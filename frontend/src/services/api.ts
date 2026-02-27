import { useAuthStore } from '../store/useAuthStore';
import type {
  BalanceInfo, BalanceCheckResult, TransactionListResponse,
  RechargeConfig, RechargeOrder, OrderStatus, PricingInfo,
  DailyUsageExtended, ConversationRankingResponse,
} from '../types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// Types
export type MessageType = 'account' | 'notice' | 'usage';

export interface SystemMessage {
  id: number;
  title: string;
  content: string;
  msg_type: MessageType;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
}

export interface MessageListResponse {
  messages: SystemMessage[];
  total: number;
  page: number;
  page_size: number;
}

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { skipAuth = false, ...fetchOptions } = options;
    const url = `${this.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    };

    // Add auth token if available and not skipped
    if (!skipAuth) {
      const token = useAuthStore.getState().token;
      if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    // Handle 401 - token expired (only for authenticated requests)
    if (response.status === 401 && !skipAuth) {
      // Try to refresh token
      const refreshed = await this.refreshToken();
      if (refreshed) {
        // Retry the request
        const newToken = useAuthStore.getState().token;
        (headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;
        const retryResponse = await fetch(url, { ...fetchOptions, headers });
        if (!retryResponse.ok) {
          throw new Error(`HTTP error! status: ${retryResponse.status}`);
        }
        return retryResponse.json();
      } else {
        // Logout user
        useAuthStore.getState().logout();
        throw new Error('Session expired');
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  private async refreshToken(): Promise<boolean> {
    const refreshToken = useAuthStore.getState().refreshToken;
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (response.ok) {
        const result = await response.json();
        // Backend returns { code, data: { access_token, refresh_token, expires_in } }
        if (result.data) {
          useAuthStore.getState().setTokens(result.data.access_token, result.data.refresh_token);
          return true;
        }
      }
    } catch (e) {
      console.error('Failed to refresh token:', e);
    }

    return false;
  }

  // Auth endpoints
  async register(data: { email: string; password: string; nickname?: string; inviteCode?: string }) {
    const response = await this.request<{
      code: number;
      data: {
        user: any;
        access_token: string;
        refresh_token: string;
        expires_in: number;
      };
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        nickname: data.nickname,
        invite_code: data.inviteCode,
      }),
      skipAuth: true,
    });
    return {
      user: response.data.user,
      token: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in,
    };
  }

  async login(data: { email: string; password: string }) {
    const response = await this.request<{
      code: number;
      data: {
        user: any;
        access_token: string;
        refresh_token: string;
        expires_in: number;
      };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
      skipAuth: true,
    });
    return {
      user: response.data.user,
      token: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in,
    };
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  async verifyEmail(token: string) {
    return this.request('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
      skipAuth: true,
    });
  }

  async forgotPassword(email: string) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
      skipAuth: true,
    });
  }

  async resetPassword(token: string, password: string) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
      skipAuth: true,
    });
  }

  // User endpoints
  async getProfile() {
    return this.request('/user/profile');
  }

  async updateProfile(data: { nickname?: string; avatarUrl?: string }) {
    return this.request('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async changePassword(data: { oldPassword: string; newPassword: string }) {
    return this.request('/user/password', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAccount() {
    return this.request('/user/account', { method: 'DELETE' });
  }

  async getReferralCode() {
    return this.request<{ inviteCode: string }>('/user/referral-code');
  }

  // System messages endpoints
  async getMessages(params?: { page?: number; page_size?: number; msg_type?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.page_size) query.set('page_size', String(params.page_size));
    if (params?.msg_type) query.set('msg_type', params.msg_type);
    const queryStr = query.toString();

    const response = await this.request<{
      code: number;
      data: {
        messages: SystemMessage[];
        total: number;
        page: number;
        page_size: number;
      };
    }>(`/messages${queryStr ? `?${queryStr}` : ''}`);
    return response.data;
  }

  async getMessage(id: number) {
    const response = await this.request<{
      code: number;
      data: SystemMessage;
    }>(`/messages/${id}`);
    return response.data;
  }

  async markMessageAsRead(id: number) {
    await this.request(`/messages/${id}/read`, { method: 'PUT' });
  }

  async markAllMessagesAsRead() {
    const response = await this.request<{
      code: number;
      data: { marked_count: number };
    }>('/messages/read-all', { method: 'PUT' });
    return response.data;
  }

  async getUnreadCount() {
    const response = await this.request<{
      code: number;
      data: { count: number };
    }>('/messages/unread-count');
    return response.data.count;
  }

  // Usage endpoints
  async getUsageSummary() {
    return this.request('/usage');
  }

  async getDailyUsage(params?: { days?: number }) {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return this.request(`/usage/daily${query ? `?${query}` : ''}`);
  }

  async getUsageDetail(params?: { page?: number; limit?: number }) {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return this.request(`/usage/detail${query ? `?${query}` : ''}`);
  }

  // Chat endpoints
  async getConversations() {
    return this.request('/chat/conversations');
  }

  async createConversation(title?: string) {
    return this.request('/chat/conversations', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  }

  async deleteConversation(id: number) {
    return this.request(`/chat/conversations/${id}`, { method: 'DELETE' });
  }

  async getChatMessages(conversationId: number, params?: { page?: number; limit?: number }) {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return this.request(`/chat/conversations/${conversationId}/messages${query ? `?${query}` : ''}`);
  }

  async sendMessage(conversationId: number, content: string) {
    return this.request(`/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  // Balance endpoints
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

  // Transaction endpoints
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

  // Recharge endpoints
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

  // Pricing endpoints
  async getPricing() {
    const response = await this.request<{
      code: number;
      data: PricingInfo;
    }>('/pricing');
    return response.data;
  }

  // Usage extended endpoints
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

export const api = new ApiClient(API_BASE_URL);
