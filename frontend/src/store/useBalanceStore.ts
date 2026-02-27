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

export type UsageTab = 'overview' | 'transactions' | 'recharge';

interface BalanceState {
  // Balance
  balance: BalanceInfo | null;

  // Transactions
  transactions: Transaction[];
  transactionFilter: TransactionFilter;
  transactionPage: number;
  transactionTotal: number;
  transactionHasMore: boolean;

  // Daily usage trend
  dailyUsage: DailyUsageExtended[];
  usagePeriod: number;

  // Conversation ranking
  conversationRanking: ConversationUsage[];
  rankingTotal: number;
  rankingPage: number;
  rankingHasMore: boolean;

  // Recharge config
  rechargeConfig: RechargeConfig | null;

  // Pricing
  pricing: PricingInfo | null;

  // Tab
  activeTab: UsageTab;

  // Low balance modal
  showLowBalanceModal: boolean;
  lowBalanceAmount: number;

  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingTransactions: boolean;
  isLoadingMoreTransactions: boolean;
  isLoadingRanking: boolean;
  isLoadingMoreRanking: boolean;
  isRecharging: boolean;

  // Actions
  fetchBalance: () => Promise<void>;
  fetchTransactions: (refresh?: boolean) => Promise<void>;
  loadMoreTransactions: () => Promise<void>;
  setTransactionFilter: (filter: Partial<TransactionFilter>) => void;
  fetchDailyUsage: (days?: number) => Promise<void>;
  setUsagePeriod: (days: number) => void;
  fetchConversationRanking: (refresh?: boolean) => Promise<void>;
  loadMoreRanking: () => Promise<void>;
  fetchRechargeConfig: () => Promise<void>;
  createRechargeOrder: (amountYuan: number, method: string) => Promise<RechargeOrder>;
  pollOrderStatus: (orderNo: string) => Promise<OrderStatus>;
  cancelPolling: () => void;
  fetchPricing: () => Promise<void>;
  setActiveTab: (tab: UsageTab) => void;
  setShowLowBalanceModal: (show: boolean, amount?: number) => void;
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
  showLowBalanceModal: false,
  lowBalanceAmount: 0,
  isLoading: false,
  isRefreshing: false,
  isLoadingTransactions: false,
  isLoadingMoreTransactions: false,
  isLoadingRanking: false,
  isLoadingMoreRanking: false,
  isRecharging: false,
};

let pollAbortController: AbortController | null = null;

export const useBalanceStore = create<BalanceState>((set, get) => ({
  ...initialState,

  fetchBalance: async () => {
    try {
      const data = await api.getBalance();
      set({ balance: data });
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  },

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
    get().fetchConversationRanking();
  },

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
    // Cancel any existing poll
    pollAbortController?.abort();
    const controller = new AbortController();
    pollAbortController = controller;

    const MAX_ATTEMPTS = 30;
    const INTERVAL = 2000;

    try {
      for (let i = 0; i < MAX_ATTEMPTS; i++) {
        if (controller.signal.aborted) break;
        const status = await api.getOrderStatus(orderNo);
        if (status.status !== 0) {
          if (status.status === 1) {
            get().fetchBalance();
          }
          return status;
        }
        await new Promise((resolve, reject) => {
          const timer = setTimeout(resolve, INTERVAL);
          controller.signal.addEventListener('abort', () => { clearTimeout(timer); reject(new Error('cancelled')); }, { once: true });
        });
      }
    } catch {
      // Polling was cancelled
    } finally {
      if (pollAbortController === controller) {
        pollAbortController = null;
      }
    }
    return { order_no: orderNo, status: 0, status_text: '支付超时', points: 0 } as OrderStatus;
  },

  cancelPolling: () => {
    pollAbortController?.abort();
    pollAbortController = null;
  },

  fetchPricing: async () => {
    try {
      const data = await api.getPricing();
      set({ pricing: data });
    } catch (error) {
      console.error('Failed to fetch pricing:', error);
    }
  },

  setActiveTab: (tab) => {
    const { activeTab } = get();
    if (tab === activeTab) return;

    set({ activeTab: tab });

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
        get().fetchBalance();
        break;
    }
  },

  setShowLowBalanceModal: (show, amount) => {
    set({
      showLowBalanceModal: show,
      lowBalanceAmount: amount ?? get().lowBalanceAmount,
    });
  },

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
