import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { HomeStackParamList } from "../../navigation/types";
import { useAuth } from "../../providers/AuthProvider";
import { useBalance } from "../../providers/BalanceProvider";
import {
  ChevronRight, Settings, Shield, Volume2, LogOut,
  History, Wallet, Users, Award,
} from "lucide-react-native";
import { colors, fonts, fontSize, radii } from "../../config/theme";

type Nav = NativeStackNavigationProp<HomeStackParamList>;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const { user, signOut } = useAuth();
  const { coins, cash } = useBalance();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Pressable onPress={() => nav.goBack()} style={styles.backRow}>
          <Text style={styles.backArrow}>{"\u2039"}</Text>
          <Text style={styles.headerTitle}>{"\u10DE\u10E0\u10DD\u10E4\u10D8\u10DA\u10D8"}</Text>
          <View style={{ width: 32 }} />
        </Pressable>

        {/* Avatar + name */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() || "👤"}</Text>
          </View>
          <Text style={styles.userName}>{user?.name || "Shansi User"}</Text>
          <Text style={styles.userPhone}>{user?.phone || ""}</Text>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{coins.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Coins</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>₾{cash.toFixed(2)}</Text>
              <Text style={styles.statLabel}>Winnings</Text>
            </View>
          </View>
        </View>

        {/* Menu items */}
        <View style={styles.menu}>
          <MenuItem icon={<Wallet size={20} color={colors.textSecondary} />} label="Wallet" onPress={() => nav.navigate("Wallet")} />
          <MenuItem icon={<History size={20} color={colors.textSecondary} />} label="History" onPress={() => nav.navigate("History")} />
          <MenuItem icon={<Users size={20} color={colors.textSecondary} />} label="Referral" onPress={() => nav.navigate("Referral")} />
          <MenuItem icon={<Award size={20} color={colors.textSecondary} />} label="Leaderboard" onPress={() => nav.navigate("Leaderboard")} />
        </View>

        <View style={styles.menu}>
          <MenuItem icon={<Settings size={20} color={colors.textSecondary} />} label="Settings" onPress={() => nav.navigate("Settings")} />
          <MenuItem icon={<Shield size={20} color={colors.textSecondary} />} label="Security" onPress={() => nav.navigate("Security")} />
          <MenuItem icon={<Volume2 size={20} color={colors.textSecondary} />} label="Audio" onPress={() => nav.navigate("AudioSettings")} />
        </View>

        <Pressable onPress={handleLogout} style={styles.logoutBtn}>
          <LogOut size={20} color={colors.error} />
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function MenuItem({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.menuItem}>
      {icon}
      <Text style={styles.menuLabel}>{label}</Text>
      <ChevronRight size={18} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  scroll: { paddingHorizontal: 16, paddingBottom: 100 },
  backRow: {
    flexDirection: "row", alignItems: "center", paddingVertical: 12,
  },
  backArrow: { color: colors.white, fontSize: 28, width: 32 },
  headerTitle: {
    flex: 1, color: colors.white, fontSize: fontSize.md + 1,
    fontFamily: fonts.outfit.semiBold, textAlign: "center",
  },
  profileCard: {
    backgroundColor: "#1C1C1E", borderRadius: radii.lg, padding: 24,
    alignItems: "center", marginBottom: 24,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: "#2A2A2E",
    alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  avatarText: { fontSize: 28, color: colors.white },
  userName: { color: colors.white, fontSize: 20, fontFamily: fonts.outfit.bold },
  userPhone: { color: colors.textSecondary, fontSize: 14, fontFamily: fonts.dmSans.regular, marginTop: 4 },
  statsRow: {
    flexDirection: "row", marginTop: 20, width: "100%",
    justifyContent: "center", gap: 24,
  },
  stat: { alignItems: "center" },
  statValue: { color: colors.white, fontSize: 18, fontFamily: fonts.outfit.bold },
  statLabel: { color: colors.textSecondary, fontSize: 12, fontFamily: fonts.dmSans.regular, marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: "#333" },
  menu: {
    backgroundColor: "#1C1C1E", borderRadius: radii.lg, marginBottom: 16,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 16,
    paddingVertical: 14, gap: 12, borderBottomWidth: 0.5,
    borderBottomColor: "#2A2A2E",
  },
  menuLabel: { flex: 1, color: colors.white, fontSize: 15, fontFamily: fonts.dmSans.medium },
  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 16, marginTop: 8,
  },
  logoutText: { color: colors.error, fontSize: 16, fontFamily: fonts.outfit.semiBold },
});
