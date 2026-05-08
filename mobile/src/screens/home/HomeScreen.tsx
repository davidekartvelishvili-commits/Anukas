import { useState, useEffect, useCallback, useRef } from "react";
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  Image, RefreshControl, Dimensions, Modal, TextInput,
  Animated as RNAnimated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { HomeStackParamList } from "../../navigation/types";
import { getMe } from "../../services/auth";
import { apiFetch } from "../../services/api";
import { useAuth } from "../../providers/AuthProvider";
import { useBalance } from "../../providers/BalanceProvider";
import { LinearGradient } from "expo-linear-gradient";
import { colors, fonts, fontSize } from "../../config/theme";

type Nav = NativeStackNavigationProp<HomeStackParamList>;
const { width: SW } = Dimensions.get("window");

const ALL_GAMES = [
  { id: 1, name: "Midnight Machine", gameType: "slot", route: "MidnightMachine" as const, gradient: ["#4338CA", "#6366F1"], cover: require("../../../assets/lucky-step-cover.png") },
  { id: 3, name: "Lucky Step", gameType: "chicken_rush", route: "ChickenRush" as const, gradient: ["#1a237e", "#7c4dff"], cover: require("../../../assets/lucky-step-cover.png") },
  { id: 4, name: "Lucky Drop", gameType: "plinko", route: "LuckyDrop" as const, gradient: ["#1a237e", "#7c4dff"], cover: require("../../../assets/lucky-drop-cover.png") },
  { id: 5, name: "Air Hockey", gameType: "air_hockey", route: "AirHockey" as const, gradient: ["#0A0F1C", "#1C2539"], cover: require("../../../assets/air-hockey-cover.png") },
];

interface RecentWin {
  id: string;
  name: string;
  coins: number;
  game: string;
  createdAt: string;
}

function timeAgo(dateStr: string): string {
  try {
    const d = new Date(dateStr.includes("T") ? dateStr : dateStr.replace(" ", "T") + "Z");
    const sec = Math.floor((Date.now() - d.getTime()) / 1000);
    if (sec < 60) return "\u10D0\u10EE\u10DA\u10D0";
    if (sec < 3600) return `${Math.floor(sec / 60)} \u10EC\u10D7`;
    if (sec < 86400) return `${Math.floor(sec / 3600)} \u10E1\u10D7`;
    return `${Math.floor(sec / 86400)} \u10D3\u10E6\u10D4`;
  } catch {
    return "";
  }
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const { user, updateUser } = useAuth();
  const { coins, cash, setCoins, setCash } = useBalance();
  const [refreshing, setRefreshing] = useState(false);
  const [activeGameTypes, setActiveGameTypes] = useState<string[]>(["slot", "plinko", "chicken_rush", "air_hockey"]);
  const [promoCount, setPromoCount] = useState(0);
  const [promoSeenToday, setPromoSeenToday] = useState(false);
  const [recentWins, setRecentWins] = useState<RecentWin[]>([]);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [showExchange, setShowExchange] = useState(false);
  const [exchangeAmount, setExchangeAmount] = useState("");

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

  // Live Recent Wins polling
  useEffect(() => {
    let alive = true;
    const fetchWins = () => {
      apiFetch("/public/recent-wins").then((data: any) => {
        if (alive && data?.success && Array.isArray(data.wins)) {
          setRecentWins(data.wins);
        }
      }).catch(() => {});
    };
    fetchWins();
    const interval = setInterval(fetchWins, 8000);
    return () => { alive = false; clearInterval(interval); };
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const navigateToGame = (route: string) => {
    const parent = nav.getParent();
    if (parent) parent.navigate("GamesTab", { screen: route });
  };

  const handleExchange = async () => {
    const amt = parseFloat(exchangeAmount);
    if (!amt || amt <= 0 || amt > cash) return;
    try {
      const res = await apiFetch("/user/exchange", {
        method: "POST",
        body: JSON.stringify({ amount: amt }),
      });
      if (res?.success) {
        setCash(res.cashBalance ?? cash - amt);
        setCoins(res.coinBalance ?? coins + amt * 100);
        setShowExchange(false);
        setExchangeAmount("");
      }
    } catch {}
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
        {/* ── Header: balances + avatar ── */}
        <View style={styles.header}>
          <View style={styles.balanceRow}>
            {/* Coin balance */}
            <View style={styles.balancePill}>
              <Image source={require("../../../assets/coin-icon.png")} style={{ width: 22, height: 22 }} resizeMode="contain" />
              <Text style={styles.balanceText}>{coins.toLocaleString()}</Text>
            </View>
            {/* Cash balance — tappable */}
            <Pressable
              onPress={() => setShowBalanceModal(true)}
              style={({ pressed }) => [styles.balancePill, pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] }]}
            >
              <Image source={require("../../../assets/lari-icon.png")} style={{ width: 38, height: 38 }} resizeMode="contain" />
              <Text style={styles.balanceText}>{cash.toFixed(2)}</Text>
            </Pressable>
          </View>
          {/* Avatar */}
          <Pressable
            onPress={() => nav.navigate("Profile")}
            style={({ pressed }) => [styles.avatar, pressed && { transform: [{ scale: 0.95 }] }]}
          >
            <LinearGradient colors={["#C4E0F9", "#E8D5F5"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatarGradient}>
              <Image source={require("../../../assets/profile-avatar.png")} style={styles.avatarImage} />
            </LinearGradient>
          </Pressable>
        </View>

        {/* ── Featured Games ── */}
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
              style={({ pressed }) => [styles.gameCard, pressed && { transform: [{ scale: 0.97 }] }]}
            >
              <Image source={game.cover} style={StyleSheet.absoluteFill} resizeMode="cover" />
              {/* Gradient overlay at bottom */}
              <View style={styles.gameCardGradient}>
                <Text style={styles.gameCardName}>{game.name}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        {/* ── Today's Promo Inbox ── */}
        <Pressable
          onPress={() => {
            setPromoSeenToday(true);
            nav.navigate("Promos");
          }}
          style={({ pressed }) => [styles.promoCard, pressed && { transform: [{ scale: 0.98 }] }]}
        >
          <View style={styles.promoLeft}>
            <Image source={require("../../../assets/trophy.png")} style={{ width: 36, height: 36 }} resizeMode="contain" />
            <Text style={styles.promoText}>Today's Promo Inbox</Text>
          </View>
          {!promoSeenToday && promoCount > 0 && (
            <View style={styles.promoBadge}>
              <Text style={styles.promoBadgeText}>{promoCount}</Text>
            </View>
          )}
        </Pressable>

        {/* ── Live Recent Wins ── */}
        {recentWins.length > 0 && (
          <View style={{ marginTop: 20 }}>
            <View style={styles.liveHeader}>
              <View style={styles.liveDot} />
              <Text style={styles.liveTitle}>Live Wins</Text>
            </View>
            {recentWins.map((win) => (
              <View key={win.id} style={styles.winRow}>
                <View style={styles.winAvatar}>
                  <Text style={styles.winAvatarText}>{win.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.winName}>
                    {win.name}
                    <Text style={styles.winGame}> — {win.game}</Text>
                  </Text>
                </View>
                <View style={styles.winCoinsWrap}>
                  <Image source={require("../../../assets/coin-icon.png")} style={{ width: 14, height: 14 }} resizeMode="contain" />
                  <Text style={styles.winCoins}>+{win.coins.toLocaleString()}</Text>
                </View>
                <Text style={styles.winTime}>{timeAgo(win.createdAt)}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ── Balance Modal ── */}
      <Modal visible={showBalanceModal} transparent animationType="slide" onRequestClose={() => setShowBalanceModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowBalanceModal(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select an Option</Text>
            <View style={styles.modalOptions}>
              {/* Exchange */}
              <Pressable
                style={({ pressed }) => [styles.modalOption, pressed && { opacity: 0.8 }]}
                onPress={() => {
                  setShowBalanceModal(false);
                  setExchangeAmount("");
                  setShowExchange(true);
                }}
              >
                <View style={styles.modalOptionIconWhite}>
                  <Text style={{ fontSize: 22 }}>⇄</Text>
                </View>
                <Text style={styles.modalOptionText}>Exchange</Text>
              </Pressable>
              {/* Redeem Balance */}
              <Pressable
                style={({ pressed }) => [styles.modalOption, pressed && { opacity: 0.8 }]}
                onPress={() => {
                  setShowBalanceModal(false);
                  nav.navigate("Wallet");
                }}
              >
                <View style={styles.modalOptionIconGray}>
                  <Text style={{ fontSize: 22, color: "#999" }}>↗</Text>
                </View>
                <Text style={[styles.modalOptionText, { color: "#999" }]}>Redeem Balance</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Exchange Modal ── */}
      <Modal visible={showExchange} transparent animationType="slide" onRequestClose={() => setShowExchange(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowExchange(false)}>
          <Pressable style={styles.exchangeSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Exchange</Text>

            {/* Cash input */}
            <View style={styles.exchangeRow}>
              <Image source={require("../../../assets/lari-icon.png")} style={{ width: 50, height: 50 }} resizeMode="contain" />
              <TextInput
                value={exchangeAmount}
                onChangeText={setExchangeAmount}
                placeholder="0"
                placeholderTextColor="#666"
                keyboardType="decimal-pad"
                style={styles.exchangeInput}
              />
              <Text style={styles.exchangeBalance}>Balance: {cash.toFixed(2)} ₾</Text>
            </View>

            {/* Arrow */}
            <View style={{ alignItems: "center", paddingVertical: 8 }}>
              <Text style={{ color: "#F9E741", fontSize: 20 }}>↓</Text>
            </View>

            {/* Coin output */}
            <View style={[styles.exchangeRow, { marginBottom: 16 }]}>
              <Image source={require("../../../assets/coin-icon.png")} style={{ width: 42, height: 42 }} resizeMode="contain" />
              <Text style={styles.exchangeOutput}>
                {exchangeAmount ? (parseFloat(exchangeAmount) * 100).toLocaleString() : "0"}
              </Text>
              <Text style={styles.exchangeBalance}>Coins</Text>
            </View>

            {/* Rate */}
            <Text style={styles.exchangeRate}>1₾ Cash = 100 Coin</Text>

            {/* Exchange button */}
            <Pressable
              onPress={handleExchange}
              disabled={!exchangeAmount || parseFloat(exchangeAmount) <= 0 || parseFloat(exchangeAmount) > cash}
              style={({ pressed }) => [
                styles.exchangeButton,
                (!exchangeAmount || parseFloat(exchangeAmount) <= 0) && { opacity: 0.4 },
                pressed && { transform: [{ scale: 0.97 }] },
              ]}
            >
              <Text style={styles.exchangeButtonText}>Exchange</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 },

  // Header
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: 24,
  },
  balanceRow: { flexDirection: "row", gap: 8 },
  balancePill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9999,
    backgroundColor: "#1C1C1E",
  },
  balanceText: {
    color: "#FFFFFF", fontSize: 14, fontFamily: fonts.outfit.bold,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24, overflow: "hidden",
  },
  avatarGradient: {
    width: 48, height: 48, borderRadius: 24, overflow: "hidden",
  },
  avatarImage: {
    width: 48, height: 48,
  },

  // Section title
  sectionTitle: {
    color: "#FFFFFF", fontSize: 22, fontFamily: fonts.outfit.bold,
    marginBottom: 16, marginTop: 8,
  },

  // Games
  gamesRow: { paddingRight: 16, gap: 12, marginBottom: 24 },
  gameCard: {
    width: 130, height: 130, borderRadius: 36,
    overflow: "hidden",
  },
  gameCardGradient: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: 14, paddingBottom: 14, paddingTop: 30,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  gameCardName: {
    color: "#FFFFFF", fontSize: 16, fontFamily: fonts.outfit.bold,
  },

  // Promo inbox
  promoCard: {
    marginTop: 24,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 20,
    borderRadius: 20,
    backgroundColor: "#A8E06C",
  },
  promoLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  promoText: {
    fontSize: 17, fontFamily: fonts.outfit.bold, color: "#1A1A1A",
  },
  promoBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "#EF4444",
    alignItems: "center", justifyContent: "center",
  },
  promoBadgeText: {
    color: "#FFFFFF", fontSize: 13, fontFamily: fonts.outfit.bold,
  },

  // Live Wins
  liveHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#22C55E" },
  liveTitle: { color: "#F1F5F9", fontSize: 14, fontFamily: fonts.outfit.bold },
  winRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 12, backgroundColor: "#141B2D",
    marginBottom: 6,
  },
  winAvatar: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: "#1C2539",
    alignItems: "center", justifyContent: "center",
  },
  winAvatarText: { color: "#F1F5F9", fontSize: 11, fontFamily: fonts.outfit.bold },
  winName: { color: "#F1F5F9", fontSize: 13, fontFamily: fonts.dmSans.semiBold },
  winGame: { color: "#64748B", fontFamily: fonts.dmSans.regular },
  winCoinsWrap: { flexDirection: "row", alignItems: "center", gap: 4, marginRight: 8 },
  winCoins: { color: "#FFE500", fontSize: 13, fontFamily: fonts.outfit.bold },
  winTime: { color: "#475569", fontSize: 10, fontFamily: fonts.dmSans.regular },

  // Balance Modal
  modalOverlay: {
    flex: 1, justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalSheet: {
    backgroundColor: "rgba(50,50,50,0.55)",
    borderTopLeftRadius: 36, borderTopRightRadius: 36,
    paddingTop: 12, paddingBottom: 32, paddingHorizontal: 20,
  },
  modalHandle: {
    width: 36, height: 5, borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignSelf: "center", marginBottom: 20,
  },
  modalTitle: {
    color: "#FFFFFF", fontSize: 20, fontFamily: fonts.outfit.bold,
    textAlign: "center", marginBottom: 24,
  },
  modalOptions: { flexDirection: "row", gap: 12, marginBottom: 8 },
  modalOption: {
    flex: 1, alignItems: "center", gap: 12,
    paddingVertical: 24, borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
  },
  modalOptionIconWhite: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: "#FFFFFF",
    alignItems: "center", justifyContent: "center",
  },
  modalOptionIconGray: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: "#3A3A3C",
    alignItems: "center", justifyContent: "center",
  },
  modalOptionText: {
    color: "#FFFFFF", fontSize: 14, fontFamily: fonts.dmSans.semiBold,
  },

  // Exchange Modal
  exchangeSheet: {
    backgroundColor: "rgba(30,30,30,0.55)",
    borderTopLeftRadius: 36, borderTopRightRadius: 36,
    paddingTop: 12, paddingBottom: 32, paddingHorizontal: 20,
  },
  exchangeRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)",
  },
  exchangeInput: {
    flex: 1, color: "#FFFFFF", fontSize: 22, fontFamily: fonts.outfit.bold,
    marginLeft: 8, padding: 0,
  },
  exchangeOutput: {
    flex: 1, color: "#FFFFFF", fontSize: 22, fontFamily: fonts.outfit.bold,
    marginLeft: 8,
  },
  exchangeBalance: {
    color: "#999", fontSize: 15, fontFamily: fonts.dmSans.semiBold,
  },
  exchangeRate: {
    color: "#999", fontSize: 13, fontFamily: fonts.dmSans.regular,
    textAlign: "center", marginBottom: 20,
  },
  exchangeButton: {
    alignSelf: "center",
    paddingHorizontal: 40, paddingVertical: 18,
    borderRadius: 9999,
    backgroundColor: "#F9E741",
  },
  exchangeButtonText: {
    color: "#000000", fontSize: 16, fontFamily: fonts.outfit.bold,
  },
});
