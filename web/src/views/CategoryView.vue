<template>
  <div v-if="data">
    <!-- 五类风险卡片 -->
    <div class="cat-grid">
      <div
        v-for="c in data.categories"
        :key="c.code"
        class="cat-card card c4 fade-up"
        :class="{ active: sel === c.code }"
        :style="{ '--cc': c.color }"
        @click="sel = sel === c.code ? '' : c.code"
      >
        <div class="c-head">
          <span class="c-name" :style="{ color: c.color }">{{ c.name }}</span>
          <span class="pill" :style="{ background: c.color + '22', color: c.color }">权重 {{ c.weight }}%</span>
        </div>
        <div class="c-score num">{{ c.score }}<small>/100</small></div>
        <div class="c-bar"><div class="c-fill" :style="{ width: c.score + '%', background: c.color }"></div></div>
        <div class="c-foot">
          <span>显性疑点 {{ c.issueCount }} 个</span>
          <span class="c-go">点击筛选 →</span>
        </div>
      </div>
    </div>

    <!-- 疑点列表 -->
    <div class="card c4 fade-up" style="margin-top: 18px">
      <div class="seg-bar">
        <button class="seg" :class="{ active: sel === '' }" @click="sel = ''">全部（{{ data.issues.length }}）</button>
        <button
          v-for="c in data.categories"
          :key="c.code"
          class="seg"
          :class="{ active: sel === c.code }"
          @click="sel = c.code"
        >{{ c.name }}（{{ c.issueCount }}）</button>
      </div>
      <div class="issue-list">
        <IssueItem v-for="it in filtered" :key="it.id" :issue="it" @open="openDrill" />
        <div v-if="!filtered.length" class="empty">该分类暂无显性疑点——无显性疑点 ≠ 零风险，仍保留行业基线分</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { api } from '../api';
import { useDashboard } from '../composables/useDashboard';
import type { CategoryData } from '../types';
import IssueItem from '../components/IssueItem.vue';

const { openDrill } = useDashboard();
const data = ref<CategoryData | null>(null);
const sel = ref('');

const filtered = computed(() => (sel.value ? data.value!.issues.filter((i) => i.catCode === sel.value) : data.value!.issues));

onMounted(async () => {
  data.value = await api.categories();
});
</script>

<style scoped>
.cat-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
}
@media (max-width: 1200px) { .cat-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 640px) { .cat-grid { grid-template-columns: 1fr; } }

.cat-card { cursor: pointer; transition: all 0.25s var(--ease); }
.cat-card:hover { transform: translateY(-3px); border-color: var(--cc); box-shadow: 0 8px 24px color-mix(in srgb, var(--cc) 18%, transparent); }
.cat-card.active { border-color: var(--cc); box-shadow: 0 0 0 1px var(--cc) inset, 0 0 20px color-mix(in srgb, var(--cc) 22%, transparent); }

.c-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.c-name { font-size: 15px; font-weight: 600; }
.c-score { font-size: 34px; font-weight: 700; color: var(--text); line-height: 1; }
.c-score small { font-size: 13px; color: var(--muted); font-weight: 500; margin-left: 2px; }
.c-bar { height: 6px; background: rgba(56, 130, 200, 0.12); border-radius: 4px; overflow: hidden; margin: 14px 0 12px; }
.c-fill { height: 100%; border-radius: 4px; transition: width 0.9s var(--ease); }
.c-foot { display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: var(--muted); }
.c-go { color: var(--cyan); font-size: 12px; }

.seg-bar { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
.seg {
  padding: 7px 15px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: transparent;
  color: var(--muted);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s var(--ease);
}
.seg:hover { color: var(--text); border-color: var(--border-strong); }
.seg.active { color: var(--cyan); border-color: rgba(34, 211, 238, 0.4); background: rgba(34, 211, 238, 0.08); }
.issue-list { max-height: 520px; overflow-y: auto; padding-right: 4px; }
</style>
