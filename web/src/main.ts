import { createApp } from 'vue';
import * as echarts from 'echarts';
import App from './App.vue';
import './styles/theme.css';

// 注册自定义深色指挥舱 ECharts 主题
echarts.registerTheme('cockpit', {
  backgroundColor: 'transparent',
  textStyle: { color: '#9fb3d1' },
  color: ['#22d3ee', '#38bdf8', '#fb4d5c', '#fb923c', '#34d399', '#a78bfa', '#f5b93f'],
  categoryAxis: {
    axisLine: { lineStyle: { color: 'rgba(56,130,200,0.25)' } },
    axisTick: { show: false },
    axisLabel: { color: '#6b7fa0' },
    splitLine: { show: false },
  },
  valueAxis: {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#6b7fa0' },
    splitLine: { lineStyle: { color: 'rgba(56,130,200,0.12)' } },
  },
  legend: { textStyle: { color: '#9fb3d1' } },
  tooltip: {
    backgroundColor: 'rgba(10,20,36,0.95)',
    borderColor: 'rgba(56,130,200,0.3)',
    textStyle: { color: '#e6f1ff' },
  },
});

createApp(App).mount('#app');
