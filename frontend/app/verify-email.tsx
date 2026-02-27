import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CheckCircle, XCircle } from 'lucide-react-native';
import { useTheme } from '../src/theme';
import { AuthLayout } from '../src/components/layout';
import { Button } from '../src/components/ui';
import { api } from '../src/services/api';

export default function VerifyEmailScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { colors, spacing } = useTheme();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    } else {
      setStatus('error');
      setMessage('无效的验证链接');
    }
  }, [token]);

  const verifyEmail = async (verifyToken: string) => {
    try {
      await api.verifyEmail(verifyToken);
      setStatus('success');
      setMessage('邮箱验证成功！');
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || '验证失败，链接可能已过期');
    }
  };

  const renderContent = () => {
    if (status === 'loading') {
      return (
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={{ color: colors.textSecondary, marginTop: spacing.lg, fontSize: 16 }}>
            正在验证邮箱...
          </Text>
        </View>
      );
    }

    if (status === 'success') {
      return (
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <CheckCircle size={48} color={colors.success} />
          <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '600', marginTop: spacing.lg, marginBottom: spacing.sm }}>
            验证成功
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: spacing.xl, textAlign: 'center' }}>
            {message}
          </Text>
          <Button
            title="前往登录"
            variant="primary"
            onPress={() => router.replace('/login')}
            style={{ width: '100%' }}
          />
        </View>
      );
    }

    return (
      <View style={{ alignItems: 'center', paddingVertical: 40 }}>
        <XCircle size={48} color={colors.error} />
        <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '600', marginTop: spacing.lg, marginBottom: spacing.sm }}>
          验证失败
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: spacing.xl, textAlign: 'center' }}>
          {message}
        </Text>
        <Button
          title="返回登录"
          variant="secondary"
          onPress={() => router.replace('/login')}
          style={{ width: '100%' }}
        />
      </View>
    );
  };

  return (
    <AuthLayout title="邮箱验证" subtitle="">
      {renderContent()}
    </AuthLayout>
  );
}
