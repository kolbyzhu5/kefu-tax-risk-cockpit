import { Router } from 'express';
import { listIssues, listSubs } from '../repo.js';
import { calcGroupScore, calcSubScore, riskLevel } from '../engine/scoring.js';
import { INDUSTRY_TAX_RANGE } from '../types.js';

export const overviewRouter = Router();

overviewRouter.get('/', (_req, res) => {
  const subs = listSubs();
  const issues = listIssues();

  const score = calcGroupScore(subs);
  const level = riskLevel(score);

  const dist = { high: 0, mid: 0, low: 0 };
  issues.forEach((i) => dist[i.level]++);

  const openAmountWan = issues.filter((i) => i.status !== 'closed').reduce((a, i) => a + i.amount, 0);
  const pendingCount = issues.filter((i) => i.status === 'pending').length;
  const closedCount = issues.filter((i) => i.status === 'closed').length;
  const completionRate = Math.round((closedCount / issues.length) * 100);

  const ranking = subs
    .map((s) => ({ id: s.id, name: s.name, score: calcSubScore(s), level: riskLevel(calcSubScore(s)) }))
    .sort((a, b) => b.score - a.score);

  const taxBenchmark = subs.map((s) => {
    const range = INDUSTRY_TAX_RANGE[s.industry] ?? [2, 5];
    const dev = s.taxBurden < range[0] ? '偏低' : s.taxBurden > range[1] ? '偏高' : '正常';
    return { id: s.id, name: s.name, industry: s.industry, vatRate: s.vatRate, revenue: s.revenue, taxBurden: s.taxBurden, range: `${range[0]}–${range[1]}%`, dev };
  });

  res.json({ score, level, distribution: dist, total: issues.length, openAmountWan, pendingCount, closedCount, completionRate, ranking, taxBenchmark });
});
