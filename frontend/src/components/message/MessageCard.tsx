/**
 * GenNovel Message System - MessageCard Component
 * Displays a single message item in the list
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { User, Megaphone, BarChart3 } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { SystemMessage, MessageType } from '../../services/api';
import { formatRelativeTime } from '../../utils/timeFormat';

interface MessageCardProps {
  message: SystemMessage;
  onPress?: () => void;
}

const MESSAGE_TYPE_ICONS: Record<MessageType, typeof User> = {
  account: User,
  notice: Megaphone,
  usage: BarChart3,
};

const MESSAGE_TYPE_LABELS: Record<MessageType, string> = {
  account: '账户',
  notice: '通知',
  usage: '用量',
};

export function MessageCard({ message, onPress }: MessageCardProps) {
  const { colors, spacing, borderRadius } = useTheme();
  const Icon = MESSAGE_TYPE_ICONS[message.msg_type];

  return (
    <Pressable
      style={(state: any) => [
        styles.container,
        {
          backgroundColor: message.is_read ? colors.bgSecondary : colors.bgTertiary,
          borderRadius: borderRadius.lg,
          borderLeftWidth: message.is_read ? 0 : 3,
          borderLeftColor: colors.accent,
          padding: spacing.lg,
          marginBottom: spacing.sm,
          gap: spacing.md,
        },
        state.hovered && {
          backgroundColor: colors.bgTertiary,
        },
      ]}
      onPress={onPress}
    >
      {/* Icon */}
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: colors.bgTertiary,
            borderRadius: borderRadius.md,
          },
        ]}
      >
        <Icon size={20} color={colors.textSecondary} strokeWidth={1.8} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text
            style={[
              styles.title,
              {
                color: message.is_read ? colors.textSecondary : colors.textPrimary,
                fontWeight: message.is_read ? '400' : '500',
              },
            ]}
            numberOfLines={1}
          >
            {message.title}
          </Text>
          <View
            style={[
              styles.typeTag,
              {
                backgroundColor: colors.bgPrimary,
                borderRadius: borderRadius.sm,
              },
            ]}
          >
            <Text style={[styles.typeText, { color: colors.textMuted }]}>
              {MESSAGE_TYPE_LABELS[message.msg_type]}
            </Text>
          </View>
        </View>
        <Text
          style={[styles.preview, { color: colors.textMuted }]}
          numberOfLines={2}
        >
          {message.content}
        </Text>
        <Text style={[styles.time, { color: colors.textMuted }]}>
          {formatRelativeTime(message.created_at)}
        </Text>
      </View>

      {/* Unread indicator dot */}
      {!message.is_read && (
        <View style={[styles.unreadDot, { backgroundColor: colors.accent }]} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
    flex: 1,
  },
  typeTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  typeText: {
    fontSize: 11,
  },
  preview: {
    fontSize: 13,
    lineHeight: 18,
  },
  time: {
    fontSize: 12,
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
});

export default MessageCard;
