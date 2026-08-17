import express from 'express';
import cors from 'cors';
import { getDb } from './db.js';
import { seed } from './seed.js';
import { overviewRouter } from './routes/overview.js';
import { categoryRouter } from './routes/category.js';
import { progressRouter } from './routes/progress.js';
import { metricsRouter } from './routes/metrics.js';
import { issuesRouter } from './routes/issues.js';
import { modelRouter } from './routes/model.js';

const db = getDb();

// 首次启动自动建库 + 写入模拟数据（幂等）
const issueCount = (db.prepare('SELECT COUNT(*) AS c FROM issues').get() as { c: number }).c;
if (issueCount === 0) seed();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true, name: '可孚医疗集团税务风险驾驶舱', version: '1.0.0' }));

app.use('/api/overview', overviewRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/progress', progressRouter);
app.use('/api/metrics', metricsRouter);
app.use('/api/issues', issuesRouter);
app.use('/api/model', modelRouter);

const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, () => {
  console.log(`🚀 可孚税务风险驾驶舱 API 已启动：http://localhost:${PORT}`);
  console.log(`   健康检查 → http://localhost:${PORT}/api/health`);
  console.log(`   集团总览 → http://localhost:${PORT}/api/overview`);
});
