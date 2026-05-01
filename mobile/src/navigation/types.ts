import type { NavigatorScreenParams } from "@react-navigation/native";

// ── Auth Stack ──
export type AuthStackParamList = {
  PhoneEntry: undefined;
  OtpVerify: { phone: string };
  PinSetup: { phone: string; token: string };
  PinLogin: { phone: string };
};

// ── Home Stack ──
export type HomeStackParamList = {
  HomeScreen: undefined;
  Profile: undefined;
  Settings: undefined;
  Security: undefined;
  AudioSettings: undefined;
  Wallet: undefined;
  History: undefined;
  Referral: undefined;
  Leaderboard: undefined;
  Notifications: undefined;
  Promos: undefined;
  MysteryBox: undefined;
  Nearby: undefined;
  PlaceDetail: { id: string };
};

// ── Games Stack ──
export type GamesStackParamList = {
  GamesHub: undefined;
  MidnightMachine: undefined;
  LuckyDrop: undefined;
  ChickenRush: undefined;
  AirHockey: undefined;
};

// ── Village Stack ──
export type VillageStackParamList = {
  VillageHome: undefined;
};

// ── Scan Stack ──
export type ScanStackParamList = {
  QRScanner: undefined;
};

// ── Main Tab Navigator ──
export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  GamesTab: NavigatorScreenParams<GamesStackParamList>;
  VillageTab: NavigatorScreenParams<VillageStackParamList>;
  ScanTab: NavigatorScreenParams<ScanStackParamList>;
};

// ── Root Navigator ──
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};
