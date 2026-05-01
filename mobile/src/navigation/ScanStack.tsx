import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { ScanStackParamList } from "./types";
import QRScannerScreen from "../screens/scan/QRScannerScreen";
import { colors } from "../config/theme";

const Stack = createNativeStackNavigator<ScanStackParamList>();

export default function ScanStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="QRScanner" component={QRScannerScreen} />
    </Stack.Navigator>
  );
}
