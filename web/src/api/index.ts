import type { CategoryData, DrilldownData, MetricsData, ModelData, OverviewData, ProgressData } from '../types';

const BASE = '/api';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(BASE + path);
  if (!res.ok) throw new Error(`API ${path} 请求失败：${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  overview: () => get<OverviewData>('/overview'),
  categories: () => get<CategoryData>('/categories'),
  progress: () => get<ProgressData>('/progress'),
  metrics: (subId = 'group') => get<MetricsData>(`/metrics?sub=${subId}`),
  issues: (filters: Record<string, string> = {}) => {
    const q = new URLSearchParams(Object.entries(filters).filter(([, v]) => v)).toString();
    return get<{ issues: CategoryData['issues']; count: number }>(`/issues${q ? '?' + q : ''}`);
  },
  drilldown: (id: number) => get<DrilldownData>(`/issues/${id}`),
  model: () => get<ModelData>('/model'),
};
