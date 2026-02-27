import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: number;
  email: string;
  nickname: string;
  avatarUrl: string;
  emailVerified: boolean;
  inviteCode: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: User) => void;
  setTokens: (token: string, refreshToken: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) => set({ user, isAuthenticated: true }),

      setTokens: (token, refreshToken) => set({ token, refreshToken }),

      logout: () => set({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
      }),

      setLoading: (isLoading) => set({ isLoading }),

      initialize: () => {
        // After hydration, set loading to false
        setTimeout(() => {
          set({ isLoading: false });
        }, 100);
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state, error) => {
        // 无论是否有存储数据，都设置 isLoading 为 false
        // 使用 setState 确保状态更新
        setTimeout(() => {
          useAuthStore.setState({ isLoading: false });
        }, 0);
      },
    }
  )
);
