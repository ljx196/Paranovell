/**
 * GenNovel - Theme Store
 * Persists theme preference using Zustand + AsyncStorage
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeMode } from '../theme/colors';

interface ThemeState {
  mode: ThemeMode;
  isHydrated: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  setHydrated: (hydrated: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'dark',
      isHydrated: false,

      setMode: (mode) => set({ mode }),

      toggleMode: () => {
        const currentMode = get().mode;
        set({ mode: currentMode === 'dark' ? 'light' : 'dark' });
      },

      setHydrated: (isHydrated) => set({ isHydrated }),
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ mode: state.mode }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHydrated(true);
        }
      },
    }
  )
);
