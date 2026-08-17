<template>
  <div v-if="data">
    <!-- 四层评分架构 -->
    <div class="sec-title">评分架构 · 四层可复算公式链</div>
    <div class="layers">
      <div v-for="l in data.layers" :key="l.level" class="layer card c4 fade-up">
        <div class="l-head">
          <span class="l-level num">{{ l.level }}</span>
          <span class="l-tag">{{ l.tag }}</span>
          <span class="l-title">{{ l.title }}</span>
        </div>
        <p class="l-desc">{{ l.desc }}</p>
        <div class="l-formula">{{ l.formula }}</div>
      </div>
    </div>

    <div class="grid g2" style="margin-top: 18px">
      <!-- 权重 -->
      <div class="card c4 fade-up">
        <h3>五类权重（合计 100%）</h3>
        <div class="w-row" v-for="w in data.weights" :key="w.code">
          <span class="w-name" :style="{ color: w.color }">{{ w.name }}</span>
          <div class="w-track"><div class="w-fill" :style="{ width: w.weight + '%', background: w.color }"></div></div>
          <span class="w-val num">{{ w.weight }}%</span>
        </div>
        <div class="calib">
          <span v-for="c in data.calibration" :key="c.key" class="calib-item">
            <b>{{ c.name }}</b>{{ c.desc }}
          </span>
        </div>
      </div>

      <!-- 动态修正因子 -->
      <div class="card c4 fade-up">
        <h3>动态修正因子（实时增量）</h3>
        <div v-for="f in data.factors" :key="f.key" class="f-row">
          <div class="f-main">
            <span class="f-name">{{ f.name }}</span>
            <span class="f-desc">{{ f.desc }}</span>
          </div>
          <span class="f-delta num" :class="f.delta > 0 ? 'up' : 'zero'">{{ f.delta > 0 ? '+' + f.delta : f.delta }}</span>
        </div>
        <div class="flow-note" style="margin-top: 16px">修正因子作用于 L2→L3，使模型对时效、重复、回潮等场景具备自适应能力。</div>
      </div>
    </div>

    <!-- 演算表 -->
    <div class="card c4 fade-up" style="margin-top: 18px">
      <h3>子公司演算表（分类得分 → 加权 → 风险等级）</h3>
      <table class="ev">
        <tr>
          <th>子公司</th>
          <th v-for="c in data.catOrder" :key="c" class="num-cell">{{ catName(c) }}</th>
          <th class="num-cell">加权总分</th>
          <th>等级</th>
        </tr>
        <tr v-for="r in data.rows" :key="r.id">
          <td style="font-weight: 600">{{ r.name }}</td>
          <td v-for="(v, i) in r.scores" :key="i" class="num-cell" :style="{ color: data.catColors[data.catOrder[i]] }">{{ v }}</td>
          <td class="num-cell" style="font-weight: 700; color: var(--text)">{{ r.total.toFixed(1) }}</td>
          <td><span class="pill" :class="'lv-' + r.level">{{ r.levelName }}风险</span></td>
        </tr>
        <tr class="group-row">
          <td style="font-weight: 700">集团（营收加权）</td>
          <td v-for="(v, i) in data.group.scores" :key="i" class="num-cell" :style="{ color: data.catColors[data.catOrder[i]] }">{{ v }}</td>
          <td class="num-cell" style="font-weight: 700; color: var(--cyan)">{{ data.group.total.toFixed(1) }}</td>
          <td><span class="pill" :class="'lv-' + data.group.level">{{ data.group.levelName }}风险</span></td>
        </tr>
      </table>
      <div class="example">{{ data.example }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api } from '../api';
import type { ModelData, RiskCatCode } from '../types';

const data = ref<ModelData | null>(null);

const CAT_NAME: Record<RiskCatCode, string> = {
  invoice: '发票', income: '收入成本', prefer: '优惠', related: '关联交易', payroll: '个税社保',
};
const catName = (c: RiskCatCode) => CAT_NAME[c];

onMounted(async () => {
  data.value = await api.model();
});
</script>

<style scoped>
.sec-title { font-size: 16px; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 16px; }

.layers { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
@media (max-width: 1200px) { .layers { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 640px) { .layers { grid-template-columns: 1fr; } }

.l-head { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.l-level { font-size: 22px; font-weight: 700; color: var(--cyan); }
.l-tag { font-family: var(--num); font-size: 10px; letter-spacing: 1px; color: var(--cyan); padding: 2px 8px; border: 1px solid rgba(34, 211, 238, 0.35); border-radius: 4px; }
.l-title { font-size: 15px; font-weight: 600; }
.l-desc { font-size: 12.5px; color: var(--muted); line-height: 1.7; margin-bottom: 12px; }
.l-formula { font-size: 12px; color: var(--cyan); background: rgba(34, 211, 238, 0.06); border: 1px solid rgba(34, 211, 238, 0.18); border-radius: 8px; padding: 10px 12px; line-height: 1.7; }

.w-row { display: flex; align-items: center; gap: 10px; margin-bottom: 13px; }
.w-name { width: 96px; font-size: 13px; flex-shrink: 0; }
.w-track { flex: 1; height: 12px; background: rgba(56, 130, 200, 0.1); border-radius: 6px; overflow: hidden; }
.w-fill { height: 100%; border-radius: 6px; transition: width 0.9s var(--ease); }
.w-val { width: 44px; text-align: right; font-size: 14px; font-weight: 600; }

.calib { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--border); }
.calib-item { font-size: 11.5px; color: var(--muted); padding: 6px 10px; background: rgba(56, 130, 200, 0.08); border-radius: 6px; }
.calib-item b { color: var(--text-dim); margin-right: 4px; }

.f-row { display: flex; align-items: center; gap: 12px; padding: 11px 0; border-bottom: 1px solid rgba(56, 130, 200, 0.08); }
.f-main { flex: 1; min-width: 0; }
.f-name { display: block; font-size: 13.5px; color: var(--text); margin-bottom: 3px; }
.f-desc { display: block; font-size: 12px; color: var(--muted); }
.f-delta { font-size: 20px; font-weight: 700; flex-shrink: 0; }
.f-delta.up { color: #ff7a88; }
.f-delta.zero { color: var(--faint); }

.group-row td { background: rgba(34, 211, 238, 0.05); }

.example { margin-top: 16px; padding: 12px 14px; font-size: 12.5px; color: var(--amber); background: rgba(245, 185, 63, 0.07); border: 1px solid rgba(245, 185, 63, 0.22); border-radius: 8px; line-height: 1.7; }
</style>
