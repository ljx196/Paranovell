/**
 * GenNovel Design System - Card Component
 * 12px border-radius card container
 */

import React, { ReactNode } from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  noBorder?: boolean;
  noPadding?: boolean;
}

export function Card({
  children,
  style,
  noBorder = false,
  noPadding = false,
}: CardProps) {
  const { colors, borderRadius, spacing } = useTheme();

  const cardStyle: ViewStyle = {
    backgroundColor: colors.bgSecondary,
    borderRadius: borderRadius.lg,
    padding: noPadding ? 0 : spacing.lg,
    borderWidth: noBorder ? 0 : 1,
    borderColor: colors.border,
  };

  return <View style={[cardStyle, style]}>{children}</View>;
}

export default Card;
