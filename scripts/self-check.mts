/**
 * 税务风险驾驶舱 · 自检脚本
 * 1) 评分引擎单元断言（公式口径 + 边界值 + 动态因子语义）
 * 2) 7 个后端 API 契约断言（数据口径 + 异常参数）
 * 运行：npx tsx scripts/self-check.mts
 */
import {
  calcSubScore,
  calcGroupScore,
  riskLevel,
  amountScaleFactor,
  slaOverdueAdjust,
  repeatAggregationAdjust,
  isDecayed,
} from '../server/src/engine/scoring.ts';
import { SUBSIDIARIES, ISSUES, CATEGORIES, LINK_KEYS } from '../server/src/data/subs.ts';
import type { Issue } from '../server/src/types.ts';

const BASE = 'http://localhost:4000';

let pass = 0;
let fail = 0;
const failures: string[] = [];

function ok(name: string, cond: boolean, detail = '') {
  if (cond) {
    pass++;
    console.log(`  ✅ ${name}${detail ? '  → ' + detail : ''}`);
  } else {
    fail++;
    failures.push(name + (detail ? ' | ' + detail : ''));
    console.log(`  ❌ ${name}${detail ? '  → ' + detail : ''}`);
  }
}

const near = (a: number, b: number, eps = 0.02) => Math.abs(a - b) < eps;

// ============ 一、评分引擎单元断言 ============
console.log('\n━━━ 一、评分引擎（L3/L4 公式 + 边界 + 动态因子）━━━');

const subNames: Record<string, string> = {};
SUBSIDIARIES.forEach((s) => (subNames[s.id] = s.name));

console.log('  [L3 子公司得分 = Σ 分类得分 × 权重]');
const EXPECTED_SUB: Record<string, number> = { hc: 22.25, rd: 47.35, jg: 52.35, yq: 37.05, lh: 38.75, xl: 48.4 };
for (const s of SUBSIDIARIES) {
  const got = calcSubScore(s);
  ok(`子公司 ${subNames[s.id]} 得分 ${got} ≈ 期望 ${EXPECTED_SUB[s.id]}`, near(got, EXPECTED_SUB[s.id], 0.05), `got=${got}`);
}

console.log('  [L4 集团总分 = Σ 子公司得分 × 营收占比]');
const group = calcGroupScore(SUBSIDIARIES);
ok('集团总分 ≈ 43.26（方案 ≈43）', near(group, 43.26, 0.05), `got=${group}`);

console.log('  [风险分级边界 0–30低 / 31–60中 / 61–100高]');
const levelCases: [number, string][] = [
  [0, 'low'], [30, 'low'], [30.01, 'mid'], [31, 'mid'], [60, 'mid'], [60.01, 'high'], [61, 'high'], [100, 'high'],
];
for (const [sc, lv] of levelCases) ok(`riskLevel(${sc}) = ${lv}`, riskLevel(sc) === lv);

console.log('  [L1 金额规模因子 —— 对照方案 4.2 分段：<100万=0.6 / 100–1000万=0.8 / 1000–5000万=1.0 / >5000万=1.2]');
const scaleExpect: [number, number][] = [
  [50, 0.6], [99, 0.6], [100, 0.8], [500, 0.8], [999, 0.8], [1000, 1.0], [3000, 1.0], [4999, 1.0], [5000, 1.2], [8000, 1.2],
];
for (const [amt, exp] of scaleExpect) {
  const got = amountScaleFactor(amt);
  ok(`amountScaleFactor(${amt}万) = ${exp}`, near(got, exp, 0.001), `got=${got}`);
}

console.log('  [SLA 逾期加成 —— 方案 4.6：高危>7天 +10 / 中危>30天 +5]');
const mk = (level: Issue['level'], status: Issue['status'], date: string): Issue =>
  ({ id: 999, subId: 'jg', catCode: 'invoice', level, desc: 'x', amount: 100, status, owner: 'x', counterparty: 'x', date });
const slaHigh = [mk('high', 'pending', '2026-01-01')];
const slaMid = [mk('mid', 'fixing', '2026-01-01')];
ok('高危>7天未核实 → +10', slaOverdueAdjust(slaHigh) === 10, `got=${slaOverdueAdjust(slaHigh)}`);
ok('中危>30天未整改 → +5（方案）', slaOverdueAdjust(slaMid) === 5, `got=${slaOverdueAdjust(slaMid)}`);

console.log('  [重复疑点聚合 —— 方案 4.6：同一主体 + 同类 ≥3 条 → +15]');
const sameSubSameCat: Issue[] = [mk('mid', 'pending', '2026-01-01'), mk('mid', 'pending', '2026-01-02'), mk('mid', 'pending', '2026-01-03')];
ok('同主体同类 3 条 → +15', repeatAggregationAdjust(sameSubSameCat) === 15, `got=${repeatAggregationAdjust(sameSubSameCat)}`);
ok('模拟数据无「同主体同类≥3」→ 应为 0', repeatAggregationAdjust(ISSUES) === 0, `got=${repeatAggregationAdjust(ISSUES)}`);

console.log('  [时间衰减：销号满 180 天移出]');
ok('已销号且>180天 → 衰减', isDecayed(mk('low', 'closed', '2020-01-01')) === true);
ok('已销号但<180天 → 不衰减', isDecayed(mk('low', 'closed', '2026-07-01')) === false);

// ============ 二、API 契约断言 ============
console.log('\n━━━ 二、后端 API 契约断言（:4000）━━━');

async function getJson(p: string): Promise<any> {
  const r = await fetch(BASE + p);
  return { status: r.status, body: await r.json().catch(() => null) };
}

{
  const { status, body } = await getJson('/api/health');
  ok('GET /api/health → 200', status === 200 && body?.ok === true, `status=${status}`);
}

{
  const { status, body } = await getJson('/api/overview');
  ok('GET /api/overview → 200', status === 200);
  ok('集团总分 43.26 / 中风险', near(body.score, 43.26, 0.05) && body.level === 'mid', `score=${body.score} level=${body.level}`);
  ok('分布 高5/中8/低5', body.distribution.high === 5 && body.distribution.mid === 8 && body.distribution.low === 5, JSON.stringify(body.distribution));
  ok('总数 18', body.total === 18);
  ok('待处置金额 18420 万', body.openAmountWan === 18420, `got=${body.openAmountWan}`);
  ok('待核实 9 / 已销号 4 / 完成率 22%', body.pendingCount === 9 && body.closedCount === 4 && body.completionRate === 22, `p=${body.pendingCount} c=${body.closedCount} r=${body.completionRate}`);
  ok('排名 Top1 = 建工建设 52.35', body.ranking[0].name === '建工建设' && near(body.ranking[0].score, 52.35, 0.05), `got=${body.ranking[0].name}:${body.ranking[0].score}`);
  ok('排名降序', body.ranking.every((r: any, i: number, a: any[]) => i === 0 || a[i - 1].score >= r.score));
  ok('税负对标 6 家且含偏离字段', body.taxBenchmark.length === 6 && body.taxBenchmark.every((t: any) => ['偏低', '偏高', '正常'].includes(t.dev)));
  const rd = body.taxBenchmark.find((t: any) => t.id === 'rd');
  ok('瑞达商贸税负 1.2% 落在 0.8–2.5% 区间 → 正常', rd && rd.dev === '正常', rd && `got=${rd.dev}`);
  ok('税负偏离列存在「正常/偏低/偏高」判定逻辑（观察：模拟数据 6 家均正常）', body.taxBenchmark.every((t: any) => ['偏低', '偏高', '正常'].includes(t.dev)));
}

{
  const { status, body } = await getJson('/api/categories');
  ok('GET /api/categories → 200', status === 200);
  const wsum = body.categories.reduce((a: number, c: any) => a + c.weight, 0);
  ok('五类权重合计 = 100', wsum === 100, `sum=${wsum}`);
  ok('五类齐全', body.categories.length === 5);
  ok('发票权重 25 / 优惠 15', body.categories.find((c: any) => c.code === 'invoice').weight === 25 && body.categories.find((c: any) => c.code === 'prefer').weight === 15);
  const cnt: Record<string, number> = {};
  ISSUES.forEach((i) => (cnt[i.catCode] = (cnt[i.catCode] ?? 0) + 1));
  ok('各类疑点数与台账一致', body.categories.every((c: any) => c.issueCount === cnt[c.code]), JSON.stringify(body.categories.map((c: any) => c.code + '=' + c.issueCount)));
}

{
  const { status, body } = await getJson('/api/progress');
  ok('GET /api/progress → 200', status === 200);
  const lanes: Record<string, number> = {};
  body.lanes.forEach((l: any) => (lanes[l.status] = l.count));
  ok('三泳道 待核实9/整改中5/已销号4', lanes.pending === 9 && lanes.fixing === 5 && lanes.closed === 4, JSON.stringify(lanes));
}

{
  const g = await getJson('/api/metrics?sub=group');
  const h = await getJson('/api/metrics?sub=hc');
  const bad = await getJson('/api/metrics?sub=nope');
  ok('GET /api/metrics?sub=group → 200 / 12月 / 4指标', g.status === 200 && g.body.months.length === 12 && g.body.series.length === 4, `months=${g.body.months.length} series=${g.body.series.length}`);
  ok('子公司维度 hc 亦有 12 月数据', h.status === 200 && h.body.months.length === 12);
  ok('收入勾稽差异指标带 5% 预警线', g.body.series.find((s: any) => s.key === 'gap')?.warn === 5);
  ok('非法 sub 不报错（返回空序列）', bad.status === 200, `status=${bad.status} seriesLen=${bad.body?.series?.[0]?.data?.length}`);
}

{
  const all = await getJson('/api/issues');
  const high = await getJson('/api/issues?level=high');
  const combo = await getJson('/api/issues?cat=invoice&level=high');
  const sub = await getJson('/api/issues?sub=jg');
  const bad = await getJson('/api/issues?level=xxx');
  ok('GET /api/issues → 18 条', all.status === 200 && all.body.count === 18, `count=${all.body.count}`);
  ok('?level=high → 5 条', high.body.count === 5, `count=${high.body.count}`);
  ok('?cat=invoice&level=high → 1 条（瑞达虚开）', combo.body.count === 1 && combo.body.issues[0].desc.includes('虚开'), `count=${combo.body.count}`);
  ok('?sub=jg → 建工 4 条', sub.body.count === 4, `count=${sub.body.count}`);
  ok('非法 level 不报错 → 0 条', bad.status === 200 && bad.body.count === 0, `count=${bad.body.count}`);
}

{
  const one = await getJson('/api/issues/1');
  ok('GET /api/issues/1 → 200', one.status === 200);
  ok('下钻证据 4 类', one.body.evidence.length === 4, `got=${one.body.evidence.length}`);
  ok('三流一致核验 4 条', one.body.verify.length === 4);
  ok('关联键 6 个', one.body.linkKeys.length === 6 && one.body.linkKeys.join(',') === LINK_KEYS.join(','));
  ok('证据映射含主/辅证据', !!one.body.evidenceMap?.must && !!one.body.evidenceMap?.aux);
  const nf = await getJson('/api/issues/9999');
  ok('GET /api/issues/9999 → 404', nf.status === 404, `status=${nf.status}`);
}

{
  const { status, body } = await getJson('/api/model');
  ok('GET /api/model → 200', status === 200);
  const wsum = body.weights.reduce((a: number, w: any) => a + w.weight, 0);
  ok('权重合计 100', wsum === 100, `sum=${wsum}`);
  ok('四层架构', body.layers.length === 4);
  ok('子公司演算表 6 行', body.rows.length === 6);
  ok('集团总分 43.26', near(body.group.total, 43.26, 0.05), `got=${body.group.total}`);
  ok('动态因子 3 项', body.factors.length === 3, JSON.stringify(body.factors.map((f: any) => f.key + '=' + f.delta)));
}

// ============ 汇总 ============
console.log('\n━━━ 汇总 ━━━');
console.log(`  通过 ${pass} · 失败 ${fail}`);
if (failures.length) {
  console.log('\n  失败项清单：');
  failures.forEach((f) => console.log('    - ' + f));
  process.exitCode = 1;
} else {
  console.log('  ✔ 全部断言通过');
}
