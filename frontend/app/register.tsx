import { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '../src/theme';
import { AuthLayout } from '../src/components/layout';
import { Input, Button } from '../src/components/ui';
import { api } from '../src/services/api';
import { formatErrorMessage } from '../src/utils/errorMessages';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const { colors, spacing, typography } = useTheme();

  // Countdown + auto-redirect after registration success
  useEffect(() => {
    if (!success) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.replace('/login');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [success]);

  const clearErrors = () => {
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
  };

  const handleRegister = async () => {
    clearErrors();

    let hasError = false;
    if (!email) {
      setEmailError('请输入邮箱');
      hasError = true;
    }
    if (!password) {
      setPasswordError('请输入密码');
      hasError = true;
    } else if (password.length < 8) {
      setPasswordError('密码至少需要 8 个字符');
      hasError = true;
    }
    if (!confirmPassword) {
      setConfirmPasswordError('请确认密码');
      hasError = true;
    } else if (password && confirmPassword && password !== confirmPassword) {
      setConfirmPasswordError('两次输入的密码不一致');
      hasError = true;
    }
    if (hasError) return;

    setLoading(true);
    try {
      await api.register({ email, password, inviteCode: inviteCode || undefined });
      setSuccess(true);
    } catch (err: any) {
      setEmailError(formatErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout title="注册成功" subtitle="">
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: typography.body.fontSize,
            textAlign: 'center',
            marginVertical: 24,
            lineHeight: typography.body.lineHeight,
          }}
        >
          账户创建成功！请查收邮箱验证邮件，然后登录。
        </Text>
        <Text
          style={{
            color: colors.textMuted,
            fontSize: 13,
            textAlign: 'center',
            marginBottom: spacing.lg,
          }}
        >
          {countdown} 秒后自动跳转...
        </Text>
        <Pressable
          onPress={() => router.replace('/login')}
          accessibilityRole="link"
          // @ts-ignore - hovered is web-only
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
    <AuthLayout title="创建账户" subtitle="加入 GenNovel">
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
        hint="至少 8 位字符"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          setPasswordError('');
          // Real-time confirm password check
          if (confirmPassword && text !== confirmPassword) {
            setConfirmPasswordError('两次输入的密码不一致');
          } else {
            setConfirmPasswordError('');
          }
        }}
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

      <Input
        label="确认密码"
        variant="underline"
        placeholder="再次输入密码"
        value={confirmPassword}
        onChangeText={(text) => {
          setConfirmPassword(text);
          if (password && text && password !== text) {
            setConfirmPasswordError('两次输入的密码不一致');
          } else {
            setConfirmPasswordError('');
          }
        }}
        error={confirmPasswordError}
        secureTextEntry={!showConfirmPassword}
        maxLength={128}
        rightIcon={
          <Pressable
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            hitSlop={8}
            accessibilityLabel={showConfirmPassword ? '隐藏密码' : '显示密码'}
          >
            {showConfirmPassword ? (
              <EyeOff size={18} color={colors.textMuted} />
            ) : (
              <Eye size={18} color={colors.textMuted} />
            )}
          </Pressable>
        }
      />

      <Input
        label="邀请码 (选填)"
        variant="underline"
        placeholder="输入邀请码"
        value={inviteCode}
        onChangeText={setInviteCode}
        autoCapitalize="characters"
        maxLength={20}
      />

      <Button
        title={loading ? '创建中...' : '创建账户'}
        variant="primary"
        onPress={handleRegister}
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
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
        <Pressable
          onPress={() => router.push('/login')}
          accessibilityRole="link"
          // @ts-ignore - hovered is web-only
          style={(state: any) => ({
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 6,
            backgroundColor: state.hovered ? `rgba(212,131,106,0.08)` : 'transparent',
          })}
        >
          <Text style={{ color: colors.accent, fontSize: 14 }}>已有账户？立即登录</Text>
        </Pressable>
      </View>
    </AuthLayout>
  );
}
