import { Router } from 'express';
import { listIssues } from '../repo.js';
import { enrichIssue } from '../serialize.js';
import { STATUSES } from '../data/subs.js';

export const progressRouter = Router();

progressRouter.get('/', (_req, res) => {
  const issues = listIssues();
  const lanes = (['pending', 'fixing', 'closed'] as const).map((st) => {
    const list = issues.filter((i) => i.status === st).map(enrichIssue);
    return { status: st, name: STATUSES[st].name, color: STATUSES[st].color, count: list.length, issues: list };
  });
  res.json({ lanes });
});
