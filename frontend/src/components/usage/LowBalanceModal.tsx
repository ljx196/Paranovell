import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { useBalanceStore } from '../../store/useBalanceStore';

export default function LowBalanceModal() {
  const { colors } = useTheme();
  const { showLowBalanceModal, lowBalanceAmount, setShowLowBalanceModal } = useBalanceStore();

  const handleRecharge = () => {
    setShowLowBalanceModal(false);
    router.push('/usage?tab=recharge');
  };

  const handleDismiss = () => {
    setShowLowBalanceModal(false);
  };

  return (
    <Modal
      visible={showLowBalanceModal}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.bgSecondary }]}>
          {/* Close button */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={handleDismiss}
            accessibilityLabel="关闭"
          >
            <Text style={[styles.closeBtnText, { color: colors.textMuted }]}>✕</Text>
          </TouchableOpacity>

          {/* Icon */}
          <Text style={styles.warningIcon}>⚠️</Text>

          {/* Title */}
          <Text style={[styles.title, { color: colors.textPrimary }]}>余额不足</Text>

          {/* Description */}
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            您的账户余额已不足，为避免创作中断，建议尽快充值。
          </Text>

          {/* Balance */}
          <Text style={[styles.balanceText, { color: (colors as any).balanceCritical }]}>
            当前余额: {lowBalanceAmount.toLocaleString()} 点
          </Text>

          {/* Recharge button */}
          <TouchableOpacity
            style={[styles.rechargeBtn, { backgroundColor: colors.accent }]}
            onPress={handleRecharge}
            accessibilityLabel="去充值"
          >
            <Text style={styles.rechargeBtnText}>去充值</Text>
          </TouchableOpacity>

          {/* Dismiss */}
          <TouchableOpacity onPress={handleDismiss}>
            <Text style={[styles.dismissText, { color: colors.textMuted }]}>稍后再说</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modal: {
    borderRadius: 16,
    padding: 24,
    maxWidth: 360,
    width: '85%',
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
  },
  closeBtnText: {
    fontSize: 18,
  },
  warningIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  balanceText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
  },
  rechargeBtn: {
    width: '100%',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  rechargeBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dismissText: {
    fontSize: 14,
    paddingVertical: 4,
  },
});
