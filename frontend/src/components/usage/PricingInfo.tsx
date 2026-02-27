import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import type { PricingInfo as PricingInfoType } from '../../types';

interface PricingInfoProps {
  pricing: PricingInfoType | null;
}

export default function PricingInfo({ pricing }: PricingInfoProps) {
  const { colors } = useTheme();

  if (!pricing || pricing.models.length === 0) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.bgTertiary }]}>
      <Text style={[styles.title, { color: colors.textMuted }]}>模型费率</Text>
      {pricing.models.map((model) => (
        <View key={model.name} style={styles.row}>
          <Text style={[styles.modelName, { color: colors.textSecondary }]}>{model.display_name}</Text>
          <Text style={[styles.price, { color: colors.textMuted }]}>
            {model.input_price}点/{model.unit} 输入
          </Text>
          <Text style={[styles.price, { color: colors.textMuted }]}>
            {model.output_price}点/{model.unit} 输出
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    padding: 12,
    marginTop: 4,
  },
  title: {
    fontSize: 12,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 4,
  },
  modelName: {
    fontSize: 13,
    width: 70,
  },
  price: {
    fontSize: 13,
  },
});
