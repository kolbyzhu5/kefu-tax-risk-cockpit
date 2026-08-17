import { Router } from 'express';
import { listCategories, listIssues, listSubs } from '../repo.js';
import { calcGroupScore, calcSubScore, DYNAMIC_FACTORS, riskLevel } from '../engine/scoring.js';
import { CAT_ORDER, LEVELS } from '../data/subs.js';

export const modelRouter = Router();

modelRouter.get('/', (_req, res) => {
  const cats = listCategories();
  const subs = listSubs();
  const issues = listIssues();
  const revTotal = subs.reduce((a, s) => a + s.revenue, 0);
  const group = calcGroupScore(subs);
  const groupLevel = riskLevel(group);

  // 四层架构（公式说明）
  const layers = [
    { level: 'L1', tag: 'ISSUE', title: '疑点贡献分', desc: '单个疑点的风险贡献，由等级、金额规模、处置状态共同决定', formula: '等级基础分 高100/中60/低30 × 金额规模因子 0.6~1.2 × 状态因子 待核实1.0/整改中0.9/已销号0.2' },
    { level: 'L2', tag: 'CATEGORY', title: '分类得分', desc: '基础分 + 疑点增量分。无显性疑点 ≠ 零风险，保留行业基线', formula: '基础分 + Σ 疑点贡献分（金额加权）' },
    { level: 'L3', tag: 'SUBSIDIARY', title: '子公司得分', desc: '五类分类得分按权重加权求和', formula: 'Σ 分类得分ᵢ × 权重ᵢ' },
    { level: 'L4', tag: 'GROUP', title: '集团总分', desc: '子公司得分按营收加权（可切换利润/资产/等权）', formula: 'Σ 子公司得分 × 营收占比' },
  ];

  // 子公司演算表
  const rows = subs.map((s) => {
    const total = calcSubScore(s);
    const lv = riskLevel(total);
    return { id: s.id, name: s.name, scores: CAT_ORDER.map((k) => s.scores[k]), total, level: lv, levelName: LEVELS[lv].name, levelColor: LEVELS[lv].color };
  });

  const groupScores = CAT_ORDER.map((k) => subs.reduce((a, s) => a + s.scores[k] * s.revenue, 0) / revTotal);

  // 动态修正因子（含当前增量）
  const factors = DYNAMIC_FACTORS.map((f) => ({ key: f.key, name: f.name, desc: f.desc, delta: f.apply({ issues, now: new Date().toISOString() }) }));

  const calibration = [
    { key: 'AHP', name: '层次分析法', desc: '一致性检验 CR<0.1' },
    { key: 'DELPHI', name: '德尔菲', desc: '税务专家多轮匿名征询收敛' },
    { key: 'BACKTEST', name: '回测', desc: '历史稽查案例回测校准阈值' },
    { key: 'MONTHLY', name: '月度', desc: '每月重校权重与参考区间' },
  ];

  res.json({
    layers,
    weights: CAT_ORDER.map((k) => ({ code: k, name: cats.find((c) => c.code === k)!.name, weight: cats.find((c) => c.code === k)!.weight, color: cats.find((c) => c.code === k)!.color })),
    factors,
    calibration,
    catOrder: CAT_ORDER,
    catColors: Object.fromEntries(cats.map((c) => [c.code, c.color])),
    rows,
    group: { scores: groupScores.map((v) => +v.toFixed(1)), total: group, level: groupLevel, levelName: LEVELS[groupLevel].name, levelColor: LEVELS[groupLevel].color },
    example: '建工建设 52.4 = 55×25% + 68×20% + 20×15% + 45×20% + 65×20%。分类「基础分」解释了为何无优惠疑点仍保留 20 分基线——无显性疑点 ≠ 零风险。',
  });
});
