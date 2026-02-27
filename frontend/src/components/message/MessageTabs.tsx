/**
 * GenNovel Message System - MessageTabs Component
 * Tab filter for message types
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../theme';
import { MessageType } from '../../services/api';

type TabType = 'all' | MessageType;

interface Tab {
  key: TabType;
  label: string;
  icon?: string;
}

const TABS: Tab[] = [
  { key: 'all', label: '全部' },
  { key: 'account', label: '账户', icon: '👤' },
  { key: 'notice', label: '通知', icon: '📢' },
  { key: 'usage', label: '用量', icon: '📊' },
];

interface MessageTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function MessageTabs({ activeTab, onTabChange }: MessageTabsProps) {
  const { colors, spacing, borderRadius } = useTheme();

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                {
                  backgroundColor: isActive ? colors.bgTertiary : 'transparent',
                  borderRadius: borderRadius.md,
                },
              ]}
              onPress={() => onTabChange(tab.key)}
              activeOpacity={0.7}
            >
              {tab.icon && <Text style={styles.tabIcon}>{tab.icon}</Text>}
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isActive ? colors.textPrimary : colors.textSecondary,
                    fontWeight: isActive ? '500' : '400',
                  },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  scrollContent: {
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  tabIcon: {
    fontSize: 14,
  },
  tabLabel: {
    fontSize: 14,
  },
});

export default MessageTabs;
