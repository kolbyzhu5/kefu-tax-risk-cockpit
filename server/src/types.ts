// ============ 核心类型定义 ============

export type RiskCatCode = 'invoice' | 'income' | 'prefer' | 'related' | 'payroll';
export type RiskLevel = 'high' | 'mid' | 'low';
export type IssueStatus = 'pending' | 'fixing' | 'closed';
export type EvidenceType = 'voucher' | 'invoice' | 'contract' | 'flow';

export interface RiskCategory {
  code: RiskCatCode;
  name: string;
  weight: number; // 权重 %
  color: string;
  baseScore: number; // 行业基线（无显性疑点 ≠ 零风险）
}

export interface Subsidiary {
  id: string;
  name: string;
  industry: string;
  vatRate: string;
  revenue: number; // 营收（亿元）
  taxBurden: number; // 增值税税负率 %
  grossMargin: number; // 毛利率 %
  expenseRatio: number; // 费用率 %
  incomeGap: number; // 收入勾稽差异 %
  scores: Record<RiskCatCode, number>; // 五类最终分类得分（基础分 + 疑点增量分）
}

export interface Issue {
  id: number;
  subId: string;
  catCode: RiskCatCode;
  level: RiskLevel;
  desc: string;
  amount: number; // 涉及金额（万元）
  status: IssueStatus;
  owner: string;
  counterparty: string;
  date: string; // YYYY-MM-DD
}

export interface EvidenceItem {
  type: EvidenceType;
  columns: string[];
  rows: string[][];
}

export interface VerifyResult {
  name: string;
  hint: string;
  status: 'ok' | 'abnormal' | 'warn';
  text: string;
}

export interface MonthlyMetric {
  subId: string;
  month: string; // YYYY-MM
  tax: number;
  grossMargin: number;
  expense: number;
  gap: number;
}

// 行业税负参考区间（经验基线）
export const INDUSTRY_TAX_RANGE: Record<string, [number, number]> = {
  '制造业': [2.5, 4.5],
  '批发零售': [0.8, 2.5],
  '建筑业': [1.5, 3],
  '软件信息': [3, 6],
  '现代服务': [2, 6],
  '高新技术': [3, 6],
};
