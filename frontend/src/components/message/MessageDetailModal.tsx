/**
 * GenNovel Message System - MessageDetailModal Component
 * Modal for viewing full message content
 */

import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useTheme } from '../../theme';
import { SystemMessage, MessageType } from '../../services/api';
import { formatDateTime } from '../../utils/timeFormat';

interface MessageDetailModalProps {
  visible: boolean;
  message: SystemMessage | null;
  onClose: () => void;
}

const MESSAGE_TYPE_ICONS: Record<MessageType, string> = {
  account: '👤',
  notice: '📢',
  usage: '📊',
};

const MESSAGE_TYPE_LABELS: Record<MessageType, string> = {
  account: '账户消息',
  notice: '系统通知',
  usage: '用量通知',
};

export function MessageDetailModal({
  visible,
  message,
  onClose,
}: MessageDetailModalProps) {
  const { colors, spacing, borderRadius } = useTheme();

  if (!message) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[
            styles.modal,
            {
              backgroundColor: colors.bgSecondary,
              borderRadius: borderRadius.lg,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: colors.bgTertiary,
                    borderRadius: borderRadius.md,
                  },
                ]}
              >
                <Text style={styles.icon}>
                  {MESSAGE_TYPE_ICONS[message.msg_type]}
                </Text>
              </View>
              <View>
                <Text style={[styles.typeLabel, { color: colors.textMuted }]}>
                  {MESSAGE_TYPE_LABELS[message.msg_type]}
                </Text>
                <Text style={[styles.time, { color: colors.textMuted }]}>
                  {formatDateTime(message.created_at)}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeButton,
                {
                  backgroundColor: colors.bgTertiary,
                  borderRadius: borderRadius.md,
                },
              ]}
            >
              <Text style={[styles.closeIcon, { color: colors.textSecondary }]}>
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {message.title}
          </Text>

          {/* Content */}
          <ScrollView style={styles.contentScroll}>
            <Text style={[styles.content, { color: colors.textSecondary }]}>
              {message.content}
            </Text>
          </ScrollView>

          {/* Footer */}
          {message.read_at && (
            <View style={[styles.footer, { borderTopColor: colors.border }]}>
              <Text style={[styles.readInfo, { color: colors.textMuted }]}>
                已读于 {formatDateTime(message.read_at)}
              </Text>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
  },
  typeLabel: {
    fontSize: 12,
  },
  time: {
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    padding: 16,
    paddingBottom: 8,
  },
  contentScroll: {
    maxHeight: 300,
    paddingHorizontal: 16,
  },
  content: {
    fontSize: 15,
    lineHeight: 24,
    paddingBottom: 16,
  },
  footer: {
    padding: 12,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  readInfo: {
    fontSize: 12,
  },
});

export default MessageDetailModal;
