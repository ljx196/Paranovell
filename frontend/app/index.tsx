import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { View, Text } from 'react-native';
import { useAuthStore } from '../src/store/useAuthStore';
import { useTheme } from '../src/theme';

export default function Index() {
  const { isAuthenticated, isLoading, token } = useAuthStore();
  const { colors } = useTheme();
  const [mounted, setMounted] = useState(false);

  // 等待组件挂载
  useEffect(() => {
    setMounted(true);
  }, []);

  // 在组件挂载且认证状态加载完成后进行导航
  useEffect(() => {
    if (!mounted || isLoading) return;

    console.log('[Index] Auth state:', { isLoading, isAuthenticated, hasToken: !!token });

    if (isAuthenticated && token) {
      console.log('[Index] Redirecting to /chat');
      router.replace('/chat');
    } else {
      console.log('[Index] Redirecting to /login');
      router.replace('/login');
    }
  }, [mounted, isLoading, isAuthenticated, token]);

  // 显示加载状态
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgPrimary }}>
      <Text style={{ color: colors.textSecondary }}>加载中...</Text>
    </View>
  );
}
