# 可孚医疗集团税务风险驾驶舱

面向集团税务管理的 AI 风险驾驶舱 BI 核心看板 —— 全栈实现。深色数据指挥舱风格，覆盖「风险识别 → 分级 → 处置 → 穿透取证 → 销号复核」完整闭环。

> ⚠️ 本项目数据均为**模拟数据**，仅用于方案演示与原型验证，不构成任何税务合规结论。

## 技术栈

| 层 | 技术 |
| --- | --- |
| 前端 | Vue 3 + TypeScript + Vite + ECharts 5 |
| 后端 | Express + TypeScript + better-sqlite3 |
| 数据 | SQLite（WAL 模式，模拟数据由 seed 脚本写入） |
| 工程 | npm workspaces（monorepo） |

## 核心能力

### 1. 五类加权聚合评分模型
| 分类 | 权重 | 分类 | 权重 |
| --- | --- | --- | --- |
| 发票风险 | 25% | 关联交易风险 | 20% |
| 收入成本风险 | 20% | 个税社保风险 | 20% |
| 优惠政策风险 | 15% | — | — |

四层可复算公式链：
- **L1 疑点贡献分** = 等级基础分（高100/中60/低30）× 金额规模因子（0.6~1.2）× 状态因子（待核实1.0/整改中0.9/已销号0.2）
- **L2 分类得分** = 基础分 + 疑点增量分（无显性疑点 ≠ 零风险）
- **L3 子公司得分** = Σ 分类得分 × 权重
- **L4 集团总分** = Σ 子公司得分 × 营收占比（示例 43 分 · 中风险）

风险分级：0–30 低（绿）/ 31–60 中（橙）/ 61–100 高（红）。

动态修正因子：SLA 逾期加成（高危>7天/中危>30天 +10）、时间衰减（销号180天移出）、重复聚合（同类≥3条 +15）。

### 2. 穿透下钻与三流一致核验
点击任意疑点，直达四类证据（原始凭证 / 发票 / 合同 / 资金流水），并对齐金税四期「合同—发票—资金」三流一致核验，依托 6 个主数据关联键（`sub_id / vendor_id / contract_no / invoice_no / voucher_no / bank_seq`）完成业务真实性自证。

### 3. 七大视图
01 集团总览 · 02 风险分类 · 03 处置进度 · 04 指标监控 · 05 疑点下钻 · 06 评分模型 · 07 实施路线图。

## 目录结构

```
可孚税务驾驶舱/
├── package.json            # monorepo 根配置 + 并行启动脚本
├── server/                 # 后端 API
│   └── src/
│       ├── index.ts        # Express 入口（端口 4000，首次启动自动建库）
│       ├── db.ts           # SQLite 单例 + 建表
│       ├── seed.ts         # 模拟数据种子（幂等）
│       ├── repo.ts         # 仓储层（统一从 SQLite 读取）
│       ├── serialize.ts    # 疑点 DTO 组装
│       ├── types.ts        # 类型 + 行业税负参考区间
│       ├── data/subs.ts    # 6 子公司 / 5 分类 / 18 疑点 / 证据映射
│       ├── engine/
│       │   ├── scoring.ts  # 四层评分引擎 + 动态修正因子
│       │   └── verify.ts   # 三流一致核验 + 证据生成
│       └── routes/         # overview / category / progress / metrics / issues / model
└── web/                    # 前端大屏
    └── src/
        ├── App.vue         # 顶栏 + 导航 + 视图路由
        ├── main.ts         # 注册 cockpit ECharts 主题
        ├── api/index.ts    # API 客户端
        ├── composables/useDashboard.ts   # 共享状态 + 跨视图联动
        ├── components/     # EChart / IssueItem / DrillModal
        ├── views/          # 7 个视图
        └── styles/theme.css
```

## 快速开始

```bash
# 1. 安装依赖（根目录，自动装 server + web）
npm install

# 2. 启动前后端（并行）
npm run dev
#   后端 http://localhost:4000
#   前端 http://localhost:5173

# 也可分开启动
npm run dev:server   # 仅后端
npm run dev:web      # 仅前端

# 重建种子数据（清空重插）
npm run seed
```

## API 一览

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/health` | 健康检查 |
| GET | `/api/overview` | 集团总分、风险分布、子公司排名、税负对标 |
| GET | `/api/categories` | 五类营收加权得分 + 疑点列表 |
| GET | `/api/progress` | 三状态泳道（待核实/整改中/已销号） |
| GET | `/api/metrics?sub=group` | 4 指标 12 个月趋势 |
| GET | `/api/issues` | 疑点列表（支持 `cat/level/status/sub` 筛选） |
| GET | `/api/issues/:id` | 穿透下钻（证据 + 三流核验 + 关联键） |
| GET | `/api/model` | 四层架构 / 权重 / 动态因子 / 演算表 |

## 生产切换提示

当前数据来自 SQLite 模拟库。生产切换时，需将 `server/src/repo.ts` 的数据源替换为真实数仓/数据中台接口（ODS → DWD + DIM），并保留评分引擎 `engine/scoring.ts` 与核验引擎 `engine/verify.ts` 的可复算公式链不变。
