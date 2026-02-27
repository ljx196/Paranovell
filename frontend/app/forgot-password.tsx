import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../src/theme';
import { AuthLayout } from '../src/components/layout';
import { Input, Button } from '../src/components/ui';
import { api } from '../src/services/api';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const { colors, spacing, typography } = useTheme();

  const handleSubmit = async () => {
    if (!email) {
      setError('请输入邮箱地址');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await api.forgotPassword(email);
      setSent(true);
    } catch (err: any) {
      // Even on error, show success message for security
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout title="查收邮件" subtitle="">
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: typography.body.fontSize,
            textAlign: 'center',
            marginVertical: 24,
            lineHeight: typography.body.lineHeight,
          }}
        >
          如果 {email} 存在账户，您将很快收到密码重置链接。
        </Text>
        <Pressable
          onPress={() => router.push('/login')}
          accessibilityRole="link"
          style={(state: any) => ({
            alignSelf: 'center',
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 6,
            backgroundColor: state.hovered ? `rgba(212,131,106,0.08)` : 'transparent',
          })}
        >
          <Text style={{ color: colors.accent, fontSize: 16 }}>返回登录</Text>
        </Pressable>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="重置密码"
      subtitle="输入您的邮箱，我们将发送重置链接"
    >
      {error ? (
        <Text style={{ color: colors.error, fontSize: 14, marginBottom: 12, textAlign: 'center' }}>
          {error}
        </Text>
      ) : null}

      <Input
        label="邮箱"
        variant="underline"
        placeholder="name@example.com"
        value={email}
        onChangeText={(text) => { setEmail(text); setError(''); }}
        keyboardType="email-address"
        autoCapitalize="none"
        maxLength={254}
      />

      <Button
        title={loading ? '发送中...' : '发送重置链接'}
        variant="primary"
        onPress={handleSubmit}
        disabled={loading}
        loading={loading}
        style={{ marginTop: spacing.lg }}
      />

      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: spacing.xl }}>
        <Pressable
          onPress={() => router.push('/login')}
          accessibilityRole="link"
          style={(state: any) => ({
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 6,
            backgroundColor: state.hovered ? `rgba(212,131,106,0.08)` : 'transparent',
          })}
        >
          <Text style={{ color: colors.accent, fontSize: 14 }}>返回登录</Text>
        </Pressable>
      </View>
    </AuthLayout>
  );
}
