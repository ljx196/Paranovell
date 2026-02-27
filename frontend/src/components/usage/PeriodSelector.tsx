import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface PeriodSelectorProps {
  value: number;
  onChange: (days: number) => void;
}

const OPTIONS = [
  { label: '7日', value: 7 },
  { label: '30日', value: 30 },
  { label: '90日', value: 90 },
  { label: '180日', value: 180 },
];

export default function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  const { colors, spacing, borderRadius } = useTheme();

  return (
    <View
      style={[styles.container, { backgroundColor: colors.bgTertiary, borderRadius: borderRadius.md }]}
      accessibilityRole="tablist"
      accessibilityLabel="选择时间周期"
    >
      {OPTIONS.map((option) => {
        const isActive = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            onPress={() => onChange(option.value)}
            style={(state: any) => [
              styles.option,
              { borderRadius: borderRadius.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
              isActive && { backgroundColor: colors.bgSecondary },
              !isActive && state.hovered && { backgroundColor: colors.bgSecondary, opacity: 0.6 },
            ]}
          >
            <Text
              style={[
                styles.label,
                {
                  color: isActive ? colors.textPrimary : colors.textMuted,
                  fontWeight: isActive ? '600' : '400',
                },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 2,
    gap: 2,
  },
  option: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
  },
});
