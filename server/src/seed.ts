import { getDb } from './db.js';
import { CATEGORIES, ISSUES, SUBSIDIARIES } from './data/subs.js';
import { genEvidence } from './engine/verify.js';

// ============ 指标序列生成（复刻原型的正弦/余弦波动）============
function genSeries(base: number, vol: number, drift: number, seed: number): number[] {
  const arr: number[] = [];
  for (let i = 0; i < 12; i++) {
    const noise = (Math.sin(i * 1.7 + seed) * 0.5 + Math.cos(i * 0.9 + seed * 2) * 0.5) * vol;
    const v = base + drift * (i - 6) + noise;
    arr.push(+v.toFixed(2));
  }
  return arr;
}

const SEED = { tax: 1, gm: 2, cost: 3, gap: 4 };

function groupBase(key: 'tax' | 'gm' | 'cost' | 'gap'): number {
  const revTotal = SUBSIDIARIES.reduce((a, s) => a + s.revenue, 0);
  const map = { tax: 'taxBurden', gm: 'grossMargin', cost: 'expenseRatio', gap: 'incomeGap' } as const;
  return SUBSIDIARIES.reduce((a, s) => a + (s[map[key]] as number) * s.revenue, 0) / revTotal;
}

function monthlyMonths(): string[] {
  const months: string[] = [];
  let y = 2025, m = 8;
  for (let i = 0; i < 12; i++) {
    months.push(`${y}-${String(m).padStart(2, '0')}`);
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  return months;
}

export function seed(): void {
  const db = getDb();

  // 幂等：清空重插，保证每次种子一致
  const tables = ['evidence_items', 'monthly_metrics', 'issues', 'subsidiaries', 'risk_categories'];
  for (const t of tables) db.prepare(`DELETE FROM ${t}`).run();

  const insertCat = db.prepare('INSERT INTO risk_categories (code,name,weight,color,base_score) VALUES (?,?,?,?,?)');
  const insertSub = db.prepare(`INSERT INTO subsidiaries
    (id,name,industry,vat_rate,revenue,tax_burden,gross_margin,expense_ratio,income_gap,
     score_invoice,score_income,score_prefer,score_related,score_payroll)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const insertIssue = db.prepare(`INSERT INTO issues
    (id,sub_id,cat_code,level,desc,amount,status,owner,counterparty,date)
    VALUES (?,?,?,?,?,?,?,?,?,?)`);
  const insertEvidence = db.prepare('INSERT INTO evidence_items (issue_id,type,columns,rows) VALUES (?,?,?,?)');
  const insertMetric = db.prepare('INSERT INTO monthly_metrics (sub_id,month,tax,gross_margin,expense,gap) VALUES (?,?,?,?,?,?)');

  const seedTx = db.transaction(() => {
    for (const c of CATEGORIES) insertCat.run(c.code, c.name, c.weight, c.color, c.baseScore);

    for (const s of SUBSIDIARIES) {
      insertSub.run(
        s.id, s.name, s.industry, s.vatRate, s.revenue,
        s.taxBurden, s.grossMargin, s.expenseRatio, s.incomeGap,
        s.scores.invoice, s.scores.income, s.scores.prefer, s.scores.related, s.scores.payroll,
      );
    }

    for (const i of ISSUES) {
      insertIssue.run(i.id, i.subId, i.catCode, i.level, i.desc, i.amount, i.status, i.owner, i.counterparty, i.date);
      for (const ev of genEvidence(i)) {
        insertEvidence.run(i.id, ev.type, JSON.stringify(ev.columns), JSON.stringify(ev.rows));
      }
    }

    // 指标序列：集团 + 6 家子公司 × 12 个月
    const months = monthlyMonths();
    const subs = [{ id: 'group', name: '集团' }, ...SUBSIDIARIES.map((s) => ({ id: s.id, name: s.name }))];
    for (const s of subs) {
      const isGroup = s.id === 'group';
      const src = isGroup
        ? { tax: groupBase('tax'), gm: groupBase('gm'), cost: groupBase('cost'), gap: groupBase('gap') }
        : (() => { const x = SUBSIDIARIES.find((z) => z.id === s.id)!; return { tax: x.taxBurden, gm: x.grossMargin, cost: x.expenseRatio, gap: x.incomeGap }; })();

      const vol = (k: 'tax' | 'gm' | 'cost' | 'gap') => (k === 'gap' ? (isGroup ? 1.0 : 1.2) : isGroup ? 0.6 : 0.8);
      const drift = (k: 'tax' | 'gm' | 'cost' | 'gap') => (k === 'gap' ? (isGroup ? 0.06 : 0.08) : isGroup ? 0.02 : 0.03);

      const series = {
        tax: genSeries(src.tax, vol('tax'), drift('tax'), SEED.tax),
        gm: genSeries(src.gm, vol('gm'), drift('gm'), SEED.gm),
        cost: genSeries(src.cost, vol('cost'), drift('cost'), SEED.cost),
        gap: genSeries(src.gap, vol('gap'), drift('gap'), SEED.gap),
      };

      months.forEach((month, idx) => {
        insertMetric.run(s.id, month, series.tax[idx], series.gm[idx], series.cost[idx], series.gap[idx]);
      });
    }
  });

  seedTx();

  const count = (t: string) => (db.prepare(`SELECT COUNT(*) AS c FROM ${t}`).get() as { c: number }).c;
  console.log('✅ 种子数据已写入：');
  console.log(`   风险分类 ${count('risk_categories')} · 子公司 ${count('subsidiaries')} · 疑点 ${count('issues')} · 证据 ${count('evidence_items')} · 月度指标 ${count('monthly_metrics')}`);
}

// 仅在作为入口直接运行（tsx src/seed.ts）时执行；被 import 时不触发
import { pathToFileURL } from 'node:url';
const isMain = !!process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) seed();
