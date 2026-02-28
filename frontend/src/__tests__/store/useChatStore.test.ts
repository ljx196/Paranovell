import { useChatStore } from '../../store/useChatStore';
import type { SidebarConversation } from '../../store/useChatStore';

const makeSidebarConversation = (id: number, title = `Conv ${id}`): SidebarConversation => ({
  id,
  title,
  time: '刚刚',
  active: false,
});

const makeMessage = (id: number, conversationId: number, role: 'user' | 'assistant' = 'user') => ({
  id,
  conversationId,
  role,
  content: `Message ${id}`,
  status: 'success' as const,
  createdAt: '2025-01-01T00:00:00Z',
});

beforeEach(() => {
  useChatStore.setState({
    sidebarConversations: [],
    isLoadingConversations: false,
    currentConversationId: null,
    messages: {},
    isLoading: false,
    isSending: false,
  });
});

describe('useChatStore', () => {
  test('has correct initial state', () => {
    const state = useChatStore.getState();
    expect(state.sidebarConversations).toEqual([]);
    expect(state.isLoadingConversations).toBe(false);
    expect(state.currentConversationId).toBeNull();
    expect(state.messages).toEqual({});
    expect(state.isLoading).toBe(false);
    expect(state.isSending).toBe(false);
  });

  test('setActiveConversation updates active flag', () => {
    useChatStore.setState({
      sidebarConversations: [makeSidebarConversation(1), makeSidebarConversation(2)],
    });
    useChatStore.getState().setActiveConversation(2);
    const convs = useChatStore.getState().sidebarConversations;
    expect(convs.find(c => c.id === 2)?.active).toBe(true);
    expect(convs.find(c => c.id === 1)?.active).toBe(false);
  });

  test('setActiveConversation with null clears all active flags', () => {
    useChatStore.setState({
      sidebarConversations: [
        { ...makeSidebarConversation(1), active: true },
        makeSidebarConversation(2),
      ],
    });
    useChatStore.getState().setActiveConversation(null);
    const convs = useChatStore.getState().sidebarConversations;
    expect(convs.every(c => !c.active)).toBe(true);
  });

  test('setCurrentConversation sets id', () => {
    useChatStore.getState().setCurrentConversation(5);
    expect(useChatStore.getState().currentConversationId).toBe(5);
  });

  test('setCurrentConversation can set null', () => {
    useChatStore.getState().setCurrentConversation(5);
    useChatStore.getState().setCurrentConversation(null);
    expect(useChatStore.getState().currentConversationId).toBeNull();
  });

  test('setMessages sets messages for a conversation', () => {
    const msgs = [makeMessage(1, 10), makeMessage(2, 10)];
    useChatStore.getState().setMessages(10, msgs);
    expect(useChatStore.getState().messages[10]).toEqual(msgs);
  });

  test('addMessage appends to conversation messages', () => {
    useChatStore.getState().setMessages(10, [makeMessage(1, 10)]);
    useChatStore.getState().addMessage(10, makeMessage(2, 10, 'assistant'));
    const msgs = useChatStore.getState().messages[10];
    expect(msgs).toHaveLength(2);
    expect(msgs[1].id).toBe(2);
    expect(msgs[1].role).toBe('assistant');
  });

  test('addMessage creates array for new conversation', () => {
    useChatStore.getState().addMessage(99, makeMessage(1, 99));
    expect(useChatStore.getState().messages[99]).toHaveLength(1);
  });

  test('updateMessage updates specific message', () => {
    useChatStore.getState().setMessages(10, [
      makeMessage(1, 10),
      makeMessage(2, 10),
    ]);
    useChatStore.getState().updateMessage(10, 1, { content: 'Updated', status: 'error' });
    const msg = useChatStore.getState().messages[10].find(m => m.id === 1);
    expect(msg?.content).toBe('Updated');
    expect(msg?.status).toBe('error');
  });

  test('updateMessage does not affect other messages', () => {
    useChatStore.getState().setMessages(10, [
      makeMessage(1, 10),
      makeMessage(2, 10),
    ]);
    useChatStore.getState().updateMessage(10, 1, { content: 'Changed' });
    const msg2 = useChatStore.getState().messages[10].find(m => m.id === 2);
    expect(msg2?.content).toBe('Message 2');
  });

  test('setLoading updates isLoading', () => {
    useChatStore.getState().setLoading(true);
    expect(useChatStore.getState().isLoading).toBe(true);
  });

  test('setSending updates isSending', () => {
    useChatStore.getState().setSending(true);
    expect(useChatStore.getState().isSending).toBe(true);
  });

  test('clearChat resets sidebarConversations, currentConversationId, and messages', () => {
    useChatStore.setState({
      sidebarConversations: [makeSidebarConversation(1)],
    });
    useChatStore.getState().setCurrentConversation(1);
    useChatStore.getState().setMessages(1, [makeMessage(1, 1)]);

    useChatStore.getState().clearChat();
    const state = useChatStore.getState();
    expect(state.sidebarConversations).toEqual([]);
    expect(state.currentConversationId).toBeNull();
    expect(state.messages).toEqual({});
  });
});
