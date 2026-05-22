import { create } from 'zustand';
import { ThemeType } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeState {
  theme: ThemeType;
  toggleTheme: () => void;
  loadTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'dark', // Default is dark
  
  toggleTheme: async () => {
    const newTheme = get().theme === 'dark' ? 'light' : 'dark';
    set({ theme: newTheme });
    try {
      await AsyncStorage.setItem('@theme', newTheme);
    } catch (e) {
      console.error('Failed to save theme to AsyncStorage', e);
    }
  },
  
  loadTheme: async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('@theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        set({ theme: savedTheme });
      }
    } catch (e) {
      console.error('Failed to load theme from AsyncStorage', e);
    }
  }
}));
