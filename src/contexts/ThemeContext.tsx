import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type Mode = 'light' | 'dark';

interface ThemeModeContextType {
  mode: Mode;
  toggle: () => void;
}

const ThemeModeContext = createContext<ThemeModeContextType | undefined>(undefined);

export const useThemeMode = () => {
  const ctx = useContext(ThemeModeContext);
  if (!ctx) throw new Error('useThemeMode must be used within ThemeModeProvider');
  return ctx;
};

export const ThemeModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<Mode>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('xenon_theme_mode') as Mode | null;
    if (saved === 'light' || saved === 'dark') setMode(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem('xenon_theme_mode', mode);
    document.documentElement.setAttribute('data-color-scheme', mode);
  }, [mode]);

  const value = useMemo(
    () => ({ mode, toggle: () => setMode((m) => (m === 'light' ? 'dark' : 'light')) }),
    [mode]
  );

  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>;
};

