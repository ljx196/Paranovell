/**
 * GenNovel - Usage & Balance Page
 * Account balance, usage trends, transactions, and recharge
 */

import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Linking,
  Alert,
  StyleSheet,
} from 'react-native';
import { router, useLocalSearchParams, Redirect } from 'expo-router';
import { ClipboardList, RefreshCw } from 'lucide-react-native';
import { useTheme } from '../src/theme';
import { useResponsive } from '../src/hooks/useResponsive';
import { useAuthStore } from '../src/store/useAuthStore';
import { useBalanceStore, type UsageTab } from '../src/store/useBalanceStore';
import { Header } from '../src/components/layout';
import { Sidebar, Conversation } from '../src/components/chat';
import {
  UsageSideTabs,
  UsageSkeleton,
  BalanceCard,
  UsageTrendChart,
  ConversationRanking,
  TransactionItem,
  TransactionFilters,
  RechargePresets,
  CustomAmount,
  PaymentMethodSelector,
  RechargeNotes,
} from '../src/components/usage';
import { Card } from '../src/components/ui';
import { api } from '../src/services/api';
import type { RechargePreset } from '../src/types';

// ==================== Overview Tab ====================

export function OverviewContent() {
  const store = useBalanceStore();
  const { colors, spacing } = useTheme();
  const [hasError, setHasError] = useState(false);

  const handleRetry = async () => {
    setHasError(false);
    try {
      await store.initOverview();
    } catch {
      setHasError(true);
    }
  };

  if (hasError) {
    return (
      <View style={[styles.emptyState, { paddingVertical: spacing['3xl'] }]}>
        <RefreshCw size={40} color={colors.textMuted} strokeWidth={1.5} />
        <Text style={[styles.emptyTitle, { color: colors.textPrimary, marginTop: spacing.lg }]}>
          加载失败
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textMuted, marginTop: spacing.sm }]}>
          请检查网络后重试
        </Text>
        <Pressable
          onPress={handleRetry}
          style={(state: any) => [
            {
              marginTop: spacing.lg,
              paddingHorizontal: spacing.xl,
              paddingVertical: spacing.sm,
              borderRadius: 8,
              backgroundColor: state.hovered ? colors.accentHover : colors.accent,
            },
          ]}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '500' }}>重试</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View>
      {store.isLoading ? (
        <UsageSkeleton variant="overview" />
      ) : (
        <>
          <BalanceCard
            balance={store.balance}
            isLoading={store.isLoading}
            onRechargePress={() => store.setActiveTab('recharge')}
          />
          <UsageTrendChart
            data={store.dailyUsage}
            period={store.usagePeriod}
            onPeriodChange={store.setUsagePeriod}
            pricing={store.pricing}
            isLoading={store.isLoading}
          />
          <ConversationRanking
            data={store.conversationRanking}
            isLoading={store.isLoadingRanking}
            hasMore={store.rankingHasMore}
            onLoadMore={store.loadMoreRanking}
            onConversationPress={(id) => router.push(`/chat?id=${id}`)}
          />
        </>
      )}
    </View>
  );
}

// ==================== Transactions Tab ====================

export function TransactionsContent() {
  const { colors, spacing } = useTheme();
  const store = useBalanceStore();

  useEffect(() => {
    if (store.transactions.length === 0 && !store.isLoadingTransactions) {
      store.fetchTransactions();
    }
  }, []);

  return (
    <Card>
      {store.isLoadingTransactions && store.transactions.length === 0 ? (
        <UsageSkeleton variant="transactions" />
      ) : (
        <>
          <TransactionFilters
            filter={store.transactionFilter}
            onFilterChange={store.setTransactionFilter}
          />

          {store.transactions.length === 0 ? (
            <View style={[styles.emptyState, { paddingVertical: spacing['3xl'] }]}>
              <ClipboardList size={48} color={colors.textMuted} strokeWidth={1.2} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary, marginTop: spacing.lg }]}>
                暂无交易记录
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted, marginTop: spacing.sm }]}>
                充值或开始对话后，记录将在这里显示
              </Text>
            </View>
          ) : (
            <>
              {store.transactions.map((tx) => (
                <TransactionItem key={tx.id} transaction={tx} />
              ))}

              {store.isLoadingMoreTransactions ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.lg }}>
                  <ActivityIndicator size="small" color={colors.accent} />
                  <Text style={{ color: colors.textMuted, marginLeft: spacing.sm }}>加载中...</Text>
                </View>
              ) : store.transactionHasMore ? (
                <Pressable
                  onPress={store.loadMoreTransactions}
                  style={(state: any) => [
                    styles.loadMoreBtn,
                    { paddingVertical: spacing.lg, borderRadius: 8 },
                    state.hovered && { backgroundColor: colors.bgTertiary },
                  ]}
                >
                  <Text style={[styles.loadMoreText, { color: colors.accent }]}>
                    加载更多
                  </Text>
                </Pressable>
              ) : store.transactions.length > 0 ? (
                <Text
                  style={[styles.noMoreText, { color: colors.textMuted, paddingVertical: spacing.lg }]}
                >
                  没有更多记录
                </Text>
              ) : null}
            </>
          )}
        </>
      )}
    </Card>
  );
}

// ==================== Recharge Tab ====================

export function RechargeContent() {
  const { colors, spacing, borderRadius } = useTheme();
  const store = useBalanceStore();

  const [selectedPreset, setSelectedPreset] = useState<RechargePreset | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  useEffect(() => {
    if (!store.rechargeConfig) {
      store.fetchRechargeConfig();
    }
    store.fetchBalance();
  }, []);

  // Set default payment method
  useEffect(() => {
    if (store.rechargeConfig?.payment_methods?.length && !paymentMethod) {
      setPaymentMethod(store.rechargeConfig.payment_methods[0]);
    }
  }, [store.rechargeConfig]);

  const config = store.rechargeConfig;
  const exchangeRate = config?.exchange_rate || 100;
  const minAmount = config?.min_amount_yuan || 1;

  // Compute final amount
  let finalAmountYuan = 0;
  if (selectedPreset) {
    finalAmountYuan = selectedPreset.amount_yuan;
  } else if (customAmount) {
    const parsed = parseFloat(customAmount);
    if (!isNaN(parsed) && parsed >= minAmount) {
      finalAmountYuan = parsed;
    }
  }

  const canSubmit = finalAmountYuan > 0 && paymentMethod && !store.isRecharging;

  const handleRecharge = async () => {
    if (!canSubmit) return;

    try {
      const order = await store.createRechargeOrder(finalAmountYuan, paymentMethod);

      if (order.payment_url) {
        // Open payment URL
        await Linking.openURL(order.payment_url).catch(() => {});
      }

      // Poll for result
      const status = await store.pollOrderStatus(order.order_no);

      if (status.status === 1) {
        Alert.alert('充值成功', `+${status.points.toLocaleString()} 点已到账`);
        setSelectedPreset(null);
        setCustomAmount('');
        store.setActiveTab('overview');
      } else if (status.status === 2) {
        Alert.alert('充值取消', '订单已取消');
      } else {
        Alert.alert('支付超时', '请稍后在交易记录中查看订单状态');
      }
    } catch (error) {
      Alert.alert('充值失败', '创建订单失败，请重试');
    }
  };

  if (!config) {
    return <UsageSkeleton variant="recharge" />;
  }

  return (
    <Card>
      {/* Current balance */}
      <View style={[styles.rechargeBalance, { marginBottom: spacing.xl }]}>
        <Text style={[styles.rechargeBalLabel, { color: colors.textSecondary }]}>当前余额</Text>
        <Text style={[styles.rechargeBalValue, { color: colors.textPrimary }]}>
          {store.balance ? store.balance.balance.toLocaleString() : '—'} 点
        </Text>
      </View>

      {/* Presets */}
      <RechargePresets
        presets={config.presets}
        selectedPreset={selectedPreset}
        onSelect={(preset) => {
          setSelectedPreset(preset);
          if (preset) setCustomAmount('');
        }}
      />

      {/* Custom amount */}
      <CustomAmount
        value={customAmount}
        exchangeRate={exchangeRate}
        minAmount={minAmount}
        onChange={(val) => {
          setCustomAmount(val);
          if (val) setSelectedPreset(null);
        }}
        onFocus={() => setSelectedPreset(null)}
      />

      {/* Payment method */}
      <PaymentMethodSelector
        methods={config.payment_methods}
        selected={paymentMethod}
        onSelect={setPaymentMethod}
      />

      {/* Submit button */}
      <Pressable
        onPress={handleRecharge}
        disabled={!canSubmit}
        style={(state: any) => [
          styles.rechargeBtn,
          {
            backgroundColor: canSubmit
              ? (state.hovered ? colors.accentHover : colors.accent)
              : colors.bgTertiary,
            borderRadius: borderRadius.md,
            marginBottom: spacing.xl,
            // @ts-ignore - web cursor
            cursor: canSubmit ? 'pointer' : 'not-allowed',
          },
        ]}
        accessibilityLabel="立即充值"
      >
        {store.isRecharging ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={[styles.rechargeBtnText, { color: canSubmit ? '#FFFFFF' : colors.textMuted }]}>
            立即充值{finalAmountYuan > 0 ? ` · ¥${finalAmountYuan.toFixed(2)}` : ''}
          </Text>
        )}
      </Pressable>

      {/* Notes */}
      <RechargeNotes />
    </Card>
  );
}

// ==================== Main Page ====================

export default function UsagePage() {
  const { colors, spacing } = useTheme();
  const { isMobile, isDesktop } = useResponsive();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuthStore();
  const store = useBalanceStore();
  const params = useLocalSearchParams<{ tab?: string }>();

  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  // Load sidebar conversations
  useEffect(() => {
    if (isAuthenticated) {
      loadConversations();
    }
  }, [isAuthenticated]);

  // Sync tab from URL params
  useEffect(() => {
    if (params.tab && ['overview', 'transactions', 'recharge'].includes(params.tab)) {
      store.setActiveTab(params.tab as UsageTab);
    }
  }, [params.tab]);

  // Init data
  useEffect(() => {
    if (isAuthenticated) {
      store.initOverview();
    }
  }, [isAuthenticated]);

  const loadConversations = async () => {
    try {
      const response = await api.getConversations();
      const apiConversations = response.data?.conversations || [];
      if (apiConversations.length > 0) {
        const formatted: Conversation[] = apiConversations.map((c: any) => ({
          id: c.id,
          title: c.title || '新会话',
          time: '',
          active: false,
        }));
        setConversations(formatted);
      }
    } catch (err) {
      // Silent fail for sidebar
    }
  };

  const handleTabChange = (tab: UsageTab) => {
    store.setActiveTab(tab);
    try { router.setParams({ tab }); } catch { /* navigation may not be ready */ }
  };

  const handleRefresh = useCallback(async () => {
    switch (store.activeTab) {
      case 'overview':
        await store.initOverview();
        break;
      case 'transactions':
        await store.fetchTransactions(true);
        break;
      case 'recharge':
        await Promise.all([
          store.fetchBalance(),
          store.fetchRechargeConfig(),
        ]);
        break;
    }
  }, [store.activeTab]);

  // Auth redirect (use component instead of useEffect to avoid navigation-before-mount)
  if (!authLoading && !isAuthenticated) {
    return <Redirect href="/login" />;
  }
  if (authLoading || !isAuthenticated) return null;

  return (
    <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
      {/* Sidebar */}
      {(sidebarOpen || isDesktop) && (
        <Sidebar
          conversations={conversations}
          onSelectConversation={(id) => router.replace(`/chat?id=${id}`)}
          onNewChat={() => router.replace('/chat')}
          onCollapse={() => setSidebarOpen(false)}
          onLogout={() => {
            logout();
            router.replace('/login');
          }}
          userName={user?.nickname || user?.email || '用户'}
          userPlan="免费版"
        />
      )}

      {/* Main content */}
      <View style={styles.main}>
        <Header
          title="用量统计"
          showMenuButton={!isDesktop}
          onMenuPress={() => setSidebarOpen(true)}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingVertical: spacing.lg }]}
          refreshControl={
            <RefreshControl
              refreshing={store.isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.textMuted}
            />
          }
        >
          {/* Inner container - centered, max-width */}
          <View
            style={[
              styles.innerContainer,
              { paddingHorizontal: isMobile ? spacing.lg : spacing.xl },
            ]}
          >
            {/* Mobile: horizontal tabs at top */}
            {isMobile && (
              <UsageSideTabs
                activeTab={store.activeTab}
                onTabChange={handleTabChange}
                layout="horizontal"
              />
            )}

            {/* Desktop/Tablet: vertical tabs floating left */}
            {!isMobile && (
              <UsageSideTabs
                activeTab={store.activeTab}
                onTabChange={handleTabChange}
                layout="vertical"
              />
            )}

            {/* Tab content */}
            {store.activeTab === 'overview' && <OverviewContent />}
            {store.activeTab === 'transactions' && <TransactionsContent />}
            {store.activeTab === 'recharge' && <RechargeContent />}

            {/* Bottom spacing */}
            <View style={{ height: spacing['2xl'] }} />
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
  },
  main: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
  },
  innerContainer: {
    width: '100%',
    maxWidth: 768,
    position: 'relative',
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 280,
  },
  // Load more
  loadMoreBtn: {
    alignItems: 'center',
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '500',
  },
  noMoreText: {
    textAlign: 'center',
    fontSize: 13,
  },
  // Recharge
  rechargeBalance: {},
  rechargeBalLabel: {
    fontSize: 14,
  },
  rechargeBalValue: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 4,
  },
  rechargeBtn: {
    paddingVertical: 14,
    alignItems: 'center',
  } as any,
  rechargeBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
