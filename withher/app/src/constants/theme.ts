import { Platform } from 'react-native';

export const Colors = {
  primary: '#7C4DFF',
  primaryLight: '#B47CFF',
  primaryDark: '#5600E8',
  secondary: '#00BFA5',
  secondaryLight: '#5DF2D6',
  secondaryDark: '#008E76',
  accent: '#FF4081',
  accentLight: '#FF80AB',
  accentDark: '#C60055',

  // Backgrounds
  backgroundLight: '#FAFAFA',
  backgroundDark: '#121212',
  surfaceLight: '#FFFFFF',
  surfaceDark: '#1E1E1E',
  cardLight: '#FFFFFF',
  cardDark: '#2A2A2A',

  // Text
  textPrimaryLight: '#1A1A1A',
  textPrimaryDark: '#FAFAFA',
  textSecondaryLight: '#666666',
  textSecondaryDark: '#AAAAAA',
  textDisabledLight: '#BBBBBB',
  textDisabledDark: '#555555',

  // Borders
  borderLight: '#E0E0E0',
  borderDark: '#3A3A3A',

  // States
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',

  // Fixed
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // Gradients (used with LinearGradient)
  gradientPrimary: ['#7C4DFF', '#5600E8'] as const,
  gradientAccent: ['#FF4081', '#C60055'] as const,
  gradientSurface: ['#7C4DFF', '#00BFA5'] as const,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  display: 40,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const FontFamily = {
  regular: Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }),
  medium: Platform.select({ ios: 'System', android: 'Roboto-Medium', default: 'System' }),
  bold: Platform.select({ ios: 'System', android: 'Roboto-Bold', default: 'System' }),
};

export const Shadow = {
  sm: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
    },
    android: { elevation: 2 },
    default: {},
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    android: { elevation: 5 },
    default: {},
  }),
  lg: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
    },
    android: { elevation: 10 },
    default: {},
  }),
} as const;

export const ZIndex = {
  base: 0,
  card: 10,
  overlay: 100,
  modal: 200,
  toast: 300,
} as const;

export const Animation = {
  fast: 150,
  normal: 250,
  slow: 400,
} as const;

// Swipe card constants
export const SWIPE_THRESHOLD = 120;
export const SWIPE_OUT_DURATION = 250;

const theme = {
  Colors,
  Spacing,
  BorderRadius,
  FontSize,
  FontWeight,
  FontFamily,
  Shadow,
  ZIndex,
  Animation,
};

export default theme;
