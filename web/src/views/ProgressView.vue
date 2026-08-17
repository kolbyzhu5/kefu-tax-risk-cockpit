<template>
  <div v-if="data" class="lanes">
    <div v-for="lane in data.lanes" :key="lane.status" class="lane card c4 fade-up">
      <div class="lane-head">
        <span class="lane-dot" :style="{ background: lane.color, boxShadow: `0 0 10px ${lane.color}` }"></span>
        <span class="lane-name">{{ lane.name }}</span>
        <span class="lane-count num" :style="{ color: lane.color }">{{ lane.count }}</span>
      </div>
      <div class="lane-sub">点击疑点查看证据与核验结论</div>
      <div class="lane-body">
        <IssueItem v-for="it in lane.issues" :key="it.id" :issue="it" @open="openDrill" />
        <div v-if="!lane.issues.length" class="empty">暂无</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api } from '../api';
import { useDashboard } from '../composables/useDashboard';
import type { ProgressData } from '../types';
import IssueItem from '../components/IssueItem.vue';

const { openDrill } = useDashboard();
const data = ref<ProgressData | null>(null);

onMounted(async () => {
  data.value = await api.progress();
});
</script>

<style scoped>
.lanes {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  align-items: start;
}
@media (max-width: 1100px) { .lanes { grid-template-columns: 1fr; } }

.lane-head { display: flex; align-items: center; gap: 10px; }
.lane-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.lane-name { font-size: 16px; font-weight: 600; }
.lane-count { margin-left: auto; font-size: 26px; font-weight: 700; }
.lane-sub { font-size: 12px; color: var(--faint); margin: 6px 0 16px; }
.lane-body { max-height: 560px; overflow-y: auto; padding-right: 4px; }
</style>
