import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import type { UsageTab } from '../../store/useBalanceStore';

interface UsageSideTabsProps {
  activeTab: UsageTab;
  onTabChange: (tab: UsageTab) => void;
  layout: 'vertical' | 'horizontal';
}

const tabs: { key: UsageTab; label: string; icon: string }[] = [
  { key: 'overview', label: '用量概览', icon: '📊' },
  { key: 'transactions', label: '交易记录', icon: '📋' },
  { key: 'recharge', label: '充值', icon: '💳' },
];

export default function UsageSideTabs({ activeTab, onTabChange, layout }: UsageSideTabsProps) {
  const { colors } = useTheme();
  const isVertical = layout === 'vertical';

  return (
    <View
      style={[
        styles.container,
        isVertical ? styles.vertical : styles.horizontal,
        isVertical && { position: 'absolute' as const, right: '100%' as any, marginRight: 16, top: 16 },
      ]}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            activeOpacity={0.7}
            onPress={() => onTabChange(tab.key)}
            style={[
              styles.tab,
              {
                backgroundColor: isActive ? colors.bgTertiary : 'transparent',
                borderRadius: 8,
              },
            ]}
            accessibilityLabel={tab.label}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text
              style={[
                styles.tabLabel,
                {
                  color: isActive ? colors.textPrimary : colors.textSecondary,
                  fontWeight: isActive ? '500' : '400',
                },
              ]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  vertical: {
    flexDirection: 'column',
    width: 130,
  },
  horizontal: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  tabIcon: {
    fontSize: 14,
  },
  tabLabel: {
    fontSize: 14,
  },
});
