import "react-native-gesture-handler";
import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Font from "expo-font";
import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
} from "@expo-google-fonts/outfit";
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
} from "@expo-google-fonts/dm-sans";
import { AuthProvider } from "./src/providers/AuthProvider";
import { BalanceProvider } from "./src/providers/BalanceProvider";
import RootNavigator from "./src/navigation/RootNavigator";
import { colors } from "./src/config/theme";

const linking: any = {
  prefixes: ["shansi://"],
  config: {
    screens: {
      Auth: "auth",
      Main: {
        screens: {
          HomeTab: {
            screens: {
              Referral: "referral/:code",
            },
          },
        },
      },
    },
  },
};

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    Font.loadAsync({
      Outfit_400Regular,
      Outfit_500Medium,
      Outfit_600SemiBold,
      Outfit_700Bold,
      Outfit_800ExtraBold,
      DMSans_400Regular,
      DMSans_500Medium,
      DMSans_600SemiBold,
    }).then(() => setFontsLoaded(true));
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <BalanceProvider>
          <NavigationContainer linking={linking}>
            <StatusBar style="light" />
            <RootNavigator />
          </NavigationContainer>
        </BalanceProvider>
      </AuthProvider>
    </SafeAreaProvider>
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
