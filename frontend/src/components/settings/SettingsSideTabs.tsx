import React, { useRef, useCallback } from 'react';
import { View, Pressable, Text, StyleSheet, Platform } from 'react-native';
import { User, BarChart3, Receipt, CreditCard } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';

export type SettingsTab = 'profile' | 'overview' | 'transactions' | 'recharge';

interface SettingsSideTabsProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
  layout: 'vertical' | 'horizontal';
}

const tabs: { key: SettingsTab; label: string; Icon: typeof User }[] = [
  { key: 'profile', label: '个人资料', Icon: User },
  { key: 'overview', label: '用量概览', Icon: BarChart3 },
  { key: 'transactions', label: '交易记录', Icon: Receipt },
  { key: 'recharge', label: '充值', Icon: CreditCard },
];

export default function SettingsSideTabs({ activeTab, onTabChange, layout }: SettingsSideTabsProps) {
  const { colors, spacing } = useTheme();
  const isVertical = layout === 'vertical';
  const containerRef = useRef<View>(null);

  const handleKeyDown = useCallback(
    (e: any) => {
      if (Platform.OS !== 'web') return;
      const currentIndex = tabs.findIndex((t) => t.key === activeTab);
      let nextIndex = currentIndex;

      if (isVertical) {
        if (e.key === 'ArrowDown') nextIndex = (currentIndex + 1) % tabs.length;
        else if (e.key === 'ArrowUp') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        else return;
      } else {
        if (e.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length;
        else if (e.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        else return;
      }

      e.preventDefault();
      onTabChange(tabs[nextIndex].key);
    },
    [activeTab, isVertical, onTabChange]
  );

  return (
    <View
      ref={containerRef}
      style={[
        styles.container,
        { gap: spacing.xs },
        isVertical ? styles.vertical : [styles.horizontal, { marginBottom: spacing.md }],
      ]}
      accessibilityRole="tablist"
      // @ts-ignore - Web only
      onKeyDown={Platform.OS === 'web' ? handleKeyDown : undefined}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onTabChange(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={tab.label}
            style={(state: any) => [
              styles.tab,
              { borderRadius: 8, paddingHorizontal: spacing.md, paddingVertical: 10 },
              isActive && { backgroundColor: colors.bgTertiary },
              !isActive && state.hovered && { backgroundColor: colors.bgTertiary },
              isVertical && isActive && {
                borderLeftWidth: 3,
                borderLeftColor: colors.accent,
                paddingLeft: spacing.md - 3,
              },
            ]}
          >
            <tab.Icon
              size={16}
              color={isActive ? colors.textPrimary : colors.textSecondary}
              strokeWidth={isActive ? 2.2 : 1.8}
            />
            <Text
              style={[
                styles.tabLabel,
                {
                  color: isActive ? colors.textPrimary : colors.textSecondary,
                  fontWeight: isActive ? '600' : '400',
                },
              ]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  vertical: {
    flexDirection: 'column',
    width: 130,
    flexShrink: 0,
  },
  horizontal: {
    flexDirection: 'row',
    width: '100%',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabLabel: {
    fontSize: 14,
  },
});
