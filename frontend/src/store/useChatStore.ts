import { create } from 'zustand';

interface Message {
  id: number;
  conversationId: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  status: 'sending' | 'success' | 'error';
  createdAt: string;
}

interface Conversation {
  id: number;
  title: string;
  status: number;
  createdAt: string;
  updatedAt: string;
}

interface ChatState {
  conversations: Conversation[];
  currentConversationId: number | null;
  messages: Record<number, Message[]>;
  isLoading: boolean;
  isSending: boolean;

  // Actions
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  removeConversation: (id: number) => void;
  setCurrentConversation: (id: number | null) => void;
  setMessages: (conversationId: number, messages: Message[]) => void;
  addMessage: (conversationId: number, message: Message) => void;
  updateMessage: (conversationId: number, messageId: number, updates: Partial<Message>) => void;
  setLoading: (loading: boolean) => void;
  setSending: (sending: boolean) => void;
  clearChat: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  currentConversationId: null,
  messages: {},
  isLoading: false,
  isSending: false,

  setConversations: (conversations) => set({ conversations }),

  addConversation: (conversation) => set((state) => ({
    conversations: [conversation, ...state.conversations],
  })),

  removeConversation: (id) => set((state) => ({
    conversations: state.conversations.filter((c) => c.id !== id),
    currentConversationId: state.currentConversationId === id ? null : state.currentConversationId,
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
    conversations: [],
    currentConversationId: null,
    messages: {},
  }),
}));
