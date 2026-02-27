/**
 * GenNovel Design System - Input Component
 * Supports label, error, hint, rightIcon, and outlined/underline variants
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';
import { useTheme } from '../../theme';

export type InputVariant = 'outlined' | 'underline';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  hint?: string;
  variant?: InputVariant;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

export function Input({
  label,
  error,
  hint,
  variant = 'outlined',
  rightIcon,
  containerStyle,
  inputStyle,
  ...textInputProps
}: InputProps) {
  const { colors, borderRadius, typography } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const isUnderline = variant === 'underline';

  const inputContainerStyle: ViewStyle = isUnderline
    ? {
        backgroundColor: 'transparent',
        borderWidth: 0,
        borderBottomWidth: 1.5,
        borderBottomColor: error
          ? colors.error
          : isFocused
          ? colors.accent
          : colors.inputBorder,
        paddingHorizontal: 0,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
      }
    : {
        backgroundColor: colors.inputBg,
        borderWidth: 1,
        borderColor: error
          ? colors.error
          : isFocused
          ? colors.inputFocusBorder
          : colors.inputBorder,
        borderRadius: borderRadius.xl,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
      };

  const inputTextStyle: TextStyle = {
    flex: 1,
    fontSize: typography.body.fontSize,
    color: colors.textPrimary,
    lineHeight: typography.body.lineHeight,
    // @ts-ignore - Web specific: remove browser focus outline
    outlineStyle: 'none',
    paddingRight: rightIcon ? 32 : 0,
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {label}
        </Text>
      )}
      <View style={inputContainerStyle}>
        <TextInput
          accessibilityRole="text"
          style={[inputTextStyle, inputStyle]}
          placeholderTextColor={colors.textMuted}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...textInputProps}
        />
        {rightIcon && (
          <View style={styles.rightIconContainer}>
            {rightIcon}
          </View>
        )}
      </View>
      {error && (
        <Text accessibilityRole="alert" style={[styles.error, { color: colors.error }]}>{error}</Text>
      )}
      {hint && !error && (
        <Text style={[styles.hint, { color: colors.textMuted }]}>{hint}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  rightIconContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
  },
  hint: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default Input;
