import { useAuthStore } from '../../store/useAuthStore';

// Reset store before each test
beforeEach(() => {
  useAuthStore.setState({
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: true,
  });
});

describe('useAuthStore', () => {
  test('has correct initial state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(true);
  });

  test('setUser sets user and isAuthenticated to true', () => {
    const user = {
      id: 1,
      email: 'test@example.com',
      nickname: 'Test',
      avatarUrl: '',
      emailVerified: true,
      inviteCode: 'ABC123',
    };
    useAuthStore.getState().setUser(user);
    const state = useAuthStore.getState();
    expect(state.user).toEqual(user);
    expect(state.isAuthenticated).toBe(true);
  });

  test('setTokens sets token and refreshToken', () => {
    useAuthStore.getState().setTokens('access-token', 'refresh-token');
    const state = useAuthStore.getState();
    expect(state.token).toBe('access-token');
    expect(state.refreshToken).toBe('refresh-token');
  });

  test('logout clears all auth state', () => {
    // Set some state first
    useAuthStore.getState().setUser({
      id: 1,
      email: 'test@example.com',
      nickname: 'Test',
      avatarUrl: '',
      emailVerified: true,
      inviteCode: 'ABC123',
    });
    useAuthStore.getState().setTokens('access-token', 'refresh-token');

    // Logout
    useAuthStore.getState().logout();
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  test('setLoading toggles isLoading', () => {
    useAuthStore.getState().setLoading(false);
    expect(useAuthStore.getState().isLoading).toBe(false);

    useAuthStore.getState().setLoading(true);
    expect(useAuthStore.getState().isLoading).toBe(true);
  });

  test('initialize sets isLoading to false after timeout', () => {
    jest.useFakeTimers();
    useAuthStore.getState().initialize();

    // isLoading should still be true immediately
    expect(useAuthStore.getState().isLoading).toBe(true);

    // After timeout, isLoading should be false
    jest.advanceTimersByTime(200);
    expect(useAuthStore.getState().isLoading).toBe(false);

    jest.useRealTimers();
  });

  test('setUser does not affect tokens', () => {
    useAuthStore.getState().setTokens('my-token', 'my-refresh');
    useAuthStore.getState().setUser({
      id: 2,
      email: 'new@test.com',
      nickname: 'New',
      avatarUrl: '',
      emailVerified: false,
      inviteCode: 'XYZ789',
    });
    const state = useAuthStore.getState();
    expect(state.token).toBe('my-token');
    expect(state.refreshToken).toBe('my-refresh');
  });

  test('setTokens does not affect user', () => {
    const user = {
      id: 1,
      email: 'test@example.com',
      nickname: 'Test',
      avatarUrl: '',
      emailVerified: true,
      inviteCode: 'ABC123',
    };
    useAuthStore.getState().setUser(user);
    useAuthStore.getState().setTokens('new-token', 'new-refresh');
    expect(useAuthStore.getState().user).toEqual(user);
  });

  test('logout does not reset isLoading', () => {
    useAuthStore.getState().setLoading(false);
    useAuthStore.getState().logout();
    // isLoading is not part of logout reset
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  test('multiple setUser calls update correctly', () => {
    const user1 = {
      id: 1,
      email: 'first@test.com',
      nickname: 'First',
      avatarUrl: '',
      emailVerified: true,
      inviteCode: 'ABC',
    };
    const user2 = {
      id: 2,
      email: 'second@test.com',
      nickname: 'Second',
      avatarUrl: 'http://avatar.url',
      emailVerified: false,
      inviteCode: 'DEF',
    };
    useAuthStore.getState().setUser(user1);
    useAuthStore.getState().setUser(user2);
    expect(useAuthStore.getState().user).toEqual(user2);
  });
});
