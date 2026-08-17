import { EVIDENCE_MAP, SUBSIDIARIES, VERIFY_BAD_INDEX, VERIFY_RULES } from '../data/subs.js';
import type { EvidenceItem, Issue, VerifyResult } from '../types.js';

/** 金额格式化：≥1 亿显示「亿」，否则「万」 */
export function fmtWan(n: number): string {
  if (n >= 10000) {
    const v = (n / 10000).toFixed(2).replace(/\.?0+$/, '');
    return v + ' 亿';
  }
  return n.toLocaleString('zh-CN') + ' 万';
}

const pad = (n: number, p = 8) => String(n).padStart(p, '0');

/** 生成 4 类证据明细（凭证/发票/合同/资金流水） */
export function genEvidence(issue: Issue): EvidenceItem[] {
  const cp = issue.counterparty;
  const amt = issue.amount;
  const rate = SUBSIDIARIES.find((s) => s.id === issue.subId)?.vatRate ?? '13%';

  return [
    {
      type: 'voucher',
      columns: ['凭证号', '日期', '科目', '摘要', '金额'],
      rows: [
        ['记-2026-' + pad(issue.id * 3 + 1, 4), issue.date, '库存商品 / 主营业务成本', issue.desc, fmtWan(amt)],
        ['记-2026-' + pad(issue.id * 3 + 2, 4), issue.date, '应交税费—应交增值税（进项）', '对应发票入账', fmtWan(Math.round(amt * 0.13))],
      ],
    },
    {
      type: 'invoice',
      columns: ['发票号码', '开票方', '金额', '税率', '用途确认'],
      rows: [
        ['044002' + pad(issue.id, 6), cp, fmtWan(amt), rate, issue.status === 'closed' ? '已确认' : '待确认'],
      ],
    },
    {
      type: 'contract',
      columns: ['合同编号', '签约方', '合同金额', '签订日期', '状态'],
      rows: [
        ['HT-2026-' + pad(issue.id, 4), cp, fmtWan(amt), issue.date, '履约中'],
      ],
    },
    {
      type: 'flow',
      columns: ['银行流水号', '对手方', '金额', '交易日期', '方向'],
      rows: [
        ['LS' + pad(issue.id * 7, 8), cp, fmtWan(amt), issue.date, '支出'],
        ['LS' + pad(issue.id * 7 + 1, 8), cp, fmtWan(Math.round(amt * 0.3)), issue.date, '支出'],
      ],
    },
  ];
}

/** 三流一致核验结论（4 条规则） */
export function genVerify(issue: Issue): VerifyResult[] {
  const bad = VERIFY_BAD_INDEX[issue.catCode];
  return VERIFY_RULES.map((r, idx) => {
    if (issue.status === 'closed') return { name: r.name, hint: r.hint, status: 'ok', text: '核验通过' };
    if (idx === bad) return { name: r.name, hint: r.hint, status: 'abnormal', text: `差异 ${(5.5 + idx * 1.3).toFixed(1)}% · 超出阈值` };
    if (issue.level === 'high') return { name: r.name, hint: r.hint, status: 'abnormal', text: `差异 ${(5.5 + idx * 1.3).toFixed(1)}% · 待复核` };
    return { name: r.name, hint: r.hint, status: 'warn', text: '待核验' };
  });
}

/** 证据组合映射 + 主数据关联键（下钻弹窗头部信息） */
export function evidenceMap(catCode: Issue['catCode']) {
  return EVIDENCE_MAP[catCode];
}
