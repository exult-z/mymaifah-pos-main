import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      // Check localStorage first
      const saved = localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark') return saved;
      
      // Check user preference from localStorage
      const userPref = localStorage.getItem('userThemePreferences');
      if (userPref) {
        try {
          const parsed = JSON.parse(userPref);
          // Check if there's a default theme
          const defaultTheme = parsed.default;
          if (defaultTheme === 'light' || defaultTheme === 'dark') return defaultTheme;
        } catch (e) {
          console.error('Failed to parse userThemePreferences:', e);
        }
      }
      
      // Check system preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
      return 'light';
    } catch (error) {
      console.error('Error getting theme preference:', error);
      return 'light';
    }
  });

  useEffect(() => {
    try {
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      localStorage.setItem('theme', theme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setUserThemePreference = (userId: string, preferredTheme: Theme) => {
    try {
      const userPrefs = JSON.parse(localStorage.getItem('userThemePreferences') || '{}');
      userPrefs[userId] = preferredTheme;
      localStorage.setItem('userThemePreferences', JSON.stringify(userPrefs));
    } catch (error) {
      console.error('Error saving user theme preference:', error);
    }
  };

  const getUserThemePreference = (userId: string): Theme | null => {
    try {
      const userPrefs = JSON.parse(localStorage.getItem('userThemePreferences') || '{}');
      return userPrefs[userId] || null;
    } catch (error) {
      console.error('Error getting user theme preference:', error);
      return null;
    }
  };

  return { theme, toggleTheme, setUserThemePreference, getUserThemePreference };
}