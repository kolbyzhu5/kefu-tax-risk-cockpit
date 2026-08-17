<template>
  <div ref="el" :style="{ width: '100%', height: height }"></div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

const props = defineProps<{ option: echarts.EChartsOption; height?: string }>();

const el = ref<HTMLElement>();
let chart: echarts.ECharts | null = null;

function render() {
  if (!chart || !el.value) return;
  chart.setOption(props.option, true);
}

function resize() {
  chart?.resize();
}

onMounted(() => {
  chart = echarts.init(el.value!, 'cockpit');
  render();
  window.addEventListener('resize', resize);
});

watch(() => props.option, () => render(), { deep: true });

onBeforeUnmount(() => {
  window.removeEventListener('resize', resize);
  chart?.dispose();
  chart = null;
});
</script>
