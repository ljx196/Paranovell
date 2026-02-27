/**
 * GenNovel Design System - Sidebar Component
 * 260px width sidebar with conversations list
 */

import React from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Plus } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { Button } from '../ui/Button';
import { UserMenu } from '../layout/UserMenu';

export interface Conversation {
  id: number | string;
  title: string;
  time: string;
  active?: boolean;
}

interface SidebarProps {
  conversations: Conversation[];
  onNewChat?: () => void;
  onSelectConversation?: (id: number | string) => void;
  onCollapse?: () => void;
  onLogout?: () => void;
  userName?: string;
  userPlan?: string;
}

export function Sidebar({
  conversations,
  onNewChat,
  onSelectConversation,
  onCollapse,
  onLogout,
  userName = 'User',
  userPlan = 'Free',
}: SidebarProps) {
  const { colors, spacing, borderRadius, layout, typography } = useTheme();
  const router = useRouter();

  return (
    <View
      style={[
        styles.container,
        {
          width: layout.sidebarWidth,
          backgroundColor: colors.sidebarBg,
          borderRightColor: colors.border,
        },
      ]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { borderBottomColor: colors.border },
        ]}
      >
        <Pressable
          style={styles.logo}
          onPress={() => router.replace('/chat')}
          accessibilityLabel="GenNovel 首页"
        >
          <View
            style={[
              styles.logoIcon,
              { backgroundColor: colors.accent, borderRadius: borderRadius.md },
            ]}
          >
            <Text style={styles.logoText}>G</Text>
          </View>
          <Text style={[styles.logoTitle, { color: colors.textPrimary }]}>
            GenNovel
          </Text>
        </Pressable>
        <Pressable
          onPress={onCollapse}
          accessibilityLabel="折叠侧边栏"
          // @ts-ignore - hovered is web-only
          style={(state: any) => ({
            padding: spacing.xs,
            borderRadius: borderRadius.sm,
            backgroundColor: state.hovered ? colors.sidebarHover : 'transparent',
          })}
        >
          <ChevronLeft size={18} color={colors.textMuted} />
        </Pressable>
      </View>

      {/* New Chat Button */}
      <View style={{ padding: spacing.md }}>
        <Button
          variant="dashed"
          onPress={onNewChat}
          style={{ width: '100%' }}
          icon={<Plus size={16} color={colors.textSecondary} />}
        >
          新建会话
        </Button>
      </View>

      {/* Conversations List */}
      <ScrollView style={styles.conversations}>
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.textMuted, fontSize: typography.small.fontSize },
          ]}
        >
          最近会话
        </Text>
        {conversations.map((conv) => (
          <Pressable
            key={conv.id}
            // @ts-ignore - hovered is web-only
            style={(state: any) => ({
              padding: spacing.md,
              marginBottom: spacing.xs,
              borderRadius: borderRadius.md,
              backgroundColor: conv.active
                ? colors.sidebarHover
                : state.hovered
                ? colors.sidebarHover
                : 'transparent',
              borderLeftWidth: conv.active ? 3 : 0,
              borderLeftColor: conv.active ? colors.accent : 'transparent',
            })}
            onPress={() => onSelectConversation?.(conv.id)}
          >
            <Text
              style={{
                fontSize: typography.body.fontSize,
                color: conv.active ? colors.textPrimary : colors.textSecondary,
                fontWeight: conv.active ? '500' : '400',
              }}
              numberOfLines={1}
            >
              {conv.title}
            </Text>
            <Text style={{ fontSize: typography.small.fontSize, color: colors.textMuted, marginTop: spacing.xs }}>
              {conv.time}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Footer - User Menu */}
      <View
        style={[
          styles.footer,
          {
            borderTopColor: colors.border,
            backgroundColor: colors.sidebarHover,
            // @ts-ignore - web shadow
            boxShadow: '0 -1px 4px rgba(0,0,0,0.06)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -1 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          },
        ]}
      >
        <UserMenu
          userName={userName}
          userPlan={userPlan}
          onLogout={onLogout}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: '100%',
    borderRightWidth: 1,
    flexDirection: 'column',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  logoTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  conversations: {
    flex: 1,
    paddingHorizontal: 12,
  },
  sectionTitle: {
    fontWeight: '500',
    marginVertical: 8,
    paddingLeft: 4,
  },
  footer: {
    borderTopWidth: 1,
  },
});

export default Sidebar;
