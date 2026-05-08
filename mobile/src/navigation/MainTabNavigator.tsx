import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path, Circle, Line, Rect } from "react-native-svg";
import type { MainTabParamList } from "./types";
import HomeStack from "./HomeStack";
import GamesStack from "./GamesStack";
import VillageStack from "./VillageStack";
import ScanStack from "./ScanStack";
import { fonts } from "../config/theme";

const Tab = createBottomTabNavigator<MainTabParamList>();

/* ── Tab icons matching web exactly ── */

function HomeIcon({ active }: { active: boolean }) {
  const color = active ? "#FFF" : "rgba(255,255,255,0.4)";
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill={active ? "#FFF" : "none"} stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 11l8-7 8 7" />
      <Path d="M5 9.5v8a1 1 0 001 1h3v-4h4v4h3a1 1 0 001-1v-8" />
    </Svg>
  );
}

function GamesIcon({ active }: { active: boolean }) {
  const color = active ? "#FFF" : "rgba(255,255,255,0.4)";
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Circle cx={7} cy={7} r={2.2} fill={active ? "#FFF" : "none"} stroke={color} strokeWidth={1.5} />
      <Circle cx={15} cy={7} r={2.2} fill={active ? "#FFF" : "none"} stroke={color} strokeWidth={1.5} />
      <Circle cx={7} cy={15} r={2.2} fill={active ? "#FFF" : "none"} stroke={color} strokeWidth={1.5} />
      <Circle cx={15} cy={15} r={2.2} fill={active ? "#FFF" : "none"} stroke={color} strokeWidth={1.5} />
    </Svg>
  );
}

function VillageIcon({ active }: { active: boolean }) {
  const color = active ? "#FFF" : "rgba(255,255,255,0.4)";
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 20V10l8-7 8 7v10" />
      <Path d="M8 20v-5h6v5" />
      <Path d="M1 20h20" />
      <Circle cx={17} cy={6} r={2} fill={active ? "#FFF" : "none"} />
    </Svg>
  );
}

function ScanIcon({ active }: { active: boolean }) {
  const color = active ? "#FFF" : "rgba(255,255,255,0.4)";
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M2 7V4a2 2 0 012-2h3" />
      <Path d="M15 2h3a2 2 0 012 2v3" />
      <Path d="M20 15v3a2 2 0 01-2 2h-3" />
      <Path d="M7 20H4a2 2 0 01-2-2v-3" />
      <Line x1={2} y1={11} x2={20} y2={11} />
    </Svg>
  );
}

const TAB_CONFIG = [
  { name: "HomeTab" as const, label: "Home", icon: HomeIcon },
  { name: "GamesTab" as const, label: "Games", icon: GamesIcon },
  { name: "VillageTab" as const, label: "Village", icon: VillageIcon },
  { name: "ScanTab" as const, label: "Scan", icon: ScanIcon },
];

function FloatingTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBarOuter, { paddingBottom: Math.max(12, insets.bottom) }]}>
      <View style={styles.tabBarPill}>
        {state.routes.map((route: any, index: number) => {
          const config = TAB_CONFIG[index];
          if (!config) return null;
          const isFocused = state.index === index;
          const IconComp = config.icon;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={[
                styles.tab,
                isFocused && styles.tabActive,
              ]}
            >
              <IconComp active={isFocused} />
              <Text style={[styles.tabLabel, { color: isFocused ? "#FFFFFF" : "rgba(255,255,255,0.4)" }]}>
                {config.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="HomeTab" component={HomeStack} />
      <Tab.Screen name="GamesTab" component={GamesStack} />
      <Tab.Screen name="VillageTab" component={VillageStack} />
      <Tab.Screen name="ScanTab" component={ScanStack} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarOuter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  tabBarPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: "rgba(30, 30, 30, 0.75)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.12)",
    // Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
  tab: {
    flexDirection: "column",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  tabActive: {
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 4,
    fontFamily: fonts.dmSans.medium,
  },
});
