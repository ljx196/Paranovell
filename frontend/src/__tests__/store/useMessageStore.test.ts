import { useMessageStore } from '../../store/useMessageStore';

// Mock the api module
jest.mock('../../services/api', () => ({
  api: {
    getMessages: jest.fn(),
    getMessage: jest.fn(),
    markMessageAsRead: jest.fn(),
    markAllMessagesAsRead: jest.fn(),
    getUnreadCount: jest.fn(),
  },
}));

import { api } from '../../services/api';
const mockApi = api as jest.Mocked<typeof api>;

const makeMessage = (id: number, isRead = false) => ({
  id,
  title: `Message ${id}`,
  content: `Content ${id}`,
  msg_type: 'notice' as const,
  is_read: isRead,
  created_at: '2025-01-01T00:00:00Z',
  read_at: isRead ? '2025-01-01T01:00:00Z' : null,
});

const initialState = {
  messages: [],
  unreadCount: 0,
  selectedMessage: null,
  page: 1,
  pageSize: 20,
  total: 0,
  hasMore: true,
  activeTab: 'all' as const,
  isLoading: false,
  isRefreshing: false,
  isLoadingMore: false,
  isMarkingRead: false,
  isDetailModalVisible: false,
};

beforeEach(() => {
  useMessageStore.setState(initialState);
  jest.clearAllMocks();
});

describe('useMessageStore', () => {
  // Initial state
  test('has correct initial state', () => {
    const state = useMessageStore.getState();
    expect(state.messages).toEqual([]);
    expect(state.unreadCount).toBe(0);
    expect(state.selectedMessage).toBeNull();
    expect(state.page).toBe(1);
    expect(state.pageSize).toBe(20);
    expect(state.hasMore).toBe(true);
    expect(state.activeTab).toBe('all');
    expect(state.isLoading).toBe(false);
    expect(state.isDetailModalVisible).toBe(false);
  });

  // fetchMessages
  describe('fetchMessages', () => {
    test('success sets messages', async () => {
      const msgs = [makeMessage(1), makeMessage(2)];
      mockApi.getMessages.mockResolvedValue({ messages: msgs, total: 2, page: 1, page_size: 20 });
      await useMessageStore.getState().fetchMessages();
      expect(useMessageStore.getState().messages).toEqual(msgs);
      expect(useMessageStore.getState().total).toBe(2);
    });

    test('refresh mode resets page', async () => {
      useMessageStore.setState({ page: 3 });
      mockApi.getMessages.mockResolvedValue({ messages: [], total: 0, page: 1, page_size: 20 });
      await useMessageStore.getState().fetchMessages(true);
      expect(useMessageStore.getState().page).toBe(1);
    });

    test('sets hasMore false when results less than pageSize', async () => {
      mockApi.getMessages.mockResolvedValue({ messages: [makeMessage(1)], total: 1, page: 1, page_size: 20 });
      await useMessageStore.getState().fetchMessages();
      expect(useMessageStore.getState().hasMore).toBe(false);
    });

    test('passes msg_type filter when not all', async () => {
      useMessageStore.setState({ activeTab: 'notice' });
      mockApi.getMessages.mockResolvedValue({ messages: [], total: 0, page: 1, page_size: 20 });
      await useMessageStore.getState().fetchMessages();
      expect(mockApi.getMessages).toHaveBeenCalledWith(
        expect.objectContaining({ msg_type: 'notice' })
      );
    });

    test('does not pass msg_type for all tab', async () => {
      mockApi.getMessages.mockResolvedValue({ messages: [], total: 0, page: 1, page_size: 20 });
      await useMessageStore.getState().fetchMessages();
      const call = mockApi.getMessages.mock.calls[0][0];
      expect(call?.msg_type).toBeUndefined();
    });

    test('failure clears loading', async () => {
      mockApi.getMessages.mockRejectedValue(new Error('fail'));
      await useMessageStore.getState().fetchMessages();
      expect(useMessageStore.getState().isLoading).toBe(false);
      expect(useMessageStore.getState().isRefreshing).toBe(false);
    });

    test('handles null messages in response', async () => {
      mockApi.getMessages.mockResolvedValue({ messages: null as any, total: 0, page: 1, page_size: 20 });
      await useMessageStore.getState().fetchMessages();
      expect(useMessageStore.getState().messages).toEqual([]);
    });
  });

  // loadMoreMessages
  describe('loadMoreMessages', () => {
    test('appends messages and increments page', async () => {
      useMessageStore.setState({ messages: [makeMessage(1)] as any, hasMore: true, page: 1 });
      mockApi.getMessages.mockResolvedValue({ messages: [makeMessage(2)], total: 2, page: 2, page_size: 20 });
      await useMessageStore.getState().loadMoreMessages();
      expect(useMessageStore.getState().messages).toHaveLength(2);
      expect(useMessageStore.getState().page).toBe(2);
    });

    test('does nothing when hasMore is false', async () => {
      useMessageStore.setState({ hasMore: false });
      await useMessageStore.getState().loadMoreMessages();
      expect(mockApi.getMessages).not.toHaveBeenCalled();
    });

    test('does nothing when already loading', async () => {
      useMessageStore.setState({ hasMore: true, isLoadingMore: true });
      await useMessageStore.getState().loadMoreMessages();
      expect(mockApi.getMessages).not.toHaveBeenCalled();
    });

    test('clears isLoadingMore on failure', async () => {
      useMessageStore.setState({ hasMore: true });
      mockApi.getMessages.mockRejectedValue(new Error('fail'));
      await useMessageStore.getState().loadMoreMessages();
      expect(useMessageStore.getState().isLoadingMore).toBe(false);
    });
  });

  // fetchUnreadCount
  describe('fetchUnreadCount', () => {
    test('success sets count', async () => {
      mockApi.getUnreadCount.mockResolvedValue(5);
      await useMessageStore.getState().fetchUnreadCount();
      expect(useMessageStore.getState().unreadCount).toBe(5);
    });

    test('failure does not crash', async () => {
      mockApi.getUnreadCount.mockRejectedValue(new Error('fail'));
      await useMessageStore.getState().fetchUnreadCount();
      expect(useMessageStore.getState().unreadCount).toBe(0);
    });
  });

  // markAsRead
  describe('markAsRead', () => {
    test('marks message as read and decrements unread count', async () => {
      const msg = makeMessage(1, false);
      useMessageStore.setState({ messages: [msg] as any, unreadCount: 3 });
      mockApi.markMessageAsRead.mockResolvedValue(undefined);
      await useMessageStore.getState().markAsRead(1);
      const state = useMessageStore.getState();
      expect(state.messages[0].is_read).toBe(true);
      expect(state.messages[0].read_at).toBeTruthy();
      expect(state.unreadCount).toBe(2);
    });

    test('skips if message already read', async () => {
      const msg = makeMessage(1, true);
      useMessageStore.setState({ messages: [msg] as any, unreadCount: 3 });
      await useMessageStore.getState().markAsRead(1);
      expect(mockApi.markMessageAsRead).not.toHaveBeenCalled();
    });

    test('skips if message not found', async () => {
      useMessageStore.setState({ messages: [makeMessage(1)] as any });
      await useMessageStore.getState().markAsRead(999);
      expect(mockApi.markMessageAsRead).not.toHaveBeenCalled();
    });

    test('unread count does not go below 0', async () => {
      useMessageStore.setState({ messages: [makeMessage(1)] as any, unreadCount: 0 });
      mockApi.markMessageAsRead.mockResolvedValue(undefined);
      await useMessageStore.getState().markAsRead(1);
      expect(useMessageStore.getState().unreadCount).toBe(0);
    });

    test('throws on api failure', async () => {
      useMessageStore.setState({ messages: [makeMessage(1)] as any, unreadCount: 1 });
      mockApi.markMessageAsRead.mockRejectedValue(new Error('fail'));
      await expect(useMessageStore.getState().markAsRead(1)).rejects.toThrow();
    });
  });

  // markAllAsRead
  describe('markAllAsRead', () => {
    test('marks all messages as read', async () => {
      const msgs = [makeMessage(1, false), makeMessage(2, false), makeMessage(3, true)];
      useMessageStore.setState({ messages: msgs as any, unreadCount: 2 });
      mockApi.markAllMessagesAsRead.mockResolvedValue({ marked_count: 2 });
      const count = await useMessageStore.getState().markAllAsRead();
      expect(count).toBe(2);
      const state = useMessageStore.getState();
      expect(state.messages.every(m => m.is_read)).toBe(true);
      expect(state.unreadCount).toBe(0);
    });

    test('clears isMarkingRead on failure', async () => {
      useMessageStore.setState({ messages: [makeMessage(1)] as any });
      mockApi.markAllMessagesAsRead.mockRejectedValue(new Error('fail'));
      await expect(useMessageStore.getState().markAllAsRead()).rejects.toThrow();
      expect(useMessageStore.getState().isMarkingRead).toBe(false);
    });
  });

  // setActiveTab
  describe('setActiveTab', () => {
    test('changes tab and triggers fetch', () => {
      mockApi.getMessages.mockResolvedValue({ messages: [], total: 0, page: 1, page_size: 20 });
      useMessageStore.getState().setActiveTab('notice');
      expect(useMessageStore.getState().activeTab).toBe('notice');
      expect(useMessageStore.getState().messages).toEqual([]);
      expect(useMessageStore.getState().page).toBe(1);
      expect(useMessageStore.getState().hasMore).toBe(true);
      expect(mockApi.getMessages).toHaveBeenCalled();
    });

    test('does nothing when setting same tab', () => {
      useMessageStore.getState().setActiveTab('all');
      expect(mockApi.getMessages).not.toHaveBeenCalled();
    });
  });

  // openDetailModal / closeDetailModal
  describe('detail modal', () => {
    test('openDetailModal sets selected message and shows modal', () => {
      const msg = makeMessage(1, true);
      mockApi.markMessageAsRead.mockResolvedValue(undefined);
      useMessageStore.setState({ messages: [msg] as any });
      useMessageStore.getState().openDetailModal(msg as any);
      expect(useMessageStore.getState().selectedMessage).toEqual(msg);
      expect(useMessageStore.getState().isDetailModalVisible).toBe(true);
    });

    test('openDetailModal auto marks unread message as read', () => {
      const msg = makeMessage(1, false);
      useMessageStore.setState({ messages: [msg] as any, unreadCount: 1 });
      mockApi.markMessageAsRead.mockResolvedValue(undefined);
      useMessageStore.getState().openDetailModal(msg as any);
      expect(mockApi.markMessageAsRead).toHaveBeenCalledWith(1);
    });

    test('openDetailModal does not mark already-read message', () => {
      const msg = makeMessage(1, true);
      useMessageStore.setState({ messages: [msg] as any });
      useMessageStore.getState().openDetailModal(msg as any);
      expect(mockApi.markMessageAsRead).not.toHaveBeenCalled();
    });

    test('closeDetailModal clears selection and hides modal', () => {
      const msg = makeMessage(1, true);
      useMessageStore.setState({
        selectedMessage: msg as any,
        isDetailModalVisible: true,
        messages: [msg] as any,
      });
      useMessageStore.getState().closeDetailModal();
      expect(useMessageStore.getState().selectedMessage).toBeNull();
      expect(useMessageStore.getState().isDetailModalVisible).toBe(false);
    });
  });

  // reset
  describe('reset', () => {
    test('resets all state to initial', () => {
      useMessageStore.setState({
        messages: [makeMessage(1)] as any,
        unreadCount: 5,
        activeTab: 'usage',
        isDetailModalVisible: true,
      });
      useMessageStore.getState().reset();
      const state = useMessageStore.getState();
      expect(state.messages).toEqual([]);
      expect(state.unreadCount).toBe(0);
      expect(state.activeTab).toBe('all');
      expect(state.isDetailModalVisible).toBe(false);
    });
  });
});
