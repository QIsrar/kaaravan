/**
 * KAARAVAN THEME TOKENS
 * 
 * IMPORTANT: This file must be usable in React Native (Expo).
 * - Do not use CSS functions like oklch(), calc(), or var().
 * - Store colors as plain hex strings.
 * - Store radii and spacing as plain numbers (pixels).
 * 
 * NOTE: The web app uses globals.css for styling with oklch() colors.
 * These hex values must visually match the oklch values in globals.css.
 * Keep both files in sync when updating the design system.
 */
export const theme = {
  colors: {
    light: {
      background: '#FEFAF1',
      foreground: '#121C23',
      card: '#FFFFFF',
      cardForeground: '#121C23',
      popover: '#FFFFFF',
      popoverForeground: '#121C23',
      primary: '#004744',
      primaryForeground: '#FEFAF1',
      secondary: '#F5D29C',
      secondaryForeground: '#002927',
      muted: '#F3EEE3',
      mutedForeground: '#726756',
      accent: '#C64E31',
      accentForeground: '#FCFCFC',
      destructive: '#D40924',
      destructiveForeground: '#FCFCFC',
      border: '#E3DDD1',
      input: '#E3DDD1',
      ring: '#004744',
      sidebar: '#FAF5EA',
      sidebarForeground: '#121C23',
      sidebarPrimary: '#004744',
      sidebarPrimaryForeground: '#FEFAF1',
      sidebarAccent: '#EEE7D9',
      sidebarAccentForeground: '#121C23',
      sidebarBorder: '#E3DDD1',
      sidebarRing: '#004744',
    },
    dark: {
      background: '#031515',
      foreground: '#F5F1EA',
      card: '#092121',
      cardForeground: '#F5F1EA',
      popover: '#092121',
      popoverForeground: '#F5F1EA',
      primary: '#25AEA7',
      primaryForeground: '#031515',
      secondary: '#59431F',
      secondaryForeground: '#F5F1EA',
      muted: '#152828',
      mutedForeground: '#A89D8A',
      accent: '#DF5F35',
      accentForeground: '#FCFCFC',
      destructive: '#DE3B3D',
      destructiveForeground: '#FCFCFC',
      border: '#1B3332',
      input: '#1B3332',
      ring: '#25AEA7',
      sidebar: '#071A19',
      sidebarForeground: '#F5F1EA',
      sidebarPrimary: '#25AEA7',
      sidebarPrimaryForeground: '#031515',
      sidebarAccent: '#152828',
      sidebarAccentForeground: '#F5F1EA',
      sidebarBorder: '#1B3332',
      sidebarRing: '#25AEA7',
    },
  },
  radii: {
    sm: 8,
    md: 11,
    lg: 14,
    xl: 18,
    '2xl': 22,
    '3xl': 28,
  },
  spacing: {
    4: 4,
    8: 8,
    12: 12,
    16: 16,
    24: 24,
    32: 32,
    48: 48,
  },
  fonts: {
    display: 'Outfit',
    body: 'Plus Jakarta Sans',
    urdu: 'Noto Nastaliq Urdu',
  }
};
