import { create } from 'zustand';
import { adminApi } from '../services/adminApi';
import type {
  AdminUser, DashboardStats, TrendItem, TrendType, RecentLog,
  UserListItem, UserListParams, UserDetail,
  OrderListItem, OrderListParams, OrderSummary,
  TransactionListItem, TransactionListParams,
  AnnouncementListItem, AnnouncementListParams, CreateAnnouncementRequest,
  SystemConfigItem, UpdateConfigsRequest,
  AuditLogListItem, AuditLogListParams, AuditLogDetail,
  AdjustBalanceRequest, UpdateStatusRequest,
  ConversationListItem, ConversationListParams,
  ConversationMessage, FlagRequest, ReviewRequest,
  ReviewListItem, ReviewListParams,
  SensitiveWordItem, SensitiveWordListParams,
  BatchCreateSensitiveWordsRequest, BatchCreateSensitiveWordsResponse,
  UpdateSensitiveWordRequest,
  ScanRequest, ScanResponse,
  ReferralStats, ReferralListItem, ReferralListParams,
  ReferrerDetailResponse,
} from '../types/admin';

interface AdminState {
  currentUser: AdminUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  restoreSession: () => boolean;

  dashboardStats: DashboardStats | null;
  trendData: Record<TrendType, TrendItem[]>;
  trendDays: Record<TrendType, number>;
  recentLogs: RecentLog[];
  isDashboardLoading: boolean;
  fetchDashboardStats: () => Promise<void>;
  fetchTrends: (type: TrendType, days?: number) => Promise<void>;
  setTrendDays: (type: TrendType, days: number) => void;
  fetchRecentLogs: () => Promise<void>;
  initDashboard: () => Promise<void>;

  users: UserListItem[];
  userTotal: number;
  userParams: UserListParams;
  userDetail: UserDetail | null;
  isUsersLoading: boolean;
  isUserDetailLoading: boolean;
  fetchUsers: (params?: Partial<UserListParams>) => Promise<void>;
  fetchUserDetail: (id: number) => Promise<void>;
  updateUserStatus: (id: number, data: UpdateStatusRequest) => Promise<void>;
  adjustBalance: (id: number, data: AdjustBalanceRequest) => Promise<void>;
  resetPassword: (id: number) => Promise<{ new_password: string; message: string }>;

  orders: OrderListItem[];
  orderTotal: number;
  orderParams: OrderListParams;
  orderSummary: OrderSummary | null;
  isOrdersLoading: boolean;
  fetchOrders: (params?: Partial<OrderListParams>) => Promise<void>;
  fetchOrderSummary: () => Promise<void>;

  transactions: TransactionListItem[];
  transactionTotal: number;
  transactionParams: TransactionListParams;
  isTransactionsLoading: boolean;
  fetchTransactions: (params?: Partial<TransactionListParams>) => Promise<void>;

  announcements: AnnouncementListItem[];
  announcementTotal: number;
  announcementParams: AnnouncementListParams;
  isAnnouncementsLoading: boolean;
  fetchAnnouncements: (params?: Partial<AnnouncementListParams>) => Promise<void>;
  createAnnouncement: (data: CreateAnnouncementRequest) => Promise<void>;
  deleteAnnouncement: (id: number) => Promise<void>;

  configs: SystemConfigItem[];
  isConfigsLoading: boolean;
  isConfigsSaving: boolean;
  fetchConfigs: () => Promise<void>;
  updateConfigs: (data: UpdateConfigsRequest) => Promise<void>;

  auditLogs: AuditLogListItem[];
  auditLogTotal: number;
  auditLogParams: AuditLogListParams;
  auditLogDetail: AuditLogDetail | null;
  isAuditLogsLoading: boolean;
  fetchAuditLogs: (params?: Partial<AuditLogListParams>) => Promise<void>;
  fetchAuditLogDetail: (id: number) => Promise<void>;

  // Content Review
  conversations: ConversationListItem[];
  conversationTotal: number;
  conversationParams: ConversationListParams;
  conversationMessages: ConversationMessage[];
  conversationMessageTotal: number;
  isConversationsLoading: boolean;
  isMessagesLoading: boolean;
  fetchConversations: (params?: Partial<ConversationListParams>) => Promise<void>;
  fetchConversationMessages: (id: string, userId: number, page?: number) => Promise<void>;
  flagConversation: (id: string, data: FlagRequest) => Promise<void>;
  reviewConversation: (id: string, data: ReviewRequest) => Promise<void>;

  reviews: ReviewListItem[];
  reviewTotal: number;
  reviewParams: ReviewListParams;
  isReviewsLoading: boolean;
  fetchReviews: (params?: Partial<ReviewListParams>) => Promise<void>;

  sensitiveWords: SensitiveWordItem[];
  sensitiveWordTotal: number;
  sensitiveWordParams: SensitiveWordListParams;
  isSensitiveWordsLoading: boolean;
  fetchSensitiveWords: (params?: Partial<SensitiveWordListParams>) => Promise<void>;
  createSensitiveWords: (data: BatchCreateSensitiveWordsRequest) => Promise<BatchCreateSensitiveWordsResponse>;
  updateSensitiveWord: (id: number, data: UpdateSensitiveWordRequest) => Promise<void>;
  deleteSensitiveWord: (id: number) => Promise<void>;
  scanContent: (data: ScanRequest) => Promise<ScanResponse>;

  // Referral Management
  referralStats: ReferralStats | null;
  referrals: ReferralListItem[];
  referralTotal: number;
  referralParams: ReferralListParams;
  referrerDetail: ReferrerDetailResponse | null;
  isReferralStatsLoading: boolean;
  isReferralsLoading: boolean;
  isReferrerDetailLoading: boolean;
  fetchReferralStats: () => Promise<void>;
  fetchReferrals: (params?: Partial<ReferralListParams>) => Promise<void>;
  fetchReferrerDetail: (userId: number, page?: number) => Promise<void>;
}

const DEFAULT_PAGE_SIZE = 20;

export const useAdminStore = create<AdminState>((set, get) => ({
  // ==================== 认证 ====================
  currentUser: null,
  isAuthenticated: false,

  login: async (email, password) => {
    const result = await adminApi.login({ email, password });
    const { user, access_token } = result;
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      throw new Error('无管理权限，仅管理员可登录');
    }
    adminApi.setToken(access_token);
    set({ currentUser: { ...user, token: access_token }, isAuthenticated: true });
  },

  logout: () => {
    adminApi.clearToken();
    set({ currentUser: null, isAuthenticated: false });
  },

  restoreSession: () => {
    const token = adminApi.getToken();
    if (!token) return false;
    set({ isAuthenticated: true });
    return true;
  },

  // ==================== 仪表盘 ====================
  dashboardStats: null,
  trendData: { users: [], revenue: [], tokens: [] },
  trendDays: { users: 30, revenue: 30, tokens: 30 },
  recentLogs: [],
  isDashboardLoading: false,

  fetchDashboardStats: async () => {
    try {
      const data = await adminApi.getDashboardStats();
      set({ dashboardStats: data });
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    }
  },

  fetchTrends: async (type, days) => {
    const period = days || get().trendDays[type];
    try {
      const result = await adminApi.getDashboardTrends({ type, days: period });
      set((state) => ({
        trendData: { ...state.trendData, [type]: Array.isArray(result) ? result : [] },
      }));
    } catch (error) {
      console.error(`Failed to fetch ${type} trends:`, error);
    }
  },

  setTrendDays: (type, days) => {
    set((state) => ({ trendDays: { ...state.trendDays, [type]: days } }));
    get().fetchTrends(type, days);
  },

  fetchRecentLogs: async () => {
    try {
      const data = await adminApi.getRecentLogs(5);
      set({ recentLogs: Array.isArray(data) ? data : [] });
    } catch (error) {
      console.error('Failed to fetch recent logs:', error);
    }
  },

  initDashboard: async () => {
    set({ isDashboardLoading: true });
    try {
      await Promise.allSettled([
        get().fetchDashboardStats(),
        get().fetchTrends('users'),
        get().fetchTrends('revenue'),
        get().fetchTrends('tokens'),
        get().fetchRecentLogs(),
      ]);
    } finally {
      set({ isDashboardLoading: false });
    }
  },

  // ==================== 用户管理 ====================
  users: [],
  userTotal: 0,
  userParams: { page: 1, page_size: DEFAULT_PAGE_SIZE },
  userDetail: null,
  isUsersLoading: false,
  isUserDetailLoading: false,

  fetchUsers: async (params) => {
    const merged = { ...get().userParams, ...params };
    set({ isUsersLoading: true, userParams: merged });
    try {
      const result = await adminApi.getUsers(merged);
      set({ users: result.items || [], userTotal: result.total });
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  fetchUserDetail: async (id) => {
    set({ isUserDetailLoading: true, userDetail: null });
    try {
      const data = await adminApi.getUserDetail(id);
      set({ userDetail: data });
    } catch (error) {
      console.error('Failed to fetch user detail:', error);
    } finally {
      set({ isUserDetailLoading: false });
    }
  },

  updateUserStatus: async (id, data) => {
    try {
      await adminApi.updateUserStatus(id, data);
    } catch (error) {
      console.error('Failed to update user status:', error);
      throw error;
    }
  },

  adjustBalance: async (id, data) => {
    try {
      await adminApi.adjustBalance(id, data);
    } catch (error) {
      console.error('Failed to adjust balance:', error);
      throw error;
    }
  },

  resetPassword: async (id) => {
    try {
      return await adminApi.resetPassword(id, { send_email: true });
    } catch (error) {
      console.error('Failed to reset password:', error);
      throw error;
    }
  },

  // ==================== 订单管理 ====================
  orders: [],
  orderTotal: 0,
  orderParams: { page: 1, page_size: DEFAULT_PAGE_SIZE },
  orderSummary: null,
  isOrdersLoading: false,

  fetchOrders: async (params) => {
    const merged = { ...get().orderParams, ...params };
    set({ isOrdersLoading: true, orderParams: merged });
    try {
      const result = await adminApi.getOrders(merged);
      set({ orders: result.items || [], orderTotal: result.total });
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      set({ isOrdersLoading: false });
    }
  },

  fetchOrderSummary: async () => {
    try {
      const data = await adminApi.getOrdersSummary();
      set({ orderSummary: data });
    } catch (error) {
      console.error('Failed to fetch order summary:', error);
    }
  },

  // ==================== 交易流水 ====================
  transactions: [],
  transactionTotal: 0,
  transactionParams: { page: 1, page_size: DEFAULT_PAGE_SIZE },
  isTransactionsLoading: false,

  fetchTransactions: async (params) => {
    const merged = { ...get().transactionParams, ...params };
    set({ isTransactionsLoading: true, transactionParams: merged });
    try {
      const result = await adminApi.getTransactions(merged);
      set({ transactions: result.items || [], transactionTotal: result.total });
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      set({ isTransactionsLoading: false });
    }
  },

  // ==================== 公告管理 ====================
  announcements: [],
  announcementTotal: 0,
  announcementParams: { page: 1, page_size: DEFAULT_PAGE_SIZE },
  isAnnouncementsLoading: false,

  fetchAnnouncements: async (params) => {
    const merged = { ...get().announcementParams, ...params };
    set({ isAnnouncementsLoading: true, announcementParams: merged });
    try {
      const result = await adminApi.getAnnouncements(merged);
      set({ announcements: result.items || [], announcementTotal: result.total });
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    } finally {
      set({ isAnnouncementsLoading: false });
    }
  },

  createAnnouncement: async (data) => {
    try {
      await adminApi.createAnnouncement(data);
    } catch (error) {
      console.error('Failed to create announcement:', error);
      throw error;
    }
  },

  deleteAnnouncement: async (id) => {
    try {
      await adminApi.deleteAnnouncement(id);
    } catch (error) {
      console.error('Failed to delete announcement:', error);
      throw error;
    }
  },

  // ==================== 系统配置 ====================
  configs: [],
  isConfigsLoading: false,
  isConfigsSaving: false,

  fetchConfigs: async () => {
    set({ isConfigsLoading: true });
    try {
      const result = await adminApi.getConfigs();
      set({ configs: Array.isArray(result) ? result : [] });
    } catch (error) {
      console.error('Failed to fetch configs:', error);
    } finally {
      set({ isConfigsLoading: false });
    }
  },

  updateConfigs: async (data) => {
    set({ isConfigsSaving: true });
    try {
      await adminApi.updateConfigs(data);
    } finally {
      set({ isConfigsSaving: false });
    }
  },

  // ==================== 操作日志 ====================
  auditLogs: [],
  auditLogTotal: 0,
  auditLogParams: { page: 1, page_size: DEFAULT_PAGE_SIZE },
  auditLogDetail: null,
  isAuditLogsLoading: false,

  fetchAuditLogs: async (params) => {
    const merged = { ...get().auditLogParams, ...params };
    set({ isAuditLogsLoading: true, auditLogParams: merged });
    try {
      const result = await adminApi.getAuditLogs(merged);
      set({ auditLogs: result.items || [], auditLogTotal: result.total });
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      set({ isAuditLogsLoading: false });
    }
  },

  fetchAuditLogDetail: async (id) => {
    try {
      const data = await adminApi.getAuditLogDetail(id);
      set({ auditLogDetail: data });
    } catch (error) {
      console.error('Failed to fetch audit log detail:', error);
    }
  },

  // ==================== 内容审查 ====================
  conversations: [],
  conversationTotal: 0,
  conversationParams: { page: 1, page_size: DEFAULT_PAGE_SIZE, only_flagged: true },
  conversationMessages: [],
  conversationMessageTotal: 0,
  isConversationsLoading: false,
  isMessagesLoading: false,

  fetchConversations: async (params) => {
    const merged = { ...get().conversationParams, ...params };
    set({ isConversationsLoading: true, conversationParams: merged });
    try {
      const result = await adminApi.getConversations(merged);
      set({ conversations: result.items || [], conversationTotal: result.total });
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      set({ isConversationsLoading: false });
    }
  },

  fetchConversationMessages: async (id, userId, page = 1) => {
    set({ isMessagesLoading: true });
    try {
      const result = await adminApi.getConversationMessages(id, { user_id: userId, page, page_size: 50 });
      set({ conversationMessages: result.items || [], conversationMessageTotal: result.total });
    } catch (error) {
      console.error('Failed to fetch conversation messages:', error);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  flagConversation: async (id, data) => {
    try {
      await adminApi.flagConversation(id, data);
    } catch (error) {
      console.error('Failed to flag conversation:', error);
      throw error;
    }
  },

  reviewConversation: async (id, data) => {
    try {
      await adminApi.reviewConversation(id, data);
    } catch (error) {
      console.error('Failed to review conversation:', error);
      throw error;
    }
  },

  reviews: [],
  reviewTotal: 0,
  reviewParams: { page: 1, page_size: DEFAULT_PAGE_SIZE },
  isReviewsLoading: false,

  fetchReviews: async (params) => {
    const merged = { ...get().reviewParams, ...params };
    set({ isReviewsLoading: true, reviewParams: merged });
    try {
      const result = await adminApi.getReviews(merged);
      set({ reviews: result.items || [], reviewTotal: result.total });
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      set({ isReviewsLoading: false });
    }
  },

  sensitiveWords: [],
  sensitiveWordTotal: 0,
  sensitiveWordParams: { page: 1, page_size: DEFAULT_PAGE_SIZE },
  isSensitiveWordsLoading: false,

  fetchSensitiveWords: async (params) => {
    const merged = { ...get().sensitiveWordParams, ...params };
    set({ isSensitiveWordsLoading: true, sensitiveWordParams: merged });
    try {
      const result = await adminApi.getSensitiveWords(merged);
      set({ sensitiveWords: result.items || [], sensitiveWordTotal: result.total });
    } catch (error) {
      console.error('Failed to fetch sensitive words:', error);
    } finally {
      set({ isSensitiveWordsLoading: false });
    }
  },

  createSensitiveWords: async (data) => {
    try {
      return await adminApi.createSensitiveWords(data);
    } catch (error) {
      console.error('Failed to create sensitive words:', error);
      throw error;
    }
  },

  updateSensitiveWord: async (id, data) => {
    try {
      await adminApi.updateSensitiveWord(id, data);
    } catch (error) {
      console.error('Failed to update sensitive word:', error);
      throw error;
    }
  },

  deleteSensitiveWord: async (id) => {
    try {
      await adminApi.deleteSensitiveWord(id);
    } catch (error) {
      console.error('Failed to delete sensitive word:', error);
      throw error;
    }
  },

  scanContent: async (data) => {
    try {
      return await adminApi.scanContent(data);
    } catch (error) {
      console.error('Failed to scan content:', error);
      throw error;
    }
  },

  // ==================== 邀请管理 ====================
  referralStats: null,
  referrals: [],
  referralTotal: 0,
  referralParams: { page: 1, page_size: DEFAULT_PAGE_SIZE },
  referrerDetail: null,
  isReferralStatsLoading: false,
  isReferralsLoading: false,
  isReferrerDetailLoading: false,

  fetchReferralStats: async () => {
    set({ isReferralStatsLoading: true });
    try {
      const data = await adminApi.getReferralStats();
      set({ referralStats: data });
    } catch (error) {
      console.error('Failed to fetch referral stats:', error);
    } finally {
      set({ isReferralStatsLoading: false });
    }
  },

  fetchReferrals: async (params) => {
    const merged = { ...get().referralParams, ...params };
    set({ isReferralsLoading: true, referralParams: merged });
    try {
      const result = await adminApi.getReferrals(merged);
      set({ referrals: result.items || [], referralTotal: result.total });
    } catch (error) {
      console.error('Failed to fetch referrals:', error);
    } finally {
      set({ isReferralsLoading: false });
    }
  },

  fetchReferrerDetail: async (userId, page = 1) => {
    set({ isReferrerDetailLoading: true, referrerDetail: null });
    try {
      const data = await adminApi.getReferrerDetail(userId, { page, page_size: DEFAULT_PAGE_SIZE });
      set({ referrerDetail: data });
    } catch (error) {
      console.error('Failed to fetch referrer detail:', error);
    } finally {
      set({ isReferrerDetailLoading: false });
    }
  },
}));
