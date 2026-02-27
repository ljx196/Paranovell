// We need to mock useAuthStore before importing api
const mockGetState = jest.fn();
jest.mock('../../store/useAuthStore', () => ({
  useAuthStore: {
    getState: mockGetState,
  },
}));

// Must import after mocks
import { api } from '../../services/api';

const mockFetch = global.fetch as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockGetState.mockReturnValue({
    token: 'test-access-token',
    refreshToken: 'test-refresh-token',
    setTokens: jest.fn(),
    logout: jest.fn(),
  });
});

function mockFetchResponse(data: any, ok = true, status = 200) {
  mockFetch.mockResolvedValueOnce({
    ok,
    status,
    json: jest.fn().mockResolvedValue(data),
  });
}

function mockFetchError(status: number, errorData: any = {}) {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    json: jest.fn().mockResolvedValue(errorData),
  });
}

describe('ApiClient', () => {
  // Constructor / URL
  describe('base URL', () => {
    test('constructs proper URLs', async () => {
      mockFetchResponse({ code: 0, data: { count: 0 } });
      await api.getUnreadCount();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/messages/unread-count'),
        expect.any(Object)
      );
    });
  });

  // Auth header injection
  describe('auth injection', () => {
    test('adds Bearer token for authenticated requests', async () => {
      mockFetchResponse({ id: 1, email: 'test@test.com' });
      await api.getProfile();
      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[1].headers['Authorization']).toBe('Bearer test-access-token');
    });

    test('skips auth for skipAuth requests', async () => {
      mockFetchResponse({
        code: 0,
        data: { user: {}, access_token: 'tok', refresh_token: 'ref', expires_in: 3600 },
      });
      await api.login({ email: 'test@test.com', password: 'pass' });
      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[1].headers['Authorization']).toBeUndefined();
    });

    test('works without token (no auth header)', async () => {
      mockGetState.mockReturnValue({
        token: null,
        refreshToken: null,
        setTokens: jest.fn(),
        logout: jest.fn(),
      });
      mockFetchResponse({ code: 0, data: {} });
      await api.getProfile();
      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[1].headers['Authorization']).toBeUndefined();
    });
  });

  // 401 retry with token refresh
  describe('401 token refresh', () => {
    test('refreshes token and retries on 401', async () => {
      // First call returns 401
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValue({ message: 'Unauthorized' }),
      });
      // Refresh call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          data: { access_token: 'new-token', refresh_token: 'new-refresh' },
        }),
      });
      // Retry call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ id: 1 }),
      });

      const setTokens = jest.fn();
      mockGetState.mockReturnValue({
        token: 'old-token',
        refreshToken: 'old-refresh',
        setTokens,
        logout: jest.fn(),
      });

      const result = await api.getProfile();
      expect(setTokens).toHaveBeenCalledWith('new-token', 'new-refresh');
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    test('logs out when refresh fails', async () => {
      // First call returns 401
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValue({ message: 'Unauthorized' }),
      });
      // Refresh call fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValue({}),
      });

      const logout = jest.fn();
      mockGetState.mockReturnValue({
        token: 'old-token',
        refreshToken: 'old-refresh',
        setTokens: jest.fn(),
        logout,
      });

      await expect(api.getProfile()).rejects.toThrow('Session expired');
      expect(logout).toHaveBeenCalled();
    });

    test('logs out when no refresh token available', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValue({}),
      });

      const logout = jest.fn();
      mockGetState.mockReturnValue({
        token: 'old-token',
        refreshToken: null,
        setTokens: jest.fn(),
        logout,
      });

      await expect(api.getProfile()).rejects.toThrow('Session expired');
      expect(logout).toHaveBeenCalled();
    });
  });

  // Error handling
  describe('error handling', () => {
    test('throws on non-ok response with error message', async () => {
      mockFetchError(400, { message: 'Bad request' });
      await expect(api.getProfile()).rejects.toThrow('Bad request');
    });

    test('throws with status when no error message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: jest.fn().mockRejectedValue(new Error('invalid json')),
      });
      await expect(api.getProfile()).rejects.toThrow('HTTP error! status: 500');
    });
  });

  // Auth endpoints
  describe('register', () => {
    test('sends register request with correct body', async () => {
      mockFetchResponse({
        code: 0,
        data: { user: { id: 1 }, access_token: 'at', refresh_token: 'rt', expires_in: 3600 },
      });
      const result = await api.register({ email: 'test@test.com', password: 'pass123', nickname: 'Test' });
      expect(result.token).toBe('at');
      expect(result.refreshToken).toBe('rt');
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.email).toBe('test@test.com');
      expect(body.nickname).toBe('Test');
    });
  });

  describe('login', () => {
    test('sends login request and returns parsed response', async () => {
      mockFetchResponse({
        code: 0,
        data: { user: { id: 1 }, access_token: 'at', refresh_token: 'rt', expires_in: 3600 },
      });
      const result = await api.login({ email: 'test@test.com', password: 'pass123' });
      expect(result.token).toBe('at');
      expect(result.user).toEqual({ id: 1 });
    });
  });

  describe('logout', () => {
    test('sends POST to /auth/logout', async () => {
      mockFetchResponse({ code: 0 });
      await api.logout();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/logout'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('verifyEmail', () => {
    test('sends token in body', async () => {
      mockFetchResponse({ code: 0 });
      await api.verifyEmail('verify-token');
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.token).toBe('verify-token');
    });
  });

  describe('forgotPassword', () => {
    test('sends email in body', async () => {
      mockFetchResponse({ code: 0 });
      await api.forgotPassword('test@test.com');
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.email).toBe('test@test.com');
    });
  });

  describe('resetPassword', () => {
    test('sends token and password', async () => {
      mockFetchResponse({ code: 0 });
      await api.resetPassword('reset-token', 'newpass123');
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.token).toBe('reset-token');
      expect(body.password).toBe('newpass123');
    });
  });

  // User endpoints
  describe('getProfile', () => {
    test('sends GET to /user/profile', async () => {
      mockFetchResponse({ id: 1, email: 'test@test.com' });
      await api.getProfile();
      expect(mockFetch.mock.calls[0][1].method).toBeUndefined(); // GET is default
    });
  });

  describe('updateProfile', () => {
    test('sends PUT with data', async () => {
      mockFetchResponse({ code: 0 });
      await api.updateProfile({ nickname: 'New Name' });
      expect(mockFetch.mock.calls[0][1].method).toBe('PUT');
    });
  });

  describe('changePassword', () => {
    test('sends PUT with passwords', async () => {
      mockFetchResponse({ code: 0 });
      await api.changePassword({ oldPassword: 'old', newPassword: 'new' });
      expect(mockFetch.mock.calls[0][1].method).toBe('PUT');
    });
  });

  describe('deleteAccount', () => {
    test('sends DELETE', async () => {
      mockFetchResponse({ code: 0 });
      await api.deleteAccount();
      expect(mockFetch.mock.calls[0][1].method).toBe('DELETE');
    });
  });

  // Message endpoints
  describe('getMessages', () => {
    test('sends query params', async () => {
      mockFetchResponse({ code: 0, data: { messages: [], total: 0, page: 1, page_size: 20 } });
      await api.getMessages({ page: 2, page_size: 10, msg_type: 'notice' });
      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('page=2');
      expect(url).toContain('page_size=10');
      expect(url).toContain('msg_type=notice');
    });

    test('works without params', async () => {
      mockFetchResponse({ code: 0, data: { messages: [], total: 0, page: 1, page_size: 20 } });
      await api.getMessages();
      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('/messages');
    });
  });

  describe('markMessageAsRead', () => {
    test('sends PUT to correct URL', async () => {
      mockFetchResponse({ code: 0 });
      await api.markMessageAsRead(5);
      expect(mockFetch.mock.calls[0][0]).toContain('/messages/5/read');
      expect(mockFetch.mock.calls[0][1].method).toBe('PUT');
    });
  });

  describe('markAllMessagesAsRead', () => {
    test('returns marked count', async () => {
      mockFetchResponse({ code: 0, data: { marked_count: 3 } });
      const result = await api.markAllMessagesAsRead();
      expect(result.marked_count).toBe(3);
    });
  });

  describe('getUnreadCount', () => {
    test('extracts count from response', async () => {
      mockFetchResponse({ code: 0, data: { count: 7 } });
      const count = await api.getUnreadCount();
      expect(count).toBe(7);
    });
  });

  // Balance endpoints
  describe('getBalance', () => {
    test('extracts data from response', async () => {
      const balance = { balance: 500, total_recharged: 1000, total_consumed: 400, total_gifted: 100 };
      mockFetchResponse({ code: 0, data: balance });
      const result = await api.getBalance();
      expect(result).toEqual(balance);
    });
  });

  describe('checkBalance', () => {
    test('sends model query param', async () => {
      mockFetchResponse({ code: 0, data: { sufficient: true, balance: 500 } });
      await api.checkBalance('gpt-4');
      expect(mockFetch.mock.calls[0][0]).toContain('model=gpt-4');
    });

    test('defaults to standard model', async () => {
      mockFetchResponse({ code: 0, data: { sufficient: true, balance: 500 } });
      await api.checkBalance();
      expect(mockFetch.mock.calls[0][0]).toContain('model=standard');
    });
  });

  // Transaction endpoints
  describe('getTransactions', () => {
    test('sends filter params', async () => {
      mockFetchResponse({ code: 0, data: { transactions: [], total: 0, page: 1, page_size: 20 } });
      await api.getTransactions({ type: 'recharge', days: 7, page: 1, page_size: 20 });
      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('type=recharge');
      expect(url).toContain('days=7');
    });

    test('excludes type=all from params', async () => {
      mockFetchResponse({ code: 0, data: { transactions: [], total: 0, page: 1, page_size: 20 } });
      await api.getTransactions({ type: 'all', page: 1, page_size: 20 });
      const url = mockFetch.mock.calls[0][0];
      expect(url).not.toContain('type=');
    });
  });

  // Recharge endpoints
  describe('getRechargeConfig', () => {
    test('extracts config data', async () => {
      const config = { exchange_rate: 100, min_amount_yuan: 1, presets: [], payment_methods: ['alipay'] };
      mockFetchResponse({ code: 0, data: config });
      const result = await api.getRechargeConfig();
      expect(result).toEqual(config);
    });
  });

  describe('createRechargeOrder', () => {
    test('sends amount and method', async () => {
      mockFetchResponse({ code: 0, data: { order_no: 'ORD001' } });
      await api.createRechargeOrder(10, 'alipay');
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.amount_yuan).toBe(10);
      expect(body.payment_method).toBe('alipay');
    });
  });

  describe('getOrderStatus', () => {
    test('sends order_no in URL', async () => {
      mockFetchResponse({ code: 0, data: { order_no: 'ORD001', status: 1 } });
      await api.getOrderStatus('ORD001');
      expect(mockFetch.mock.calls[0][0]).toContain('/recharge/status/ORD001');
    });
  });

  // Pricing
  describe('getPricing', () => {
    test('extracts pricing data', async () => {
      const pricing = { models: [], exchange_rate: 100, exchange_description: 'desc' };
      mockFetchResponse({ code: 0, data: pricing });
      const result = await api.getPricing();
      expect(result).toEqual(pricing);
    });
  });

  // Usage extended
  describe('getDailyUsageExtended', () => {
    test('sends days param', async () => {
      mockFetchResponse({ code: 0, data: { daily: [], days: 7 } });
      await api.getDailyUsageExtended({ days: 7 });
      expect(mockFetch.mock.calls[0][0]).toContain('days=7');
    });

    test('works without params', async () => {
      mockFetchResponse({ code: 0, data: { daily: [], days: 7 } });
      await api.getDailyUsageExtended();
      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('/usage/daily-extended');
      expect(url).not.toContain('days=');
    });
  });

  describe('getConversationRanking', () => {
    test('sends query params', async () => {
      mockFetchResponse({ code: 0, data: { conversations: [], total: 0, page: 1, page_size: 10 } });
      await api.getConversationRanking({ days: 7, page: 1, page_size: 10 });
      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('days=7');
      expect(url).toContain('page=1');
    });
  });
});
