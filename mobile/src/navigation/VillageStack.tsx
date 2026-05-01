import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { VillageStackParamList } from "./types";
import VillageScreen from "../screens/village/VillageScreen";
import { colors } from "../config/theme";

const Stack = createNativeStackNavigator<VillageStackParamList>();

export default function VillageStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="VillageHome" component={VillageScreen} />
    </Stack.Navigator>
  );
}
