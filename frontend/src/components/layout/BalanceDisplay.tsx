import React, { useEffect } from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { useBalanceStore } from '../../store/useBalanceStore';

export default function BalanceDisplay() {
  const { colors } = useTheme();
  const { balance, fetchBalance } = useBalanceStore();

  useEffect(() => {
    if (!balance) {
      fetchBalance();
    }
  }, []);

  if (!balance) return null;

  const balanceColor =
    balance.balance <= 500
      ? (colors as any).balanceCritical
      : balance.balance <= 1000
        ? (colors as any).balanceLow
        : colors.textSecondary;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => router.push('/usage')}
      accessibilityLabel={`余额 ${balance.balance} 点`}
    >
      <Text style={[styles.text, { color: balanceColor }]}>
        {balance.balance.toLocaleString()} 点
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
  },
});
