# 系统消息页面技术设计文档

## 1. 技术架构概述

### 1.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                        View Layer                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ messages.tsx│  │MessageCard  │  │MessageDetailModal   │ │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
└─────────┼────────────────┼────────────────────┼─────────────┘
          │                │                    │
          ▼                ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                       State Layer                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                  useMessageStore                      │  │
│  │  - messages[], unreadCount, activeTab, pagination    │  │
│  └──────────────────────────┬───────────────────────────┘  │
└─────────────────────────────┼───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Service Layer                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   messageApi                          │  │
│  │  - getMessages(), getUnreadCount(), markAsRead()     │  │
│  └──────────────────────────┬───────────────────────────┘  │
└─────────────────────────────┼───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        API Layer                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    apiClient                          │  │
│  │  - request(), auth header, error handling            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 技术选型

| 层级 | 技术 | 说明 |
|------|------|------|
| 视图层 | React Native + Expo Router | 页面和组件 |
| 状态管理 | Zustand | 轻量级状态管理 |
| 样式 | NativeWind + Theme Context | 主题适配 |
| 网络请求 | 现有 apiClient | 统一请求封装 |
| 列表渲染 | FlatList | 虚拟列表优化 |

---

## 2. 目录结构

```
frontend/src/
├── components/
│   ├── message/                      # 消息相关组件
│   │   ├── index.ts                  # 导出入口
│   │   ├── MessageCard.tsx           # 消息卡片
│   │   ├── MessageTabs.tsx           # 分类标签栏
│   │   ├── MessageDetailModal.tsx    # 消息详情弹窗
│   │   ├── MessageSkeleton.tsx       # 骨架屏
│   │   └── NotificationDropdown.tsx  # 铃铛悬浮通知面板（Web hover）
│   ├── layout/
│   │   ├── Header.tsx                # 顶部栏（含 NotificationDropdown）
│   │   └── UserMenu.tsx              # 用户菜单弹出面板
│   └── ui/
│       └── UnreadBadge.tsx           # 未读数量气泡
├── services/
│   └── api.ts                        # 添加 messageApi 方法
├── store/
│   └── useMessageStore.ts            # 消息状态管理
├── utils/
│   └── timeFormat.ts                 # 时间格式化工具
└── app/
    └── messages.tsx                  # 消息页面（含 Sidebar + 主内容区）
```

---

## 3. API 服务层设计

### 3.1 在 api.ts 中添加消息相关方法

```typescript
// src/services/api.ts 新增部分

// ============ 类型定义 ============

export interface SystemMessage {
  id: number;
  title: string;
  content: string;
  msg_type: 'account' | 'notice' | 'usage';
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

export interface UnreadCountResponse {
  count: number;
}

export interface MessageListParams {
  page?: number;
  page_size?: number;
  msg_type?: 'account' | 'notice' | 'usage';
}

// ============ API 方法 ============

class ApiClient {
  // ... 现有代码 ...

  // 获取消息列表
  async getMessages(params?: MessageListParams): Promise<MessageListResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.page_size) query.set('page_size', String(params.page_size));
    if (params?.msg_type) query.set('msg_type', params.msg_type);

    const response = await this.request<{ data: MessageListResponse }>(
      `/messages?${query.toString()}`
    );
    return response.data;
  }

  // 获取单条消息详情
  async getMessage(id: number): Promise<SystemMessage> {
    const response = await this.request<{ data: SystemMessage }>(
      `/messages/${id}`
    );
    return response.data;
  }

  // 标记单条消息已读
  async markMessageAsRead(id: number): Promise<void> {
    await this.request(`/messages/${id}/read`, { method: 'PUT' });
  }

  // 标记全部已读
  async markAllMessagesAsRead(): Promise<{ marked_count: number }> {
    const response = await this.request<{ data: { marked_count: number } }>(
      '/messages/read-all',
      { method: 'PUT' }
    );
    return response.data;
  }

  // 获取未读数量
  async getUnreadCount(): Promise<number> {
    const response = await this.request<{ data: UnreadCountResponse }>(
      '/messages/unread-count'
    );
    return response.data.count;
  }
}
```

---

## 4. 状态管理设计

### 4.1 useMessageStore 完整设计

```typescript
// src/store/useMessageStore.ts

import { create } from 'zustand';
import { apiClient, SystemMessage } from '../services/api';

type MessageTab = 'all' | 'account' | 'notice' | 'usage';

interface MessageState {
  // ===== 数据 =====
  messages: SystemMessage[];
  unreadCount: number;
  selectedMessage: SystemMessage | null;

  // ===== 分页 =====
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;

  // ===== 筛选 =====
  activeTab: MessageTab;

  // ===== 加载状态 =====
  isLoading: boolean;        // 首次加载
  isRefreshing: boolean;     // 下拉刷新
  isLoadingMore: boolean;    // 加载更多
  isMarkingRead: boolean;    // 标记已读中

  // ===== Modal =====
  isDetailModalVisible: boolean;

  // ===== Actions =====
  fetchMessages: (refresh?: boolean) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  setActiveTab: (tab: MessageTab) => void;
  openDetailModal: (message: SystemMessage) => void;
  closeDetailModal: () => void;
  reset: () => void;
}

const initialState = {
  messages: [],
  unreadCount: 0,
  selectedMessage: null,
  page: 1,
  pageSize: 20,
  total: 0,
  hasMore: true,
  activeTab: 'all' as MessageTab,
  isLoading: false,
  isRefreshing: false,
  isLoadingMore: false,
  isMarkingRead: false,
  isDetailModalVisible: false,
};

export const useMessageStore = create<MessageState>((set, get) => ({
  ...initialState,

  // 获取消息列表
  fetchMessages: async (refresh = false) => {
    const { activeTab, pageSize } = get();

    // 设置加载状态
    if (refresh) {
      set({ isRefreshing: true, page: 1 });
    } else {
      set({ isLoading: true });
    }

    try {
      const params: any = { page: 1, page_size: pageSize };
      if (activeTab !== 'all') {
        params.msg_type = activeTab;
      }

      const result = await apiClient.getMessages(params);

      set({
        messages: result.messages,
        total: result.total,
        page: 1,
        hasMore: result.messages.length >= pageSize,
      });
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      throw error;
    } finally {
      set({ isLoading: false, isRefreshing: false });
    }
  },

  // 加载更多
  loadMoreMessages: async () => {
    const { page, pageSize, hasMore, isLoadingMore, activeTab, messages } = get();

    if (!hasMore || isLoadingMore) return;

    set({ isLoadingMore: true });

    try {
      const nextPage = page + 1;
      const params: any = { page: nextPage, page_size: pageSize };
      if (activeTab !== 'all') {
        params.msg_type = activeTab;
      }

      const result = await apiClient.getMessages(params);

      set({
        messages: [...messages, ...result.messages],
        page: nextPage,
        hasMore: result.messages.length >= pageSize,
      });
    } catch (error) {
      console.error('Failed to load more messages:', error);
    } finally {
      set({ isLoadingMore: false });
    }
  },

  // 获取未读数量
  fetchUnreadCount: async () => {
    try {
      const count = await apiClient.getUnreadCount();
      set({ unreadCount: count });
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  },

  // 标记单条已读
  markAsRead: async (id: number) => {
    const { messages, unreadCount } = get();
    const message = messages.find((m) => m.id === id);

    // 如果已读，不需要操作
    if (!message || message.is_read) return;

    try {
      await apiClient.markMessageAsRead(id);

      // 更新本地状态
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

  // 标记全部已读
  markAllAsRead: async () => {
    const { messages } = get();

    set({ isMarkingRead: true });

    try {
      const result = await apiClient.markAllMessagesAsRead();

      // 更新本地状态
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

  // 切换 Tab
  setActiveTab: (tab: MessageTab) => {
    const { activeTab } = get();
    if (tab === activeTab) return;

    set({ activeTab: tab, messages: [], page: 1, hasMore: true });
    // 切换后自动加载
    get().fetchMessages();
  },

  // 打开详情弹窗
  openDetailModal: (message: SystemMessage) => {
    set({ selectedMessage: message, isDetailModalVisible: true });
    // 打开时自动标记已读
    if (!message.is_read) {
      get().markAsRead(message.id);
    }
  },

  // 关闭详情弹窗
  closeDetailModal: () => {
    set({ isDetailModalVisible: false, selectedMessage: null });
  },

  // 重置状态
  reset: () => {
    set(initialState);
  },
}));
```

### 4.2 未读数量全局同步

在 `useAuthStore` 或独立的初始化逻辑中，登录成功后自动获取未读数量：

```typescript
// 在 App 启动或登录成功后调用
useEffect(() => {
  if (isAuthenticated) {
    useMessageStore.getState().fetchUnreadCount();
  }
}, [isAuthenticated]);
```

---

## 5. 组件详细设计

### 5.1 MessageCard 组件

```typescript
// src/components/message/MessageCard.tsx

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { SystemMessage } from '../../services/api';
import { formatRelativeTime } from '../../utils/timeFormat';

const MESSAGE_ICONS: Record<string, string> = {
  account: '🔐',
  notice: '📢',
  usage: '📊',
};

interface MessageCardProps {
  message: SystemMessage;
  onPress: () => void;
}

export const MessageCard: React.FC<MessageCardProps> = ({ message, onPress }) => {
  const { colors } = useTheme();

  const icon = MESSAGE_ICONS[message.msg_type] || '📩';
  const previewText = message.content.length > 60
    ? message.content.substring(0, 60) + '...'
    : message.content;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: colors.bgSecondary },
        pressed && { opacity: 0.8 },
      ]}
    >
      {/* 图标 */}
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{icon}</Text>
      </View>

      {/* 内容区 */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text
            style={[
              styles.title,
              { color: colors.textPrimary },
              !message.is_read && styles.titleUnread,
            ]}
            numberOfLines={1}
          >
            {message.title}
          </Text>
          <Text style={[styles.time, { color: colors.textMuted }]}>
            {formatRelativeTime(message.created_at)}
          </Text>
        </View>

        <Text
          style={[styles.preview, { color: colors.textMuted }]}
          numberOfLines={2}
        >
          {previewText}
        </Text>
      </View>

      {/* 未读点 */}
      {!message.is_read && (
        <View style={[styles.unreadDot, { backgroundColor: colors.accent }]} />
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(212, 131, 106, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '400',
    flex: 1,
    marginRight: 8,
  },
  titleUnread: {
    fontWeight: '600',
  },
  time: {
    fontSize: 12,
  },
  preview: {
    fontSize: 14,
    lineHeight: 20,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
    marginTop: 6,
  },
});
```

### 5.2 MessageTabs 组件

```typescript
// src/components/message/MessageTabs.tsx

import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../theme';

type TabKey = 'all' | 'account' | 'notice' | 'usage';

interface Tab {
  key: TabKey;
  label: string;
}

const TABS: Tab[] = [
  { key: 'all', label: '全部' },
  { key: 'account', label: '账户' },
  { key: 'notice', label: '公告' },
  { key: 'usage', label: '用量' },
];

interface MessageTabsProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

export const MessageTabs: React.FC<MessageTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  const { colors } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {TABS.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onTabChange(tab.key)}
            style={[
              styles.tab,
              isActive && { backgroundColor: colors.accent + '20' },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                { color: isActive ? colors.accent : colors.textSecondary },
                isActive && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 0,
    marginBottom: 16,
  },
  content: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '400',
  },
  tabTextActive: {
    fontWeight: '600',
  },
});
```

### 5.3 MessageDetailModal 组件

```typescript
// src/components/message/MessageDetailModal.tsx

import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../theme';
import { SystemMessage } from '../../services/api';
import { formatDateTime } from '../../utils/timeFormat';

const MESSAGE_ICONS: Record<string, string> = {
  account: '🔐',
  notice: '📢',
  usage: '📊',
};

interface MessageDetailModalProps {
  visible: boolean;
  message: SystemMessage | null;
  onClose: () => void;
}

export const MessageDetailModal: React.FC<MessageDetailModalProps> = ({
  visible,
  message,
  onClose,
}) => {
  const { colors } = useTheme();

  if (!message) return null;

  const icon = MESSAGE_ICONS[message.msg_type] || '📩';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.modal, { backgroundColor: colors.bgSecondary }]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* 关闭按钮 */}
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={[styles.closeText, { color: colors.textMuted }]}>✕</Text>
          </Pressable>

          {/* 标题区 */}
          <View style={styles.header}>
            <Text style={styles.icon}>{icon}</Text>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {message.title}
            </Text>
          </View>

          {/* 时间 */}
          <Text style={[styles.time, { color: colors.textMuted }]}>
            {formatDateTime(message.created_at)}
          </Text>

          {/* 分割线 */}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* 内容 */}
          <ScrollView style={styles.contentScroll}>
            <Text style={[styles.content, { color: colors.textSecondary }]}>
              {message.content}
            </Text>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '80%',
    borderRadius: 16,
    padding: 24,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  closeText: {
    fontSize: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingRight: 32,
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  time: {
    fontSize: 13,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    marginBottom: 16,
  },
  contentScroll: {
    flexGrow: 0,
  },
  content: {
    fontSize: 15,
    lineHeight: 24,
  },
});
```

### 5.4 MessageSkeleton 骨架屏组件

```typescript
// src/components/message/MessageSkeleton.tsx

import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../theme';

export const MessageSkeleton: React.FC = () => {
  const { colors } = useTheme();
  const opacity = React.useRef(new Animated.Value(0.3)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const SkeletonItem = () => (
    <View style={[styles.item, { backgroundColor: colors.bgSecondary }]}>
      <Animated.View
        style={[styles.icon, { backgroundColor: colors.border, opacity }]}
      />
      <View style={styles.content}>
        <Animated.View
          style={[styles.titleLine, { backgroundColor: colors.border, opacity }]}
        />
        <Animated.View
          style={[styles.textLine, { backgroundColor: colors.border, opacity }]}
        />
        <Animated.View
          style={[styles.textLineShort, { backgroundColor: colors.border, opacity }]}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <SkeletonItem />
      <SkeletonItem />
      <SkeletonItem />
      <SkeletonItem />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  item: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  titleLine: {
    height: 16,
    width: '60%',
    borderRadius: 4,
    marginBottom: 8,
  },
  textLine: {
    height: 12,
    width: '100%',
    borderRadius: 4,
    marginBottom: 6,
  },
  textLineShort: {
    height: 12,
    width: '40%',
    borderRadius: 4,
  },
});
```

### 5.5 UnreadBadge 组件

```typescript
// src/components/ui/UnreadBadge.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

interface UnreadBadgeProps {
  count: number;
  maxCount?: number;
}

export const UnreadBadge: React.FC<UnreadBadgeProps> = ({
  count,
  maxCount = 99,
}) => {
  const { colors } = useTheme();

  if (count <= 0) return null;

  const displayCount = count > maxCount ? `${maxCount}+` : String(count);

  return (
    <View style={[styles.badge, { backgroundColor: colors.accent }]}>
      <Text style={styles.text}>{displayCount}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
});
```

---

## 6. 页面实现

### 6.1 messages.tsx 主页面

```typescript
// app/messages.tsx

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/theme';
import { useMessageStore } from '../src/store/useMessageStore';
import {
  MessageCard,
  MessageTabs,
  MessageDetailModal,
  MessageSkeleton,
} from '../src/components/message';

export default function MessagesPage() {
  const router = useRouter();
  const { colors } = useTheme();

  const {
    messages,
    unreadCount,
    activeTab,
    isLoading,
    isRefreshing,
    isLoadingMore,
    isMarkingRead,
    hasMore,
    selectedMessage,
    isDetailModalVisible,
    fetchMessages,
    loadMoreMessages,
    setActiveTab,
    markAllAsRead,
    openDetailModal,
    closeDetailModal,
  } = useMessageStore();

  // 初始加载
  useEffect(() => {
    fetchMessages();
  }, []);

  // 下拉刷新
  const handleRefresh = useCallback(() => {
    fetchMessages(true);
  }, []);

  // 加载更多
  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoadingMore) {
      loadMoreMessages();
    }
  }, [hasMore, isLoadingMore]);

  // 全部标记已读
  const handleMarkAllRead = useCallback(async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      // TODO: 显示错误 Toast
    }
  }, []);

  // 渲染列表项
  const renderItem = useCallback(
    ({ item }) => (
      <MessageCard message={item} onPress={() => openDetailModal(item)} />
    ),
    []
  );

  // 渲染列表底部
  const renderFooter = () => {
    if (isLoadingMore) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator color={colors.accent} />
        </View>
      );
    }
    if (!hasMore && messages.length > 0) {
      return (
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            没有更多消息了
          </Text>
        </View>
      );
    }
    return null;
  };

  // 渲染空状态
  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>📭</Text>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          {activeTab === 'all' ? '暂无消息' : '暂无该类型的消息'}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backIcon, { color: colors.textPrimary }]}>←</Text>
        </Pressable>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          系统消息
        </Text>
        <Pressable
          onPress={handleMarkAllRead}
          disabled={isMarkingRead || unreadCount === 0}
          style={styles.markAllButton}
        >
          {isMarkingRead ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <Text
              style={[
                styles.markAllText,
                { color: unreadCount > 0 ? colors.accent : colors.textMuted },
              ]}
            >
              全部已读
            </Text>
          )}
        </Pressable>
      </View>

      {/* Tabs */}
      <MessageTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Content */}
      {isLoading ? (
        <MessageSkeleton />
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.accent}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
        />
      )}

      {/* Detail Modal */}
      <MessageDetailModal
        visible={isDetailModalVisible}
        message={selectedMessage}
        onClose={closeDetailModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  markAllText: {
    fontSize: 14,
  },
  list: {
    padding: 16,
    paddingTop: 0,
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
  },
  empty: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
  },
});
```

---

## 7. 工具函数

### 7.1 时间格式化

```typescript
// src/utils/timeFormat.ts

/**
 * 格式化为相对时间
 * @param dateStr ISO 时间字符串
 * @returns 相对时间描述
 */
export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return '刚刚';
  } else if (minutes < 60) {
    return `${minutes}分钟前`;
  } else if (hours < 24) {
    return `${hours}小时前`;
  } else if (days < 7) {
    return `${days}天前`;
  } else {
    return formatDate(dateStr);
  }
}

/**
 * 格式化为完整日期时间
 * @param dateStr ISO 时间字符串
 * @returns YYYY-MM-DD HH:mm
 */
export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * 格式化为日期
 * @param dateStr ISO 时间字符串
 * @returns YYYY-MM-DD
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
```

---

## 8. Header 集成

### 8.1 修改 Header 组件添加消息入口

```typescript
// src/components/layout/Header.tsx 修改

import { UnreadBadge } from '../ui/UnreadBadge';
import { useMessageStore } from '../../store/useMessageStore';

// 在 Header 组件中添加
const Header = () => {
  const router = useRouter();
  const { unreadCount } = useMessageStore();

  return (
    <View style={styles.header}>
      {/* ... 其他内容 ... */}

      {/* 消息图标 */}
      <Pressable
        onPress={() => router.push('/messages')}
        style={styles.iconButton}
      >
        <Text style={styles.bellIcon}>🔔</Text>
        {unreadCount > 0 && (
          <View style={styles.badgeContainer}>
            <UnreadBadge count={unreadCount} />
          </View>
        )}
      </Pressable>
    </View>
  );
};

// 样式
const styles = StyleSheet.create({
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellIcon: {
    fontSize: 20,
  },
  badgeContainer: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
});
```

---

## 9. 导出配置

### 9.1 组件导出

```typescript
// src/components/message/index.ts

export { MessageCard } from './MessageCard';
export { MessageTabs } from './MessageTabs';
export { MessageDetailModal } from './MessageDetailModal';
export { MessageSkeleton } from './MessageSkeleton';
export { MessageList } from './MessageList';
```

### 9.2 UI 组件导出更新

```typescript
// src/components/ui/index.ts

export { Button } from './Button';
export { Input } from './Input';
export { Card } from './Card';
export { Avatar } from './Avatar';
export { UnreadBadge } from './UnreadBadge';  // 新增
```

---

## 10. 错误处理

### 10.1 API 错误处理

```typescript
// 在 fetchMessages 中添加错误处理
fetchMessages: async (refresh = false) => {
  try {
    // ... 请求逻辑
  } catch (error) {
    set({ error: '加载失败，请重试' });
    // 可以通过 Toast 组件显示错误
  }
}
```

### 10.2 网络状态处理

```typescript
// 可选：添加网络状态监听
import NetInfo from '@react-native-community/netinfo';

const unsubscribe = NetInfo.addEventListener(state => {
  if (state.isConnected) {
    // 网络恢复，刷新数据
    useMessageStore.getState().fetchUnreadCount();
  }
});
```

---

## 11. 实现计划

### 11.1 开发顺序

| 阶段 | 任务 | 依赖 |
|------|------|------|
| 1 | 创建 `timeFormat.ts` 工具函数 | 无 |
| 2 | 在 `api.ts` 添加消息相关 API | 无 |
| 3 | 创建 `useMessageStore.ts` | api.ts |
| 4 | 创建 `UnreadBadge` 组件 | 无 |
| 5 | 创建 `MessageCard` 组件 | timeFormat.ts |
| 6 | 创建 `MessageTabs` 组件 | 无 |
| 7 | 创建 `MessageSkeleton` 组件 | 无 |
| 8 | 创建 `MessageDetailModal` 组件 | timeFormat.ts |
| 9 | 创建 `messages.tsx` 页面 | 1-8 |
| 10 | 修改 Header 添加消息入口 | UnreadBadge, Store |
| 11 | 测试和调试 | 全部 |

### 11.2 文件创建清单

```
[x] src/utils/timeFormat.ts
[x] src/services/api.ts (修改)
[x] src/store/useMessageStore.ts
[x] src/components/ui/UnreadBadge.tsx
[x] src/components/ui/index.ts (修改)
[x] src/components/message/MessageCard.tsx
[x] src/components/message/MessageTabs.tsx
[x] src/components/message/MessageSkeleton.tsx
[x] src/components/message/MessageDetailModal.tsx
[x] src/components/message/NotificationDropdown.tsx
[x] src/components/message/index.ts
[x] src/components/layout/UserMenu.tsx
[x] app/messages.tsx
[x] src/components/layout/Header.tsx (修改)
```

---

## 12. 测试要点

### 12.1 功能测试

| 测试项 | 验收标准 |
|--------|----------|
| 消息列表加载 | 正确显示消息，分页正常 |
| Tab 切换 | 切换后正确筛选消息 |
| 下拉刷新 | 刷新后获取最新数据 |
| 加载更多 | 滚动到底部自动加载 |
| 点击查看详情 | 弹出 Modal，显示完整内容 |
| 自动标记已读 | 查看详情后消息变为已读 |
| 全部标记已读 | 所有消息变为已读，红点消失 |
| 未读数量同步 | Header 红点数量实时更新 |

### 12.2 边界测试

| 测试项 | 验收标准 |
|--------|----------|
| 空列表 | 显示空状态插图和文案 |
| 网络错误 | 显示错误提示，可重试 |
| 大量消息 | 列表滚动流畅，无卡顿 |
| 长标题/内容 | 正确截断，不破坏布局 |

---

---

## 13. Bug 修复记录（2026-02-06）

### 13.1 NotificationDropdown 悬浮面板不显示

**问题**：Web 端鼠标 hover 铃铛图标时，下拉通知面板不可见。

**根因**：`Header` 容器和内部 `right` 区域缺少 `zIndex`，导致绝对定位的 dropdown 被其他元素遮挡。

**修复**：
- `Header.tsx`：`container` 添加 `zIndex: 100`，`right` 添加 `zIndex: 100`
- `NotificationDropdown.tsx`：`container` 添加 `zIndex: 1000`

### 13.2 Web 端点击铃铛不跳转消息页

**问题**：Web 端点击铃铛按钮无反应，无法导航到 `/messages`。

**根因**：`handlePress` 中有 `Platform.OS !== 'web'` 判断，Web 端被排除。原设计意图是 Web 端仅通过 hover 面板导航，但用户期望点击也能跳转。

**修复**：移除平台判断，所有平台点击铃铛均跳转到 `/messages`。

```typescript
// 修复前
const handlePress = () => {
  if (Platform.OS !== 'web') {
    router.push('/messages');
  }
};

// 修复后
const handlePress = () => {
  setIsOpen(false);
  router.push('/messages');
};
```

### 13.3 消息页面缺少全局 Sidebar

**问题**：消息页面为全屏独立页面，左侧没有 Sidebar，与聊天页面布局不一致。

**根因**：`messages.tsx` 未引入 `Sidebar` 组件，直接以全宽渲染消息内容。

**修复**：
- 引入 `Sidebar` 和 `Conversation` 类型
- 采用与 `chat.tsx` 相同的 `flexDirection: 'row'` 两栏布局
- Sidebar 中点击会话或新建会话跳转回 `/chat`
- Header 的 `showMenuButton` 改为根据 `sidebarOpen` 状态动态控制

---

*文档版本：1.1*
*创建时间：2026-02-02*
*最后更新：2026-02-06*
*作者：Claude*
