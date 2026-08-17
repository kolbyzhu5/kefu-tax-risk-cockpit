/** 金额格式化：≥1 亿显示「亿」，否则「万」 */
export function fmtWan(n: number): string {
  if (n >= 10000) {
    return (n / 10000).toFixed(2).replace(/\.?0+$/, '') + ' 亿';
  }
  return n.toLocaleString('zh-CN') + ' 万';
}
