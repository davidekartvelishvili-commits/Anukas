import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Home, ScanLine, Gamepad2, Swords } from "lucide-react-native";
import type { MainTabParamList } from "./types";
import HomeStack from "./HomeStack";
import GamesStack from "./GamesStack";
import VillageStack from "./VillageStack";
import ScanStack from "./ScanStack";
import { colors, fonts, fontSize } from "../config/theme";

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_CONFIG = [
  { name: "HomeTab" as const, label: "მთავარი", Icon: Home },
  { name: "GamesTab" as const, label: "თამაში", Icon: Gamepad2 },
  { name: "VillageTab" as const, label: "სოფელი", Icon: Swords },
  { name: "ScanTab" as const, label: "სკანი", Icon: ScanLine },
];

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 20) }]}>
      {state.routes.map((route: any, index: number) => {
        const config = TAB_CONFIG[index];
        if (!config) return null;
        const isFocused = state.index === index;
        const { Icon } = config;

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
          <Pressable key={route.key} onPress={onPress} style={styles.tab}>
            {isFocused && <View style={styles.activeIndicator} />}
            <Icon
              size={22}
              color={isFocused ? colors.accent : "#475569"}
              strokeWidth={2}
            />
            <Text
              style={[
                styles.tabLabel,
                { color: isFocused ? colors.accent : "#475569" },
              ]}
            >
              {config.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
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
  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.card,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingTop: 4,
    paddingBottom: 2,
    position: "relative",
  },
  activeIndicator: {
    position: "absolute",
    top: 0,
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
  tabLabel: {
    fontSize: fontSize.xs,
    marginTop: 3,
    fontFamily: fonts.dmSans.medium,
  },
});
