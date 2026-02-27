/**
 * GenNovel Message System - UserMenu Component
 * Click to open popup menu from user avatar area in sidebar
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { MoreHorizontal, Bell, Settings, LogOut } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { Avatar } from '../ui/Avatar';
import { useRouter } from 'expo-router';
import { useMessageStore } from '../../store/useMessageStore';

interface MenuItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  danger?: boolean;
}

interface UserMenuProps {
  userName?: string;
  userPlan?: string;
  onLogout?: () => void;
}

const USER_MENU_ID = 'user-menu-container';

export function UserMenu({
  userName = 'User',
  userPlan = 'Free',
  onLogout,
}: UserMenuProps) {
  const { colors, borderRadius, spacing } = useTheme();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { unreadCount } = useMessageStore();

  // Click outside to close (web only)
  useEffect(() => {
    if (Platform.OS !== 'web' || !isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const container = document.getElementById(USER_MENU_ID);
      if (container && !container.contains(e.target as Node)) {
        setIsOpen(false);
        setShowLogoutConfirm(false);
      }
    };

    // Use setTimeout to avoid catching the opening click itself
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const menuItems: MenuItem[] = [
    {
      key: 'messages',
      label: '消息中心',
      icon: <Bell size={16} color={colors.textSecondary} />,
      onPress: () => {
        setIsOpen(false);
        router.replace('/messages');
      },
    },
    {
      key: 'settings',
      label: '设置',
      icon: <Settings size={16} color={colors.textSecondary} />,
      onPress: () => {
        setIsOpen(false);
        router.replace('/settings');
      },
    },
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogOut size={16} color={colors.error} />,
      danger: true,
      onPress: () => {
        setShowLogoutConfirm(true);
      },
    },
  ];

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    setIsOpen(false);
    onLogout?.();
  };

  const handlePress = () => {
    setIsOpen(!isOpen);
    setShowLogoutConfirm(false);
  };

  return (
    <View
      nativeID={USER_MENU_ID}
      style={styles.container}
    >
      {/* User Info Trigger */}
      <Pressable
        // @ts-ignore - hovered is web-only
        style={(state: any) => [
          styles.userInfo,
          {
            backgroundColor: isOpen || state.hovered ? colors.sidebarBg : 'transparent',
          },
        ]}
        onPress={handlePress}
      >
        <Avatar name={userName} size="md" />
        <View style={styles.userDetails}>
          <Text style={[styles.userName, { color: colors.textPrimary }]}>
            {userName}
          </Text>
          <Text style={[styles.userPlan, { color: colors.textMuted }]}>
            {userPlan}
          </Text>
        </View>
        <MoreHorizontal size={16} color={colors.textMuted} />
      </Pressable>

      {/* Popup Menu */}
      {isOpen && (
        <View
          style={[
            styles.menu,
            {
              backgroundColor: colors.bgSecondary,
              borderRadius: borderRadius.lg,
              borderColor: colors.border,
            },
          ]}
        >
          {showLogoutConfirm ? (
            /* Logout confirmation */
            <View style={{ padding: spacing.md }}>
              <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '500', marginBottom: spacing.sm }}>
                确定退出登录？
              </Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <Pressable
                  onPress={() => setShowLogoutConfirm(false)}
                  // @ts-ignore
                  style={(state: any) => ({
                    flex: 1,
                    paddingVertical: spacing.sm,
                    borderRadius: borderRadius.md,
                    alignItems: 'center',
                    backgroundColor: state.hovered ? colors.bgTertiary : 'transparent',
                    borderWidth: 1,
                    borderColor: colors.border,
                  })}
                >
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>取消</Text>
                </Pressable>
                <Pressable
                  onPress={handleConfirmLogout}
                  // @ts-ignore
                  style={(state: any) => ({
                    flex: 1,
                    paddingVertical: spacing.sm,
                    borderRadius: borderRadius.md,
                    alignItems: 'center',
                    backgroundColor: state.hovered ? colors.error : colors.error,
                    opacity: state.hovered ? 0.9 : 1,
                  })}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '500' }}>退出</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            /* Menu items */
            menuItems.map((item, index) => (
              <Pressable
                key={item.key}
                accessibilityRole="menuitem"
                // @ts-ignore - hovered is Web-specific
                style={(state: any) => [
                  styles.menuItem,
                  {
                    backgroundColor: state.hovered ? colors.bgTertiary : 'transparent',
                    borderTopWidth: index === menuItems.length - 1 ? 1 : 0,
                    borderTopColor: colors.border,
                  },
                ]}
                onPress={item.onPress}
              >
                {item.icon}
                <Text
                  style={[
                    styles.menuLabel,
                    { color: item.danger ? colors.error : colors.textSecondary },
                  ]}
                >
                  {item.label}
                </Text>
                {item.key === 'messages' && unreadCount > 0 && (
                  <View
                    style={[
                      styles.menuBadge,
                      {
                        backgroundColor: colors.accent,
                        borderRadius: borderRadius.sm,
                      },
                    ]}
                  >
                    <Text style={styles.menuBadgeText}>{unreadCount}</Text>
                  </View>
                )}
              </Pressable>
            ))
          )}
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
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '500',
  },
  userPlan: {
    fontSize: 12,
  },
  menu: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    marginBottom: 8,
    borderWidth: 1,
    overflow: 'hidden',
    // @ts-ignore - Web shadow
    boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 14,
  },
  menuBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  menuBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
});

export default UserMenu;
