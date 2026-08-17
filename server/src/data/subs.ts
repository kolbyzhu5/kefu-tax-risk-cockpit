import type { Issue, RiskCategory, RiskCatCode, RiskLevel, Subsidiary } from '../types.js';

// ============ 风险等级 / 处置状态 元数据 ============
export const LEVELS: Record<RiskLevel, { name: string; color: string; base: number }> = {
  high: { name: '高', color: '#f43f5e', base: 100 },
  mid: { name: '中', color: '#fb923c', base: 60 },
  low: { name: '低', color: '#34d399', base: 30 },
};

export const STATUSES = {
  pending: { name: '待核实', color: '#fb923c' },
  fixing: { name: '整改中', color: '#38bdf8' },
  closed: { name: '已销号', color: '#34d399' },
} as const;

// ============ 五类风险分类（权重合计 100%）============
export const CATEGORIES: RiskCategory[] = [
  { code: 'invoice', name: '发票风险', weight: 25, color: '#fb4d5c', baseScore: 20 },
  { code: 'income', name: '收入成本风险', weight: 20, color: '#fb923c', baseScore: 20 },
  { code: 'prefer', name: '优惠政策风险', weight: 15, color: '#a78bfa', baseScore: 20 },
  { code: 'related', name: '关联交易风险', weight: 20, color: '#38bdf8', baseScore: 20 },
  { code: 'payroll', name: '个税社保风险', weight: 20, color: '#f5b93f', baseScore: 20 },
];

export const CAT_ORDER: RiskCatCode[] = ['invoice', 'income', 'prefer', 'related', 'payroll'];

// ============ 6 家子公司（模拟）============
export const SUBSIDIARIES: Subsidiary[] = [
  { id: 'hc', name: '华晨制造', industry: '制造业', vatRate: '13%', revenue: 45, taxBurden: 3.4, grossMargin: 22, expenseRatio: 12, incomeGap: 1.5, scores: { invoice: 25, income: 30, prefer: 20, related: 15, payroll: 20 } },
  { id: 'rd', name: '瑞达商贸', industry: '批发零售', vatRate: '13%', revenue: 60, taxBurden: 1.2, grossMargin: 8, expenseRatio: 6, incomeGap: 6.5, scores: { invoice: 72, income: 58, prefer: 25, related: 30, payroll: 40 } },
  { id: 'jg', name: '建工建设', industry: '建筑业', vatRate: '9%', revenue: 80, taxBurden: 2.1, grossMargin: 11, expenseRatio: 8, incomeGap: 3.0, scores: { invoice: 55, income: 68, prefer: 20, related: 45, payroll: 65 } },
  { id: 'yq', name: '云启软件', industry: '软件信息', vatRate: '6%', revenue: 12, taxBurden: 4.2, grossMargin: 55, expenseRatio: 30, incomeGap: 2.0, scores: { invoice: 35, income: 30, prefer: 62, related: 40, payroll: 25 } },
  { id: 'lh', name: '蓝海服务', industry: '现代服务', vatRate: '6%', revenue: 18, taxBurden: 3.0, grossMargin: 40, expenseRatio: 22, incomeGap: 5.5, scores: { invoice: 40, income: 60, prefer: 25, related: 20, payroll: 45 } },
  { id: 'xl', name: '星链科技', industry: '高新技术', vatRate: '6%', revenue: 25, taxBurden: 4.8, grossMargin: 48, expenseRatio: 28, incomeGap: 2.5, scores: { invoice: 30, income: 35, prefer: 70, related: 82, payroll: 35 } },
];

// ============ 18 个疑点（模拟）============
export const ISSUES: Issue[] = [
  { id: 1, subId: 'rd', catCode: 'invoice', level: 'high', desc: '疑似接受虚开增值税专用发票', amount: 1280, status: 'pending', owner: '王税务', counterparty: '宏远贸易有限公司', date: '2026-05-18' },
  { id: 2, subId: 'jg', catCode: 'invoice', level: 'mid', desc: '分包发票合同/发票/资金三流不一致', amount: 860, status: 'fixing', owner: '李会计', counterparty: '顺达建筑工程队', date: '2026-04-09' },
  { id: 3, subId: 'lh', catCode: 'invoice', level: 'low', desc: '异常红冲发票比例偏高', amount: 230, status: 'closed', owner: '赵税务', counterparty: '多客户零星红冲', date: '2026-03-22' },
  { id: 4, subId: 'hc', catCode: 'invoice', level: 'mid', desc: '集体福利进项转出遗漏', amount: 95, status: 'pending', owner: '孙会计', counterparty: '内部食堂采购', date: '2026-06-30' },
  { id: 5, subId: 'lh', catCode: 'income', level: 'high', desc: '收入确认滞后 / 疑似隐匿现金收入', amount: 1150, status: 'fixing', owner: '钱会计', counterparty: '多家终端客户', date: '2026-02-14' },
  { id: 6, subId: 'jg', catCode: 'income', level: 'mid', desc: '成本结转与工程进度不匹配', amount: 2400, status: 'pending', owner: '周会计', counterparty: '在施工程项目', date: '2026-05-05' },
  { id: 7, subId: 'rd', catCode: 'income', level: 'mid', desc: '毛利率异常低于行业均值', amount: 3200, status: 'pending', owner: '吴会计', counterparty: '批零业务', date: '2026-06-12' },
  { id: 8, subId: 'hc', catCode: 'income', level: 'low', desc: '样品赠送视同销售漏报', amount: 42, status: 'closed', owner: '郑会计', counterparty: '样品赠送', date: '2026-01-20' },
  { id: 9, subId: 'xl', catCode: 'prefer', level: 'high', desc: '高新技术企业研发人员占比存疑', amount: 1500, status: 'pending', owner: '王税务', counterparty: '资质申报口径', date: '2026-06-01' },
  { id: 10, subId: 'yq', catCode: 'prefer', level: 'mid', desc: '软件即征即退与研发辅助账不符', amount: 680, status: 'fixing', owner: '李会计', counterparty: '退税申请', date: '2026-04-15' },
  { id: 11, subId: 'lh', catCode: 'prefer', level: 'low', desc: '小微优惠条件临近上限未复核', amount: 300, status: 'closed', owner: '赵税务', counterparty: '小微口径', date: '2026-03-08' },
  { id: 12, subId: 'xl', catCode: 'related', level: 'high', desc: '境外关联方转让定价偏高', amount: 4200, status: 'fixing', owner: '陈税务', counterparty: 'StarLink Intl. Ltd.', date: '2026-02-28' },
  { id: 13, subId: 'jg', catCode: 'related', level: 'mid', desc: '关联方资金往来未计息', amount: 1900, status: 'pending', owner: '孙会计', counterparty: '集团兄弟公司', date: '2026-05-20' },
  { id: 14, subId: 'rd', catCode: 'related', level: 'low', desc: '关联采购价格偏离公允', amount: 450, status: 'closed', owner: '周会计', counterparty: '关联供应商', date: '2026-01-15' },
  { id: 15, subId: 'jg', catCode: 'payroll', level: 'high', desc: '农民工个税未全员申报', amount: 620, status: 'fixing', owner: '吴会计', counterparty: '劳务用工', date: '2026-03-30' },
  { id: 16, subId: 'lh', catCode: 'payroll', level: 'mid', desc: '社保基数与实际工资不符', amount: 380, status: 'pending', owner: '郑会计', counterparty: '员工社保', date: '2026-06-18' },
  { id: 17, subId: 'rd', catCode: 'payroll', level: 'mid', desc: '年终奖个税计税方式错误', amount: 120, status: 'pending', owner: '钱会计', counterparty: '员工薪酬', date: '2026-05-28' },
  { id: 18, subId: 'yq', catCode: 'payroll', level: 'low', desc: '专项附加扣除凭证缺失', amount: 35, status: 'pending', owner: '李会计', counterparty: '员工个税', date: '2026-07-02' },
];

// ============ 风险类型 → 证据组合映射 ============
export const EVIDENCE_MAP: Record<RiskCatCode, { must: string; aux: string; point: string }> = {
  invoice: { must: '发票 + 原始凭证', aux: '资金流水', point: '进项抵扣合规性 · 三流一致 · 用途确认' },
  income: { must: '原始凭证 + 合同', aux: '发票', point: '收入确认时点 · 成本结转匹配 · 隐匿收入排查' },
  prefer: { must: '原始凭证 + 合同', aux: '发票', point: '优惠条件真实性 · 研发辅助账 · 资质口径' },
  related: { must: '合同 + 资金流水', aux: '原始凭证', point: '转让定价公允性 · 资金往来计息 · 独立交易原则' },
  payroll: { must: '原始凭证 + 资金流水', aux: '合同', point: '全员申报 · 社保基数一致 · 计税方式正确' },
};

// ============ 三流一致核验规则 ============
export const VERIFY_RULES = [
  { name: '合同 vs 发票', hint: '差异阈值 >5%' },
  { name: '发票 vs 资金流水', hint: '差异阈值 >10%' },
  { name: '凭证 vs 发票', hint: '入账一致性' },
  { name: '申报 vs 财报', hint: '口径差异 >5%' },
];

// 各分类「命中异常」的规则下标（用于演示核验结论）
export const VERIFY_BAD_INDEX: Record<RiskCatCode, number> = {
  invoice: 0,
  income: 1,
  prefer: 3,
  related: 1,
  payroll: 2,
};

// 6 个主数据关联键（血缘锚点）
export const LINK_KEYS = ['sub_id', 'vendor_id', 'contract_no', 'invoice_no', 'voucher_no', 'bank_seq'];
