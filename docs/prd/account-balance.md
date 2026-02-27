# 账户余额管理系统 PRD

## 1. 功能概述

### 1.1 背景

GenNovel 是一个 AI 驱动的小说创作平台，用户通过 AI 对话进行创作。每次 AI 对话会消耗 Token，需要一套完整的账户余额管理系统来支撑按量计费的商业模式。

### 1.2 目标

- 让用户清晰了解自己的账户余额和消费情况
- 提供便捷的充值能力，支持多种支付方式
- 完整记录充值、消费、赠送等所有交易流水
- 提供直观的用量统计和趋势分析
- 余额不足时及时提醒，避免使用中断

### 1.3 用户价值

| 场景 | 价值 |
|------|------|
| 创作过程中 | 随时查看剩余点数，合理规划创作节奏 |
| 余额不足时 | 收到预警通知，快速充值不中断创作 |
| 费用管理 | 查看每日消费趋势，了解哪些会话消耗最多 |
| 邀请好友 | 邀请好友注册获得点数奖励，降低创作成本 |

---

## 2. 核心概念定义

### 2.1 点数（Points）

平台的虚拟货币单位，用于衡量和支付 AI 对话消耗。

| 属性 | 说明 |
|------|------|
| 名称 | 点数（Points） |
| 最小单位 | 1 点 |
| 获取方式 | 充值购买、新用户赠送、邀请奖励 |
| 消耗方式 | AI 对话按 Token 消耗扣除 |
| 有效期 | 永不过期 |

### 2.2 汇率

| 关系 | 说明 |
|------|------|
| 人民币 → 点数 | 1 元 = 100 点（可后台配置） |
| 点数 → Token | 不同模型费率不同（见 2.3） |

### 2.3 模型费率（嵌入用量页展示）

| 模型 | 输入价格 | 输出价格 | 说明 |
|------|----------|----------|------|
| 标准模型 | 1 点 / 1K Tokens | 2 点 / 1K Tokens | 日常创作推荐 |
| 高级模型 | 3 点 / 1K Tokens | 6 点 / 1K Tokens | 复杂创作场景 |

> 费率为示例，具体数值由后台配置，前端通过 API 获取。

### 2.4 交易类型

| 类型 | type 值 | 方向 | 说明 |
|------|---------|------|------|
| 充值 | `recharge` | 收入（+） | 用户在线购买点数 |
| 消费 | `consumption` | 支出（-） | AI 对话扣费 |
| 赠送 | `gift` | 收入（+） | 新用户赠送、活动赠送 |
| 邀请奖励 | `referral` | 收入（+） | 邀请好友注册获得奖励 |
| 退款 | `refund` | 收入（+） | 充值退款或系统补偿 |

---

## 3. 数据模型设计

### 3.1 新增表

#### user_balance（用户余额表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PRIMARY KEY | 主键 |
| user_id | BIGINT | UNIQUE, NOT NULL, FK | 用户 ID |
| balance | BIGINT | NOT NULL, DEFAULT 0 | 当前可用余额（点数） |
| total_recharged | BIGINT | NOT NULL, DEFAULT 0 | 累计充值点数 |
| total_consumed | BIGINT | NOT NULL, DEFAULT 0 | 累计消费点数 |
| total_gifted | BIGINT | NOT NULL, DEFAULT 0 | 累计获赠点数 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |

```sql
CREATE UNIQUE INDEX idx_user_balance_user_id ON bff_schema.user_balance(user_id);
```

#### transactions（交易流水表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PRIMARY KEY | 交易 ID |
| user_id | BIGINT | NOT NULL, FK | 用户 ID |
| type | VARCHAR(20) | NOT NULL | 交易类型：recharge/consumption/gift/referral/refund |
| amount | BIGINT | NOT NULL | 变动点数（正数收入，负数支出） |
| balance_after | BIGINT | NOT NULL | 交易后余额 |
| description | VARCHAR(200) | | 交易描述 |
| reference_id | VARCHAR(100) | | 关联 ID（订单号/会话ID/消息ID） |
| reference_type | VARCHAR(20) | | 关联类型：order/conversation/message/invite |
| metadata | JSONB | | 扩展信息（模型名、Token 数等） |
| created_at | TIMESTAMP | DEFAULT NOW() | 交易时间 |

```sql
CREATE INDEX idx_transactions_user_id ON bff_schema.transactions(user_id);
CREATE INDEX idx_transactions_user_type ON bff_schema.transactions(user_id, type);
CREATE INDEX idx_transactions_user_date ON bff_schema.transactions(user_id, created_at);
CREATE INDEX idx_transactions_reference ON bff_schema.transactions(reference_id);
```

#### recharge_orders（充值订单表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PRIMARY KEY | 订单 ID |
| user_id | BIGINT | NOT NULL, FK | 用户 ID |
| order_no | VARCHAR(64) | UNIQUE, NOT NULL | 订单号 |
| amount_yuan | DECIMAL(10,2) | NOT NULL | 充值金额（元） |
| points | BIGINT | NOT NULL | 获得点数 |
| payment_method | VARCHAR(20) | | 支付方式：alipay/wechat |
| status | SMALLINT | NOT NULL, DEFAULT 0 | 0-待支付 1-已支付 2-已取消 3-已退款 |
| paid_at | TIMESTAMP | | 支付时间 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |

```sql
CREATE UNIQUE INDEX idx_recharge_orders_order_no ON bff_schema.recharge_orders(order_no);
CREATE INDEX idx_recharge_orders_user_id ON bff_schema.recharge_orders(user_id);
CREATE INDEX idx_recharge_orders_status ON bff_schema.recharge_orders(user_id, status);
```

### 3.2 现有表改造

#### token_usage 表新增字段

| 新增字段 | 类型 | 说明 |
|----------|------|------|
| points_consumed | BIGINT | 本次消耗的点数 |

> token_usage 表已有 user_id、conversation_id、input_tokens、output_tokens、model 等字段，新增 points_consumed 记录扣费点数。

### 3.3 ER 图（新增部分）

```
bff_schema
┌─────────────────┐
│     users        │
└────────┬─────────┘
         │
         ├───1:1───── user_balance（余额）
         │
         ├───1:N───── transactions（交易流水）
         │
         ├───1:N───── recharge_orders（充值订单）
         │
         ├───1:N───── token_usage（用量记录，已有）
         │
         └───1:N───── system_messages（系统消息，已有，用于余额预警）
```

---

## 4. 页面结构

### 4.1 入口

| 入口 | 位置 | 说明 |
|------|------|------|
| Header 余额显示 | Header 右侧（铃铛旁） | 显示当前点数余额，点击进入用量页 |
| 用户菜单 | Sidebar 底部用户菜单 | "用量统计"菜单项 |
| 个人资料页 | profile.tsx "使用统计" 按钮 | 已有按钮，需关联跳转 |

### 4.2 页面规划

共 1 个主页面，内含 3 个 Tab：

```
/usage
├── Tab 1: 用量概览（默认）
├── Tab 2: 交易记录
└── Tab 3: 充值
```

### 4.3 用量概览 Tab

```
┌──────────────────────────────────────────────────────────┐
│  Sidebar  │  Header: 用量统计                 [🔔] [☀️]  │
│           ├──────────────────────────────────────────────┤
│           │                                              │
│           │  ┌────────────────────────────────────────┐  │
│           │  │  账户余额                               │  │
│           │  │  🔵 12,500 点                           │  │
│           │  │  ┌──────┐  ┌──────┐  ┌──────┐          │  │
│           │  │  │累计充值│  │累计消费│  │累计赠送│          │  │
│           │  │  │50,000 │  │36,200 │  │ 1,200│          │  │
│           │  │  └──────┘  └──────┘  └──────┘          │  │
│           │  └────────────────────────────────────────┘  │
│           │                                              │
│           │  ┌────────────────────────────────────────┐  │
│           │  │  用量趋势           [近7日 ▼]           │  │
│           │  │                                        │  │
│           │  │  📊 (折线图: 每日消耗点数)              │  │
│           │  │      ╱╲                                │  │
│           │  │    ╱    ╲   ╱╲                         │  │
│           │  │  ╱        ╲╱  ╲                        │  │
│           │  │  ─────────────────                     │  │
│           │  │  1/31  2/1  2/2  2/3  2/4  2/5  2/6   │  │
│           │  │                                        │  │
│           │  │  模型费率：标准 1点/1K入 2点/1K出       │  │
│           │  │          高级 3点/1K入 6点/1K出         │  │
│           │  └────────────────────────────────────────┘  │
│           │                                              │
│           │  ┌────────────────────────────────────────┐  │
│           │  │  会话消费排行                           │  │
│           │  │                                        │  │
│           │  │  1. 武侠小说创作     ██████████  3,200点│  │
│           │  │  2. 科幻故事大纲     ████████    2,500点│  │
│           │  │  3. 角色设定讨论     ██████      1,800点│  │
│           │  │  4. 世界观构建       ████        1,200点│  │
│           │  │  ...                                   │  │
│           │  └────────────────────────────────────────┘  │
│           │                                              │
└───────────┴──────────────────────────────────────────────┘
```

### 4.4 交易记录 Tab

```
┌────────────────────────────────────────────────────────┐
│  [用量概览]  [交易记录]  [充值]                          │
├────────────────────────────────────────────────────────┤
│                                                        │
│  筛选：[全部 ▼]  [最近30天 ▼]                           │
│                                                        │
│  ┌────────────────────────────────────────────────┐   │
│  │ 🟢 充值         +5,000 点                      │   │
│  │    支付宝 · 50.00元       2026-02-06 14:30     │   │
│  ├────────────────────────────────────────────────┤   │
│  │ 🔴 对话消费      -320 点                       │   │
│  │    武侠小说创作 · 标准模型   2026-02-06 13:22  │   │
│  ├────────────────────────────────────────────────┤   │
│  │ 🔴 对话消费      -180 点                       │   │
│  │    科幻故事大纲 · 标准模型   2026-02-06 11:05  │   │
│  ├────────────────────────────────────────────────┤   │
│  │ 🟡 邀请奖励      +500 点                       │   │
│  │    邀请用户 user@xx.com    2026-02-05 09:30    │   │
│  ├────────────────────────────────────────────────┤   │
│  │ 🟣 新用户赠送    +1,000 点                     │   │
│  │    注册赠送               2026-02-01 08:00     │   │
│  └────────────────────────────────────────────────┘   │
│                                                        │
│               ── 加载更多 ──                           │
└────────────────────────────────────────────────────────┘
```

### 4.5 充值 Tab

```
┌────────────────────────────────────────────────────────┐
│  [用量概览]  [交易记录]  [充值]                          │
├────────────────────────────────────────────────────────┤
│                                                        │
│  当前余额: 12,500 点                                    │
│                                                        │
│  选择充值金额                                           │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐      │
│  │  10元   │  │  50元   │  │ 100元  │  │ 500元  │      │
│  │ 1,000点 │  │ 5,000点 │  │10,000点│  │50,000点│      │
│  └────────┘  └────────┘  └────────┘  └────────┘      │
│                                                        │
│  自定义金额                                             │
│  ┌──────────────────────┐                              │
│  │ ¥ [输入金额]          │  = XX,XXX 点                │
│  └──────────────────────┘                              │
│  最低充值 1 元                                          │
│                                                        │
│  支付方式                                               │
│  ○ 支付宝    ○ 微信支付                                │
│                                                        │
│  ┌────────────────────────────────────────┐            │
│  │          立即充值                       │            │
│  └────────────────────────────────────────┘            │
│                                                        │
│  充值说明：                                             │
│  · 充值后点数立即到账，不可退款                          │
│  · 点数永不过期                                         │
│  · 如遇问题请联系客服                                   │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### 4.6 余额预警（复用系统消息）

当用户余额低于阈值（默认 500 点）时，自动生成一条 `usage` 类型的系统消息：

```
标题：余额不足提醒
内容：您的账户余额已不足 500 点，为避免创作中断，建议尽快充值。
      当前余额：480 点
      [去充值]
```

---

## 5. 交互规范

### 5.1 用量概览

| 交互 | 行为 |
|------|------|
| 进入页面 | 加载余额信息 + 默认近 7 日趋势 + 会话消费排行 |
| 切换时间周期 | 下拉选择：近7日 / 近30日 / 近90日 / 近180日，重新加载趋势图 |
| 点击会话项 | 跳转到该会话的聊天页面 |
| 下拉刷新 | 重新加载所有数据 |

### 5.2 交易记录

| 交互 | 行为 |
|------|------|
| 筛选类型 | 全部 / 充值 / 消费 / 赠送奖励 |
| 筛选时间 | 最近7天 / 最近30天 / 最近90天 / 最近180天 |
| 滚动到底 | 分页加载更多记录 |
| 下拉刷新 | 重新加载列表 |

### 5.3 充值

| 交互 | 行为 |
|------|------|
| 选择档位 | 高亮选中，显示对应点数 |
| 输入自定义金额 | 实时计算对应点数，取消档位选中 |
| 选择支付方式 | 单选切换 |
| 点击充值 | 调起支付（生成订单 → 拉起支付SDK → 回调确认） |
| 支付成功 | 余额更新，显示成功提示，自动切到用量概览 |
| 支付取消/失败 | 提示信息，保留当前页面 |

### 5.4 Header 余额展示

| 交互 | 行为 |
|------|------|
| 默认展示 | Header 铃铛旁显示 "💰 12,500" 点数 |
| 余额不足 | 数字变红色 |
| 点击 | 跳转到 /usage 页面 |

---

## 6. API 接口设计

### 6.1 余额相关

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/v1/balance` | GET | 获取账户余额信息 |
| `/api/v1/balance/check` | GET | 检查余额是否足够（对话前调用） |

### 6.2 交易相关

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/v1/transactions` | GET | 获取交易记录列表（分页+筛选） |

### 6.3 充值相关

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/v1/recharge/config` | GET | 获取充值配置（档位、汇率、支付方式） |
| `/api/v1/recharge/create` | POST | 创建充值订单 |
| `/api/v1/recharge/callback` | POST | 支付回调（支付宝/微信通知） |
| `/api/v1/recharge/status/:order_no` | GET | 查询订单状态 |

### 6.4 用量统计相关（已有，可复用/扩展）

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/v1/usage` | GET | 获取用量汇总（已有） |
| `/api/v1/usage/daily` | GET | 获取每日用量（已有，扩展点数维度） |
| `/api/v1/usage/conversations` | GET | 按会话统计消费排行（新增） |

### 6.5 费率相关

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/v1/pricing` | GET | 获取模型费率配置 |

### 6.6 关键接口详细设计

**GET /api/v1/balance**

```json
{
  "code": 0,
  "data": {
    "balance": 12500,
    "total_recharged": 50000,
    "total_consumed": 36200,
    "total_gifted": 1200
  }
}
```

**GET /api/v1/transactions?type=all&days=30&page=1&page_size=20**

```json
{
  "code": 0,
  "data": {
    "transactions": [
      {
        "id": 1,
        "type": "recharge",
        "amount": 5000,
        "balance_after": 12500,
        "description": "充值 50.00 元",
        "created_at": "2026-02-06T14:30:00Z",
        "metadata": {
          "payment_method": "alipay",
          "amount_yuan": "50.00",
          "order_no": "R20260206143000001"
        }
      },
      {
        "id": 2,
        "type": "consumption",
        "amount": -320,
        "balance_after": 7500,
        "description": "武侠小说创作",
        "created_at": "2026-02-06T13:22:00Z",
        "metadata": {
          "conversation_id": 42,
          "conversation_title": "武侠小说创作",
          "model": "standard",
          "input_tokens": 1200,
          "output_tokens": 800
        }
      }
    ],
    "total": 156,
    "page": 1,
    "page_size": 20
  }
}
```

**GET /api/v1/recharge/config**

```json
{
  "code": 0,
  "data": {
    "exchange_rate": 100,
    "min_amount_yuan": 1,
    "presets": [
      { "amount_yuan": 10, "points": 1000 },
      { "amount_yuan": 50, "points": 5000 },
      { "amount_yuan": 100, "points": 10000 },
      { "amount_yuan": 500, "points": 50000 }
    ],
    "payment_methods": ["alipay", "wechat"]
  }
}
```

**GET /api/v1/usage/conversations?days=30&page=1&page_size=10**

```json
{
  "code": 0,
  "data": {
    "conversations": [
      {
        "conversation_id": 42,
        "title": "武侠小说创作",
        "total_points": 3200,
        "total_tokens": 45000,
        "message_count": 28,
        "last_used_at": "2026-02-06T13:22:00Z"
      }
    ],
    "total": 8,
    "page": 1,
    "page_size": 10
  }
}
```

**GET /api/v1/pricing**

```json
{
  "code": 0,
  "data": {
    "models": [
      {
        "name": "standard",
        "display_name": "标准模型",
        "input_price": 1,
        "output_price": 2,
        "unit": "1K Tokens"
      },
      {
        "name": "advanced",
        "display_name": "高级模型",
        "input_price": 3,
        "output_price": 6,
        "unit": "1K Tokens"
      }
    ],
    "exchange_rate": 100,
    "exchange_description": "1 元 = 100 点"
  }
}
```

---

## 7. 组件设计

### 7.1 组件树

```
app/usage.tsx                          # 用量统计主页面
├── Sidebar                            # 全局侧边栏（复用）
├── Header                             # 顶部栏（复用）
├── UsageTabs                          # 三个 Tab 切换
│
├── OverviewTab                        # 用量概览
│   ├── BalanceCard                    # 余额卡片（余额+累计数据）
│   ├── UsageTrendChart                # 用量趋势折线图
│   │   └── PeriodSelector             # 时间周期选择器
│   ├── PricingInfo                    # 模型费率说明
│   └── ConversationRanking            # 会话消费排行
│
├── TransactionsTab                    # 交易记录
│   ├── TransactionFilters             # 筛选栏（类型+时间）
│   └── TransactionList                # 交易列表
│       └── TransactionItem            # 单条交易记录
│
└── RechargeTab                        # 充值
    ├── RechargePresets                 # 充值档位选择
    ├── CustomAmount                    # 自定义金额输入
    ├── PaymentMethodSelector           # 支付方式选择
    └── RechargeNotes                   # 充值说明
```

### 7.2 新增组件清单

| 组件 | 路径 | 说明 |
|------|------|------|
| BalanceCard | `src/components/usage/BalanceCard.tsx` | 余额展示卡片 |
| UsageTrendChart | `src/components/usage/UsageTrendChart.tsx` | 折线图（纯 RN 实现或 SVG） |
| PeriodSelector | `src/components/usage/PeriodSelector.tsx` | 时间周期下拉 |
| ConversationRanking | `src/components/usage/ConversationRanking.tsx` | 会话消费排行 |
| TransactionItem | `src/components/usage/TransactionItem.tsx` | 交易记录卡片 |
| TransactionFilters | `src/components/usage/TransactionFilters.tsx` | 筛选栏 |
| RechargePresets | `src/components/usage/RechargePresets.tsx` | 充值档位 |
| CustomAmount | `src/components/usage/CustomAmount.tsx` | 自定义金额 |
| PaymentMethodSelector | `src/components/usage/PaymentMethodSelector.tsx` | 支付方式 |
| BalanceDisplay | `src/components/layout/BalanceDisplay.tsx` | Header 余额小组件 |

---

## 8. 状态管理

### 8.1 useBalanceStore

```typescript
interface BalanceState {
  // 余额
  balance: number;
  totalRecharged: number;
  totalConsumed: number;
  totalGifted: number;

  // 交易记录
  transactions: Transaction[];
  transactionFilter: { type: string; days: number };
  transactionPage: number;
  transactionHasMore: boolean;

  // 用量趋势
  dailyUsage: DailyUsage[];
  usagePeriod: number; // 7/30/90/180

  // 会话排行
  conversationRanking: ConversationUsage[];

  // 充值
  rechargeConfig: RechargeConfig | null;

  // 费率
  pricing: PricingInfo | null;

  // 加载状态
  isLoading: boolean;
  isLoadingTransactions: boolean;
  isLoadingMore: boolean;
  isRecharging: boolean;

  // Actions
  fetchBalance: () => Promise<void>;
  fetchTransactions: (refresh?: boolean) => Promise<void>;
  loadMoreTransactions: () => Promise<void>;
  setTransactionFilter: (filter: Partial<TransactionFilter>) => void;
  fetchDailyUsage: (days?: number) => Promise<void>;
  fetchConversationRanking: () => Promise<void>;
  fetchRechargeConfig: () => Promise<void>;
  fetchPricing: () => Promise<void>;
  createRechargeOrder: (amountYuan: number, method: string) => Promise<RechargeOrder>;
}
```

---

## 9. 样式规范

### 9.1 交易类型颜色与图标

| 类型 | 图标 | 颜色 | 说明 |
|------|------|------|------|
| recharge | 💰 | `#4CAF50`（绿色） | 充值 |
| consumption | 🔥 | `accent`（#D4836A） | 消费 |
| gift | 🎁 | `#9C27B0`（紫色） | 赠送 |
| referral | 🤝 | `#FF9800`（橙色） | 邀请奖励 |
| refund | ↩️ | `#2196F3`（蓝色） | 退款 |

### 9.2 余额状态颜色

| 状态 | 颜色 | 条件 |
|------|------|------|
| 正常 | `textPrimary` | balance > 1000 |
| 偏低 | `#FF9800`（橙色） | 500 < balance ≤ 1000 |
| 不足 | `#E57373`（红色） | balance ≤ 500 |

---

## 10. 邀请返利

### 10.1 与现有系统联动

现有 `referrals` 表记录推荐关系，`users` 表有 `invite_code` 字段。

### 10.2 返利规则

| 事件 | 推荐人奖励 | 被推荐人奖励 |
|------|-----------|-------------|
| 新用户注册（使用邀请码） | 无 | 1,000 点（新用户赠送） |
| 被推荐人每次充值 | 充值点数的 10% | 无 |

### 10.3 实现方式

- 注册时：检查邀请码 → 写入 referrals 表 → 赠送新用户初始点数（`InitBalanceForNewUser`）
- 充值时：充值事务成功后同步调用 `grantRechargeReferralBonus` → 查询 referrals 表 → 给推荐人创建 `referral` 类型交易

---

## 11. 边界情况

| 场景 | 处理方式 |
|------|----------|
| 余额不足发起对话 | 对话前 check 余额，不足时弹窗提示并引导充值 |
| 对话过程中余额耗尽 | 当前回复完成后提示余额不足，阻止下一次发送 |
| 充值后支付超时 | 订单 30 分钟未支付自动取消 |
| 重复支付回调 | 根据 order_no 幂等处理 |
| 并发扣费 | 数据库行级锁保证余额一致性 |
| 无交易记录 | 显示空状态："暂无交易记录" |
| 金额输入非法 | 前端校验 + 后端校验，最低 1 元 |

---

## 12. 开发任务拆分

### Phase 1：数据层

- [ ] 创建 user_balance 表
- [ ] 创建 transactions 表
- [ ] 创建 recharge_orders 表
- [ ] token_usage 表新增 points_consumed 字段
- [ ] 新用户注册时自动创建 balance 记录并赠送初始点数

### Phase 2：后端 API

- [ ] 余额查询 API (GET /balance)
- [ ] 交易记录 API (GET /transactions)
- [ ] 充值配置 API (GET /recharge/config)
- [ ] 创建订单 API (POST /recharge/create)
- [ ] 支付回调 API (POST /recharge/callback)
- [ ] 订单状态查询 API (GET /recharge/status/:order_no)
- [ ] 会话消费排行 API (GET /usage/conversations)
- [ ] 费率配置 API (GET /pricing)
- [ ] 扩展现有 usage/daily API 支持点数维度

### Phase 3：前端 - 用量概览

- [ ] 创建 /usage 页面（含 Sidebar）
- [ ] 创建 useBalanceStore
- [ ] BalanceCard 余额卡片组件
- [ ] UsageTrendChart 折线图组件
- [ ] PeriodSelector 时间周期选择器
- [ ] ConversationRanking 会话排行组件
- [ ] PricingInfo 费率说明组件

### Phase 4：前端 - 交易记录

- [ ] TransactionItem 交易记录卡片
- [ ] TransactionFilters 筛选栏
- [ ] 交易记录列表（分页+筛选）

### Phase 5：前端 - 充值

- [ ] RechargePresets 档位选择
- [ ] CustomAmount 自定义金额
- [ ] PaymentMethodSelector 支付方式
- [ ] 充值流程（创建订单 → 拉起支付 → 轮询结果）

### Phase 6：全局集成

- [ ] Header BalanceDisplay 余额展示组件
- [ ] 对话前余额检查 + 不足提示
- [ ] 余额预警系统消息
- [ ] 邀请返利联动
- [ ] profile.tsx "使用统计" 按钮跳转

---

## 13. 验收标准

### 13.1 功能验收

- [ ] 正确显示账户余额和累计数据
- [ ] 用量趋势折线图按时间周期正确展示
- [ ] 会话消费排行正确排序和展示
- [ ] 交易记录支持分类和时间筛选
- [ ] 交易记录分页加载和下拉刷新正常
- [ ] 充值档位选择和自定义金额输入正常
- [ ] 支付流程完整（创建订单→支付→到账）
- [ ] 充值后余额实时更新
- [ ] 每次对话正确扣费并生成交易记录
- [ ] 余额不足时阻止对话并引导充值
- [ ] 余额预警消息正确触发
- [ ] 邀请返利正确发放
- [ ] 模型费率信息正确展示

### 13.2 UI 验收

- [ ] 深色/浅色主题正确显示
- [ ] 与聊天页保持一致的 Sidebar 布局
- [ ] 响应式布局（移动端/桌面端）
- [ ] 折线图在不同数据量下显示正常
- [ ] 交易记录颜色和图标正确区分类型

---

文档版本：1.0
创建时间：2026-02-06
作者：Claude
