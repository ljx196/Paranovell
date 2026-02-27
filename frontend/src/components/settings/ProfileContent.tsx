import React, { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { MessageSquare, Lock, LogOut, ChevronRight } from 'lucide-react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { useTheme } from '../../theme';
import { useResponsive } from '../../hooks/useResponsive';
import { Card, Button, Avatar, Input } from '../ui';
import { api } from '../../services/api';

export default function ProfileContent() {
  const { user, logout, setUser } = useAuthStore();
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { colors, typography, borderRadius, spacing } = useTheme();
  const { isMobile } = useResponsive();

  const avatarSize = isMobile ? 80 : 100;

  // Load profile data from API
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await api.getProfile() as any;
      if (response.data) {
        setUser(response.data);
        setNickname(response.data.nickname || '');
      }
    } catch (err) {
      console.log('Failed to load profile:', err);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.updateProfile({ nickname });
      if (user) {
        setUser({ ...user, nickname });
      }
      setSuccess('资料更新成功');
    } catch (err: any) {
      setError(err.message || '更新失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (err) {
      // Ignore logout errors
    }
    logout();
    router.replace('/login');
  };

  return (
    <View style={{ maxWidth: 600, width: '100%' }}>
      {/* Avatar Section */}
      <View style={{ alignItems: 'center', marginVertical: spacing.xl }}>
        <Avatar
          name={user?.nickname || user?.email}
          size="lg"
          style={{
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
          }}
        />
      </View>

      {/* Profile Information */}
      <Card style={{ marginBottom: spacing.xl }}>
        <Text
          style={{
            fontSize: typography.sectionTitle.fontSize,
            fontWeight: '600',
            color: colors.textPrimary,
            marginBottom: spacing.lg,
          }}
        >
          个人资料
        </Text>

        {error ? (
          <Text style={{ color: colors.error, fontSize: 14, marginBottom: spacing.md, textAlign: 'center' }}>
            {error}
          </Text>
        ) : null}

        {success ? (
          <Text style={{ color: colors.success, fontSize: 14, marginBottom: spacing.md, textAlign: 'center' }}>
            {success}
          </Text>
        ) : null}

        <Input
          label="邮箱"
          value={user?.email || ''}
          editable={false}
          variant="underline"
        />

        <Input
          label="昵称"
          value={nickname}
          onChangeText={(text) => { setNickname(text); setError(''); setSuccess(''); }}
          placeholder="输入昵称"
          variant="underline"
        />

        <Input
          label="邀请码"
          value={user?.inviteCode || '暂无'}
          editable={false}
          variant="underline"
        />

        <Button
          title={loading ? '保存中...' : '保存更改'}
          variant="primary"
          onPress={handleSave}
          disabled={loading}
          loading={loading}
        />
      </Card>

      {/* Account Section */}
      <Card>
        <Text
          style={{
            fontSize: typography.sectionTitle.fontSize,
            fontWeight: '600',
            color: colors.textPrimary,
            marginBottom: spacing.lg,
          }}
        >
          账户
        </Text>

        {/* 返回聊天 */}
        <Pressable
          style={(state: any) => [
            {
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: spacing.lg,
              paddingHorizontal: spacing.md,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              borderRadius: borderRadius.md,
            },
            state.hovered && { backgroundColor: colors.bgTertiary },
          ]}
          onPress={() => router.replace('/chat')}
        >
          <MessageSquare size={18} color={colors.textSecondary} strokeWidth={1.8} />
          <Text style={{ flex: 1, color: colors.textPrimary, fontSize: 16, marginLeft: spacing.md }}>
            返回聊天
          </Text>
          <ChevronRight size={16} color={colors.textMuted} strokeWidth={1.8} />
        </Pressable>

        {/* 修改密码 */}
        <Pressable
          style={(state: any) => [
            {
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: spacing.lg,
              paddingHorizontal: spacing.md,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              borderRadius: borderRadius.md,
            },
            state.hovered && { backgroundColor: colors.bgTertiary },
          ]}
        >
          <Lock size={18} color={colors.textSecondary} strokeWidth={1.8} />
          <Text style={{ flex: 1, color: colors.textPrimary, fontSize: 16, marginLeft: spacing.md }}>
            修改密码
          </Text>
          <ChevronRight size={16} color={colors.textMuted} strokeWidth={1.8} />
        </Pressable>

        {/* 退出登录 */}
        {!showLogoutConfirm ? (
          <Pressable
            style={(state: any) => [
              {
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: spacing.lg,
                paddingHorizontal: spacing.md,
                borderRadius: borderRadius.md,
              },
              state.hovered && { backgroundColor: colors.errorLight },
            ]}
            onPress={() => setShowLogoutConfirm(true)}
          >
            <LogOut size={18} color={colors.error} strokeWidth={1.8} />
            <Text style={{ flex: 1, color: colors.error, fontSize: 16, marginLeft: spacing.md }}>
              退出登录
            </Text>
          </Pressable>
        ) : (
          <View
            style={{
              paddingVertical: spacing.lg,
              paddingHorizontal: spacing.md,
              borderRadius: borderRadius.md,
              backgroundColor: colors.errorLight,
            }}
          >
            <Text style={{ color: colors.error, fontSize: 15, fontWeight: '500', marginBottom: spacing.md }}>
              确定退出登录？
            </Text>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Pressable
                style={(state: any) => [
                  {
                    flex: 1,
                    paddingVertical: spacing.sm,
                    borderRadius: borderRadius.md,
                    borderWidth: 1,
                    borderColor: colors.border,
                    alignItems: 'center' as const,
                  },
                  state.hovered && { backgroundColor: colors.bgTertiary },
                ]}
                onPress={() => setShowLogoutConfirm(false)}
              >
                <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '500' }}>取消</Text>
              </Pressable>
              <Pressable
                style={(state: any) => [
                  {
                    flex: 1,
                    paddingVertical: spacing.sm,
                    borderRadius: borderRadius.md,
                    backgroundColor: colors.error,
                    alignItems: 'center' as const,
                  },
                  state.hovered && { opacity: 0.9 },
                ]}
                onPress={handleLogout}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '500' }}>退出</Text>
              </Pressable>
            </View>
          </View>
        )}
      </Card>
    </View>
  );
}
