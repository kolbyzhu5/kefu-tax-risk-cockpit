import { Router } from 'express';
import { listCategories, listIssues, listSubs } from '../repo.js';
import { CAT_ORDER } from '../data/subs.js';

export const categoryRouter = Router();

categoryRouter.get('/', (_req, res) => {
  const cats = listCategories();
  const subs = listSubs();
  const issues = listIssues();
  const revTotal = subs.reduce((a, s) => a + s.revenue, 0);

  // 分类得分 = 营收加权
  const ordered = CAT_ORDER.map((code) => {
    const c = cats.find((x) => x.code === code)!;
    const score = subs.reduce((a, s) => a + s.scores[code] * s.revenue, 0) / revTotal;
    const issueCount = issues.filter((i) => i.catCode === code).length;
    return { code, name: c.name, color: c.color, weight: c.weight, score: +score.toFixed(1), issueCount };
  });

  res.json({ categories: ordered, issues });
});
