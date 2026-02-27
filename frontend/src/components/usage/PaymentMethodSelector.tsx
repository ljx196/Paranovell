import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface PaymentMethodSelectorProps {
  methods: string[];
  selected: string;
  onSelect: (method: string) => void;
}

const METHOD_LABELS: Record<string, string> = {
  alipay: '支付宝',
  wechat: '微信支付',
};

export default function PaymentMethodSelector({ methods, selected, onSelect }: PaymentMethodSelectorProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>支付方式</Text>
      <View style={styles.row}>
        {methods.map((method) => {
          const isSelected = selected === method;
          return (
            <TouchableOpacity
              key={method}
              activeOpacity={0.7}
              onPress={() => onSelect(method)}
              style={[
                styles.option,
                {
                  backgroundColor: isSelected
                    ? `${colors.accent}0D`
                    : colors.bgSecondary,
                  borderColor: isSelected ? colors.accent : colors.border,
                  borderWidth: isSelected ? 2 : 1,
                },
              ]}
              accessibilityLabel={METHOD_LABELS[method] || method}
            >
              <View
                style={[
                  styles.radio,
                  {
                    borderColor: isSelected ? colors.accent : colors.border,
                  },
                ]}
              >
                {isSelected && (
                  <View style={[styles.radioInner, { backgroundColor: colors.accent }]} />
                )}
              </View>
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                {METHOD_LABELS[method] || method}
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    padding: 16,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  label: {
    fontSize: 15,
  },
});
