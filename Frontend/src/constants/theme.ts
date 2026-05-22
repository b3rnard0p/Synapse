export type ThemeType = 'dark' | 'light';
export type ThemeColor = keyof typeof Colors.dark;

export const Fonts = {
  mono: 'SpaceMono',
};

export const Spacing = {
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 20,
  six: 24,
  seven: 28,
  eight: 32,
  nine: 36,
  ten: 40,
};

export const MaxContentWidth = 1024;
export const BottomTabInset = 50;

export const Colors = {
  dark: {
    background: '#18181b', // Zinc 900
    backgroundSecondary: '#27272a', // Zinc 800
    text: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.5)',
    primary: '#be123c', // Rose 700 (Carmine)
    primaryDark: '#9f1239', // Rose 800
    border: 'rgba(255,255,255,0.08)',
    borderStrong: 'rgba(255,255,255,0.15)',
    card: 'rgba(255,255,255,0.05)',
    icon: 'rgba(255,255,255,0.4)',
    success: '#4CAF50',
    successLight: 'rgba(76,175,80,0.15)',
    warning: '#FF9800',
    error: '#F44336',
    errorLight: 'rgba(244,67,54,0.1)',
    star: '#FFD700',
  },
  light: {
    background: '#FAFAFA', // Off-white
    backgroundSecondary: '#FFFFFF', // Pure white
    text: '#18181B', // Zinc 900
    textSecondary: 'rgba(24,24,27,0.6)',
    primary: '#be123c', // Rose 700 (Carmine)
    primaryDark: '#9f1239', // Rose 800
    border: 'rgba(24,24,27,0.08)',
    borderStrong: 'rgba(24,24,27,0.15)',
    card: '#F4F4F5', // Zinc 100
    icon: 'rgba(24,24,27,0.4)',
    success: '#388E3C', // Darker green for contrast
    successLight: 'rgba(76,175,80,0.15)',
    warning: '#F57C00', // Darker orange
    error: '#D32F2F', // Darker red
    errorLight: 'rgba(244,67,54,0.1)',
    star: '#F5B041', // Darker yellow for white bg
  }
};
