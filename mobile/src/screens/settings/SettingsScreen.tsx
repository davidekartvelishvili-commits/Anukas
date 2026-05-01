import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { HomeStackParamList } from "../../navigation/types";
import { useAuth } from "../../providers/AuthProvider";
import { ChevronRight, Shield, Volume2, LogOut } from "lucide-react-native";
import { colors, fonts, fontSize, radii } from "../../config/theme";

type Nav = NativeStackNavigationProp<HomeStackParamList>;

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const { signOut } = useAuth();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => nav.goBack()} style={styles.backBtn}>
            <Text style={styles.backArrow}>{"\u2039"}</Text>
          </Pressable>
          <Text style={styles.headerTitle}>{"\u10DE\u10D0\u10E0\u10D0\u10DB\u10D4\u10E2\u10E0\u10D4\u10D1\u10D8"}</Text>
          <View style={{ width: 32 }} />
        </View>

        <View style={styles.menu}>
          <MenuItem label="Security / PIN" onPress={() => nav.navigate("Security")} />
          <MenuItem label="Audio Settings" onPress={() => nav.navigate("AudioSettings")} />
          <MenuItem label="Notifications" onPress={() => nav.navigate("Notifications")} />
        </View>

        <View style={styles.menu}>
          <MenuItem label="Terms of Service" onPress={() => {}} />
          <MenuItem label="Privacy Policy" onPress={() => {}} />
        </View>

        <Pressable onPress={signOut} style={styles.logoutBtn}>
          <LogOut size={20} color={colors.error} />
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>

        <Text style={styles.version}>Shansi v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

function MenuItem({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.menuItem}>
      <Text style={styles.menuLabel}>{label}</Text>
      <ChevronRight size={18} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  scroll: { paddingHorizontal: 16, paddingBottom: 100 },
  headerRow: {
    flexDirection: "row", alignItems: "center", paddingVertical: 12,
  },
  backBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  backArrow: { color: colors.white, fontSize: 28 },
  headerTitle: {
    flex: 1, color: colors.white, fontSize: fontSize.md + 1,
    fontFamily: fonts.outfit.semiBold, textAlign: "center",
  },
  menu: {
    backgroundColor: "#1C1C1E", borderRadius: radii.lg, marginBottom: 16,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 16,
    paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: "#2A2A2E",
  },
  menuLabel: { flex: 1, color: colors.white, fontSize: 15, fontFamily: fonts.dmSans.medium },
  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 16, marginTop: 8,
  },
  logoutText: { color: colors.error, fontSize: 16, fontFamily: fonts.outfit.semiBold },
  version: {
    color: colors.textSecondary, fontSize: 12, fontFamily: fonts.dmSans.regular,
    textAlign: "center", marginTop: 24,
  },
});
