import Constants from "expo-constants";

// API base URL — reads from EAS env vars at build time,
// falls back to localhost for development.
export const API_BASE: string =
  Constants.expoConfig?.extra?.API_URL ||
  process.env.EXPO_PUBLIC_API_URL ||
  "http://localhost:3000";
