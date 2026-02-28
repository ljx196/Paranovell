import { create } from 'zustand';
import { api } from '../services/api';

interface Message {
  id: number;
  conversationId: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  status: 'sending' | 'success' | 'error';
  createdAt: string;
}

// Sidebar-compatible conversation format
export interface SidebarConversation {
  id: number | string;
  title: string;
  time: string;
  active?: boolean;
}

interface ChatState {
  // Sidebar conversations (shared across pages)
  sidebarConversations: SidebarConversation[];
  isLoadingConversations: boolean;

  currentConversationId: number | null;
  messages: Record<number, Message[]>;
  isLoading: boolean;
  isSending: boolean;

  // Sidebar actions
  loadConversations: () => Promise<void>;
  setActiveConversation: (id: number | string | null) => void;

  // Message actions
  setCurrentConversation: (id: number | null) => void;
  setMessages: (conversationId: number, messages: Message[]) => void;
  addMessage: (conversationId: number, message: Message) => void;
  updateMessage: (conversationId: number, messageId: number, updates: Partial<Message>) => void;
  setLoading: (loading: boolean) => void;
  setSending: (sending: boolean) => void;
  clearChat: () => void;
}

function formatTime(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours === 0) return '刚刚';
    return `${hours}小时前`;
  } else if (days === 1) {
    return '昨天';
  } else if (days < 7) {
    return `${days}天前`;
  } else {
    return date.toLocaleDateString('zh-CN');
  }
}

const DEMO_CONVERSATIONS: SidebarConversation[] = [
  { id: 'demo', title: '演示对话', time: '刚刚', active: true },
];

export const useChatStore = create<ChatState>((set, get) => ({
  sidebarConversations: [],
  isLoadingConversations: false,

  currentConversationId: null,
  messages: {},
  isLoading: false,
  isSending: false,

  loadConversations: async () => {
    const { sidebarConversations } = get();
    // Only show loading if we have no data yet (avoids flicker on refresh)
    if (sidebarConversations.length === 0) {
      set({ isLoadingConversations: true });
    }
    try {
      const response = await api.getConversations();
      const apiConversations = response.data?.conversations || [];

      if (apiConversations.length > 0) {
        const formatted: SidebarConversation[] = apiConversations.map((c: any, index: number) => ({
          id: c.id,
          title: c.title || '新会话',
          time: formatTime(c.updatedAt || c.createdAt),
          active: index === 0,
        }));
        set({ sidebarConversations: formatted });
      } else {
        set({ sidebarConversations: DEMO_CONVERSATIONS });
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
      // Only fallback to demo if we have nothing
      if (get().sidebarConversations.length === 0) {
        set({ sidebarConversations: DEMO_CONVERSATIONS });
      }
    } finally {
      set({ isLoadingConversations: false });
    }
  },

  setActiveConversation: (id) => set((state) => ({
    sidebarConversations: state.sidebarConversations.map((c) => ({
      ...c,
      active: id !== null ? c.id === id : false,
    })),
  })),

  setCurrentConversation: (id) => set({ currentConversationId: id }),

  setMessages: (conversationId, messages) => set((state) => ({
    messages: { ...state.messages, [conversationId]: messages },
  })),

  addMessage: (conversationId, message) => set((state) => ({
    messages: {
      ...state.messages,
      [conversationId]: [...(state.messages[conversationId] || []), message],
    },
  })),

  updateMessage: (conversationId, messageId, updates) => set((state) => ({
    messages: {
      ...state.messages,
      [conversationId]: state.messages[conversationId]?.map((m) =>
        m.id === messageId ? { ...m, ...updates } : m
      ) || [],
    },
  })),

  setLoading: (isLoading) => set({ isLoading }),

  setSending: (isSending) => set({ isSending }),

  clearChat: () => set({
    sidebarConversations: [],
    currentConversationId: null,
    messages: {},
  }),
}));
