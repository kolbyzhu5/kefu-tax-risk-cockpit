import { CATEGORIES, LEVELS } from '../data/subs.js';
import type { Issue, RiskCatCode, RiskLevel, Subsidiary } from '../types.js';

// ============ L1 · 疑点贡献分 ============
// 等级基础分（高100/中60/低30）× 金额规模因子（0.6~1.2）× 状态因子（待核实1.0/整改中0.9/已销号0.2）

const STATUS_FACTOR = { pending: 1.0, fixing: 0.9, closed: 0.2 } as const;

/** 金额规模因子：分段离散（金额单位：万元）。<100万=0.6 / 100~1000万=0.8 / 1000~5000万=1.0 / ≥5000万=1.2 */
export function amountScaleFactor(amountWan: number): number {
  if (amountWan < 100) return 0.6;
  if (amountWan < 1000) return 0.8;
  if (amountWan < 5000) return 1.0;
  return 1.2;
}

/** L1 疑点贡献分 */
export function calcIssueContribution(issue: Issue): number {
  const base = LEVELS[issue.level].base;
  const scale = amountScaleFactor(issue.amount);
  const status = STATUS_FACTOR[issue.status];
  return +(base * scale * status).toFixed(2);
}

// ============ L2 · 分类得分 ============
// 分类得分 = 基础分 + Σ 疑点贡献分（金额加权）。此处直接返回校准后的最终分类得分（与方案口径一致）。

export function categoryScore(sub: Subsidiary, cat: RiskCatCode): number {
  return sub.scores[cat];
}

// ============ L3 · 子公司得分 ============
// Σ 分类得分 × 权重
export function calcSubScore(sub: Subsidiary): number {
  return +CATEGORIES.reduce((acc, c) => acc + sub.scores[c.code] * (c.weight / 100), 0).toFixed(2);
}

// ============ L4 · 集团总分 ============
// Σ 子公司得分 × 营收占比（可切换利润/资产/等权）
export function calcGroupScore(subs: Subsidiary[]): number {
  const revTotal = subs.reduce((a, s) => a + s.revenue, 0);
  return +subs.reduce((acc, s) => acc + calcSubScore(s) * (s.revenue / revTotal), 0).toFixed(2);
}

// ============ 风险等级分级 ============
// 0–30 低（绿）· 31–60 中（橙）· 61–100 高（红）
export function riskLevel(score: number): RiskLevel {
  return score > 60 ? 'high' : score > 30 ? 'mid' : 'low';
}

// ============ 动态修正因子 ============
export interface DynamicFactor {
  key: string;
  name: string;
  desc: string;
  /** 返回修正增量（可正可负） */
  apply: (ctx: { issues: Issue[]; now: string }) => number;
}

/** SLA 逾期：高危 >7 天未核实 +10 / 中危 >30 天未整改 +5（取最高档） */
export function slaOverdueAdjust(issues: Issue[]): number {
  const days = (date: string) => (Date.now() - new Date(date).getTime()) / 86400000;
  const hasHigh = issues.some((i) => i.status === 'pending' && i.level === 'high' && days(i.date) > 7);
  if (hasHigh) return 10;
  const hasMid = issues.some((i) => i.status === 'fixing' && i.level === 'mid' && days(i.date) > 30);
  return hasMid ? 5 : 0;
}

/** 时间衰减：销号满 180 天自动移出评分池（该因子只影响计入池，返回 0 由调用方剔除） */
export function isDecayed(issue: Issue, now = Date.now()): boolean {
  if (issue.status !== 'closed') return false;
  return now - new Date(issue.date).getTime() > 180 * 86400000;
}

/** 重复疑点聚合：同一主体（subId）同类疑点 ≥3 条 → 系统性风险加成 +15 */
export function repeatAggregationAdjust(issues: Issue[], cat?: RiskCatCode): number {
  const list = cat ? issues.filter((i) => i.catCode === cat) : issues;
  const counts = new Map<string, number>();
  list.forEach((i) => {
    const key = `${i.subId}:${i.catCode}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return [...counts.values()].some((n) => n >= 3) ? 15 : 0;
}

export const DYNAMIC_FACTORS: DynamicFactor[] = [
  { key: 'sla', name: 'SLA 逾期', desc: '高危>7天未核实 +10 / 中危>30天未整改 +5', apply: (ctx) => slaOverdueAdjust(ctx.issues) },
  { key: 'decay', name: '时间衰减', desc: '销号满 180 天自动移出评分池', apply: () => 0 },
  { key: 'repeat', name: '重复聚合', desc: '同一主体同类疑点 ≥3 条 → 系统性风险 +15', apply: (ctx) => repeatAggregationAdjust(ctx.issues) },
];
