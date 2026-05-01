import { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  Image, RefreshControl, Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { HomeStackParamList } from "../../navigation/types";
import { getMe } from "../../services/auth";
import { apiFetch } from "../../services/api";
import { useAuth } from "../../providers/AuthProvider";
import { useBalance } from "../../providers/BalanceProvider";
import { colors, fonts, fontSize, radii, spacing } from "../../config/theme";

type Nav = NativeStackNavigationProp<HomeStackParamList>;
const { width: SCREEN_W } = Dimensions.get("window");

const ALL_GAMES = [
  { id: 1, name: "Midnight Machine", gameType: "slot", route: "MidnightMachine" as const, gradient: ["#4338CA", "#6366F1"] },
  { id: 3, name: "Lucky Step", gameType: "chicken_rush", route: "ChickenRush" as const, gradient: ["#1a237e", "#7c4dff"] },
  { id: 4, name: "Lucky Drop", gameType: "plinko", route: "LuckyDrop" as const, gradient: ["#1a237e", "#7c4dff"] },
  { id: 5, name: "Air Hockey", gameType: "air_hockey", route: "AirHockey" as const, gradient: ["#0A0F1C", "#1C2539"] },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const { user, updateUser } = useAuth();
  const { coins, cash, setCoins, setCash } = useBalance();
  const [refreshing, setRefreshing] = useState(false);
  const [activeGameTypes, setActiveGameTypes] = useState<string[]>(["slot", "plinko", "chicken_rush", "air_hockey"]);
  const [promoCount, setPromoCount] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const [meData, gamesData, offersData] = await Promise.all([
        getMe().catch(() => null),
        apiFetch("/games/config").catch(() => null),
        apiFetch("/offers?active=true").catch(() => null),
      ]);

      if (meData?.user) {
        updateUser(meData.user);
        setCoins(meData.user.coinBalance ?? 0);
        setCash(meData.user.balance ?? 0);
      }
      if (gamesData?.games) {
        const serverTypes: string[] = gamesData.games
          .filter((g: any) => g.isActive)
          .map((g: any) => g.gameType);
        setActiveGameTypes(Array.from(new Set([...serverTypes, "air_hockey"])));
      }
      if (offersData?.success && Array.isArray(offersData.offers)) {
        setPromoCount(offersData.offers.length);
      }
    } catch {}
  }, [updateUser, setCoins, setCash]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const navigateToGame = (route: string) => {
    // Navigate to GamesTab stack
    const parent = nav.getParent();
    if (parent) {
      parent.navigate("GamesTab", { screen: route });
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        {/* Header: balances + avatar */}
        <View style={styles.header}>
          <View style={styles.balanceRow}>
            {/* Coin balance */}
            <View style={styles.balancePill}>
              <Text style={styles.coinIcon}>🪙</Text>
              <Text style={styles.balanceText}>{coins.toLocaleString()}</Text>
            </View>
            {/* Cash balance */}
            <Pressable
              onPress={() => nav.navigate("Wallet")}
              style={styles.balancePill}
            >
              <Text style={styles.cashIcon}>₾</Text>
              <Text style={styles.balanceText}>{cash.toFixed(2)}</Text>
            </Pressable>
          </View>
          <Pressable
            onPress={() => nav.navigate("Profile")}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>
              {user?.name?.[0]?.toUpperCase() || "👤"}
            </Text>
          </Pressable>
        </View>

        {/* Featured Games */}
        <Text style={styles.sectionTitle}>Featured Games</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.gamesRow}
        >
          {ALL_GAMES.filter(g => activeGameTypes.includes(g.gameType)).map((game) => (
            <Pressable
              key={game.id}
              onPress={() => navigateToGame(game.route)}
              style={[styles.gameCard, { backgroundColor: game.gradient[0] }]}
            >
              <Text style={styles.gameCardName}>{game.name}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Quick actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <ActionCard
            label={"\u10E1\u10D9\u10D0\u10DC\u10D8"}
            emoji="📷"
            onPress={() => {
              const parent = nav.getParent();
              if (parent) parent.navigate("ScanTab");
            }}
          />
          <ActionCard
            label={"\u10E1\u10DD\u10E4\u10D4\u10DA\u10D8"}
            emoji="🏘️"
            onPress={() => {
              const parent = nav.getParent();
              if (parent) parent.navigate("VillageTab");
            }}
          />
          <ActionCard
            label={"\u10E0\u10D4\u10E4\u10D4\u10E0\u10D0\u10DA\u10D8"}
            emoji="🎁"
            badge={promoCount > 0 ? promoCount : undefined}
            onPress={() => nav.navigate("Referral")}
          />
          <ActionCard
            label={"\u10E8\u10D4\u10D7\u10D0\u10D5\u10D0\u10D6\u10D4\u10D1\u10D8"}
            emoji="🎫"
            onPress={() => nav.navigate("Promos")}
          />
        </View>

        {/* Wallet section */}
        <Pressable onPress={() => nav.navigate("Wallet")} style={styles.walletCard}>
          <View>
            <Text style={styles.walletLabel}>Your Winnings</Text>
            <Text style={styles.walletAmount}>₾ {cash.toFixed(2)}</Text>
          </View>
          <Text style={styles.walletArrow}>→</Text>
        </Pressable>

        {/* Leaderboard link */}
        <Pressable onPress={() => nav.navigate("Leaderboard")} style={styles.leaderboardCard}>
          <Text style={{ fontSize: 28 }}>🏆</Text>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.leaderboardTitle}>Leaderboard</Text>
            <Text style={styles.leaderboardSub}>See top referrers</Text>
          </View>
          <Text style={styles.walletArrow}>→</Text>
        </Pressable>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

function ActionCard({
  label, emoji, badge, onPress,
}: {
  label: string; emoji: string; badge?: number; onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.actionCard}>
      <View style={styles.actionIconWrap}>
        <Text style={{ fontSize: 24 }}>{emoji}</Text>
        {badge !== undefined && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: 24,
  },
  balanceRow: { flexDirection: "row", gap: 8 },
  balancePill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    backgroundColor: "#1C1C1E",
  },
  coinIcon: { fontSize: 18 },
  cashIcon: { fontSize: 18, color: colors.gold, fontFamily: fonts.outfit.bold },
  balanceText: {
    color: colors.white, fontSize: 14, fontFamily: fonts.outfit.bold,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: "#1C1C1E", alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontSize: 20, color: colors.white },
  sectionTitle: {
    color: colors.white, fontSize: 22, fontFamily: fonts.outfit.bold,
    marginBottom: 16, marginTop: 8,
  },
  gamesRow: { paddingRight: 16, gap: 12, marginBottom: 24 },
  gameCard: {
    width: 130, height: 130, borderRadius: 36,
    alignItems: "center", justifyContent: "flex-end",
    padding: 14,
  },
  gameCardName: {
    color: colors.white, fontSize: 13, fontFamily: fonts.outfit.semiBold,
    textAlign: "center",
  },
  actionsGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24,
  },
  actionCard: {
    width: (SCREEN_W - 32 - 12) / 2 - 0.5,
    backgroundColor: "#1C1C1E",
    borderRadius: radii.lg,
    padding: 16,
    alignItems: "flex-start",
  },
  actionIconWrap: { position: "relative", marginBottom: 8 },
  badge: {
    position: "absolute", top: -4, right: -10,
    backgroundColor: colors.error, borderRadius: 10,
    minWidth: 18, height: 18, alignItems: "center", justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: { color: colors.white, fontSize: 10, fontFamily: fonts.outfit.bold },
  actionLabel: {
    color: colors.white, fontSize: 14, fontFamily: fonts.dmSans.medium,
  },
  walletCard: {
    backgroundColor: "#1C1C1E", borderRadius: radii.lg,
    padding: 20, flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 12,
  },
  walletLabel: {
    color: colors.textSecondary, fontSize: 13, fontFamily: fonts.dmSans.regular,
    marginBottom: 4,
  },
  walletAmount: {
    color: colors.accent, fontSize: 24, fontFamily: fonts.outfit.bold,
  },
  walletArrow: { color: colors.textSecondary, fontSize: 20 },
  leaderboardCard: {
    backgroundColor: "#1C1C1E", borderRadius: radii.lg,
    padding: 16, flexDirection: "row", alignItems: "center",
  },
  leaderboardTitle: {
    color: colors.white, fontSize: 16, fontFamily: fonts.outfit.semiBold,
  },
  leaderboardSub: {
    color: colors.textSecondary, fontSize: 13, fontFamily: fonts.dmSans.regular,
    marginTop: 2,
  },
});
