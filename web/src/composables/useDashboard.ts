import { reactive, ref } from 'vue';

export type TabKey = 'overview' | 'category' | 'progress' | 'metric' | 'issues' | 'model' | 'roadmap';

// 模块级单例状态，各视图组件共享
const activeTab = ref<TabKey>('overview');
const filters = reactive<{ cat: string; level: string; status: string; sub: string }>({ cat: '', level: '', status: '', sub: '' });
const drillIssueId = ref<number | null>(null);

export function useDashboard() {
  function switchTab(tab: TabKey) {
    activeTab.value = tab;
  }

  // 跨视图联动：总览点分布/排名 → 跳疑点下钻并预过滤
  function goFilter(type: 'cat' | 'level' | 'status' | 'sub', val: string) {
    filters.cat = '';
    filters.level = '';
    filters.status = '';
    filters.sub = '';
    filters[type] = val;
    activeTab.value = 'issues';
  }

  function openDrill(id: number) {
    drillIssueId.value = id;
  }
  function closeDrill() {
    drillIssueId.value = null;
  }

  return { activeTab, filters, drillIssueId, switchTab, goFilter, openDrill, closeDrill };
}
