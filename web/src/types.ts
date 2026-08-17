// ============ 前端类型定义（对应后端 API 返回结构）============

export type RiskLevel = 'high' | 'mid' | 'low';
export type IssueStatus = 'pending' | 'fixing' | 'closed';
export type RiskCatCode = 'invoice' | 'income' | 'prefer' | 'related' | 'payroll';

export interface EnrichedIssue {
  id: number;
  subId: string;
  subName: string;
  catCode: RiskCatCode;
  catName: string;
  catColor: string;
  level: RiskLevel;
  levelName: string;
  levelColor: string;
  desc: string;
  amount: number;
  status: IssueStatus;
  statusName: string;
  statusColor: string;
  owner: string;
  counterparty: string;
  date: string;
}

export interface OverviewData {
  score: number;
  level: RiskLevel;
  distribution: Record<RiskLevel, number>;
  total: number;
  openAmountWan: number;
  pendingCount: number;
  closedCount: number;
  completionRate: number;
  ranking: { id: string; name: string; score: number; level: RiskLevel }[];
  taxBenchmark: { id: string; name: string; industry: string; vatRate: string; revenue: number; taxBurden: number; range: string; dev: string }[];
}

export interface CategoryData {
  categories: { code: RiskCatCode; name: string; color: string; weight: number; score: number; issueCount: number }[];
  issues: EnrichedIssue[];
}

export interface ProgressData {
  lanes: { status: IssueStatus; name: string; color: string; count: number; issues: EnrichedIssue[] }[];
}

export interface MetricSeries {
  key: string;
  name: string;
  unit: string;
  color: string;
  warn: number | null;
  data: number[];
}

export interface MetricsData {
  subjects: { id: string; name: string }[];
  months: string[];
  series: MetricSeries[];
}

export interface DrilldownData {
  issue: EnrichedIssue;
  evidenceMap: { must: string; aux: string; point: string };
  linkKeys: string[];
  evidence: { type: string; columns: string[]; rows: string[][] }[];
  verify: { name: string; hint: string; status: 'ok' | 'abnormal' | 'warn'; text: string }[];
}

export interface ModelData {
  layers: { level: string; tag: string; title: string; desc: string; formula: string }[];
  weights: { code: RiskCatCode; name: string; weight: number; color: string }[];
  factors: { key: string; name: string; desc: string; delta: number }[];
  calibration: { key: string; name: string; desc: string }[];
  catOrder: RiskCatCode[];
  catColors: Record<RiskCatCode, string>;
  rows: { id: string; name: string; scores: number[]; total: number; level: RiskLevel; levelName: string; levelColor: string }[];
  group: { scores: number[]; total: number; level: RiskLevel; levelName: string; levelColor: string };
  example: string;
}
