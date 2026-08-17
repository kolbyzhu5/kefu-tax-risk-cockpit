<template>
  <header class="topbar">
    <div class="brand">
      <div class="brand-badge"><span class="logo">KF</span></div>
      <h1>可孚医疗集团税务风险<em>驾驶舱</em></h1>
      <span class="live"><span class="dot"></span>LIVE</span>
    </div>
    <div class="topbar-right">
      <span>数据口径：模拟数据</span>
      <span class="clock num">{{ clock }}</span>
    </div>
  </header>

  <nav class="nav">
    <button
      v-for="t in tabs"
      :key="t.key"
      class="tab"
      :class="{ active: activeTab === t.key }"
      @click="switchTab(t.key)"
    >
      <span class="n">{{ t.n }}</span>{{ t.label }}
    </button>
  </nav>

  <main>
    <OverviewView v-if="activeTab === 'overview'" />
    <CategoryView v-else-if="activeTab === 'category'" />
    <ProgressView v-else-if="activeTab === 'progress'" />
    <MetricView v-else-if="activeTab === 'metric'" />
    <IssuesView v-else-if="activeTab === 'issues'" />
    <ModelView v-else-if="activeTab === 'model'" />
    <RoadmapView v-else-if="activeTab === 'roadmap'" />
  </main>

  <DrillModal />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useDashboard, type TabKey } from './composables/useDashboard';
import OverviewView from './views/OverviewView.vue';
import CategoryView from './views/CategoryView.vue';
import ProgressView from './views/ProgressView.vue';
import MetricView from './views/MetricView.vue';
import IssuesView from './views/IssuesView.vue';
import ModelView from './views/ModelView.vue';
import RoadmapView from './views/RoadmapView.vue';
import DrillModal from './components/DrillModal.vue';

const { activeTab, switchTab } = useDashboard();

const tabs: { key: TabKey; n: string; label: string }[] = [
  { key: 'overview', n: '01', label: '集团总览' },
  { key: 'category', n: '02', label: '风险分类' },
  { key: 'progress', n: '03', label: '处置进度' },
  { key: 'metric', n: '04', label: '指标监控' },
  { key: 'issues', n: '05', label: '疑点下钻' },
  { key: 'model', n: '06', label: '评分模型' },
  { key: 'roadmap', n: '07', label: '实施路线图' },
];

const clock = ref('');
let timer: ReturnType<typeof setInterval> | null = null;
function tick() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  clock.value = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
onMounted(() => {
  tick();
  timer = setInterval(tick, 1000);
});
onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});
</script>
