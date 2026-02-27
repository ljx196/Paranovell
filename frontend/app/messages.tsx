/**
 * GenNovel - Messages Page
 * System messages center with filtering and detail view
 */

import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams, Redirect } from 'expo-router';
import { Inbox, CheckCheck } from 'lucide-react-native';
import { useTheme } from '../src/theme';
import { useResponsive } from '../src/hooks/useResponsive';
import { useAuthStore } from '../src/store/useAuthStore';
import { useMessageStore } from '../src/store/useMessageStore';
import { Header } from '../src/components/layout';
import {
  Sidebar,
  Conversation,
} from '../src/components/chat';
import {
  MessageCard,
  MessageTabs,
  MessageSkeleton,
  MessageDetailModal,
} from '../src/components/message';
import { api } from '../src/services/api';

export default function MessagesScreen() {
  const { colors, spacing, borderRadius } = useTheme();
  const { isMobile } = useResponsive();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const params = useLocalSearchParams<{ id?: string }>();

  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  // Load conversations for sidebar
  useEffect(() => {
    if (isAuthenticated) {
      loadConversations();
    }
  }, [isAuthenticated]);

  const loadConversations = async () => {
    try {
      const response = await api.getConversations() as any;
      const apiConversations = response.data?.conversations || [];
      if (apiConversations.length > 0) {
        const formatted: Conversation[] = apiConversations.map((c: any) => ({
          id: c.id,
          title: c.title || '新会话',
          time: '',
          active: false,
        }));
        setConversations(formatted);
      } else {
        setConversations([
          { id: 'demo', title: '演示对话', time: '刚刚', active: false },
        ]);
      }
    } catch (_) {
      setConversations([
        { id: 'demo', title: '演示对话', time: '刚刚', active: false },
      ]);
    }
  };

  const handleSelectConversation = (id: number | string) => {
    router.replace('/chat');
  };

  const handleNewChat = () => {
    router.replace('/chat');
  };

  const {
    messages,
    unreadCount,
    selectedMessage,
    activeTab,
    isLoading,
    isRefreshing,
    isLoadingMore,
    isMarkingRead,
    hasMore,
    isDetailModalVisible,
    fetchMessages,
    loadMoreMessages,
    fetchUnreadCount,
    markAllAsRead,
    setActiveTab,
    openDetailModal,
    closeDetailModal,
  } = useMessageStore();

  // Initial load
  useEffect(() => {
    if (isAuthenticated) {
      fetchMessages();
      fetchUnreadCount();
    }
  }, [isAuthenticated]);

  // Handle message ID from URL params (one-time)
  const handledParamId = React.useRef<string | null>(null);
  useEffect(() => {
    if (params.id && params.id !== handledParamId.current && messages.length > 0) {
      const messageId = parseInt(params.id, 10);
      const message = messages.find((m) => m.id === messageId);
      if (message) {
        handledParamId.current = params.id;
        openDetailModal(message);
        try { router.setParams({ id: undefined }); } catch {}
      }
    }
  }, [params.id, messages]);

  const handleRefresh = useCallback(() => {
    fetchMessages(true);
    fetchUnreadCount();
  }, []);

  const handleScroll = useCallback(
    ({ nativeEvent }: any) => {
      const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
      const paddingBottom = 50;
      const isCloseToBottom =
        layoutMeasurement.height + contentOffset.y >=
        contentSize.height - paddingBottom;

      if (isCloseToBottom && hasMore && !isLoadingMore) {
        loadMoreMessages();
      }
    },
    [hasMore, isLoadingMore]
  );

  const handleMarkAllRead = async () => {
    try {
      const count = await markAllAsRead();
      console.log(`Marked ${count} messages as read`);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  // Auth redirect (use component instead of useEffect to avoid navigation-before-mount)
  if (!authLoading && !isAuthenticated) {
    return <Redirect href="/login" />;
  }
  if (authLoading || !isAuthenticated) {
    return (
      <View
        style={[styles.loadingContainer, { backgroundColor: colors.bgPrimary }]}
      >
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={{ color: colors.textSecondary, marginTop: spacing.md }}>
          加载中...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.bgPrimary }}>
      {/* Sidebar - same as chat page */}
      {sidebarOpen && !isMobile && (
        <Sidebar
          conversations={conversations}
          onNewChat={handleNewChat}
          onSelectConversation={handleSelectConversation}
          onCollapse={() => setSidebarOpen(false)}
          onLogout={() => {
            useAuthStore.getState().logout();
            router.replace('/login');
          }}
          userName={user?.nickname || user?.email || '用户'}
          userPlan="免费版"
        />
      )}

      {/* Main Content */}
      <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      {/* Header */}
      <Header
        title="消息中心"
        showMenuButton={!sidebarOpen}
        onMenuPress={() => setSidebarOpen(true)}
        showThemeToggle={!isMobile}
      />

      {/* Tabs */}
      <MessageTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Message List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={[styles.listContent, { padding: spacing.lg, paddingBottom: spacing['2xl'] }]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        {/* Stats Header */}
        <View
          style={[
            styles.statsBar,
            {
              backgroundColor: colors.bgSecondary,
              borderRadius: borderRadius.md,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              padding: spacing.md,
              marginBottom: spacing.lg,
            },
          ]}
        >
          <Text style={[styles.statsText, { color: colors.textSecondary }]}>
            共 {messages.length} 条消息
            {unreadCount > 0 && (
              <Text style={{ color: colors.accent }}>
                {' '}· {unreadCount} 条未读
              </Text>
            )}
          </Text>
          {unreadCount > 0 && (
            <Pressable
              onPress={handleMarkAllRead}
              disabled={isMarkingRead}
              style={(state: any) => [
                styles.markAllButton,
                {
                  borderRadius: borderRadius.sm,
                  paddingHorizontal: spacing.sm,
                  paddingVertical: spacing.xs,
                },
                state.hovered && { backgroundColor: colors.bgTertiary },
              ]}
            >
              {isMarkingRead ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <>
                  <CheckCheck size={14} color={colors.accent} strokeWidth={2} />
                  <Text style={{ color: colors.accent, fontSize: 13, marginLeft: spacing.xs }}>
                    全部已读
                  </Text>
                </>
              )}
            </Pressable>
          )}
        </View>

        {/* Loading Skeleton */}
        {isLoading && messages.length === 0 ? (
          <MessageSkeleton count={5} />
        ) : messages.length === 0 ? (
          /* Empty State */
          <View style={[styles.emptyState, { paddingVertical: spacing['3xl'] }]}>
            <Inbox size={48} color={colors.textMuted} strokeWidth={1.2} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary, marginTop: spacing.lg }]}>
              暂无消息
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.textMuted, marginTop: spacing.sm }]}>
              当有新的系统通知时，会在这里显示
            </Text>
          </View>
        ) : (
          /* Message Cards */
          <>
            {messages.map((message) => (
              <MessageCard
                key={message.id}
                message={message}
                onPress={() => openDetailModal(message)}
              />
            ))}

            {/* Load More Indicator */}
            {isLoadingMore && (
              <View style={[styles.loadingMore, { padding: spacing.lg }]}>
                <ActivityIndicator size="small" color={colors.accent} />
                <Text style={{ color: colors.textMuted, marginLeft: spacing.sm }}>加载中...</Text>
              </View>
            )}

            {!hasMore && messages.length > 0 && (
              <View style={[styles.noMore, { padding: spacing.lg }]}>
                <Text style={{ color: colors.textMuted }}>没有更多消息了</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Detail Modal */}
      <MessageDetailModal
        visible={isDetailModalVisible}
        message={selectedMessage}
        onClose={closeDetailModal}
      />
    </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  list: {
    flex: 1,
  },
  listContent: {},
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statsText: {
    fontSize: 13,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  emptyDesc: {
    fontSize: 14,
  },
  loadingMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noMore: {
    alignItems: 'center',
  },
});
