import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import { ArrowRight, AlertTriangle } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import type { BalanceInfo } from '../../types';

interface BalanceCardProps {
  balance: BalanceInfo | null;
  isLoading: boolean;
  onRechargePress?: () => void;
}

function formatPoints(val: number): string {
  return Math.abs(val).toLocaleString();
}

function getBalanceColor(balance: number, colors: any): string {
  if (balance <= 500) return colors.balanceCritical;
  if (balance <= 1000) return colors.balanceLow;
  return colors.textPrimary;
}

export default function BalanceCard({ balance, isLoading, onRechargePress }: BalanceCardProps) {
  const { colors, spacing, borderRadius } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (balance && balance.balance <= 500) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.6, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ]),
        { iterations: 3 }
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [balance?.balance, pulseAnim]);

  if (!balance) return null;

  const isLowBalance = balance.balance <= 1000;

  return (
    <View style={[styles.card, { backgroundColor: colors.bgSecondary, borderColor: colors.border, borderRadius: borderRadius.lg, padding: spacing.xl, marginBottom: spacing.lg }]}>
      <View style={[styles.headerRow, { marginBottom: spacing.sm }]}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>账户余额</Text>
        {onRechargePress && (
          <Pressable
            onPress={onRechargePress}
            accessibilityLabel="去充值"
            style={(state: any) => [
              styles.rechargeLink,
              { borderRadius: borderRadius.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
              state.hovered && { backgroundColor: colors.bgTertiary },
            ]}
          >
            <Text style={{ color: colors.accent, fontSize: 13, fontWeight: '500' }}>去充值</Text>
            <ArrowRight size={14} color={colors.accent} strokeWidth={2} />
          </Pressable>
        )}
      </View>

      <Animated.View style={{ flexDirection: 'row', alignItems: 'baseline', opacity: balance.balance <= 500 ? pulseAnim : 1 }}>
        <Text style={[styles.balanceNumber, { color: getBalanceColor(balance.balance, colors) }]}>
          {formatPoints(balance.balance)}
        </Text>
        <Text style={[styles.balanceUnit, { color: colors.textSecondary }]}> 点</Text>
      </Animated.View>

      {/* Low balance warning */}
      {isLowBalance && (
        <View style={[styles.warningRow, { backgroundColor: colors.errorLight, borderRadius: borderRadius.md, padding: spacing.sm, marginTop: spacing.md }]}>
          <AlertTriangle size={14} color={colors.error} strokeWidth={2} />
          <Text style={{ color: colors.error, fontSize: 13, marginLeft: spacing.xs }}>
            {balance.balance <= 500 ? '余额严重不足，请及时充值' : '余额不足，建议充值'}
          </Text>
        </View>
      )}

      <View style={[styles.statsRow, { gap: spacing.md, marginTop: spacing.xl }]}>
        <View style={[styles.statItem, { backgroundColor: colors.bgTertiary, borderRadius: borderRadius.md, padding: spacing.md }]}>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>累计充值</Text>
          <Text style={[styles.statValue, { color: colors.textSecondary }]}>
            {formatPoints(balance.total_recharged)}
          </Text>
        </View>
        <View style={[styles.statItem, { backgroundColor: colors.bgTertiary, borderRadius: borderRadius.md, padding: spacing.md }]}>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>累计消费</Text>
          <Text style={[styles.statValue, { color: colors.textSecondary }]}>
            {formatPoints(balance.total_consumed)}
          </Text>
        </View>
        <View style={[styles.statItem, { backgroundColor: colors.bgTertiary, borderRadius: borderRadius.md, padding: spacing.md }]}>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>累计赠送</Text>
          <Text style={[styles.statValue, { color: colors.textSecondary }]}>
            {formatPoints(balance.total_gifted)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
  },
  rechargeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  balanceNumber: {
    fontSize: 36,
    fontWeight: '700',
  },
  balanceUnit: {
    fontSize: 16,
    fontWeight: '400',
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
});
