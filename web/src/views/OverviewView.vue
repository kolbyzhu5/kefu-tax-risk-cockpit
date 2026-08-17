<template>
  <div v-if="data">
    <!-- KPI 数字带 -->
    <div class="kpi-strip">
      <div class="kpi fade-up" style="--kc: var(--cyan); --kg: var(--cyan-glow)">
        <div class="k-label">集团总风险得分</div>
        <div class="k-num">{{ data.score.toFixed(0) }}<small>/100</small></div>
        <div class="k-sub">五类加权聚合 · 营收加权</div>
      </div>
      <div class="kpi fade-up" style="--kc: var(--red); --kg: rgba(244,63,94,.5)">
        <div class="k-label">高风险疑点</div>
        <div class="k-num">{{ data.distribution.high }}<small>个</small></div>
        <div class="k-sub">需立即处置</div>
      </div>
      <div class="kpi fade-up" style="--kc: var(--amber); --kg: rgba(245,185,63,.5)">
        <div class="k-label">待处置金额</div>
        <div class="k-num">{{ (data.openAmountWan / 10000).toFixed(2) }}<small>亿</small></div>
        <div class="k-sub">待核实 + 整改中</div>
      </div>
      <div class="kpi fade-up" style="--kc: var(--orange); --kg: rgba(251,146,60,.5)">
        <div class="k-label">待核实</div>
        <div class="k-num">{{ data.pendingCount }}<small>个</small></div>
        <div class="k-sub">待派单核实</div>
      </div>
      <div class="kpi fade-up" style="--kc: var(--green); --kg: rgba(52,211,153,.5)">
        <div class="k-label">处置完成率</div>
        <div class="k-num">{{ data.completionRate }}<small>%</small></div>
        <div class="k-sub">已销号 {{ data.closedCount }} / {{ data.total }} 个</div>
      </div>
    </div>

    <div class="grid g3">
      <!-- 仪表盘 -->
      <div class="card c4 fade-up">
        <h3>集团总风险得分</h3>
        <EChart :option="gaugeOption" height="240px" />
        <div class="gauge-side">
          <span class="pill" :class="'lv-' + data.level" :style="{ boxShadow: `0 0 14px ${levelColor}55` }">{{ levelName }}风险</span>
          <div class="delta">参考区间：0–30 低 · 31–60 中 · 61–100 高</div>
        </div>
      </div>

      <!-- 风险分布 -->
      <div class="card c4 fade-up">
        <h3>风险数量分布</h3>
        <div class="dist">
          <div v-for="lv in distRows" :key="lv.key" class="drow">
            <span class="dot" :style="{ background: lv.color }"></span>
            <span class="lab" :style="{ color: lv.color }">{{ lv.label }}</span>
            <div class="bar" @click="goFilter('level', lv.key)">
              <div class="seg" :style="{ width: pct(lv.count) + '%', background: lv.color }">{{ lv.count }}</div>
            </div>
          </div>
          <div class="legend">共 <b class="num" style="color: var(--text)">{{ data.total }}</b> 个疑点 · 高危 <b class="num" style="color: #f43f5e">{{ data.distribution.high }}</b> 个需立即处置</div>
        </div>
      </div>

      <!-- 排名 -->
      <div class="card c4 fade-up">
        <h3>子公司风险排名（点击下钻）</h3>
        <div class="rank">
          <div v-for="(r, i) in data.ranking" :key="r.id" class="ritem" @click="goFilter('sub', r.id)">
            <div class="rrow">
              <span class="idx num">{{ String(i + 1).padStart(2, '0') }}</span>
              <span class="name">{{ r.name }}</span>
              <div class="track">
                <div class="fill" :style="{ width: r.score + '%', background: lc(r.level), color: lc(r.level) }"></div>
              </div>
              <span class="score num" :style="{ color: lc(r.level) }">{{ r.score.toFixed(1) }}</span>
              <span class="tag" :style="{ background: lc(r.level) + '22', color: lc(r.level) }">{{ ln(r.level) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 税负对标 -->
    <div class="card c4 fade-up" style="margin-top: 18px">
      <h3>子公司税负对标（行业参考区间）</h3>
      <table class="ev">
        <tr><th>子公司</th><th>行业</th><th>增值税率</th><th>营收(亿)</th><th>增值税税负率</th><th>行业参考区间</th><th>偏离</th></tr>
        <tr v-for="s in data.taxBenchmark" :key="s.id">
          <td style="font-weight: 600">{{ s.name }}</td>
          <td>{{ s.industry }}</td>
          <td class="num-cell">{{ s.vatRate }}</td>
          <td class="num-cell">{{ s.revenue }}</td>
          <td class="num-cell" style="font-weight: 700">{{ s.taxBurden.toFixed(2) }}%</td>
          <td class="num-cell">{{ s.range }}</td>
          <td><span class="pill" :class="s.dev === '正常' ? 'lv-low' : 'lv-mid'">{{ s.dev }}</span></td>
        </tr>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type { EChartsOption } from 'echarts';
import { api } from '../api';
import { useDashboard } from '../composables/useDashboard';
import type { OverviewData, RiskLevel } from '../types';
import EChart from '../components/EChart.vue';

const { goFilter } = useDashboard();
const data = ref<OverviewData | null>(null);

const LEVEL_COLOR: Record<RiskLevel, string> = { high: '#f43f5e', mid: '#fb923c', low: '#34d399' };
const LEVEL_NAME: Record<RiskLevel, string> = { high: '高', mid: '中', low: '低' };

const levelColor = computed(() => (data.value ? LEVEL_COLOR[data.value.level] : '#34d399'));
const levelName = computed(() => (data.value ? LEVEL_NAME[data.value.level] : '低'));

const distRows = computed(() => {
  if (!data.value) return [];
  const d = data.value.distribution;
  return [
    { key: 'high', label: '高', color: '#f43f5e', count: d.high },
    { key: 'mid', label: '中', color: '#fb923c', count: d.mid },
    { key: 'low', label: '低', color: '#34d399', count: d.low },
  ];
});
const pct = (n: number) => (data.value ? (n / data.value.total) * 100 : 0);
const lc = (l: RiskLevel) => LEVEL_COLOR[l];
const ln = (l: RiskLevel) => LEVEL_NAME[l];

const gaugeOption = computed<EChartsOption>(() => ({
  series: [
    {
      type: 'gauge',
      startAngle: 210,
      endAngle: -30,
      min: 0,
      max: 100,
      radius: '90%',
      center: ['50%', '55%'],
      progress: { show: true, width: 12, itemStyle: { color: levelColor.value, shadowBlur: 12, shadowColor: levelColor.value } },
      axisLine: { lineStyle: { width: 12, color: [[0.3, '#34d399'], [0.6, '#fb923c'], [1, '#f43f5e']] } },
      pointer: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      detail: {
        valueAnimation: true,
        formatter: '{value}',
        color: '#e6f1ff',
        fontSize: 44,
        fontWeight: 700,
        fontFamily: 'Rajdhani',
        offsetCenter: [0, '30%'],
      },
      title: { offsetCenter: [0, '65%'], color: '#6b7fa0', fontSize: 12 },
      data: [{ value: data.value?.score ?? 0, name: 'RISK SCORE' }],
    },
  ],
}));

onMounted(async () => {
  data.value = await api.overview();
});
</script>

<style scoped>
.gauge-side {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
}
.delta { font-size: 12px; color: var(--muted); text-align: center; }

.dist { display: flex; flex-direction: column; gap: 14px; padding-top: 6px; }
.drow { display: flex; align-items: center; gap: 10px; }
.dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.lab { width: 20px; font-size: 14px; font-weight: 600; flex-shrink: 0; }
.bar { flex: 1; height: 22px; background: rgba(56, 130, 200, 0.08); border-radius: 5px; overflow: hidden; cursor: pointer; }
.seg {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  transition: width 0.8s var(--ease);
  min-width: 26px;
  font-family: var(--num);
}
.legend { font-size: 12.5px; color: var(--muted); margin-top: 4px; }

.rank { display: flex; flex-direction: column; gap: 13px; padding-top: 6px; }
.ritem { cursor: pointer; transition: transform 0.2s; }
.ritem:hover { transform: translateX(4px); }
.rrow { display: flex; align-items: center; gap: 10px; }
.idx { width: 24px; font-size: 13px; color: var(--faint); }
.name { width: 68px; font-size: 13.5px; flex-shrink: 0; }
.track { flex: 1; height: 10px; background: rgba(56, 130, 200, 0.1); border-radius: 5px; overflow: hidden; }
.fill { height: 100%; border-radius: 5px; transition: width 0.9s var(--ease); }
.score { width: 42px; text-align: right; font-size: 15px; font-weight: 600; }
.tag { font-size: 11px; padding: 2px 8px; border-radius: 999px; }
</style>
