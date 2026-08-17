import { Router } from 'express';
import { listMonthlyMetrics, listSubs } from '../repo.js';

export const metricsRouter = Router();

const METRIC_META = [
  { key: 'tax', name: '增值税税负率', unit: '%', color: '#22d3ee', warn: null },
  { key: 'gm', name: '毛利率', unit: '%', color: '#34d399', warn: null },
  { key: 'cost', name: '费用率', unit: '%', color: '#a78bfa', warn: null },
  { key: 'gap', name: '收入勾稽差异', unit: '%', color: '#fb4d5c', warn: 5 },
];

metricsRouter.get('/', (req, res) => {
  const subId = (req.query.sub as string) || 'group';
  const rows = listMonthlyMetrics(subId);
  const subs = listSubs();

  const series = METRIC_META.map((m) => {
    const keyMap = { tax: 'tax', gm: 'gm', cost: 'cost', gap: 'gap' } as const;
    const data = rows.map((r) => r[keyMap[m.key as keyof typeof keyMap]]);
    return { ...m, data };
  });

  res.json({
    subjects: [{ id: 'group', name: '集团（营收加权）' }, ...subs.map((s) => ({ id: s.id, name: s.name }))],
    months: rows.map((r) => r.month),
    series,
  });
});
