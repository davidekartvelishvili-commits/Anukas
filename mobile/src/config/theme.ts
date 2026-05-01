/**
 * Design tokens mirroring the web app's globals.css and CLAUDE.md design system.
 * Single source of truth for the mobile app's visual identity.
 */

export const colors = {
  bg: "#0A0F1C",
  surface: "#141B2D",
  card: "#1C2539",
  accent: "#00E88F",
  accentDark: "#00C577",
  textPrimary: "#F1F5F9",
  textSecondary: "#94A3B8",
  error: "#EF4444",
  warning: "#F59E0B",
  success: "#00E88F",
  gold: "#FFD700",
  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",
  // Game-specific
  slotGold: "#F9E741",
  winGreen: "#00E676",
  loseRed: "#FF3D3D",
  // Glass morphism overlay
  glassWhite: "rgba(255, 255, 255, 0.05)",
  glassBorder: "rgba(255, 255, 255, 0.10)",
} as const;

export const fonts = {
  outfit: {
    regular: "Outfit_400Regular",
    medium: "Outfit_500Medium",
    semiBold: "Outfit_600SemiBold",
    bold: "Outfit_700Bold",
    extraBold: "Outfit_800ExtraBold",
  },
  dmSans: {
    regular: "DMSans_400Regular",
    medium: "DMSans_500Medium",
    semiBold: "DMSans_600SemiBold",
  },
} as const;

export const radii = {
  xs: 4,
  sm: 8,   // inputs
  md: 12,  // buttons
  lg: 16,  // cards
  xl: 24,
  full: 9999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  display: 40,
} as const;
