import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface CustomAmountProps {
  value: string;
  exchangeRate: number;
  minAmount: number;
  onChange: (value: string) => void;
  onFocus: () => void;
}

export default function CustomAmount({ value, exchangeRate, minAmount, onChange, onFocus }: CustomAmountProps) {
  const { colors } = useTheme();

  const numValue = parseFloat(value);
  const isValid = !isNaN(numValue) && numValue >= minAmount;
  const points = isValid ? Math.floor(numValue * exchangeRate) : 0;
  const showError = value.length > 0 && !isValid;

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>自定义金额</Text>
      <View style={styles.inputRow}>
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: colors.inputBg,
              borderColor: showError ? (colors as any).balanceCritical : colors.inputBorder,
            },
          ]}
        >
          <Text style={[styles.prefix, { color: colors.textMuted }]}>¥</Text>
          <TextInput
            style={[styles.input, { color: colors.textPrimary }]}
            value={value}
            onChangeText={onChange}
            onFocus={onFocus}
            keyboardType="numeric"
            placeholder="输入金额"
            placeholderTextColor={colors.textMuted}
          />
        </View>
        {value.length > 0 && isValid && (
          <Text style={[styles.pointsDisplay, { color: colors.textSecondary }]}>
            = {points.toLocaleString()} 点
          </Text>
        )}
      </View>
      {showError ? (
        <Text style={[styles.hint, { color: (colors as any).balanceCritical }]}>
          {numValue < minAmount ? `最低充值 ${minAmount} 元` : '请输入有效金额'}
        </Text>
      ) : (
        <Text style={[styles.hint, { color: colors.textMuted }]}>最低充值 {minAmount} 元</Text>
      )}
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  prefix: {
    fontSize: 16,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  pointsDisplay: {
    fontSize: 14,
    fontWeight: '500',
    minWidth: 90,
  },
  hint: {
    marginTop: 8,
    fontSize: 12,
  },
});
