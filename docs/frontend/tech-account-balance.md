# 账户余额管理系统 — 前端技术方案

> 基于 PRD（docs/prd/account-balance.md）和 UI/UX 设计稿（docs/frontend/uiux-account-balance.md），遵循现有前端架构模式（Expo Router + Zustand + NativeWind + 自定义 Theme），对齐后端 API（docs/backend/api-account-balance.md）。

---

## 1. 技术架构概述

### 1.1 技术栈

| 层级 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 框架 | Expo + React Native | 54.0 / 0.81.5 | 跨端基础 |
| 路由 | Expo Router | 6.0.23 | 文件式路由 |
| 状态管理 | Zustand | 5.0.11 | 轻量级 Store |
| 样式 | NativeWind + StyleSheet | 4.2.1 | Tailwind + RN 原生样式 |
| 主题 | 自定义 ThemeContext | - | useTheme() 获取色值 |
| 图表 | react-native-svg | **新增** | SVG 折线图 |
| 列表 | @shopify/flash-list | 2.2.1 | 高性能列表 |

### 1.2 整体架构

```
┌────────────────────────────────────────────────────────────────┐
│                        Page Layer                               │
│  app/usage.tsx                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Sidebar + Header + UsageSideTabs + Tab Content           │   │
│  └──────────────────────────┬──────────────────────────────┘   │
└─────────────────────────────┼──────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                      Component Layer                            │
│  src/components/usage/                                          │
│  ┌──────────┐ ┌──────────────┐ ┌────────────┐ ┌────────────┐  │
│  │BalanceCard│ │UsageTrendChart│ │TransactionItem│ │RechargeTab│  │
│  └─────┬────┘ └──────┬───────┘ └──────┬─────┘ └──────┬─────┘  │
└────────┼─────────────┼────────────────┼───────────────┼────────┘
         │             │                │               │
         ▼             ▼                ▼               ▼
┌────────────────────────────────────────────────────────────────┐
│                       Store Layer                               │
│  src/store/useBalanceStore.ts                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ balance / transactions / dailyUsage / conversationRanking │  │
│  │ rechargeConfig / pricing / loading states                 │  │
│  └──────────────────────────────┬───────────────────────────┘  │
└─────────────────────────────────┼──────────────────────────────┘
                                  │
                                  ▼
┌────────────────────────────────────────────────────────────────┐
│                       Service Layer                             │
│  src/services/api.ts (扩展)                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ getBalance / getTransactions / getRechargeConfig /        │  │
│  │ createRechargeOrder / getOrderStatus / getDailyUsageExt / │  │
│  │ getConversationRanking / getPricing / checkBalance         │  │
│  └──────────────────────────────┬───────────────────────────┘  │
└─────────────────────────────────┼──────────────────────────────┘
                                  │
                                  ▼
                          BFF API (Go/Gin)
```

### 1.3 新增文件清单

```
frontend/
├── app/
│   └── usage.tsx                              # 用量统计主页面（新增）
├── src/
│   ├── components/
│   │   └── usage/                             # 新增目录
│   │       ├── index.ts                       # 导出入口
│   │       ├── UsageSideTabs.tsx              # 垂直浮动 Tab 导航
│   │       ├── BalanceCard.tsx                # 余额卡片
│   │       ├── UsageTrendChart.tsx            # SVG 折线图
│   │       ├── PeriodSelector.tsx             # 时间周期下拉选择
│   │       ├── PricingInfo.tsx                # 模型费率信息
│   │       ├── ConversationRanking.tsx        # 会话消费排行
│   │       ├── TransactionItem.tsx            # 单条交易记录
│   │       ├── TransactionFilters.tsx         # 交易筛选栏
│   │       ├── RechargePresets.tsx            # 充值档位选择
│   │       ├── CustomAmount.tsx               # 自定义金额输入
│   │       ├── PaymentMethodSelector.tsx      # 支付方式选择
│   │       ├── RechargeNotes.tsx              # 充值说明
│   │       ├── LowBalanceModal.tsx            # 低余额弹窗
│   │       └── UsageSkeleton.tsx              # 骨架屏
│   ├── store/
│   │   └── useBalanceStore.ts                 # 余额状态管理（新增）
│   └── components/
│       └── layout/
│           └── BalanceDisplay.tsx             # Header 余额小组件（新增）
```

### 1.4 现有文件变更

| 文件 | 变更内容 |
|------|----------|
| `src/theme/colors.ts` | 新增余额语义色（income/expense/gift/referral/refund/balanceLow/balanceCritical/chart*） |
| `src/services/api.ts` | 新增 9 个 API 方法（余额、交易、充值、费率、用量扩展） |
| `src/types/index.ts` | 新增余额、交易、充值、费率相关 TypeScript 类型 |
| `app/profile.tsx` | "使用统计" 按钮跳转到 `/usage` |
| `app/_layout.tsx` | 路由表新增 `/usage` 页面 |

### 1.5 新增依赖

```bash
npx expo install react-native-svg
```

| 包名 | 说明 |
|------|------|
| `react-native-svg` | SVG 渲染，用于折线图。Expo 官方支持，安装即用 |

---

## 2. 类型定义

**文件：`src/types/index.ts` — 新增类型**

```typescript
// ==================== 余额 ====================

export interface BalanceInfo {
  balance: number;
  total_recharged: number;
  total_consumed: number;
  total_gifted: number;
}

export interface BalanceCheckResult {
  sufficient: boolean;
  balance: number;
  estimated_cost?: number;
}

// ==================== 交易记录 ====================

export type TransactionType = 'recharge' | 'consumption' | 'gift' | 'referral' | 'refund';

export interface Transaction {
  id: number;
  type: TransactionType;
  amount: number;           // 正数收入，负数支出
  balance_after: number;
  description: string;
  created_at: string;
  metadata?: TransactionMetadata;
}

export interface TransactionMetadata {
  // 充值
  payment_method?: string;
  amount_yuan?: string;
  order_no?: string;
  // 消费
  conversation_id?: number;
  conversation_title?: string;
  model?: string;
  input_tokens?: number;
  output_tokens?: number;
  // 邀请
  referee_id?: number;
  recharge_points?: number;
  bonus_rate?: number;
}

export interface TransactionListResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  page_size: number;
}

export type TransactionFilterType = 'all' | 'recharge' | 'consumption' | 'gift_referral';

export interface TransactionFilter {
  type: TransactionFilterType;
  days: number;
}

// ==================== 充值 ====================

export interface RechargePreset {
  amount_yuan: number;
  points: number;
}

export interface RechargeConfig {
  exchange_rate: number;
  min_amount_yuan: number;
  presets: RechargePreset[];
  payment_methods: string[];
}

export interface RechargeOrder {
  order_no: string;
  amount_yuan: number;
  points: number;
  payment_method: string;
  payment_url?: string;
  expire_at: string;
}

export interface OrderStatus {
  order_no: string;
  status: number;         // 0-待支付 1-已支付 2-已取消 3-已退款
  status_text: string;
  points: number;
  paid_at?: string;
}

// ==================== 费率 ====================

export interface ModelPricing {
  name: string;
  display_name: string;
  input_price: number;    // 点/1K Tokens
  output_price: number;
  unit: string;
}

export interface PricingInfo {
  models: ModelPricing[];
  exchange_rate: number;
  exchange_description: string;
}

// ==================== 用量扩展 ====================

export interface ConversationUsage {
  conversation_id: number;
  title: string;
  total_points: number;
  total_tokens: number;
  message_count: number;
  last_used_at: string;
}

export interface ConversationRankingResponse {
  conversations: ConversationUsage[];
  total: number;
  page: number;
  page_size: number;
}

export interface DailyUsageExtended {
  date: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  points_consumed: number;
}
```

---

## 3. API Service 扩展

**文件：`src/services/api.ts` — ApiClient 新增方法**

```typescript
class ApiClient {
  // ... 现有方法 ...

  // ==================== Balance ====================

  async getBalance() {
    const response = await this.request<{
      code: number;
      data: BalanceInfo;
    }>('/balance');
    return response.data;
  }

  async checkBalance(model: string = 'standard') {
    const response = await this.request<{
      code: number;
      data: BalanceCheckResult;
    }>(`/balance/check?model=${model}`);
    return response.data;
  }

  // ==================== Transactions ====================

  async getTransactions(params?: {
    type?: string;
    days?: number;
    page?: number;
    page_size?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.type && params.type !== 'all') query.set('type', params.type);
    if (params?.days) query.set('days', String(params.days));
    if (params?.page) query.set('page', String(params.page));
    if (params?.page_size) query.set('page_size', String(params.page_size));
    const queryStr = query.toString();

    const response = await this.request<{
      code: number;
      data: TransactionListResponse;
    }>(`/transactions${queryStr ? `?${queryStr}` : ''}`);
    return response.data;
  }

  // ==================== Recharge ====================

  async getRechargeConfig() {
    const response = await this.request<{
      code: number;
      data: RechargeConfig;
    }>('/recharge/config');
    return response.data;
  }

  async createRechargeOrder(amountYuan: number, paymentMethod: string) {
    const response = await this.request<{
      code: number;
      data: RechargeOrder;
    }>('/recharge/create', {
      method: 'POST',
      body: JSON.stringify({
        amount_yuan: amountYuan,
        payment_method: paymentMethod,
      }),
    });
    return response.data;
  }

  async getOrderStatus(orderNo: string) {
    const response = await this.request<{
      code: number;
      data: OrderStatus;
    }>(`/recharge/status/${orderNo}`);
    return response.data;
  }

  // ==================== Pricing ====================

  async getPricing() {
    const response = await this.request<{
      code: number;
      data: PricingInfo;
    }>('/pricing');
    return response.data;
  }

  // ==================== Usage Extended ====================

  async getDailyUsageExtended(params?: { days?: number }) {
    const query = params?.days ? `?days=${params.days}` : '';
    const response = await this.request<{
      code: number;
      data: { daily: DailyUsageExtended[]; days: number };
    }>(`/usage/daily-extended${query}`);
    return response.data;
  }

  async getConversationRanking(params?: {
    days?: number;
    page?: number;
    page_size?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.days) query.set('days', String(params.days));
    if (params?.page) query.set('page', String(params.page));
    if (params?.page_size) query.set('page_size', String(params.page_size));
    const queryStr = query.toString();

    const response = await this.request<{
      code: number;
      data: ConversationRankingResponse;
    }>(`/usage/conversations${queryStr ? `?${queryStr}` : ''}`);
    return response.data;
  }
}
```

---

## 4. 主题色彩扩展

**文件：`src/theme/colors.ts` — 新增语义色**

```typescript
export const darkColors = {
  // ... 现有色值 ...

  // 余额 - 交易类型色
  income: '#4CAF50',
  expense: '#D4836A',       // 复用 accent
  gift: '#9C27B0',
  referral: '#FF9800',
  refund: '#2196F3',

  // 余额 - 状态色
  balanceLow: '#FF9800',
  balanceCritical: '#E57373',

  // 余额 - 图表色
  chartLine: '#D4836A',     // 复用 accent
  chartFill: 'rgba(212,131,106,0.1)',
  chartGrid: '#333333',     // 复用 border
};

export const lightColors = {
  // ... 现有色值 ...

  // 余额 - 交易类型色
  income: '#388E3C',
  expense: '#C4704F',       // 复用 accent
  gift: '#7B1FA2',
  referral: '#F57C00',
  refund: '#1976D2',

  // 余额 - 状态色
  balanceLow: '#F57C00',
  balanceCritical: '#E53935',

  // 余额 - 图表色
  chartLine: '#C4704F',     // 复用 accent
  chartFill: 'rgba(196,112,79,0.1)',
  chartGrid: '#E7E5E4',    // 复用 border
};
```

---

## 5. 状态管理

**文件：`src/store/useBalanceStore.ts`**

遵循 `useMessageStore.ts` 的既有模式：`create<State>((set, get) => ({ ...initialState, ...actions }))`。

```typescript
import { create } from 'zustand';
import { api } from '../services/api';
import type {
  BalanceInfo,
  Transaction,
  TransactionFilter,
  DailyUsageExtended,
  ConversationUsage,
  RechargeConfig,
  PricingInfo,
  RechargeOrder,
  OrderStatus,
} from '../types';

type UsageTab = 'overview' | 'transactions' | 'recharge';

interface BalanceState {
  // 余额
  balance: BalanceInfo | null;

  // 交易记录
  transactions: Transaction[];
  transactionFilter: TransactionFilter;
  transactionPage: number;
  transactionTotal: number;
  transactionHasMore: boolean;

  // 用量趋势
  dailyUsage: DailyUsageExtended[];
  usagePeriod: number;       // 7 / 30 / 90 / 180

  // 会话排行
  conversationRanking: ConversationUsage[];
  rankingTotal: number;
  rankingPage: number;
  rankingHasMore: boolean;

  // 充值配置
  rechargeConfig: RechargeConfig | null;

  // 费率
  pricing: PricingInfo | null;

  // Tab
  activeTab: UsageTab;

  // 加载状态
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingTransactions: boolean;
  isLoadingMoreTransactions: boolean;
  isLoadingRanking: boolean;
  isLoadingMoreRanking: boolean;
  isRecharging: boolean;

  // Actions - 余额
  fetchBalance: () => Promise<void>;

  // Actions - 交易记录
  fetchTransactions: (refresh?: boolean) => Promise<void>;
  loadMoreTransactions: () => Promise<void>;
  setTransactionFilter: (filter: Partial<TransactionFilter>) => void;

  // Actions - 用量趋势
  fetchDailyUsage: (days?: number) => Promise<void>;
  setUsagePeriod: (days: number) => void;

  // Actions - 会话排行
  fetchConversationRanking: (refresh?: boolean) => Promise<void>;
  loadMoreRanking: () => Promise<void>;

  // Actions - 充值
  fetchRechargeConfig: () => Promise<void>;
  createRechargeOrder: (amountYuan: number, method: string) => Promise<RechargeOrder>;
  pollOrderStatus: (orderNo: string) => Promise<OrderStatus>;

  // Actions - 费率
  fetchPricing: () => Promise<void>;

  // Actions - Tab
  setActiveTab: (tab: UsageTab) => void;

  // Actions - 初始化 & 重置
  initOverview: () => Promise<void>;
  reset: () => void;
}

const PAGE_SIZE = 20;
const RANKING_PAGE_SIZE = 10;

const initialState = {
  balance: null as BalanceInfo | null,
  transactions: [] as Transaction[],
  transactionFilter: { type: 'all', days: 30 } as TransactionFilter,
  transactionPage: 1,
  transactionTotal: 0,
  transactionHasMore: true,
  dailyUsage: [] as DailyUsageExtended[],
  usagePeriod: 7,
  conversationRanking: [] as ConversationUsage[],
  rankingTotal: 0,
  rankingPage: 1,
  rankingHasMore: true,
  rechargeConfig: null as RechargeConfig | null,
  pricing: null as PricingInfo | null,
  activeTab: 'overview' as UsageTab,
  isLoading: false,
  isRefreshing: false,
  isLoadingTransactions: false,
  isLoadingMoreTransactions: false,
  isLoadingRanking: false,
  isLoadingMoreRanking: false,
  isRecharging: false,
};

export const useBalanceStore = create<BalanceState>((set, get) => ({
  ...initialState,

  // ==================== 余额 ====================

  fetchBalance: async () => {
    try {
      const data = await api.getBalance();
      set({ balance: data });
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  },

  // ==================== 交易记录 ====================

  fetchTransactions: async (refresh = false) => {
    const { transactionFilter } = get();

    if (refresh) {
      set({ isRefreshing: true, transactionPage: 1 });
    } else {
      set({ isLoadingTransactions: true });
    }

    try {
      const result = await api.getTransactions({
        type: transactionFilter.type,
        days: transactionFilter.days,
        page: 1,
        page_size: PAGE_SIZE,
      });

      set({
        transactions: result.transactions || [],
        transactionTotal: result.total,
        transactionPage: 1,
        transactionHasMore: (result.transactions?.length || 0) >= PAGE_SIZE,
      });
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      set({ isLoadingTransactions: false, isRefreshing: false });
    }
  },

  loadMoreTransactions: async () => {
    const {
      transactionPage, transactionHasMore,
      isLoadingMoreTransactions, transactionFilter, transactions,
    } = get();

    if (!transactionHasMore || isLoadingMoreTransactions) return;

    set({ isLoadingMoreTransactions: true });

    try {
      const nextPage = transactionPage + 1;
      const result = await api.getTransactions({
        type: transactionFilter.type,
        days: transactionFilter.days,
        page: nextPage,
        page_size: PAGE_SIZE,
      });

      set({
        transactions: [...transactions, ...(result.transactions || [])],
        transactionPage: nextPage,
        transactionHasMore: (result.transactions?.length || 0) >= PAGE_SIZE,
      });
    } catch (error) {
      console.error('Failed to load more transactions:', error);
    } finally {
      set({ isLoadingMoreTransactions: false });
    }
  },

  setTransactionFilter: (filter) => {
    const { transactionFilter } = get();
    const newFilter = { ...transactionFilter, ...filter };
    set({
      transactionFilter: newFilter,
      transactions: [],
      transactionPage: 1,
      transactionHasMore: true,
    });
    get().fetchTransactions();
  },

  // ==================== 用量趋势 ====================

  fetchDailyUsage: async (days) => {
    const period = days || get().usagePeriod;
    try {
      const result = await api.getDailyUsageExtended({ days: period });
      set({ dailyUsage: result.daily || [] });
    } catch (error) {
      console.error('Failed to fetch daily usage:', error);
    }
  },

  setUsagePeriod: (days) => {
    set({ usagePeriod: days });
    get().fetchDailyUsage(days);
  },

  // ==================== 会话排行 ====================

  fetchConversationRanking: async (refresh = false) => {
    if (refresh) {
      set({ isRefreshing: true, rankingPage: 1 });
    } else {
      set({ isLoadingRanking: true });
    }

    try {
      const result = await api.getConversationRanking({
        days: get().usagePeriod,
        page: 1,
        page_size: RANKING_PAGE_SIZE,
      });

      set({
        conversationRanking: result.conversations || [],
        rankingTotal: result.total,
        rankingPage: 1,
        rankingHasMore: (result.conversations?.length || 0) >= RANKING_PAGE_SIZE,
      });
    } catch (error) {
      console.error('Failed to fetch conversation ranking:', error);
    } finally {
      set({ isLoadingRanking: false, isRefreshing: false });
    }
  },

  loadMoreRanking: async () => {
    const {
      rankingPage, rankingHasMore,
      isLoadingMoreRanking, conversationRanking,
    } = get();

    if (!rankingHasMore || isLoadingMoreRanking) return;

    set({ isLoadingMoreRanking: true });

    try {
      const nextPage = rankingPage + 1;
      const result = await api.getConversationRanking({
        days: get().usagePeriod,
        page: nextPage,
        page_size: RANKING_PAGE_SIZE,
      });

      set({
        conversationRanking: [...conversationRanking, ...(result.conversations || [])],
        rankingPage: nextPage,
        rankingHasMore: (result.conversations?.length || 0) >= RANKING_PAGE_SIZE,
      });
    } catch (error) {
      console.error('Failed to load more ranking:', error);
    } finally {
      set({ isLoadingMoreRanking: false });
    }
  },

  // ==================== 充值 ====================

  fetchRechargeConfig: async () => {
    try {
      const data = await api.getRechargeConfig();
      set({ rechargeConfig: data });
    } catch (error) {
      console.error('Failed to fetch recharge config:', error);
    }
  },

  createRechargeOrder: async (amountYuan, method) => {
    set({ isRecharging: true });
    try {
      return await api.createRechargeOrder(amountYuan, method);
    } finally {
      set({ isRecharging: false });
    }
  },

  pollOrderStatus: async (orderNo) => {
    // 每 2s 轮询，最多 60s
    const MAX_ATTEMPTS = 30;
    const INTERVAL = 2000;

    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      const status = await api.getOrderStatus(orderNo);
      if (status.status !== 0) {
        // 非待支付状态，返回结果
        if (status.status === 1) {
          // 支付成功，刷新余额
          get().fetchBalance();
        }
        return status;
      }
      await new Promise((resolve) => setTimeout(resolve, INTERVAL));
    }
    // 超时
    return { order_no: orderNo, status: 0, status_text: '支付超时', points: 0 };
  },

  // ==================== 费率 ====================

  fetchPricing: async () => {
    try {
      const data = await api.getPricing();
      set({ pricing: data });
    } catch (error) {
      console.error('Failed to fetch pricing:', error);
    }
  },

  // ==================== Tab ====================

  setActiveTab: (tab) => {
    const { activeTab } = get();
    if (tab === activeTab) return;

    set({ activeTab: tab });

    // Tab 切换时按需加载数据
    switch (tab) {
      case 'overview':
        get().initOverview();
        break;
      case 'transactions':
        if (get().transactions.length === 0) {
          get().fetchTransactions();
        }
        break;
      case 'recharge':
        if (!get().rechargeConfig) {
          get().fetchRechargeConfig();
        }
        break;
    }
  },

  // ==================== 初始化 ====================

  initOverview: async () => {
    set({ isLoading: true });
    try {
      await Promise.all([
        get().fetchBalance(),
        get().fetchDailyUsage(),
        get().fetchConversationRanking(),
        get().fetchPricing(),
      ]);
    } finally {
      set({ isLoading: false });
    }
  },

  reset: () => {
    set(initialState);
  },
}));
```

---

## 6. 页面设计

**文件：`app/usage.tsx`**

### 6.1 页面结构

遵循 `messages.tsx` 既有模式：Sidebar + Header + Content Area。

```typescript
export default function UsagePage() {
  const { colors } = useTheme();
  const { isMobile, isDesktop } = useResponsive();
  const { isAuthenticated } = useAuthStore();
  const store = useBalanceStore();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 未登录跳转
  useEffect(() => {
    if (!isAuthenticated) router.replace('/login');
  }, [isAuthenticated]);

  // 初始化
  useEffect(() => {
    store.initOverview();
  }, []);

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.bgPrimary }}>
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen || isDesktop}
        onClose={() => setSidebarOpen(false)}
        conversations={[]}
        activeConversationId={null}
        onSelectConversation={() => {}}
        onNewConversation={() => {}}
      />

      {/* Main content */}
      <View style={{ flex: 1 }}>
        <Header
          title="用量统计"
          onMenuPress={() => setSidebarOpen(true)}
          showMenu={!isDesktop}
        />

        {/* Content area with Side Tabs */}
        <View style={{ flex: 1, position: 'relative' }}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              alignItems: 'center',
              paddingVertical: 16,
            }}
            refreshControl={
              <RefreshControl
                refreshing={store.isRefreshing}
                onRefresh={() => handleRefresh()}
              />
            }
          >
            {/* Inner container: max-width 768, centered */}
            <View style={{
              width: '100%',
              maxWidth: 768,
              paddingHorizontal: isMobile ? 16 : 24,
              position: 'relative',
            }}>
              {/* Mobile: Side Tabs horizontal at top */}
              {isMobile && (
                <UsageSideTabs
                  activeTab={store.activeTab}
                  onTabChange={store.setActiveTab}
                  layout="horizontal"
                />
              )}

              {/* Desktop/Tablet: Side Tabs vertical absolute */}
              {!isMobile && (
                <UsageSideTabs
                  activeTab={store.activeTab}
                  onTabChange={store.setActiveTab}
                  layout="vertical"
                />
              )}

              {/* Tab Content */}
              {store.activeTab === 'overview' && <OverviewContent />}
              {store.activeTab === 'transactions' && <TransactionsContent />}
              {store.activeTab === 'recharge' && <RechargeContent />}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Low Balance Modal */}
      <LowBalanceModal />
    </View>
  );
}
```

### 6.2 路由与 URL 参数

```
/usage              → 默认 overview Tab
/usage?tab=overview
/usage?tab=transactions
/usage?tab=recharge
```

使用 `expo-router` 的 `useLocalSearchParams` 读取 query 参数，`router.setParams` 更新。

---

## 7. 组件设计

### 7.1 UsageSideTabs

垂直浮动 Tab 导航（Desktop/Tablet）或水平排列（Mobile）。

```typescript
interface UsageSideTabsProps {
  activeTab: UsageTab;
  onTabChange: (tab: UsageTab) => void;
  layout: 'vertical' | 'horizontal';
}

const tabs = [
  { key: 'overview', label: '用量概览', icon: '📊' },
  { key: 'transactions', label: '交易记录', icon: '📋' },
  { key: 'recharge', label: '充值', icon: '💳' },
];
```

布局:
- vertical: `position: 'absolute', right: '100%' + 16px, top: 16`, `flexDirection: 'column'`
- horizontal: `position: 'relative'`, `flexDirection: 'row'`, `marginBottom: 12`

### 7.2 BalanceCard

余额展示卡片，显示当前余额 + 累计充值/消费/赠送。

```typescript
interface BalanceCardProps {
  balance: BalanceInfo | null;
  isLoading: boolean;
  onRechargePress?: () => void;  // 余额偏低时显示 "去充值" 按钮
}
```

关键逻辑：
- 余额数字颜色: `balance > 1000` → textPrimary, `500 < balance <= 1000` → balanceLow, `balance <= 500` → balanceCritical
- 低余额脉冲动画: `balance <= 500` 时 opacity 动画 (1 → 0.6 → 1) 循环 3 次
- 格式化: 使用 `toLocaleString()` 添加千分位分隔符

### 7.3 UsageTrendChart

基于 `react-native-svg` 的折线图，手绘实现（不依赖图表库）。

```typescript
interface UsageTrendChartProps {
  data: DailyUsageExtended[];
  period: number;
  onPeriodChange: (days: number) => void;
  pricing: PricingInfo | null;
  isLoading: boolean;
}
```

SVG 结构:
```
<Svg viewBox="0 0 {width} {height}">
  <Defs>
    <LinearGradient id="fillGradient">
      <Stop offset="0" stopColor={accent} stopOpacity="0.15" />
      <Stop offset="1" stopColor={accent} stopOpacity="0" />
    </LinearGradient>
  </Defs>

  {/* 参考线 2-3 条 */}
  <Line ... strokeDasharray="4 4" opacity={0.5} />

  {/* 填充区域 */}
  <Path d={areaPath} fill="url(#fillGradient)" />

  {/* 折线 */}
  <Path d={linePath} stroke={accent} strokeWidth={2} fill="none" />

  {/* 数据点 */}
  {points.map(p => <Circle cx={p.x} cy={p.y} r={4} />)}

  {/* X 轴标签 */}
  {labels.map(l => <SvgText ... >{l.date}</SvgText>)}
</Svg>
```

坐标计算:
```typescript
// padding
const pad = { top: 20, right: 16, bottom: 30, left: 16 };
const chartW = width - pad.left - pad.right;
const chartH = height - pad.top - pad.bottom;

// 数据点 → SVG 坐标
const maxVal = Math.max(...data.map(d => d.points_consumed), 1);
const x = (i: number) => pad.left + (i / (data.length - 1)) * chartW;
const y = (val: number) => pad.top + chartH - (val / maxVal) * chartH;
```

子组件 PeriodSelector: 下拉选择 [近7日, 近30日, 近90日, 近180日]。
子组件 PricingInfo: 嵌入图表卡片底部，展示模型费率表。

### 7.4 ConversationRanking

会话消费排行列表，带进度条。

```typescript
interface ConversationRankingProps {
  data: ConversationUsage[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onConversationPress: (conversationId: number) => void;
}
```

进度条宽度: `(item.total_points / maxPoints) * 100%`，其中 `maxPoints` 为列表中最大值。

### 7.5 TransactionItem

单条交易记录卡片。

```typescript
interface TransactionItemProps {
  transaction: Transaction;
}
```

交易类型映射:

```typescript
const TX_CONFIG: Record<TransactionType, {
  icon: string;
  label: string;
  colorKey: keyof ThemeColors;   // 引用 colors 对象的 key
  iconBgOpacity: number;
}> = {
  recharge:    { icon: '💰', label: '充值',     colorKey: 'income',   iconBgOpacity: 0.12 },
  consumption: { icon: '🔥', label: '对话消费', colorKey: 'expense',  iconBgOpacity: 0.12 },
  gift:        { icon: '🎁', label: '赠送',     colorKey: 'gift',     iconBgOpacity: 0.12 },
  referral:    { icon: '🤝', label: '邀请奖励', colorKey: 'referral', iconBgOpacity: 0.12 },
  refund:      { icon: '↩️', label: '退款',     colorKey: 'refund',   iconBgOpacity: 0.12 },
};
```

金额颜色: `amount > 0` → colors.income (绿), `amount < 0` → colors.expense (accent)。
金额格式: `+5,000 点` / `-320 点`。

### 7.6 TransactionFilters

交易筛选栏：类型 + 时间两个下拉。

```typescript
interface TransactionFiltersProps {
  filter: TransactionFilter;
  onFilterChange: (filter: Partial<TransactionFilter>) => void;
}

const TYPE_OPTIONS = [
  { label: '全部', value: 'all' },
  { label: '充值', value: 'recharge' },
  { label: '消费', value: 'consumption' },
  { label: '赠送/奖励', value: 'gift_referral' },
];

const DAYS_OPTIONS = [
  { label: '最近7天', value: 7 },
  { label: '最近30天', value: 30 },
  { label: '最近90天', value: 90 },
  { label: '最近180天', value: 180 },
];
```

使用 Modal 或绝对定位下拉面板实现选项列表。

### 7.7 RechargePresets

充值档位选择，2x2 网格布局。

```typescript
interface RechargePresetsProps {
  presets: RechargePreset[];
  selectedPreset: RechargePreset | null;
  onSelect: (preset: RechargePreset | null) => void;
}
```

布局: `flexDirection: 'row', flexWrap: 'wrap', gap: 12`，每项 `flex: 1, minWidth: '45%'`。

### 7.8 CustomAmount

自定义金额输入。

```typescript
interface CustomAmountProps {
  value: string;
  exchangeRate: number;
  minAmount: number;
  onChange: (value: string) => void;
  onFocus: () => void;         // 聚焦时取消档位选中
}
```

实时计算: `points = parseFloat(value) * exchangeRate`。
校验: 非空 + 数字 + >= minAmount。

### 7.9 PaymentMethodSelector

支付方式单选。

```typescript
interface PaymentMethodSelectorProps {
  methods: string[];
  selected: string;
  onSelect: (method: string) => void;
}

const METHOD_LABELS: Record<string, string> = {
  alipay: '支付宝',
  wechat: '微信支付',
};
```

### 7.10 LowBalanceModal

低余额弹窗，在对话页余额不足时触发。

```typescript
interface LowBalanceModalProps {
  // 从 Store 读取，无外部 props
}
```

Store 中增加控制字段:
```typescript
showLowBalanceModal: boolean;
lowBalanceAmount: number;
setShowLowBalanceModal: (show: boolean, amount?: number) => void;
```

"去充值" → `router.push('/usage?tab=recharge')`
"稍后再说" → 关闭 Modal

### 7.11 BalanceDisplay (Header)

Header 右侧余额展示小组件。

```typescript
interface BalanceDisplayProps {
  balance: number;
  onPress: () => void;  // → router.push('/usage')
}
```

放置位置: Header 组件内，铃铛图标旁。
余额不足 (`<= 500`) 时数字变红 (balanceCritical)。

### 7.12 UsageSkeleton

骨架屏组件，三种变体对应三个 Tab。

```typescript
interface UsageSkeletonProps {
  variant: 'overview' | 'transactions' | 'recharge';
}
```

使用 `Animated.loop` + opacity (0.3 → 0.7 → 0.3)，duration 800ms。
颜色: `colors.border`，圆角: `borderRadius.sm`。

---

## 8. 充值流程

### 8.1 完整时序

```
用户选择金额 + 支付方式
         │
         ▼
  点击「立即充值」
         │
         ▼
 store.createRechargeOrder(amountYuan, method)
         │
         ▼
  POST /api/v1/recharge/create
         │
         ▼
  返回 { order_no, payment_url, ... }
         │
         ▼
  拉起支付（Linking.openURL(payment_url)）
         │
         ├─── 支付完成回到 APP ───┐
         │                        ▼
         │              store.pollOrderStatus(orderNo)
         │                        │
         │              每 2s GET /recharge/status/:order_no
         │                        │
         │              status === 1 (已支付)
         │                        │
         │                        ▼
         │              显示成功 Toast
         │              store.fetchBalance() 刷新余额
         │              store.setActiveTab('overview')
         │
         ├─── 用户取消 ──────────── 显示取消提示
         └─── 超时 (60s) ────────── 显示超时提示
```

### 8.2 订单轮询逻辑

在 `useBalanceStore.pollOrderStatus` 中实现，已包含在 Store 设计中（第 5 节）。

---

## 9. 余额检查与对话集成

### 9.1 对话前检查

在 `chat.tsx` 发送消息前调用 `api.checkBalance()`。

```typescript
// chat.tsx 中发送消息前
const handleSend = async () => {
  const check = await api.checkBalance('standard');
  if (!check.sufficient) {
    // 显示低余额 Modal
    useBalanceStore.getState().setShowLowBalanceModal(true, check.balance);
    return;
  }
  // 正常发送
  await sendMessage();
};
```

### 9.2 对话后余额更新

AI 回复完成后，BFF 自动扣费。前端通过 WebSocket 或轮询获知余额变化，更新 Header BalanceDisplay。

---

## 10. 现有文件修改详情

### 10.1 `app/profile.tsx`

"使用统计" 按钮点击事件:

```typescript
// 现有按钮，修改 onPress
onPress={() => router.push('/usage')}
```

### 10.2 `app/_layout.tsx`

确认 Expo Router 文件式路由自动注册 `app/usage.tsx`，无需手动配置。如有白名单或权限配置，需添加 `/usage` 路由。

### 10.3 `src/theme/colors.ts`

在 `darkColors` 和 `lightColors` 对象末尾追加余额语义色（详见第 4 节）。`ThemeColors` 类型自动推导，无需修改。

### 10.4 `src/services/api.ts`

在 `ApiClient` 类中追加 9 个方法（详见第 3 节）。需在文件顶部导入新增类型:

```typescript
import type {
  BalanceInfo, BalanceCheckResult, TransactionListResponse,
  RechargeConfig, RechargeOrder, OrderStatus, PricingInfo,
  DailyUsageExtended, ConversationRankingResponse,
} from '../types';
```

### 10.5 `src/types/index.ts`

在文件末尾追加所有新增类型定义（详见第 2 节）。

---

## 11. 响应式适配

遵循现有 `useResponsive()` Hook 的断点定义:

| 断点 | 宽度 | Sidebar | 内容区 | Side Tabs |
|------|------|---------|--------|-----------|
| Mobile | < 768px | 隐藏/抽屉 | 全宽, padding 16px | 水平排列, static |
| Tablet | 768-1024px | 可折叠 | 全宽, padding 24px | 垂直, absolute |
| Desktop | >= 1024px | 展开 260px | max-width 768px, 居中 | 垂直, absolute |

关键适配点:
- 充值档位网格: Mobile 时仍为 2x2，但卡片更紧凑
- 折线图: 根据容器宽度自适应 SVG viewBox
- 会话排行进度条: Desktop 120px / Mobile 80px
- Side Tabs: Mobile 水平 / Desktop 垂直

---

## 12. 开发任务拆分

### Phase 1: 基础设施 (0.5 天)

- [ ] 安装 `react-native-svg` 依赖
- [ ] `src/types/index.ts` 新增所有类型定义
- [ ] `src/theme/colors.ts` 新增余额语义色
- [ ] `src/services/api.ts` 新增 9 个 API 方法

### Phase 2: Store 与基础组件 (1 天)

- [ ] `src/store/useBalanceStore.ts` 完整 Store
- [ ] `src/components/usage/UsageSideTabs.tsx`
- [ ] `src/components/usage/UsageSkeleton.tsx`
- [ ] `src/components/usage/index.ts` 导出入口

### Phase 3: 用量概览 Tab (1.5 天)

- [ ] `src/components/usage/BalanceCard.tsx`
- [ ] `src/components/usage/UsageTrendChart.tsx` (含 SVG 折线图)
- [ ] `src/components/usage/PeriodSelector.tsx`
- [ ] `src/components/usage/PricingInfo.tsx`
- [ ] `src/components/usage/ConversationRanking.tsx`

### Phase 4: 交易记录 Tab (0.5 天)

- [ ] `src/components/usage/TransactionItem.tsx`
- [ ] `src/components/usage/TransactionFilters.tsx`
- [ ] 交易列表分页加载

### Phase 5: 充值 Tab (1 天)

- [ ] `src/components/usage/RechargePresets.tsx`
- [ ] `src/components/usage/CustomAmount.tsx`
- [ ] `src/components/usage/PaymentMethodSelector.tsx`
- [ ] `src/components/usage/RechargeNotes.tsx`
- [ ] 充值流程（创建订单 → 拉起支付 → 轮询结果 → Toast）

### Phase 6: 页面集成 (0.5 天)

- [ ] `app/usage.tsx` 主页面组装
- [ ] Sidebar + Header 复用
- [ ] URL query 参数同步 Tab 状态
- [ ] 下拉刷新

### Phase 7: 全局集成 (0.5 天)

- [ ] `src/components/layout/BalanceDisplay.tsx` Header 余额组件
- [ ] `src/components/usage/LowBalanceModal.tsx`
- [ ] `app/profile.tsx` "使用统计" 跳转
- [ ] `chat.tsx` 对话前余额检查

### Phase 8: 测试与优化 (0.5 天)

- [ ] 深色/浅色主题切换验证
- [ ] Mobile / Tablet / Desktop 响应式验证
- [ ] 骨架屏 + 空状态 + 加载更多
- [ ] 异常场景（网络错误、充值失败、余额不足）

---

## 13. 组件导出入口

**文件：`src/components/usage/index.ts`**

```typescript
export { default as UsageSideTabs } from './UsageSideTabs';
export { default as BalanceCard } from './BalanceCard';
export { default as UsageTrendChart } from './UsageTrendChart';
export { default as PeriodSelector } from './PeriodSelector';
export { default as PricingInfo } from './PricingInfo';
export { default as ConversationRanking } from './ConversationRanking';
export { default as TransactionItem } from './TransactionItem';
export { default as TransactionFilters } from './TransactionFilters';
export { default as RechargePresets } from './RechargePresets';
export { default as CustomAmount } from './CustomAmount';
export { default as PaymentMethodSelector } from './PaymentMethodSelector';
export { default as RechargeNotes } from './RechargeNotes';
export { default as LowBalanceModal } from './LowBalanceModal';
export { default as UsageSkeleton } from './UsageSkeleton';
```

---

## 14. 数据格式化工具

在组件中复用的格式化函数，就近定义于 Store 或组件内：

```typescript
// 千分位格式化
function formatPoints(points: number): string {
  return Math.abs(points).toLocaleString();
}

// 带符号的点数
function formatAmount(amount: number): string {
  const prefix = amount > 0 ? '+' : '';
  return `${prefix}${amount.toLocaleString()} 点`;
}

// 日期格式化 (M月D日 HH:mm)
function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

// 短日期 (M/D)
function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// 余额状态色
function getBalanceColor(balance: number, colors: ThemeColors): string {
  if (balance <= 500) return colors.balanceCritical;
  if (balance <= 1000) return colors.balanceLow;
  return colors.textPrimary;
}
```

---

## 15. 注意事项

### 15.1 与现有代码的一致性

- 所有组件使用 `useTheme()` 获取色值，不硬编码颜色
- 所有组件使用 `useResponsive()` 判断断点
- Store 模式完全对齐 `useMessageStore.ts`：初始状态解构 + actions 内调用 api
- API 方法模式对齐现有 `api.getMessages` 等方法
- 页面结构对齐 `messages.tsx`：Sidebar + Header + ScrollView(RefreshControl)

### 15.2 react-native-svg 安装注意

```bash
cd frontend
npx expo install react-native-svg
```

Expo 54 官方支持 react-native-svg，无需额外 native 配置。Web 端自动 fallback 为 DOM SVG。

### 15.3 图表 Tooltip

SVG 折线图的 Tooltip 在 Web 端使用 hover 事件，在 Native 端使用 PanResponder/Pressable。初版可先只在 Web 端实现 hover tooltip，Native 端暂不显示（后续迭代）。

### 15.4 支付 SDK 集成

当前 BFF 的 `createPayment` 返回模拟 URL，前端使用 `Linking.openURL(paymentUrl)` 跳转。实际接入支付宝/微信 SDK 时需安装对应 Expo 插件或 Native Module，属于后续迭代内容。当前阶段先完成 UI 和轮询逻辑。

---

文档版本：1.0
创建时间：2026-02-06
作者：Claude
