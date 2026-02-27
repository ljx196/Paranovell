import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import { useAuthStore } from '../src/store/useAuthStore';
import { useTheme } from '../src/theme';
import { AuthLayout } from '../src/components/layout';
import { Input, Button } from '../src/components/ui';
import { api } from '../src/services/api';
import { formatErrorMessage } from '../src/utils/errorMessages';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { setUser, setTokens } = useAuthStore();
  const { colors, spacing } = useTheme();

  const clearErrors = () => {
    setEmailError('');
    setPasswordError('');
  };

  const handleLogin = async () => {
    clearErrors();

    let hasError = false;
    if (!email) {
      setEmailError('请输入邮箱');
      hasError = true;
    }
    if (!password) {
      setPasswordError('请输入密码');
      hasError = true;
    }
    if (hasError) return;

    setLoading(true);
    try {
      const data = await api.login({ email, password });
      setUser(data.user);
      setTokens(data.token, data.refreshToken);
      router.replace('/chat');
    } catch (err: any) {
      setPasswordError(formatErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="GenNovel" subtitle="登录以继续">
      <Input
        label="邮箱"
        variant="underline"
        placeholder="name@example.com"
        value={email}
        onChangeText={(text) => { setEmail(text); setEmailError(''); }}
        error={emailError}
        keyboardType="email-address"
        autoCapitalize="none"
        maxLength={254}
      />

      <Input
        label="密码"
        variant="underline"
        placeholder="输入密码"
        value={password}
        onChangeText={(text) => { setPassword(text); setPasswordError(''); }}
        error={passwordError}
        secureTextEntry={!showPassword}
        maxLength={128}
        rightIcon={
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={8}
            accessibilityLabel={showPassword ? '隐藏密码' : '显示密码'}
          >
            {showPassword ? (
              <EyeOff size={18} color={colors.textMuted} />
            ) : (
              <Eye size={18} color={colors.textMuted} />
            )}
          </Pressable>
        }
      />

      <Button
        title={loading ? '登录中...' : '登录'}
        variant="primary"
        onPress={handleLogin}
        disabled={loading}
        loading={loading}
        style={{ marginTop: spacing.lg }}
      />

      {/* Divider */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.lg }}>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
        <Text style={{ color: colors.textMuted, fontSize: 12, marginHorizontal: spacing.md }}>或</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
      </View>

      {/* Links */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.sm }}>
        <Pressable
          onPress={() => router.push('/register')}
          accessibilityRole="link"
          // @ts-ignore - hovered is web-only
          style={(state: any) => ({
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 6,
            backgroundColor: state.hovered ? `rgba(212,131,106,0.08)` : 'transparent',
          })}
        >
          <Text style={{ color: colors.accent, fontSize: 14 }}>创建账户</Text>
        </Pressable>
        <Text style={{ color: colors.textMuted, fontSize: 14 }}>|</Text>
        <Pressable
          onPress={() => router.push('/forgot-password')}
          accessibilityRole="link"
          // @ts-ignore - hovered is web-only
          style={(state: any) => ({
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 6,
            backgroundColor: state.hovered ? `rgba(212,131,106,0.08)` : 'transparent',
          })}
        >
          <Text style={{ color: colors.accent, fontSize: 14 }}>忘记密码?</Text>
        </Pressable>
      </View>
    </AuthLayout>
  );
}
