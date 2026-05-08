import React, { useState, useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { GamesStackParamList } from "./types";
import GamesHubScreen from "../screens/games/GamesHubScreen";
import ChickenRushScreen from "../screens/games/ChickenRushScreen";
import { colors } from "../config/theme";
import { View, Text, ActivityIndicator } from "react-native";

// Skia-based screens don't work in Expo Go — load dynamically with fallback
function createSafeScreen(importFn: () => Promise<any>) {
  return function SafeScreen(props: any) {
    const [Screen, setScreen] = useState<React.ComponentType<any> | null>(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
      importFn()
        .then((mod) => setScreen(() => mod.default))
        .catch(() => setFailed(true));
    }, []);

    if (failed) {
      return (
        <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center", padding: 24 }}>
          <Text style={{ color: "#F1F5F9", fontSize: 18, textAlign: "center" }}>
            This game requires a custom build and is not available in Expo Go.
          </Text>
        </View>
      );
    }

    if (!Screen) {
      return (
        <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color="#00E88F" size="large" />
        </View>
      );
    }

    return <Screen {...props} />;
  };
}

const MidnightMachineScreen = createSafeScreen(() => import("../screens/games/MidnightMachineScreen"));
const LuckyDropScreen = createSafeScreen(() => import("../screens/games/LuckyDropScreen"));
const AirHockeyScreen = createSafeScreen(() => import("../screens/games/AirHockeyScreen"));

const Stack = createNativeStackNavigator<GamesStackParamList>();

export default function GamesStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="GamesHub" component={GamesHubScreen} />
      <Stack.Screen name="MidnightMachine" component={MidnightMachineScreen} />
      <Stack.Screen name="LuckyDrop" component={LuckyDropScreen} />
      <Stack.Screen name="ChickenRush" component={ChickenRushScreen} />
      <Stack.Screen name="AirHockey" component={AirHockeyScreen} />
    </Stack.Navigator>
  );
}
