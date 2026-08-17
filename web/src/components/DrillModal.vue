<template>
  <div class="mask" :class="{ show: !!data }" @click.self="close">
    <div v-if="data" class="modal fade-up">
      <div class="m-head">
        <div>
          <div class="m-title">{{ data.issue.desc }}</div>
          <div class="m-meta">
            {{ data.issue.subName }} · {{ data.issue.catName }} · 涉及金额 <b>{{ fmtWan(data.issue.amount) }}</b> · 责任人 {{ data.issue.owner }} · 对手方 {{ data.issue.counterparty }}
          </div>
          <div class="m-meta" style="margin-top: 7px">
            <span class="pill" :class="'lv-' + data.issue.level">{{ data.issue.levelName }}风险</span>
            <span class="pill" :class="'st-' + data.issue.status">{{ data.issue.statusName }}</span>
          </div>
        </div>
        <button class="close" @click="close">×</button>
      </div>

      <div class="m-body">
        <div class="ev-map">
          <div><b>证据组合映射</b> · 必看 <b>{{ data.evidenceMap.must }}</b> · 辅助 <b>{{ data.evidenceMap.aux }}</b></div>
          <div style="margin-top: 4px">核验要点：{{ data.evidenceMap.point }}</div>
        </div>

        <div class="link-keys">主数据关联键：<code v-for="k in data.linkKeys" :key="k">{{ k }}</code></div>

        <div class="ev-tabs">
          <button
            v-for="t in evTabs"
            :key="t.type"
            class="ev-tab"
            :class="{ active: activeEv === t.type }"
            @click="activeEv = t.type"
          >{{ t.label }}</button>
        </div>

        <table class="ev">
          <tr><th v-for="c in currentEv?.columns ?? []" :key="c">{{ c }}</th></tr>
          <tr v-for="(row, i) in currentEv?.rows ?? []" :key="i">
            <td v-for="(cell, j) in row" :key="j">{{ cell }}</td>
          </tr>
        </table>

        <div class="verify-title">三流一致核验结论</div>
        <div class="verify">
          <div v-for="v in data.verify" :key="v.name" class="v-item">
            <div class="v-name">{{ v.name }} · {{ v.hint }}</div>
            <div class="v-result" :style="{ color: vc(v.status) }">
              <span class="v-dot" :style="{ background: vc(v.status), boxShadow: `0 0 8px ${vc(v.status)}` }"></span>
              {{ vt(v.status) }} · {{ v.text }}
            </div>
          </div>
        </div>

        <div class="flow-note">穿透逻辑：对齐金税四期「合同—发票—资金」三流一致，凭证号为账务落地痕迹，支撑业务真实性自证。</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { api } from '../api';
import { useDashboard } from '../composables/useDashboard';
import type { DrilldownData } from '../types';
import { fmtWan } from '../utils';

const { drillIssueId, closeDrill } = useDashboard();
const data = ref<DrilldownData | null>(null);
const activeEv = ref('voucher');

const evTabs = [
  { type: 'voucher', label: '原始凭证' },
  { type: 'invoice', label: '发票' },
  { type: 'contract', label: '合同' },
  { type: 'flow', label: '资金流水' },
];

const currentEv = computed(() => data.value?.evidence.find((e) => e.type === activeEv.value));

watch(drillIssueId, async (id) => {
  if (id == null) {
    data.value = null;
    return;
  }
  activeEv.value = 'voucher';
  data.value = await api.drilldown(id);
});

function close() {
  closeDrill();
}

function vc(s: string) {
  return s === 'ok' ? 'var(--green)' : s === 'abnormal' ? '#f43f5e' : 'var(--orange)';
}
function vt(s: string) {
  return s === 'ok' ? '通过' : s === 'abnormal' ? '异常' : '待核验';
}
</script>
