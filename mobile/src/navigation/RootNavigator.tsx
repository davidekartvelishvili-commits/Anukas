import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "./MainTabNavigator";
import PhoneEntryScreen from "../screens/auth/PhoneEntryScreen";
import OtpVerifyScreen from "../screens/auth/OtpVerifyScreen";
import PinSetupScreen from "../screens/auth/PinSetupScreen";
import PinLoginScreen from "../screens/auth/PinLoginScreen";
import { useAuth } from "../providers/AuthProvider";
import { colors } from "../config/theme";
import { ActivityIndicator, View, StyleSheet } from "react-native";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#000000" },
        animation: "slide_from_right",
      }}
    >
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainTabNavigator} />
      ) : (
        <>
          <Stack.Screen name="PhoneEntry" component={PhoneEntryScreen} />
          <Stack.Screen name="OtpVerify" component={OtpVerifyScreen} />
          <Stack.Screen name="PinSetup" component={PinSetupScreen} />
          <Stack.Screen name="PinLogin" component={PinLoginScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
});
