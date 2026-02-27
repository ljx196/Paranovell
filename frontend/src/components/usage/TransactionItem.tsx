import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Wallet, Flame, Gift, Users, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import type { Transaction, TransactionType } from '../../types';

interface TransactionItemProps {
  transaction: Transaction;
}

const TX_CONFIG: Record<TransactionType, {
  Icon: typeof Wallet;
  label: string;
  colorKey: string;
}> = {
  recharge:    { Icon: Wallet,     label: '充值',     colorKey: 'income' },
  consumption: { Icon: Flame,      label: '对话消费', colorKey: 'expense' },
  gift:        { Icon: Gift,       label: '赠送',     colorKey: 'gift' },
  referral:    { Icon: Users,      label: '邀请奖励', colorKey: 'referral' },
  refund:      { Icon: RotateCcw,  label: '退款',     colorKey: 'refund' },
};

const ICON_BG_COLORS: Record<TransactionType, string> = {
  recharge:    'rgba(76, 175, 80, 0.12)',
  consumption: 'rgba(212, 131, 106, 0.12)',
  gift:        'rgba(156, 39, 176, 0.12)',
  referral:    'rgba(255, 152, 0, 0.12)',
  refund:      'rgba(33, 150, 243, 0.12)',
};

const ICON_COLORS: Record<TransactionType, string> = {
  recharge:    '#4CAF50',
  consumption: '#D4836A',
  gift:        '#9C27B0',
  referral:    '#FF9800',
  refund:      '#2196F3',
};

function formatAmount(amount: number): string {
  const prefix = amount > 0 ? '+' : '';
  return `${prefix}${amount.toLocaleString()} 点`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export default function TransactionItem({ transaction }: TransactionItemProps) {
  const { colors, spacing, borderRadius } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const config = TX_CONFIG[transaction.type] || TX_CONFIG.consumption;
  const iconBg = ICON_BG_COLORS[transaction.type] || ICON_BG_COLORS.consumption;
  const iconColor = ICON_COLORS[transaction.type] || ICON_COLORS.consumption;
  const amountColor = transaction.amount > 0 ? (colors as any).income : (colors as any).expense;

  return (
    <Pressable
      onPress={() => setExpanded(!expanded)}
      style={(state: any) => [
        styles.card,
        {
          backgroundColor: colors.bgSecondary,
          borderColor: colors.border,
          borderRadius: borderRadius.lg,
          padding: spacing.lg,
          marginBottom: spacing.sm,
          gap: spacing.md,
        },
        state.hovered && { backgroundColor: colors.bgTertiary },
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconBg, borderRadius: borderRadius.md }]}>
        <config.Icon size={18} color={iconColor} strokeWidth={1.8} />
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={[styles.typeLabel, { color: colors.textPrimary }]}>{config.label}</Text>
          <Text style={[styles.amount, { color: amountColor }]}>
            {formatAmount(transaction.amount)}
          </Text>
        </View>
        <View style={styles.bottomRow}>
          <Text style={[styles.description, { color: colors.textMuted }]} numberOfLines={expanded ? undefined : 1}>
            {transaction.description}
          </Text>
          <Text style={[styles.date, { color: colors.textMuted }]}>
            {formatDate(transaction.created_at)}
          </Text>
        </View>

        {/* Expanded detail */}
        {expanded && (
          <View style={[styles.detailSection, { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border }]}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textMuted }]}>交易ID</Text>
              <Text style={[styles.detailValue, { color: colors.textSecondary }]}>#{transaction.id}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textMuted }]}>时间</Text>
              <Text style={[styles.detailValue, { color: colors.textSecondary }]}>{formatDate(transaction.created_at)}</Text>
            </View>
            {transaction.description && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>描述</Text>
                <Text style={[styles.detailValue, { color: colors.textSecondary, flex: 1 }]}>{transaction.description}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Expand indicator */}
      {expanded ? (
        <ChevronUp size={14} color={colors.textMuted} strokeWidth={1.8} style={{ marginTop: 2 }} />
      ) : (
        <ChevronDown size={14} color={colors.textMuted} strokeWidth={1.8} style={{ marginTop: 2 }} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  amount: {
    fontSize: 15,
    fontWeight: '600',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  description: {
    fontSize: 13,
    flex: 1,
    marginRight: 8,
  },
  date: {
    fontSize: 12,
  },
  detailSection: {},
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 12,
    width: 60,
  },
  detailValue: {
    fontSize: 12,
  },
});
