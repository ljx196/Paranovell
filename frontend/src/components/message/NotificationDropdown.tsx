/**
 * GenNovel Message System - NotificationDropdown Component
 * Hover to preview recent notifications, click to navigate to messages page
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { Bell } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { useMessageStore } from '../../store/useMessageStore';
import { UnreadBadge } from '../ui/UnreadBadge';
import { formatRelativeTime } from '../../utils/timeFormat';
import { useRouter } from 'expo-router';

interface NotificationDropdownProps {
  maxItems?: number;
}

export function NotificationDropdown({ maxItems = 5 }: NotificationDropdownProps) {
  const { colors, borderRadius, spacing } = useTheme();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { messages, unreadCount, fetchMessages, fetchUnreadCount, markAllAsRead } =
    useMessageStore();

  const recentMessages = messages.slice(0, maxItems);

  const handleMouseEnter = () => {
    if (Platform.OS === 'web') {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setIsOpen(true);
      setIsLoading(true);
      Promise.all([fetchMessages(), fetchUnreadCount()]).finally(() => {
        setIsLoading(false);
      });
    }
  };

  const handleMouseLeave = () => {
    if (Platform.OS === 'web') {
      timeoutRef.current = setTimeout(() => {
        setIsOpen(false);
      }, 150);
    }
  };

  // Click always navigates, never toggles dropdown
  const handlePress = () => {
    setIsOpen(false);
    router.push('/messages');
  };

  const handleMessagePress = (messageId: number) => {
    setIsOpen(false);
    router.push(`/messages?id=${messageId}`);
  };

  const handleViewAll = () => {
    setIsOpen(false);
    router.push('/messages');
  };

  const renderSkeleton = () => (
    <View style={styles.messagesList}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={[styles.messageItem, { opacity: 0.5 }]}>
          <View style={styles.messageContent}>
            <View style={{ height: 14, width: '60%', backgroundColor: colors.bgTertiary, borderRadius: 4, marginBottom: 6 }} />
            <View style={{ height: 12, width: '80%', backgroundColor: colors.bgTertiary, borderRadius: 4 }} />
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <View
      style={styles.container}
      // @ts-ignore - Web specific props
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Bell Icon Button */}
      <Pressable
        accessibilityLabel="消息通知"
        onPress={handlePress}
        // @ts-ignore - hovered is web-only
        style={(state: any) => ({
          width: 36,
          height: 36,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative' as const,
          backgroundColor: state.hovered ? colors.bgTertiary : colors.bgTertiary,
          borderRadius: borderRadius.md,
        })}
      >
        <Bell size={16} color={colors.textSecondary} />
        {unreadCount > 0 && (
          <UnreadBadge count={unreadCount} size="sm" style={styles.badge} />
        )}
      </Pressable>

      {/* Hover Dropdown Panel (Web only) */}
      {Platform.OS === 'web' && isOpen && (
        <View
          style={[
            styles.dropdown,
            {
              backgroundColor: colors.bgSecondary,
              borderRadius: borderRadius.lg,
              borderColor: colors.border,
              maxWidth: '90vw' as any,
            },
          ]}
          // @ts-ignore
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Header */}
          <View style={[styles.dropdownHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.dropdownTitle, { color: colors.textPrimary }]}>
              消息通知
            </Text>
            {unreadCount > 0 && (
              <Pressable
                onPress={() => markAllAsRead()}
                // @ts-ignore
                style={(state: any) => ({
                  paddingVertical: 2,
                  paddingHorizontal: 6,
                  borderRadius: borderRadius.sm,
                  backgroundColor: state.hovered ? colors.bgTertiary : 'transparent',
                })}
              >
                <Text style={[styles.markAllRead, { color: colors.accent }]}>
                  全部已读
                </Text>
              </Pressable>
            )}
          </View>

          {/* Messages List */}
          {isLoading && recentMessages.length === 0 ? (
            renderSkeleton()
          ) : (
            <View style={styles.messagesList}>
              {recentMessages.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                    暂无消息
                  </Text>
                </View>
              ) : (
                recentMessages.map((msg) => (
                  <Pressable
                    key={msg.id}
                    // @ts-ignore - hovered is Web-specific
                    style={(state: any) => [
                      styles.messageItem,
                      {
                        backgroundColor: state.hovered
                          ? colors.bgTertiary
                          : !msg.is_read
                          ? colors.successLight
                          : 'transparent',
                        borderLeftWidth: msg.is_read ? 0 : 3,
                        borderLeftColor: msg.is_read ? 'transparent' : colors.accent,
                      },
                    ]}
                    onPress={() => handleMessagePress(msg.id)}
                  >
                    <View style={styles.messageContent}>
                      <Text
                        style={[
                          styles.messageTitle,
                          {
                            color: msg.is_read
                              ? colors.textSecondary
                              : colors.textPrimary,
                            fontWeight: msg.is_read ? '400' : '500',
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {msg.title}
                      </Text>
                      <Text
                        style={[styles.messagePreview, { color: colors.textMuted }]}
                        numberOfLines={1}
                      >
                        {msg.content}
                      </Text>
                    </View>
                    <Text style={[styles.messageTime, { color: colors.textMuted }]}>
                      {formatRelativeTime(msg.created_at)}
                    </Text>
                  </Pressable>
                ))
              )}
            </View>
          )}

          {/* Footer */}
          <Pressable
            // @ts-ignore
            style={(state: any) => [
              styles.dropdownFooter,
              {
                borderTopColor: colors.border,
                backgroundColor: state.hovered ? colors.bgTertiary : 'transparent',
              },
            ]}
            onPress={handleViewAll}
          >
            <Text style={[styles.viewAllText, { color: colors.accent }]}>
              查看全部消息
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 8,
    width: 320,
    borderWidth: 1,
    // @ts-ignore - Web shadow
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
  },
  dropdownTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  markAllRead: {
    fontSize: 13,
    fontWeight: '500',
  },
  messagesList: {
    maxHeight: 300,
    overflow: 'hidden' as any,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
  messageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  messageContent: {
    flex: 1,
    gap: 4,
  },
  messageTitle: {
    fontSize: 14,
  },
  messagePreview: {
    fontSize: 12,
  },
  messageTime: {
    fontSize: 11,
  },
  dropdownFooter: {
    padding: 12,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '500',
  },
});

export default NotificationDropdown;
