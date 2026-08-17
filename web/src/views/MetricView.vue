<template>
  <div v-if="data">
    <div class="mbar">
      <div class="mtitle">指标监控 · 近 12 个月趋势</div>
      <select :value="subId" @change="onSub">
        <option v-for="s in data.subjects" :key="s.id" :value="s.id">{{ s.name }}</option>
      </select>
    </div>

    <div class="mgrid">
      <div v-for="s in data.series" :key="s.key" class="card c4 fade-up">
        <div class="mhead">
          <span class="mdot" :style="{ background: s.color }"></span>
          <span class="mname" :style="{ color: s.color }">{{ s.name }}</span>
          <span class="munit">{{ s.unit }}</span>
          <span v-if="s.warn != null" class="pill lv-high">预警线 {{ s.warn }}%</span>
        </div>
        <EChart :option="line(s)" height="220px" />
      </div>
    </div>

    <div class="flow-note">口径说明：税负 / 毛利率 / 费用率按集团营收加权或单子公司口径展示；收入勾稽差异（申报 vs 财报口径）设置 5% 预警线，超线自动标记为收入成本类疑点。</div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { EChartsOption } from 'echarts';
import { api } from '../api';
import type { MetricSeries, MetricsData } from '../types';
import EChart from '../components/EChart.vue';

const data = ref<MetricsData | null>(null);
const subId = ref('group');

const months = () => (data.value ? data.value.months.map((m) => m.slice(2).replace('-', '/')) : []);

function line(s: MetricSeries): EChartsOption {
  const markLine = s.warn == null
    ? undefined
    : {
        symbol: 'none',
        lineStyle: { color: '#fb4d5c', type: 'dashed', width: 1 },
        label: { show: true, formatter: `预警 ${s.warn}%`, color: '#ff7a88', fontSize: 10 },
        data: [{ yAxis: s.warn }],
      };
  return {
    grid: { left: 42, right: 18, top: 24, bottom: 26 },
    tooltip: { trigger: 'axis', valueFormatter: (v) => `${v}${s.unit}` },
    xAxis: { type: 'category', boundaryGap: false, data: months(), axisLabel: { fontSize: 10 } },
    yAxis: { type: 'value', scale: true, axisLabel: { formatter: `{value}${s.unit}` } },
    series: [
      {
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        data: s.data,
        lineStyle: { width: 2.5, color: s.color, shadowColor: s.color, shadowBlur: 8 },
        itemStyle: { color: s.color },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: s.color + '44' }, { offset: 1, color: s.color + '00' }] } },
        markLine,
      },
    ],
  };
}

function onSub(e: Event) {
  subId.value = (e.target as HTMLSelectElement).value;
  load();
}

async function load() {
  data.value = await api.metrics(subId.value);
}

onMounted(load);
</script>

<style scoped>
.mbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
.mtitle { font-size: 16px; font-weight: 600; letter-spacing: 0.5px; }
.mgrid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; }
@media (max-width: 1000px) { .mgrid { grid-template-columns: 1fr; } }
.mhead { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.mdot { width: 8px; height: 8px; border-radius: 50%; }
.mname { font-size: 14px; font-weight: 600; }
.munit { font-size: 12px; color: var(--faint); font-family: var(--num); }
.mhead .pill { margin-left: auto; }
</style>
