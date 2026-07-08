import React, { createContext, useContext, useState, useEffect } from 'react';
import { storageService } from '@/services/storage';

type Theme = 'dark' | 'light';

export const darkColors = {
  primary: '#D4AF37',
  primaryLight: '#E8C84A',
  primaryDark: '#B8941F',
  background: '#0F0F1A',
  surface: '#1E1E2F',
  surfaceLight: '#2A2A3F',
  surfaceDark: '#151525',
  text: '#FFFFFF',
  textMuted: '#A0A0B0',
  textInverse: '#0F0F1A',
  border: '#2A2A3F',
  error: '#FF4444',
  success: '#44FF88',
  warning: '#FFAA00',
  info: '#4488FF',
  overlay: 'rgba(0, 0, 0, 0.7)',
} as const;

export const lightColors = {
  primary: '#D4AF37',
  primaryLight: '#E8C84A',
  primaryDark: '#B8941F',
  background: '#F5F5FA',
  surface: '#FFFFFF',
  surfaceLight: '#F0F0F5',
  surfaceDark: '#E8E8EF',
  text: '#1A1A2E',
  textMuted: '#666680',
  textInverse: '#FFFFFF',
  border: '#E0E0E8',
  error: '#CC0000',
  success: '#00AA44',
  warning: '#CC8800',
  info: '#0066CC',
  overlay: 'rgba(0, 0, 0, 0.5)',
} as const;

type Colors = typeof darkColors;

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  colors: Colors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await storageService.getItem('bigstarz_theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setTheme(savedTheme);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    await storageService.setItem('bigstarz_theme', newTheme);
  };

  const colors: Colors = theme === 'dark' ? darkColors : (lightColors as unknown as Colors);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
