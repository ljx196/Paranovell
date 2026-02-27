/**
 * GenNovel Design System - UnreadBadge Component
 * Displays unread count indicator
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';

interface UnreadBadgeProps {
  count: number;
  maxCount?: number;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export function UnreadBadge({
  count,
  maxCount = 99,
  size = 'md',
  style,
}: UnreadBadgeProps) {
  const { colors, borderRadius } = useTheme();

  if (count <= 0) return null;

  const displayCount = count > maxCount ? `${maxCount}+` : String(count);
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.accent,
          borderRadius: borderRadius.sm,
          minWidth: isSmall ? 16 : 20,
          height: isSmall ? 16 : 20,
          paddingHorizontal: isSmall ? 4 : 6,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            fontSize: isSmall ? 10 : 12,
          },
        ]}
      >
        {displayCount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default UnreadBadge;
