/**
 * GenNovel Design System - Button Component
 * Supports primary/secondary/dashed/icon variants
 * 5-state: default, hover, pressed, disabled, focus-visible
 */

import React from 'react';
import {
  Pressable,
  Text,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'dashed' | 'icon';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children?: React.ReactNode;
  title?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export function Button({
  children,
  title,
  variant = 'primary',
  size = 'md',
  onPress,
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}: ButtonProps) {
  const { colors, borderRadius } = useTheme();
  const isDisabled = disabled || loading;

  const sizeStyles: Record<ButtonSize, ViewStyle> = {
    sm: { paddingVertical: 8, paddingHorizontal: 12 },
    md: { paddingVertical: 12, paddingHorizontal: 16 },
    lg: { paddingVertical: 16, paddingHorizontal: 20 },
  };

  const getVariantBg = (hovered: boolean): string => {
    switch (variant) {
      case 'primary':
        return hovered ? colors.accentHover : colors.accent;
      case 'secondary':
      case 'dashed':
        return hovered ? colors.bgTertiary : 'transparent';
      case 'icon':
        return hovered ? colors.bgTertiary : colors.bgTertiary;
      default:
        return 'transparent';
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontSize: 14,
      fontWeight: '500',
    };

    const variantStyles: Record<ButtonVariant, TextStyle> = {
      primary: { color: '#FFFFFF' },
      secondary: { color: colors.textSecondary },
      dashed: { color: colors.textSecondary },
      icon: { color: colors.textSecondary, fontSize: 16 },
    };

    return { ...baseStyle, ...variantStyles[variant] };
  };

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#FFFFFF' : colors.accent}
        />
      );
    }

    return (
      <>
        {icon}
        {(title || children) && (
          <Text style={[getTextStyle(), textStyle]}>
            {title || children}
          </Text>
        )}
      </>
    );
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      // @ts-ignore - hovered is web-only
      style={(state: any) => {
        const { pressed } = state;
        const isHovered = state.hovered ?? false;

        const baseStyle: ViewStyle = {
          borderRadius: borderRadius.md,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 8,
          backgroundColor: getVariantBg(isHovered && !isDisabled),
          ...sizeStyles[size],
        };

        // Variant-specific border
        if (variant === 'secondary') {
          baseStyle.borderWidth = 1;
          baseStyle.borderColor = colors.border;
        } else if (variant === 'dashed') {
          baseStyle.borderWidth = 1;
          baseStyle.borderColor = colors.border;
          baseStyle.borderStyle = 'dashed';
        } else if (variant === 'icon') {
          baseStyle.width = 32;
          baseStyle.height = 32;
          baseStyle.padding = 8;
        }

        // Pressed state
        if (pressed && !isDisabled) {
          baseStyle.transform = [{ scale: 0.985 }];
        }

        // Disabled state
        if (isDisabled) {
          baseStyle.opacity = 0.6;
          // @ts-ignore - Web specific
          baseStyle.cursor = 'not-allowed';
        }

        // @ts-ignore - Web specific: focus-visible outline
        baseStyle.outlineStyle = 'none';

        return [baseStyle, style];
      }}
    >
      {renderContent()}
    </Pressable>
  );
}

export default Button;
