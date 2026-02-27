// Simple store tests without React Native dependencies
import { create } from 'zustand';

// Simplified auth store for testing
interface AuthState {
  user: { id: number; email: string } | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: { id: number; email: string }) => void;
  setToken: (token: string) => void;
  logout: () => void;
}

const createAuthStore = () =>
  create<AuthState>((set) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    setUser: (user) => set({ user, isAuthenticated: true }),
    setToken: (token) => set({ token }),
    logout: () => set({ user: null, token: null, isAuthenticated: false }),
  }));

// Simplified chat store for testing
interface ChatState {
  conversations: { id: number; title: string }[];
  messages: Record<number, { id: number; content: string }[]>;
  addConversation: (conv: { id: number; title: string }) => void;
  addMessage: (convId: number, msg: { id: number; content: string }) => void;
}

const createChatStore = () =>
  create<ChatState>((set) => ({
    conversations: [],
    messages: {},
    addConversation: (conv) =>
      set((state) => ({ conversations: [...state.conversations, conv] })),
    addMessage: (convId, msg) =>
      set((state) => ({
        messages: {
          ...state.messages,
          [convId]: [...(state.messages[convId] || []), msg],
        },
      })),
  }));

describe('Auth Store', () => {
  let useAuthStore: ReturnType<typeof createAuthStore>;

  beforeEach(() => {
    useAuthStore = createAuthStore();
  });

  it('should initialize with null user', () => {
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('should set user and mark as authenticated', () => {
    const user = { id: 1, email: 'test@example.com' };
    useAuthStore.getState().setUser(user);

    expect(useAuthStore.getState().user).toEqual(user);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('should set token', () => {
    useAuthStore.getState().setToken('test-token');
    expect(useAuthStore.getState().token).toBe('test-token');
  });

  it('should logout and clear state', () => {
    useAuthStore.getState().setUser({ id: 1, email: 'test@example.com' });
    useAuthStore.getState().setToken('token');
    useAuthStore.getState().logout();

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});

describe('Chat Store', () => {
  let useChatStore: ReturnType<typeof createChatStore>;

  beforeEach(() => {
    useChatStore = createChatStore();
  });

  it('should initialize with empty conversations', () => {
    expect(useChatStore.getState().conversations).toHaveLength(0);
  });

  it('should add conversation', () => {
    useChatStore.getState().addConversation({ id: 1, title: 'Test Chat' });

    expect(useChatStore.getState().conversations).toHaveLength(1);
    expect(useChatStore.getState().conversations[0].title).toBe('Test Chat');
  });

  it('should add message to conversation', () => {
    useChatStore.getState().addMessage(1, { id: 1, content: 'Hello' });

    expect(useChatStore.getState().messages[1]).toHaveLength(1);
    expect(useChatStore.getState().messages[1][0].content).toBe('Hello');
  });

  it('should add multiple messages', () => {
    useChatStore.getState().addMessage(1, { id: 1, content: 'Hello' });
    useChatStore.getState().addMessage(1, { id: 2, content: 'World' });

    expect(useChatStore.getState().messages[1]).toHaveLength(2);
  });
});
