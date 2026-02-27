/**
 * GenNovel Design System - Theme Context
 * Provides theme state and toggle functionality
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { darkColors, lightColors, ThemeColors, ThemeMode } from './colors';
import { spacing, borderRadius, layout, padding, messagePadding } from './spacing';
import { typography } from './typography';
import { useThemeStore } from '../store/useThemeStore';

interface ThemeContextValue {
  mode: ThemeMode;
  colors: ThemeColors;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  layout: typeof layout;
  padding: typeof padding;
  messagePadding: typeof messagePadding;
  typography: typeof typography;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

// Default context value for when ThemeProvider hasn't mounted yet
const defaultContextValue: ThemeContextValue = {
  mode: 'dark',
  colors: darkColors,
  spacing,
  borderRadius,
  layout,
  padding,
  messagePadding,
  typography,
  toggleTheme: () => {},
  setMode: () => {},
  isDark: true,
};

const ThemeContext = createContext<ThemeContextValue>(defaultContextValue);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { mode, setMode: setStoreMode } = useThemeStore();
  const [currentMode, setCurrentMode] = useState<ThemeMode>(mode);

  useEffect(() => {
    setCurrentMode(mode);
  }, [mode]);

  const colors = currentMode === 'dark' ? darkColors : lightColors;

  const toggleTheme = () => {
    const newMode = currentMode === 'dark' ? 'light' : 'dark';
    setCurrentMode(newMode);
    setStoreMode(newMode);
  };

  const setMode = (newMode: ThemeMode) => {
    setCurrentMode(newMode);
    setStoreMode(newMode);
  };

  const value: ThemeContextValue = {
    mode: currentMode,
    colors,
    spacing,
    borderRadius,
    layout,
    padding,
    messagePadding,
    typography,
    toggleTheme,
    setMode,
    isDark: currentMode === 'dark',
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

export { ThemeContext };
