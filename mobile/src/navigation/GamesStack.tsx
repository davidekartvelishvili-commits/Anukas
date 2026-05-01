import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { GamesStackParamList } from "./types";
import GamesHubScreen from "../screens/games/GamesHubScreen";
import MidnightMachineScreen from "../screens/games/MidnightMachineScreen";
import LuckyDropScreen from "../screens/games/LuckyDropScreen";
import ChickenRushScreen from "../screens/games/ChickenRushScreen";
import AirHockeyScreen from "../screens/games/AirHockeyScreen";
import { colors } from "../config/theme";

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
