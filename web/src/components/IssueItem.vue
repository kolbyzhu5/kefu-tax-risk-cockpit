<template>
  <div class="issue fade-up" @click="emit('open', issue.id)">
    <div class="lv" :style="{ background: issue.levelColor + '22', color: issue.levelColor }">{{ issue.levelName }}</div>
    <div class="main">
      <div class="desc">{{ issue.desc }}</div>
      <div class="meta">{{ issue.subName }} · {{ issue.catName }} · {{ issue.counterparty }} · {{ issue.owner }} · {{ issue.date }}</div>
    </div>
    <div class="amt">{{ fmtWan(issue.amount) }}<small>涉及金额</small></div>
    <span class="pill" :class="'st-' + issue.status">{{ issue.statusName }}</span>
  </div>
</template>

<script setup lang="ts">
import type { EnrichedIssue } from '../types';
import { fmtWan } from '../utils';

defineProps<{ issue: EnrichedIssue }>();
const emit = defineEmits<{ open: [id: number] }>();
</script>
