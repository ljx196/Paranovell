import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type {
  LoginRequest, LoginResponse,
  DashboardStats, TrendParams, TrendItem, RecentLog,
  UserListParams, UserListItem, UserDetail,
  UpdateStatusRequest, AdjustBalanceRequest, ResetPasswordRequest,
  OrderListParams, OrderListItem, OrderSummary,
  TransactionListParams, TransactionListItem,
  AnnouncementListParams, AnnouncementListItem, CreateAnnouncementRequest,
  SystemConfigItem, UpdateConfigsRequest,
  AuditLogListParams, AuditLogListItem, AuditLogDetail,
  PaginatedResponse,
  ConversationListItem, ConversationListParams,
  ConversationMessage, ConversationMessagesParams,
  FlagRequest, ReviewRequest,
  ReviewListItem, ReviewListParams,
  SensitiveWordItem, SensitiveWordListParams,
  BatchCreateSensitiveWordsRequest, BatchCreateSensitiveWordsResponse,
  UpdateSensitiveWordRequest,
  ScanRequest, ScanResponse,
  ReferralStats, ReferralListItem, ReferralListParams,
  ReferrerDetailResponse,
} from '../types/admin';

const TOKEN_KEY = 'admin_token';

class AdminApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' },
    });

    this.client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => {
        const body = response.data;
        if (body.code !== 0) {
          return Promise.reject(new Error(body.message || '请求失败'));
        }
        return body.data;
      },
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem(TOKEN_KEY);
          window.location.href = '/admin/login';
          return Promise.reject(new Error('登录已过期，请重新登录'));
        }
        if (error.response?.status === 403) {
          return Promise.reject(new Error('无管理权限'));
        }
        if (!error.response) {
          return Promise.reject(new Error('网络连接失败，请检查网络'));
        }
        if (error.code === 'ECONNABORTED') {
          return Promise.reject(new Error('请求超时，请稍后重试'));
        }
        const msg = error.response?.data?.message || `服务器错误 (${error.response?.status})`;
        return Promise.reject(new Error(msg));
      },
    );
  }

  // ==================== 认证 ====================

  async login(data: LoginRequest): Promise<LoginResponse> {
    return this.client.post('/api/v1/auth/login', data);
  }

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  // ==================== 仪表盘 ====================

  async getDashboardStats(): Promise<DashboardStats> {
    return this.client.get('/api/admin/dashboard/stats');
  }

  async getDashboardTrends(params: TrendParams): Promise<TrendItem[]> {
    return this.client.get('/api/admin/dashboard/trends', { params });
  }

  async getRecentLogs(limit: number = 10): Promise<RecentLog[]> {
    return this.client.get('/api/admin/dashboard/recent-logs', { params: { limit } });
  }

  // ==================== 用户管理 ====================

  async getUsers(params?: UserListParams): Promise<PaginatedResponse<UserListItem>> {
    return this.client.get('/api/admin/users', { params });
  }

  async getUserDetail(id: number): Promise<UserDetail> {
    return this.client.get(`/api/admin/users/${id}`);
  }

  async updateUserStatus(id: number, data: UpdateStatusRequest): Promise<void> {
    return this.client.put(`/api/admin/users/${id}/status`, data);
  }

  async adjustBalance(id: number, data: AdjustBalanceRequest): Promise<void> {
    return this.client.post(`/api/admin/users/${id}/adjust-balance`, data);
  }

  async resetPassword(id: number, data: ResetPasswordRequest): Promise<{ new_password: string; message: string }> {
    return this.client.post(`/api/admin/users/${id}/reset-password`, data);
  }

  // ==================== 订单管理 ====================

  async getOrders(params?: OrderListParams): Promise<PaginatedResponse<OrderListItem>> {
    return this.client.get('/api/admin/orders', { params });
  }

  async getOrdersSummary(params?: OrderListParams): Promise<OrderSummary> {
    return this.client.get('/api/admin/orders/summary', { params });
  }

  // ==================== 交易流水 ====================

  async getTransactions(params?: TransactionListParams): Promise<PaginatedResponse<TransactionListItem>> {
    return this.client.get('/api/admin/transactions', { params });
  }

  // ==================== 公告管理 ====================

  async getAnnouncements(params?: AnnouncementListParams): Promise<PaginatedResponse<AnnouncementListItem>> {
    return this.client.get('/api/admin/announcements', { params });
  }

  async createAnnouncement(data: CreateAnnouncementRequest): Promise<void> {
    return this.client.post('/api/admin/announcements', data);
  }

  async deleteAnnouncement(id: number): Promise<void> {
    return this.client.delete(`/api/admin/announcements/${id}`);
  }

  // ==================== 系统配置 ====================

  async getConfigs(): Promise<SystemConfigItem[]> {
    return this.client.get('/api/admin/configs');
  }

  async updateConfigs(data: UpdateConfigsRequest): Promise<void> {
    return this.client.put('/api/admin/configs', data);
  }

  // ==================== 操作日志 ====================

  async getAuditLogs(params?: AuditLogListParams): Promise<PaginatedResponse<AuditLogListItem>> {
    return this.client.get('/api/admin/audit-logs', { params });
  }

  async getAuditLogDetail(id: number): Promise<AuditLogDetail> {
    return this.client.get(`/api/admin/audit-logs/${id}`);
  }

  // ==================== 内容审查 ====================

  async getConversations(params?: ConversationListParams): Promise<PaginatedResponse<ConversationListItem>> {
    return this.client.get('/api/admin/content/conversations', { params });
  }

  async getConversationMessages(id: string, params: ConversationMessagesParams): Promise<PaginatedResponse<ConversationMessage>> {
    return this.client.get(`/api/admin/content/conversations/${id}/messages`, { params });
  }

  async flagConversation(id: string, data: FlagRequest): Promise<void> {
    return this.client.post(`/api/admin/content/conversations/${id}/flag`, data);
  }

  async reviewConversation(id: string, data: ReviewRequest): Promise<void> {
    return this.client.post(`/api/admin/content/conversations/${id}/review`, data);
  }

  async getReviews(params?: ReviewListParams): Promise<PaginatedResponse<ReviewListItem>> {
    return this.client.get('/api/admin/content/reviews', { params });
  }

  async getSensitiveWords(params?: SensitiveWordListParams): Promise<PaginatedResponse<SensitiveWordItem>> {
    return this.client.get('/api/admin/content/sensitive-words', { params });
  }

  async createSensitiveWords(data: BatchCreateSensitiveWordsRequest): Promise<BatchCreateSensitiveWordsResponse> {
    return this.client.post('/api/admin/content/sensitive-words', data);
  }

  async updateSensitiveWord(id: number, data: UpdateSensitiveWordRequest): Promise<void> {
    return this.client.put(`/api/admin/content/sensitive-words/${id}`, data);
  }

  async deleteSensitiveWord(id: number): Promise<void> {
    return this.client.delete(`/api/admin/content/sensitive-words/${id}`);
  }

  async scanContent(data: ScanRequest): Promise<ScanResponse> {
    return this.client.post('/api/admin/content/scan', data, { timeout: 65000 });
  }

  // ==================== 邀请管理 ====================

  async getReferralStats(): Promise<ReferralStats> {
    return this.client.get('/api/admin/referrals/stats');
  }

  async getReferrals(params?: ReferralListParams): Promise<PaginatedResponse<ReferralListItem>> {
    return this.client.get('/api/admin/referrals', { params });
  }

  async getReferrerDetail(userId: number, params?: { page?: number; page_size?: number }): Promise<ReferrerDetailResponse> {
    return this.client.get(`/api/admin/referrals/${userId}`, { params });
  }
}

export const adminApi = new AdminApiClient();
