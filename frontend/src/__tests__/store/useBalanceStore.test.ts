import { useBalanceStore } from '../../store/useBalanceStore';

// Mock the api module
jest.mock('../../services/api', () => ({
  api: {
    getBalance: jest.fn(),
    getTransactions: jest.fn(),
    getDailyUsageExtended: jest.fn(),
    getConversationRanking: jest.fn(),
    getRechargeConfig: jest.fn(),
    createRechargeOrder: jest.fn(),
    getOrderStatus: jest.fn(),
    getPricing: jest.fn(),
  },
}));

import { api } from '../../services/api';
const mockApi = api as jest.Mocked<typeof api>;

const initialState = {
  balance: null,
  transactions: [],
  transactionFilter: { type: 'all' as const, days: 30 },
  transactionPage: 1,
  transactionTotal: 0,
  transactionHasMore: true,
  dailyUsage: [],
  usagePeriod: 7,
  conversationRanking: [],
  rankingTotal: 0,
  rankingPage: 1,
  rankingHasMore: true,
  rechargeConfig: null,
  pricing: null,
  activeTab: 'overview' as const,
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

beforeEach(() => {
  useBalanceStore.setState(initialState);
  jest.clearAllMocks();
});

describe('useBalanceStore', () => {
  // Initial state
  test('has correct initial state', () => {
    const state = useBalanceStore.getState();
    expect(state.balance).toBeNull();
    expect(state.transactions).toEqual([]);
    expect(state.transactionFilter).toEqual({ type: 'all', days: 30 });
    expect(state.transactionPage).toBe(1);
    expect(state.transactionHasMore).toBe(true);
    expect(state.dailyUsage).toEqual([]);
    expect(state.usagePeriod).toBe(7);
    expect(state.conversationRanking).toEqual([]);
    expect(state.rankingHasMore).toBe(true);
    expect(state.rechargeConfig).toBeNull();
    expect(state.pricing).toBeNull();
    expect(state.activeTab).toBe('overview');
    expect(state.showLowBalanceModal).toBe(false);
    expect(state.isLoading).toBe(false);
  });

  // fetchBalance
  describe('fetchBalance', () => {
    test('success sets balance', async () => {
      const balanceData = { balance: 1000, total_recharged: 2000, total_consumed: 800, total_gifted: 200 };
      mockApi.getBalance.mockResolvedValue(balanceData);
      await useBalanceStore.getState().fetchBalance();
      expect(useBalanceStore.getState().balance).toEqual(balanceData);
    });

    test('failure does not crash', async () => {
      mockApi.getBalance.mockRejectedValue(new Error('Network error'));
      await useBalanceStore.getState().fetchBalance();
      expect(useBalanceStore.getState().balance).toBeNull();
    });
  });

  // fetchTransactions
  describe('fetchTransactions', () => {
    const mockTransactions: any[] = [
      { id: 1, type: 'recharge', amount: 100, balance_after: 100, description: 'Test', created_at: '2025-01-01' },
      { id: 2, type: 'consumption', amount: -10, balance_after: 90, description: 'Usage', created_at: '2025-01-02' },
    ];

    test('success sets transactions', async () => {
      mockApi.getTransactions.mockResolvedValue({ transactions: mockTransactions, total: 2, page: 1, page_size: 20 });
      await useBalanceStore.getState().fetchTransactions();
      expect(useBalanceStore.getState().transactions).toEqual(mockTransactions);
      expect(useBalanceStore.getState().transactionTotal).toBe(2);
    });

    test('refresh mode resets page', async () => {
      useBalanceStore.setState({ transactionPage: 3 });
      mockApi.getTransactions.mockResolvedValue({ transactions: mockTransactions, total: 2, page: 1, page_size: 20 });
      await useBalanceStore.getState().fetchTransactions(true);
      expect(useBalanceStore.getState().transactionPage).toBe(1);
    });

    test('sets hasMore false when results less than page size', async () => {
      mockApi.getTransactions.mockResolvedValue({ transactions: mockTransactions, total: 2, page: 1, page_size: 20 });
      await useBalanceStore.getState().fetchTransactions();
      expect(useBalanceStore.getState().transactionHasMore).toBe(false);
    });

    test('sets hasMore true when results equal page size', async () => {
      const fullPage: any[] = Array.from({ length: 20 }, (_, i) => ({
        id: i, type: 'recharge', amount: 100, balance_after: 100, description: 'Test', created_at: '2025-01-01',
      }));
      mockApi.getTransactions.mockResolvedValue({ transactions: fullPage, total: 40, page: 1, page_size: 20 });
      await useBalanceStore.getState().fetchTransactions();
      expect(useBalanceStore.getState().transactionHasMore).toBe(true);
    });

    test('passes filter params to api', async () => {
      useBalanceStore.setState({ transactionFilter: { type: 'recharge', days: 7 } });
      mockApi.getTransactions.mockResolvedValue({ transactions: [], total: 0, page: 1, page_size: 20 });
      await useBalanceStore.getState().fetchTransactions();
      expect(mockApi.getTransactions).toHaveBeenCalledWith({
        type: 'recharge', days: 7, page: 1, page_size: 20,
      });
    });

    test('failure clears loading state', async () => {
      mockApi.getTransactions.mockRejectedValue(new Error('fail'));
      await useBalanceStore.getState().fetchTransactions();
      expect(useBalanceStore.getState().isLoadingTransactions).toBe(false);
      expect(useBalanceStore.getState().isRefreshing).toBe(false);
    });

    test('handles null transactions in response', async () => {
      mockApi.getTransactions.mockResolvedValue({ transactions: null as any, total: 0, page: 1, page_size: 20 });
      await useBalanceStore.getState().fetchTransactions();
      expect(useBalanceStore.getState().transactions).toEqual([]);
    });
  });

  // loadMoreTransactions
  describe('loadMoreTransactions', () => {
    test('appends new transactions', async () => {
      const existing: any[] = [{ id: 1, type: 'recharge', amount: 100, balance_after: 100, description: 'T1', created_at: '2025-01-01' }];
      const newOnes: any[] = [{ id: 2, type: 'consumption', amount: -10, balance_after: 90, description: 'T2', created_at: '2025-01-02' }];
      useBalanceStore.setState({ transactions: existing as any, transactionHasMore: true });
      mockApi.getTransactions.mockResolvedValue({ transactions: newOnes, total: 2, page: 2, page_size: 20 });
      await useBalanceStore.getState().loadMoreTransactions();
      expect(useBalanceStore.getState().transactions).toHaveLength(2);
      expect(useBalanceStore.getState().transactionPage).toBe(2);
    });

    test('does nothing when hasMore is false', async () => {
      useBalanceStore.setState({ transactionHasMore: false });
      await useBalanceStore.getState().loadMoreTransactions();
      expect(mockApi.getTransactions).not.toHaveBeenCalled();
    });

    test('does nothing when already loading', async () => {
      useBalanceStore.setState({ transactionHasMore: true, isLoadingMoreTransactions: true });
      await useBalanceStore.getState().loadMoreTransactions();
      expect(mockApi.getTransactions).not.toHaveBeenCalled();
    });
  });

  // setTransactionFilter
  describe('setTransactionFilter', () => {
    test('merges filter and triggers fetch', async () => {
      mockApi.getTransactions.mockResolvedValue({ transactions: [], total: 0, page: 1, page_size: 20 });
      useBalanceStore.getState().setTransactionFilter({ type: 'consumption' });
      expect(useBalanceStore.getState().transactionFilter.type).toBe('consumption');
      expect(useBalanceStore.getState().transactionFilter.days).toBe(30);
      expect(useBalanceStore.getState().transactionPage).toBe(1);
      expect(useBalanceStore.getState().transactions).toEqual([]);
    });

    test('resets hasMore when filter changes', () => {
      useBalanceStore.setState({ transactionHasMore: false });
      mockApi.getTransactions.mockResolvedValue({ transactions: [], total: 0, page: 1, page_size: 20 });
      useBalanceStore.getState().setTransactionFilter({ days: 7 });
      expect(useBalanceStore.getState().transactionHasMore).toBe(true);
    });
  });

  // fetchDailyUsage
  describe('fetchDailyUsage', () => {
    test('success sets dailyUsage', async () => {
      const daily = [{ date: '2025-01-01', input_tokens: 100, output_tokens: 200, total_tokens: 300, points_consumed: 10 }];
      mockApi.getDailyUsageExtended.mockResolvedValue({ daily, days: 7 });
      await useBalanceStore.getState().fetchDailyUsage();
      expect(useBalanceStore.getState().dailyUsage).toEqual(daily);
    });

    test('uses custom days param', async () => {
      mockApi.getDailyUsageExtended.mockResolvedValue({ daily: [], days: 30 });
      await useBalanceStore.getState().fetchDailyUsage(30);
      expect(mockApi.getDailyUsageExtended).toHaveBeenCalledWith({ days: 30 });
    });

    test('uses usagePeriod when no param', async () => {
      useBalanceStore.setState({ usagePeriod: 14 });
      mockApi.getDailyUsageExtended.mockResolvedValue({ daily: [], days: 14 });
      await useBalanceStore.getState().fetchDailyUsage();
      expect(mockApi.getDailyUsageExtended).toHaveBeenCalledWith({ days: 14 });
    });

    test('handles null daily in response', async () => {
      mockApi.getDailyUsageExtended.mockResolvedValue({ daily: null as any, days: 7 });
      await useBalanceStore.getState().fetchDailyUsage();
      expect(useBalanceStore.getState().dailyUsage).toEqual([]);
    });
  });

  // setUsagePeriod
  describe('setUsagePeriod', () => {
    test('sets period and triggers fetches', () => {
      mockApi.getDailyUsageExtended.mockResolvedValue({ daily: [], days: 30 });
      mockApi.getConversationRanking.mockResolvedValue({ conversations: [], total: 0, page: 1, page_size: 10 });
      useBalanceStore.getState().setUsagePeriod(30);
      expect(useBalanceStore.getState().usagePeriod).toBe(30);
      expect(mockApi.getDailyUsageExtended).toHaveBeenCalled();
      expect(mockApi.getConversationRanking).toHaveBeenCalled();
    });
  });

  // fetchConversationRanking
  describe('fetchConversationRanking', () => {
    const mockConvs = [
      { conversation_id: 1, title: 'Test', total_points: 100, total_tokens: 1000, message_count: 10, last_used_at: '2025-01-01' },
    ];

    test('success sets ranking', async () => {
      mockApi.getConversationRanking.mockResolvedValue({ conversations: mockConvs, total: 1, page: 1, page_size: 10 });
      await useBalanceStore.getState().fetchConversationRanking();
      expect(useBalanceStore.getState().conversationRanking).toEqual(mockConvs);
      expect(useBalanceStore.getState().rankingTotal).toBe(1);
    });

    test('refresh mode resets page', async () => {
      useBalanceStore.setState({ rankingPage: 3 });
      mockApi.getConversationRanking.mockResolvedValue({ conversations: mockConvs, total: 1, page: 1, page_size: 10 });
      await useBalanceStore.getState().fetchConversationRanking(true);
      expect(useBalanceStore.getState().rankingPage).toBe(1);
    });

    test('sets hasMore based on results length', async () => {
      mockApi.getConversationRanking.mockResolvedValue({ conversations: mockConvs, total: 1, page: 1, page_size: 10 });
      await useBalanceStore.getState().fetchConversationRanking();
      expect(useBalanceStore.getState().rankingHasMore).toBe(false);
    });
  });

  // loadMoreRanking
  describe('loadMoreRanking', () => {
    test('appends new ranking results', async () => {
      const existing = [{ conversation_id: 1, title: 'A', total_points: 100, total_tokens: 1000, message_count: 5, last_used_at: '2025-01-01' }];
      const newOnes = [{ conversation_id: 2, title: 'B', total_points: 50, total_tokens: 500, message_count: 3, last_used_at: '2025-01-02' }];
      useBalanceStore.setState({ conversationRanking: existing as any, rankingHasMore: true });
      mockApi.getConversationRanking.mockResolvedValue({ conversations: newOnes, total: 2, page: 2, page_size: 10 });
      await useBalanceStore.getState().loadMoreRanking();
      expect(useBalanceStore.getState().conversationRanking).toHaveLength(2);
      expect(useBalanceStore.getState().rankingPage).toBe(2);
    });

    test('does nothing when hasMore is false', async () => {
      useBalanceStore.setState({ rankingHasMore: false });
      await useBalanceStore.getState().loadMoreRanking();
      expect(mockApi.getConversationRanking).not.toHaveBeenCalled();
    });

    test('does nothing when already loading', async () => {
      useBalanceStore.setState({ rankingHasMore: true, isLoadingMoreRanking: true });
      await useBalanceStore.getState().loadMoreRanking();
      expect(mockApi.getConversationRanking).not.toHaveBeenCalled();
    });
  });

  // fetchRechargeConfig
  describe('fetchRechargeConfig', () => {
    test('success sets config', async () => {
      const config = { exchange_rate: 100, min_amount_yuan: 1, presets: [], payment_methods: ['alipay'] };
      mockApi.getRechargeConfig.mockResolvedValue(config);
      await useBalanceStore.getState().fetchRechargeConfig();
      expect(useBalanceStore.getState().rechargeConfig).toEqual(config);
    });

    test('failure does not crash', async () => {
      mockApi.getRechargeConfig.mockRejectedValue(new Error('fail'));
      await useBalanceStore.getState().fetchRechargeConfig();
      expect(useBalanceStore.getState().rechargeConfig).toBeNull();
    });
  });

  // createRechargeOrder
  describe('createRechargeOrder', () => {
    test('returns order and manages loading state', async () => {
      const order = { order_no: 'ORD001', amount_yuan: 10, points: 1000, payment_method: 'alipay', expire_at: '2025-01-01' };
      mockApi.createRechargeOrder.mockResolvedValue(order);
      const result = await useBalanceStore.getState().createRechargeOrder(10, 'alipay');
      expect(result).toEqual(order);
      expect(useBalanceStore.getState().isRecharging).toBe(false);
    });

    test('clears loading on error', async () => {
      mockApi.createRechargeOrder.mockRejectedValue(new Error('fail'));
      await expect(useBalanceStore.getState().createRechargeOrder(10, 'alipay')).rejects.toThrow();
      expect(useBalanceStore.getState().isRecharging).toBe(false);
    });
  });

  // pollOrderStatus
  describe('pollOrderStatus', () => {
    test('returns immediately when status is non-zero (success)', async () => {
      const status = { order_no: 'ORD001', status: 1, status_text: '支付成功', points: 1000 };
      mockApi.getOrderStatus.mockResolvedValue(status);
      mockApi.getBalance.mockResolvedValue({ balance: 1000, total_recharged: 1000, total_consumed: 0, total_gifted: 0 });
      const result = await useBalanceStore.getState().pollOrderStatus('ORD001');
      expect(result).toEqual(status);
      expect(mockApi.getBalance).toHaveBeenCalled(); // Refreshes balance on success
    });

    test('returns immediately when status is cancelled (non-zero, non-1)', async () => {
      const status = { order_no: 'ORD001', status: 2, status_text: '已取消', points: 0 };
      mockApi.getOrderStatus.mockResolvedValue(status);
      const result = await useBalanceStore.getState().pollOrderStatus('ORD001');
      expect(result).toEqual(status);
      expect(mockApi.getBalance).not.toHaveBeenCalled(); // No balance refresh on cancel
    });

    test('returns timeout status after max attempts', async () => {
      // Use a small number of attempts by testing the return value directly
      // The poll makes 30 attempts with 2000ms intervals. We mock getOrderStatus
      // to always return pending (status=0), and mock setTimeout to be instant.
      const pendingStatus = { order_no: 'ORD001', status: 0, status_text: '待支付', points: 0 };
      // Mock getOrderStatus to return pending, and setTimeout to resolve immediately
      mockApi.getOrderStatus.mockResolvedValue(pendingStatus);
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = ((fn: Function) => { fn(); return 0; }) as any;

      const result = await useBalanceStore.getState().pollOrderStatus('ORD001');
      expect(result.status).toBe(0);
      expect(result.status_text).toBe('支付超时');
      expect(result.order_no).toBe('ORD001');
      expect(mockApi.getOrderStatus).toHaveBeenCalledTimes(30);

      global.setTimeout = originalSetTimeout;
    });
  });

  // fetchPricing
  describe('fetchPricing', () => {
    test('success sets pricing', async () => {
      const pricing = { models: [], exchange_rate: 100, exchange_description: 'desc' };
      mockApi.getPricing.mockResolvedValue(pricing);
      await useBalanceStore.getState().fetchPricing();
      expect(useBalanceStore.getState().pricing).toEqual(pricing);
    });
  });

  // setActiveTab
  describe('setActiveTab', () => {
    test('sets active tab', () => {
      mockApi.getTransactions.mockResolvedValue({ transactions: [], total: 0, page: 1, page_size: 20 });
      useBalanceStore.getState().setActiveTab('transactions');
      expect(useBalanceStore.getState().activeTab).toBe('transactions');
    });

    test('does nothing when setting same tab', () => {
      useBalanceStore.getState().setActiveTab('overview');
      // No API calls since it's the same tab
      expect(mockApi.getBalance).not.toHaveBeenCalled();
    });

    test('transactions tab fetches transactions if empty', () => {
      mockApi.getTransactions.mockResolvedValue({ transactions: [], total: 0, page: 1, page_size: 20 });
      useBalanceStore.getState().setActiveTab('transactions');
      expect(mockApi.getTransactions).toHaveBeenCalled();
    });

    test('recharge tab fetches config and balance', () => {
      mockApi.getRechargeConfig.mockResolvedValue({ exchange_rate: 100, min_amount_yuan: 1, presets: [], payment_methods: [] });
      mockApi.getBalance.mockResolvedValue({ balance: 0, total_recharged: 0, total_consumed: 0, total_gifted: 0 });
      useBalanceStore.getState().setActiveTab('recharge');
      expect(mockApi.getBalance).toHaveBeenCalled();
      expect(mockApi.getRechargeConfig).toHaveBeenCalled();
    });
  });

  // setShowLowBalanceModal
  describe('setShowLowBalanceModal', () => {
    test('shows modal with amount', () => {
      useBalanceStore.getState().setShowLowBalanceModal(true, 50);
      expect(useBalanceStore.getState().showLowBalanceModal).toBe(true);
      expect(useBalanceStore.getState().lowBalanceAmount).toBe(50);
    });

    test('hides modal', () => {
      useBalanceStore.getState().setShowLowBalanceModal(true, 50);
      useBalanceStore.getState().setShowLowBalanceModal(false);
      expect(useBalanceStore.getState().showLowBalanceModal).toBe(false);
      expect(useBalanceStore.getState().lowBalanceAmount).toBe(50); // Amount preserved
    });
  });

  // initOverview
  describe('initOverview', () => {
    test('calls multiple fetches in parallel', async () => {
      mockApi.getBalance.mockResolvedValue({ balance: 100, total_recharged: 100, total_consumed: 0, total_gifted: 0 });
      mockApi.getDailyUsageExtended.mockResolvedValue({ daily: [], days: 7 });
      mockApi.getConversationRanking.mockResolvedValue({ conversations: [], total: 0, page: 1, page_size: 10 });
      mockApi.getPricing.mockResolvedValue({ models: [], exchange_rate: 100, exchange_description: '' });

      await useBalanceStore.getState().initOverview();
      expect(mockApi.getBalance).toHaveBeenCalled();
      expect(mockApi.getDailyUsageExtended).toHaveBeenCalled();
      expect(mockApi.getConversationRanking).toHaveBeenCalled();
      expect(mockApi.getPricing).toHaveBeenCalled();
      expect(useBalanceStore.getState().isLoading).toBe(false);
    });

    test('clears loading even on failure', async () => {
      mockApi.getBalance.mockRejectedValue(new Error('fail'));
      mockApi.getDailyUsageExtended.mockRejectedValue(new Error('fail'));
      mockApi.getConversationRanking.mockRejectedValue(new Error('fail'));
      mockApi.getPricing.mockRejectedValue(new Error('fail'));

      await useBalanceStore.getState().initOverview();
      expect(useBalanceStore.getState().isLoading).toBe(false);
    });
  });

  // reset
  describe('reset', () => {
    test('resets all state to initial', async () => {
      // Modify state
      useBalanceStore.setState({
        balance: { balance: 100, total_recharged: 100, total_consumed: 0, total_gifted: 0 },
        transactions: [{ id: 1, type: 'recharge' as any, amount: 100, balance_after: 100, description: 'T', created_at: '' }],
        activeTab: 'transactions',
        showLowBalanceModal: true,
      });

      useBalanceStore.getState().reset();
      const state = useBalanceStore.getState();
      expect(state.balance).toBeNull();
      expect(state.transactions).toEqual([]);
      expect(state.activeTab).toBe('overview');
      expect(state.showLowBalanceModal).toBe(false);
    });
  });
});
