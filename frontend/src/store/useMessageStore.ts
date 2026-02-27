import { create } from 'zustand';
import { api, SystemMessage, MessageType } from '../services/api';

type TabType = 'all' | MessageType;

interface MessageState {
  // Data
  messages: SystemMessage[];
  unreadCount: number;
  selectedMessage: SystemMessage | null;

  // Pagination
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;

  // Filter
  activeTab: TabType;

  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  isMarkingRead: boolean;

  // Modal
  isDetailModalVisible: boolean;

  // Actions
  fetchMessages: (refresh?: boolean) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<number>;
  setActiveTab: (tab: TabType) => void;
  openDetailModal: (message: SystemMessage) => void;
  closeDetailModal: () => void;
  reset: () => void;
}

const initialState = {
  messages: [] as SystemMessage[],
  unreadCount: 0,
  selectedMessage: null as SystemMessage | null,
  page: 1,
  pageSize: 20,
  total: 0,
  hasMore: true,
  activeTab: 'all' as TabType,
  isLoading: false,
  isRefreshing: false,
  isLoadingMore: false,
  isMarkingRead: false,
  isDetailModalVisible: false,
};

export const useMessageStore = create<MessageState>((set, get) => ({
  ...initialState,

  // Fetch messages
  fetchMessages: async (refresh = false) => {
    const { activeTab, pageSize } = get();

    if (refresh) {
      set({ isRefreshing: true, page: 1 });
    } else {
      set({ isLoading: true });
    }

    try {
      const params: { page: number; page_size: number; msg_type?: string } = {
        page: 1,
        page_size: pageSize,
      };
      if (activeTab !== 'all') {
        params.msg_type = activeTab;
      }

      const result = await api.getMessages(params);

      set({
        messages: result.messages || [],
        total: result.total,
        page: 1,
        hasMore: (result.messages?.length || 0) >= pageSize,
      });
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      set({ isLoading: false, isRefreshing: false });
    }
  },

  // Load more messages
  loadMoreMessages: async () => {
    const { page, pageSize, hasMore, isLoadingMore, activeTab, messages } = get();

    if (!hasMore || isLoadingMore) return;

    set({ isLoadingMore: true });

    try {
      const nextPage = page + 1;
      const params: { page: number; page_size: number; msg_type?: string } = {
        page: nextPage,
        page_size: pageSize,
      };
      if (activeTab !== 'all') {
        params.msg_type = activeTab;
      }

      const result = await api.getMessages(params);

      set({
        messages: [...messages, ...(result.messages || [])],
        page: nextPage,
        hasMore: (result.messages?.length || 0) >= pageSize,
      });
    } catch (error) {
      console.error('Failed to load more messages:', error);
    } finally {
      set({ isLoadingMore: false });
    }
  },

  // Fetch unread count
  fetchUnreadCount: async () => {
    try {
      const count = await api.getUnreadCount();
      set({ unreadCount: count });
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  },

  // Mark single message as read
  markAsRead: async (id: number) => {
    const { messages, unreadCount } = get();
    const message = messages.find((m) => m.id === id);

    if (!message || message.is_read) return;

    try {
      await api.markMessageAsRead(id);

      set({
        messages: messages.map((m) =>
          m.id === id ? { ...m, is_read: true, read_at: new Date().toISOString() } : m
        ),
        unreadCount: Math.max(0, unreadCount - 1),
      });
    } catch (error) {
      console.error('Failed to mark as read:', error);
      throw error;
    }
  },

  // Mark all messages as read
  markAllAsRead: async () => {
    const { messages } = get();

    set({ isMarkingRead: true });

    try {
      const result = await api.markAllMessagesAsRead();

      set({
        messages: messages.map((m) => ({
          ...m,
          is_read: true,
          read_at: m.read_at || new Date().toISOString(),
        })),
        unreadCount: 0,
      });

      return result.marked_count;
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      throw error;
    } finally {
      set({ isMarkingRead: false });
    }
  },

  // Set active tab
  setActiveTab: (tab: TabType) => {
    const { activeTab } = get();
    if (tab === activeTab) return;

    set({ activeTab: tab, messages: [], page: 1, hasMore: true });
    get().fetchMessages();
  },

  // Open detail modal
  openDetailModal: (message: SystemMessage) => {
    set({ selectedMessage: message, isDetailModalVisible: true });
    if (!message.is_read) {
      get().markAsRead(message.id);
    }
  },

  // Close detail modal
  closeDetailModal: () => {
    set({ isDetailModalVisible: false, selectedMessage: null });
  },

  // Reset state
  reset: () => {
    set(initialState);
  },
}));
