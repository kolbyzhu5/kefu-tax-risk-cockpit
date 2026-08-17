<template>
  <div>
    <div class="fbar card c4 fade-up">
      <label class="f-item">分类
        <select :value="filters.cat" @change="set('cat', $event)">
          <option value="">全部</option>
          <option v-for="c in CATS" :key="c.code" :value="c.code">{{ c.name }}</option>
        </select>
      </label>
      <label class="f-item">等级
        <select :value="filters.level" @change="set('level', $event)">
          <option value="">全部</option>
          <option value="high">高</option>
          <option value="mid">中</option>
          <option value="low">低</option>
        </select>
      </label>
      <label class="f-item">状态
        <select :value="filters.status" @change="set('status', $event)">
          <option value="">全部</option>
          <option value="pending">待核实</option>
          <option value="fixing">整改中</option>
          <option value="closed">已销号</option>
        </select>
      </label>
      <label class="f-item">子公司
        <select :value="filters.sub" @change="set('sub', $event)">
          <option value="">全部</option>
          <option v-for="s in SUBS" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
      </label>
      <button class="btn" @click="clear">清除筛选</button>
      <span class="count">共 <b class="num">{{ data?.count ?? 0 }}</b> 个疑点</span>
    </div>

    <div class="card c4 fade-up">
      <div class="list">
        <IssueItem v-for="it in data?.issues ?? []" :key="it.id" :issue="it" @open="openDrill" />
        <div v-if="data && !data.issues.length" class="empty">无匹配疑点，请调整筛选条件</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api } from '../api';
import { useDashboard } from '../composables/useDashboard';
import type { EnrichedIssue } from '../types';
import IssueItem from '../components/IssueItem.vue';

const { filters, openDrill } = useDashboard();
const data = ref<{ issues: EnrichedIssue[]; count: number } | null>(null);

const CATS = [
  { code: 'invoice', name: '发票风险' },
  { code: 'income', name: '收入成本风险' },
  { code: 'prefer', name: '优惠政策风险' },
  { code: 'related', name: '关联交易风险' },
  { code: 'payroll', name: '个税社保风险' },
];
const SUBS = [
  { id: 'hc', name: '华晨制造' },
  { id: 'rd', name: '瑞达商贸' },
  { id: 'jg', name: '建工建设' },
  { id: 'yq', name: '云启软件' },
  { id: 'lh', name: '蓝海服务' },
  { id: 'xl', name: '星链科技' },
];

async function load() {
  data.value = await api.issues({ cat: filters.cat, level: filters.level, status: filters.status, sub: filters.sub });
}

function set(key: 'cat' | 'level' | 'status' | 'sub', e: Event) {
  filters[key] = (e.target as HTMLSelectElement).value;
  load();
}

function clear() {
  filters.cat = '';
  filters.level = '';
  filters.status = '';
  filters.sub = '';
  load();
}

onMounted(load);
</script>

<style scoped>
.fbar { display: flex; align-items: center; flex-wrap: wrap; gap: 16px; margin-bottom: 18px; }
.f-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--muted); }
.f-item select { min-width: 120px; }
.count { margin-left: auto; font-size: 13px; color: var(--muted); }
.count b { color: var(--cyan); font-size: 18px; margin: 0 2px; }
.list { max-height: 640px; overflow-y: auto; padding-right: 4px; }
</style>
