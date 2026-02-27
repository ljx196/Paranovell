/**
 * GenNovel - Unified Settings Page
 * Profile, usage overview, transactions, and recharge in one page
 */

import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { router, useLocalSearchParams, Redirect } from 'expo-router';
import { useTheme } from '../src/theme';
import { useResponsive } from '../src/hooks/useResponsive';
import { useAuthStore } from '../src/store/useAuthStore';
import { useBalanceStore } from '../src/store/useBalanceStore';
import { Header } from '../src/components/layout';
import { Sidebar, Conversation } from '../src/components/chat';
import { SettingsSideTabs, ProfileContent } from '../src/components/settings';
import type { SettingsTab } from '../src/components/settings';
import { OverviewContent, TransactionsContent, RechargeContent } from './usage';
import { api } from '../src/services/api';

export default function SettingsPage() {
  const { colors, spacing } = useTheme();
  const { isMobile, isDesktop } = useResponsive();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuthStore();
  const store = useBalanceStore();
  const params = useLocalSearchParams<{ tab?: string }>();

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
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
    if (params.tab && ['profile', 'overview', 'transactions', 'recharge'].includes(params.tab)) {
      setActiveTab(params.tab as SettingsTab);
    }
  }, [params.tab]);

  // Sync from balance store activeTab (e.g. when BalanceCard "去充值" is clicked)
  useEffect(() => {
    if (store.activeTab !== activeTab && ['overview', 'transactions', 'recharge'].includes(store.activeTab)) {
      setActiveTab(store.activeTab as SettingsTab);
      try { router.setParams({ tab: store.activeTab }); } catch {}
    }
  }, [store.activeTab]);

  // Init usage data when switching to usage tabs
  useEffect(() => {
    if (isAuthenticated && activeTab !== 'profile') {
      store.initOverview();
    }
  }, [isAuthenticated, activeTab]);

  const loadConversations = async () => {
    try {
      const response = await api.getConversations() as any;
      const apiConversations = response.data?.conversations || [];
      if (apiConversations.length > 0) {
        const formatted: Conversation[] = apiConversations.map((c: any) => ({
          id: c.id,
          title: c.title || '新会话',
          time: '',
          active: false,
        }));
        setConversations(formatted);
      } else {
        setConversations([
          { id: 'demo', title: '演示对话', time: '刚刚', active: true },
        ]);
      }
    } catch (err) {
      console.log('Settings: Failed to load conversations:', err);
      setConversations([
        { id: 'demo', title: '演示对话', time: '刚刚', active: true },
      ]);
    }
  };

  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
    // Sync usage store active tab for usage-related tabs
    if (tab === 'overview' || tab === 'transactions' || tab === 'recharge') {
      store.setActiveTab(tab);
    }
    try { router.setParams({ tab }); } catch {}
  };

  const handleRefresh = useCallback(async () => {
    if (activeTab === 'profile') return;
    switch (activeTab) {
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
  }, [activeTab]);

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
          title="设置"
          showMenuButton={!isDesktop}
          onMenuPress={() => setSidebarOpen(true)}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={store.isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.textMuted}
            />
          }
        >
          <View
            style={[
              styles.innerContainer,
              {
                paddingHorizontal: isMobile ? spacing.lg : spacing.xl,
                maxWidth: isMobile ? 768 : 960,
              },
            ]}
          >
            {/* Mobile: horizontal tabs at top */}
            {isMobile && (
              <>
                <SettingsSideTabs
                  activeTab={activeTab}
                  onTabChange={handleTabChange}
                  layout="horizontal"
                />
                {activeTab === 'profile' && <ProfileContent />}
                {activeTab === 'overview' && <OverviewContent />}
                {activeTab === 'transactions' && <TransactionsContent />}
                {activeTab === 'recharge' && <RechargeContent />}
              </>
            )}

            {/* Desktop/Tablet: flex row with vertical tabs on left */}
            {!isMobile && (
              <View style={[styles.desktopRow, { gap: spacing.xl }]}>
                <SettingsSideTabs
                  activeTab={activeTab}
                  onTabChange={handleTabChange}
                  layout="vertical"
                />
                <View style={styles.tabContent}>
                  {activeTab === 'profile' && <ProfileContent />}
                  {activeTab === 'overview' && <OverviewContent />}
                  {activeTab === 'transactions' && <TransactionsContent />}
                  {activeTab === 'recharge' && <RechargeContent />}
                </View>
              </View>
            )}

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
    paddingVertical: 16,
  },
  innerContainer: {
    width: '100%',
  },
  desktopRow: {
    flexDirection: 'row',
  },
  tabContent: {
    flex: 1,
    maxWidth: 768,
  },
});
