import React, { createContext, useContext, ReactNode } from 'react';
import { useColorScheme } from 'react-native';

const lightColors = {
  primary: {
    50: '#e0f7f6',
    100: '#b3ebe8',
    200: '#80dfd9',
    300: '#4dd3ca',
    400: '#2ac7bc',
    500: '#14b8ad',
    600: '#119e95',
    700: '#0e847d',
    800: '#0a6a65',
    900: '#07504d',
  },
  secondary: {
    50: '#e6f2ff',
    100: '#b3dbff',
    200: '#80c4ff',
    300: '#4dacff',
    400: '#2a9aff',
    500: '#1a8cff',
    600: '#1676d9',
    700: '#1260b3',
    800: '#0e4a8c',
    900: '#0a3466',
  },
  accent: {
    surface: '#FBFBFD',
    green: '#10b981',
    yellow: '#f59e0b',
  },
  surface: {
    primary: '#ffffff',
    secondary: '#FBFBFD',
    tertiary: '#f3f4f6',
  },
  text: {
    primary: '#191D31',
    secondary: '#666876',
    tertiary: '#8C8E98',
  },
  black: {
    DEFAULT: '#000000',
    100: '#8C8E98',
    200: '#666876',
    300: '#191D31',
  },
  ubc: {
    primary: '#002145',
    secondary: '#0055B7',
  },
  danger: '#F75555',
};

const darkColors = {
  primary: {
    50: '#07504d',
    100: '#0a6a65',
    200: '#0e847d',
    300: '#119e95',
    400: '#14b8ad',
    500: '#2ac7bc',
    600: '#4dd3ca',
    700: '#80dfd9',
    800: '#b3ebe8',
    900: '#e0f7f6',
  },
  secondary: {
    50: '#0a3466',
    100: '#0e4a8c',
    200: '#1260b3',
    300: '#1676d9',
    400: '#1a8cff',
    500: '#2a9aff',
    600: '#4dacff',
    700: '#80c4ff',
    800: '#b3dbff',
    900: '#e6f2ff',
  },
  accent: {
    surface: '#1a1a1a',
    green: '#10b981',
    yellow: '#f59e0b',
  },
  surface: {
    primary: '#111111', 
    secondary: '#1b1b1b',
    tertiary: '#2a2a2a',
  },
  text: {
    primary: '#ffffff',
    secondary: '#d1d5db',
    tertiary: '#9ca3af',
  },
  black: {
    DEFAULT: '#ffffff',
    100: '#d1d5db',
    200: '#9ca3af',
    300: '#6b7280',
  },
  ubc: {
    primary: '#4a90e2',
    secondary: '#5ca3ff',
  },
  danger: '#ff6b6b',
};

type ColorScheme = typeof lightColors;

interface ThemeContextType {
  colors: ColorScheme;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ colors, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};