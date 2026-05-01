import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { HomeStackParamList } from "./types";
import HomeScreen from "../screens/home/HomeScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";
import SettingsScreen from "../screens/settings/SettingsScreen";
import SecurityScreen from "../screens/settings/SecurityScreen";
import AudioSettingsScreen from "../screens/settings/AudioSettingsScreen";
import WalletScreen from "../screens/wallet/WalletScreen";
import HistoryScreen from "../screens/history/HistoryScreen";
import ReferralScreen from "../screens/referral/ReferralScreen";
import LeaderboardScreen from "../screens/leaderboard/LeaderboardScreen";
import NotificationsScreen from "../screens/notifications/NotificationsScreen";
import PromosScreen from "../screens/promos/PromosScreen";
import MysteryBoxScreen from "../screens/mystery-box/MysteryBoxScreen";
import NearbyScreen from "../screens/nearby/NearbyScreen";
import PlaceDetailScreen from "../screens/place/PlaceDetailScreen";
import { colors } from "../config/theme";

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Security" component={SecurityScreen} />
      <Stack.Screen name="AudioSettings" component={AudioSettingsScreen} />
      <Stack.Screen name="Wallet" component={WalletScreen} />
      <Stack.Screen name="History" component={HistoryScreen} />
      <Stack.Screen name="Referral" component={ReferralScreen} />
      <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Promos" component={PromosScreen} />
      <Stack.Screen name="MysteryBox" component={MysteryBoxScreen} />
      <Stack.Screen name="Nearby" component={NearbyScreen} />
      <Stack.Screen name="PlaceDetail" component={PlaceDetailScreen} />
    </Stack.Navigator>
  );
}
