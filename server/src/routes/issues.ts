import { Router } from 'express';
import { getIssue, listEvidence, listIssues } from '../repo.js';
import { enrichIssue } from '../serialize.js';
import { evidenceMap, genVerify } from '../engine/verify.js';
import { LINK_KEYS } from '../data/subs.js';

export const issuesRouter = Router();

// GET /api/issues —— 列表（支持 cat/level/status/sub 筛选）
issuesRouter.get('/', (req, res) => {
  const { cat, level, status, sub } = req.query;
  let list = listIssues();
  if (cat) list = list.filter((i) => i.catCode === cat);
  if (level) list = list.filter((i) => i.level === level);
  if (status) list = list.filter((i) => i.status === status);
  if (sub) list = list.filter((i) => i.subId === sub);
  res.json({ issues: list.map(enrichIssue), count: list.length });
});

// GET /api/issues/:id —— 穿透下钻：证据 + 三流一致核验 + 关联键
issuesRouter.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const issue = getIssue(id);
  if (!issue) return res.status(404).json({ error: '疑点不存在' });

  res.json({
    issue: enrichIssue(issue),
    evidenceMap: evidenceMap(issue.catCode),
    linkKeys: LINK_KEYS,
    evidence: listEvidence(id),
    verify: genVerify(issue),
  });
});
