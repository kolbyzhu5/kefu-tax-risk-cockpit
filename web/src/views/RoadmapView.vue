<template>
  <div>
    <!-- 五阶段时间轴 -->
    <div class="sec-title">实施路线图 · 五阶段推进</div>
    <div class="timeline">
      <div v-for="(p, i) in phases" :key="p.no" class="t-item fade-up">
        <div class="t-rail">
          <span class="t-dot num" :class="p.status">{{ p.no }}</span>
          <span v-if="i < phases.length - 1" class="t-line"></span>
        </div>
        <div class="t-body card c4">
          <div class="t-head">
            <span class="t-name">{{ p.name }}</span>
            <span class="t-time num">{{ p.time }}</span>
            <span class="pill" :class="stCls(p.status)">{{ stLabel(p.status) }}</span>
          </div>
          <p class="t-desc">{{ p.desc }}</p>
          <div class="t-kpi">
            <span class="k-tag">核心 KPI</span>
            <span class="k-val">{{ p.kpi }}</span>
          </div>
          <div class="t-deliver">
            <span class="k-tag">交付物</span>
            <span class="k-val">{{ p.deliver }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="grid g2" style="margin-top: 22px">
      <!-- 分工 -->
      <div class="card c4 fade-up">
        <h3>职责分工</h3>
        <div v-for="r in roles" :key="r.role" class="role-row">
          <span class="role-name">{{ r.role }}</span>
          <span class="role-desc">{{ r.desc }}</span>
        </div>
      </div>

      <!-- 风险与应对 -->
      <div class="card c4 fade-up">
        <h3>关键风险与应对</h3>
        <div v-for="r in risks" :key="r.risk" class="risk-row">
          <div class="risk-name">⚠ {{ r.risk }}</div>
          <div class="risk-resp">→ {{ r.resp }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
type PhaseStatus = 'done' | 'doing' | 'todo';

const phases: { no: string; name: string; time: string; status: PhaseStatus; desc: string; kpi: string; deliver: string }[] = [
  { no: '1', name: '数据接入与血缘', time: 'M1–M2 · 8周', status: 'done', desc: '打通 ERP、发票、资金、个税、合同、申报 6 大源系统，落地 ODS 层并完成 6 个主键关联锚点打标。', kpi: '数据覆盖率 ≥95% · 主键打通率 100%', deliver: 'ODS 层 + 主数据血缘图谱' },
  { no: '2', name: '数仓建模', time: 'M2–M3 · 4周', status: 'done', desc: '构建 DWD 事实层与 DIM 维度层，完成主数据治理与口径统一，形成「合同—发票—资金」三流对齐的数据底座。', kpi: '主数据唯一率 ≥98% · 口径一致率 100%', deliver: 'DWD + DIM 模型' },
  { no: '3', name: '规则引擎与评分模型', time: 'M3–M4 · 6周', status: 'doing', desc: '落地五类风险规则、四层评分引擎与动态修正因子，通过 AHP 完成权重重校（CR<0.1）。', kpi: '规则命中准确率 ≥90% · 权重 CR<0.1', deliver: '规则引擎 + 评分引擎（可复算）' },
  { no: '4', name: '驾驶舱上线', time: 'M4–M5 · 6周', status: 'todo', desc: '发布 7 视图驾驶舱，实现穿透下钻与三流一致核验，联调疑点处置工作流。', kpi: '首屏 <2s · 下钻 ≤3 次点击', deliver: '税务风险驾驶舱 v1.0' },
  { no: '5', name: '闭环运营', time: 'M5 起 · 持续', status: 'todo', desc: 'SLA 逾期预警、月度权重重校与历史回测，形成「识别—分级—处置—销号—复核」持续闭环。', kpi: '疑点平均处置周期 <30天 · 逾期率 <10%', deliver: '运营 SOP + 月度校准报告' },
];

const roles = [
  { role: '税务部', desc: '规则口径定义、疑点定性复核、处置与销号' },
  { role: '财务/共享中心', desc: '凭证、发票、资金流水数据质量与三流核对' },
  { role: 'IT / 数据团队', desc: '数仓建设、血缘治理、看板工程与运维' },
  { role: '外部税务顾问', desc: 'AHP 权重重校、历史稽查案例回测与阈值校准' },
];

const risks = [
  { risk: '源数据质量不达预期', resp: '前置主数据治理，源系统整改与看板并行推进' },
  { risk: '规则误报率偏高', resp: '灰度发布 + 阈值回测，先内测再全量' },
  { risk: '跨部门协同推动难', resp: '管理层挂帅，纳入月度经营会通报机制' },
  { risk: '模型“黑箱”质疑', resp: '全公式白盒可解释，输出演算表与规则文档' },
];

const stCls = (s: PhaseStatus) => (s === 'done' ? 'lv-low' : s === 'doing' ? 'lv-mid' : 'st-pending');
const stLabel = (s: PhaseStatus) => (s === 'done' ? '已完成' : s === 'doing' ? '进行中' : '待启动');
</script>

<style scoped>
.sec-title { font-size: 16px; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 20px; }

.timeline { display: flex; flex-direction: column; gap: 0; }
.t-item { display: flex; gap: 18px; }
.t-rail { display: flex; flex-direction: column; align-items: center; width: 40px; flex-shrink: 0; }
.t-dot {
  width: 34px; height: 34px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 15px; flex-shrink: 0;
  border: 1px solid var(--border-strong); background: var(--panel-solid); color: var(--cyan);
  box-shadow: 0 0 14px rgba(34, 211, 238, 0.25);
}
.t-dot.done { color: #6ee7b7; border-color: rgba(52, 211, 153, 0.5); box-shadow: 0 0 14px rgba(52, 211, 153, 0.3); }
.t-dot.doing { color: #ffb37a; border-color: rgba(251, 146, 60, 0.5); box-shadow: 0 0 14px rgba(251, 146, 60, 0.3); }
.t-line { width: 1px; flex: 1; background: linear-gradient(180deg, var(--border-strong), rgba(56, 130, 200, 0.1)); margin: 4px 0; }
.t-body { flex: 1; margin-bottom: 18px; }

.t-head { display: flex; align-items: center; gap: 12px; }
.t-name { font-size: 16px; font-weight: 600; }
.t-time { font-size: 13px; color: var(--muted); }
.t-head .pill { margin-left: auto; }
.t-desc { font-size: 13px; color: var(--text-dim); line-height: 1.7; margin: 12px 0; }
.t-kpi, .t-deliver { display: flex; align-items: center; gap: 10px; margin-top: 8px; font-size: 13px; }
.k-tag { flex-shrink: 0; font-size: 11px; color: var(--cyan); border: 1px solid rgba(34, 211, 238, 0.3); border-radius: 4px; padding: 2px 8px; }
.k-val { color: var(--text-dim); }

.role-row { display: flex; gap: 14px; padding: 12px 0; border-bottom: 1px solid rgba(56, 130, 200, 0.08); }
.role-name { width: 130px; flex-shrink: 0; font-size: 13.5px; font-weight: 600; color: var(--text); }
.role-desc { font-size: 13px; color: var(--muted); line-height: 1.6; }

.risk-row { padding: 13px 0; border-bottom: 1px solid rgba(56, 130, 200, 0.08); }
.risk-name { font-size: 13.5px; font-weight: 600; color: var(--amber); margin-bottom: 5px; }
.risk-resp { font-size: 13px; color: var(--muted); line-height: 1.6; }
</style>
