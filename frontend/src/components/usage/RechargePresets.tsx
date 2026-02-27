import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import type { RechargePreset } from '../../types';

interface RechargePresetsProps {
  presets: RechargePreset[];
  selectedPreset: RechargePreset | null;
  onSelect: (preset: RechargePreset | null) => void;
}

function formatPoints(val: number): string {
  return val.toLocaleString();
}

export default function RechargePresets({ presets, selectedPreset, onSelect }: RechargePresetsProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>选择充值金额</Text>
      <View style={styles.grid}>
        {presets.map((preset) => {
          const isSelected = selectedPreset?.amount_yuan === preset.amount_yuan;
          return (
            <TouchableOpacity
              key={preset.amount_yuan}
              activeOpacity={0.7}
              onPress={() => onSelect(isSelected ? null : preset)}
              style={[
                styles.presetCard,
                {
                  backgroundColor: isSelected
                    ? `${colors.accent}0D` // 5% opacity
                    : colors.bgSecondary,
                  borderColor: isSelected ? colors.accent : colors.border,
                  borderWidth: isSelected ? 2 : 1,
                },
              ]}
              accessibilityLabel={`${preset.amount_yuan}元 ${formatPoints(preset.points)}点`}
            >
              <Text
                style={[
                  styles.amountText,
                  { color: isSelected ? colors.accent : colors.textPrimary },
                ]}
              >
                {preset.amount_yuan} 元
              </Text>
              <Text
                style={[
                  styles.pointsText,
                  { color: isSelected ? colors.accent : colors.textSecondary },
                ]}
              >
                {formatPoints(preset.points)} 点
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  presetCard: {
    flexBasis: '47%',
    flexGrow: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  amountText: {
    fontSize: 18,
    fontWeight: '600',
  },
  pointsText: {
    fontSize: 13,
    marginTop: 4,
  },
});
