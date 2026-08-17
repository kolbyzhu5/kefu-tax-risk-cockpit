import { CATEGORIES, LEVELS, STATUSES, SUBSIDIARIES } from './data/subs.js';
import type { Issue } from './types.js';

/** 组装带展示元信息的疑点 DTO（子公司名/分类名/等级/状态的中文名与颜色） */
export function enrichIssue(i: Issue) {
  const sub = SUBSIDIARIES.find((s) => s.id === i.subId);
  const cat = CATEGORIES.find((c) => c.code === i.catCode);
  return {
    ...i,
    subName: sub?.name ?? i.subId,
    catName: cat?.name ?? i.catCode,
    catColor: cat?.color ?? '#22d3ee',
    levelName: LEVELS[i.level].name,
    levelColor: LEVELS[i.level].color,
    statusName: STATUSES[i.status].name,
    statusColor: STATUSES[i.status].color,
  };
}
