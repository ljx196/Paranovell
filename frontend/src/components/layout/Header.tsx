/**
 * GenNovel Design System - Header Component
 * Top bar with title, notification bell, and theme toggle
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Menu, Sun, Moon } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { NotificationDropdown } from '../message/NotificationDropdown';

interface HeaderProps {
  title?: string;
  showMenuButton?: boolean;
  onMenuPress?: () => void;
  showThemeToggle?: boolean;
  showNotifications?: boolean;
  rightContent?: React.ReactNode;
}

export function Header({
  title,
  showMenuButton = false,
  onMenuPress,
  showThemeToggle = true,
  showNotifications = true,
  rightContent,
}: HeaderProps) {
  const { colors, toggleTheme, isDark, borderRadius, layout, spacing } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.bgSecondary,
          borderBottomColor: colors.border,
          height: layout.headerHeight,
        },
      ]}
    >
      <View style={styles.left}>
        {showMenuButton && (
          <Pressable
            onPress={onMenuPress}
            accessibilityLabel="打开菜单"
            // @ts-ignore - hovered is web-only
            style={(state: any) => ({
              padding: spacing.sm,
              borderRadius: borderRadius.md,
              backgroundColor: state.hovered ? colors.bgTertiary : 'transparent',
            })}
          >
            <Menu size={20} color={colors.textSecondary} />
          </Pressable>
        )}
        {title && (
          <Text
            style={[styles.title, { color: colors.textPrimary }]}
            accessibilityRole="header"
          >
            {title}
          </Text>
        )}
      </View>

      <View style={styles.right}>
        {showNotifications && <NotificationDropdown />}
        {showThemeToggle && (
          <Pressable
            onPress={toggleTheme}
            accessibilityLabel={isDark ? '切换到浅色模式' : '切换到深色模式'}
            // @ts-ignore - hovered is web-only
            style={(state: any) => ({
              padding: spacing.sm,
              borderRadius: borderRadius.md,
              backgroundColor: state.hovered ? colors.bgTertiary : colors.bgTertiary,
            })}
          >
            {isDark ? (
              <Sun size={16} color={colors.textSecondary} />
            ) : (
              <Moon size={16} color={colors.textSecondary} />
            )}
          </Pressable>
        )}
        {rightContent}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    zIndex: 100,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    zIndex: 100,
  },
});

export default Header;
