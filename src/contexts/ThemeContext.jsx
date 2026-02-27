import { createContext, useContext, useState, useEffect } from 'react';

const THEMES = ['warm', 'clean', 'colorful', 'dark'];
const THEME_LABELS = {
  warm: 'Warm & Cozy',
  clean: 'Clean & Minimal',
  colorful: 'Colorful & Playful',
  dark: 'Dark Mode',
};
const DEFAULT_THEME = 'warm';
const STORAGE_KEY = 'sunsar-menu-theme';

const ThemeContext = createContext(null);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return THEMES.includes(saved) ? saved : DEFAULT_THEME;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES, themeLabels: THEME_LABELS }}>
      {children}
    </ThemeContext.Provider>
  );
}
