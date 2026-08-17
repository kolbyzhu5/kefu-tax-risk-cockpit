import { getDb } from './db.js';
import type { EvidenceItem, Issue, RiskCategory, RiskCatCode, Subsidiary } from './types.js';

// ============ 仓储层：统一从 SQLite 读取，保证「数据来自数据库」============

export function listCategories(): RiskCategory[] {
  const rows = getDb().prepare('SELECT code,name,weight,color,base_score FROM risk_categories ORDER BY weight DESC').all() as any[];
  return rows.map((r) => ({ code: r.code as RiskCatCode, name: r.name, weight: r.weight, color: r.color, baseScore: r.base_score }));
}

export function listSubs(): Subsidiary[] {
  const rows = getDb().prepare('SELECT * FROM subsidiaries').all() as any[];
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    industry: r.industry,
    vatRate: r.vat_rate,
    revenue: r.revenue,
    taxBurden: r.tax_burden,
    grossMargin: r.gross_margin,
    expenseRatio: r.expense_ratio,
    incomeGap: r.income_gap,
    scores: {
      invoice: r.score_invoice,
      income: r.score_income,
      prefer: r.score_prefer,
      related: r.score_related,
      payroll: r.score_payroll,
    },
  }));
}

export function listIssues(): Issue[] {
  const rows = getDb().prepare('SELECT * FROM issues ORDER BY id').all() as any[];
  return rows.map((r) => ({
    id: r.id,
    subId: r.sub_id,
    catCode: r.cat_code as RiskCatCode,
    level: r.level,
    desc: r.desc,
    amount: r.amount,
    status: r.status,
    owner: r.owner,
    counterparty: r.counterparty,
    date: r.date,
  }));
}

export function getIssue(id: number): Issue | undefined {
  const r = getDb().prepare('SELECT * FROM issues WHERE id = ?').get(id) as any;
  if (!r) return undefined;
  return {
    id: r.id,
    subId: r.sub_id,
    catCode: r.cat_code as RiskCatCode,
    level: r.level,
    desc: r.desc,
    amount: r.amount,
    status: r.status,
    owner: r.owner,
    counterparty: r.counterparty,
    date: r.date,
  };
}

export function listEvidence(issueId: number): EvidenceItem[] {
  const rows = getDb().prepare('SELECT type,columns,rows FROM evidence_items WHERE issue_id = ?').all(issueId) as any[];
  return rows.map((r) => ({ type: r.type, columns: JSON.parse(r.columns), rows: JSON.parse(r.rows) }));
}

export function listMonthlyMetrics(subId = 'group'): { month: string; tax: number; gm: number; cost: number; gap: number }[] {
  const rows = getDb().prepare('SELECT * FROM monthly_metrics WHERE sub_id = ? ORDER BY month').all(subId) as any[];
  return rows.map((r) => ({ month: r.month, tax: r.tax, gm: r.gross_margin, cost: r.expense, gap: r.gap }));
}
