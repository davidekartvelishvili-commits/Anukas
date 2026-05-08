import { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, Pressable, StyleSheet, Image,
  Modal, TextInput, Share, ActivityIndicator, Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { HomeStackParamList } from "../../navigation/types";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../providers/AuthProvider";
import { useBalance } from "../../providers/BalanceProvider";
import { getMe } from "../../services/auth";
import { apiFetch } from "../../services/api";
import { colors, fonts, fontSize } from "../../config/theme";
import Svg, { Path, Circle as SvgCircle, Rect, Line } from "react-native-svg";

type Nav = NativeStackNavigationProp<HomeStackParamList>;

interface Activity {
  id?: string;
  type: string;
  title: string;
  description: string;
  transactionId?: string;
  color?: string;
  createdAt: string;
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d`;
  if (h > 0) return `${h}h`;
  const m = Math.floor(diff / 60000);
  return `${m}m`;
}

function getActivityEmoji(type: string): string {
  switch (type) {
    case "payment": return "\uD83D\uDCB3";
    case "game_win": return "\uD83C\uDFC6";
    case "game_loss": return "\uD83C\uDFB0";
    case "withdrawal": return "\u2191";
    case "referral": return "\uD83D\uDC65";
    case "promo": return "\uD83C\uDF81";
    default: return "\u20BE";
  }
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const { user, signOut, updateUser } = useAuth();
  const { coins, cash, setCoins, setCash } = useBalance();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [refTotal, setRefTotal] = useState(0);
  const [refCoinsEarned, setRefCoinsEarned] = useState(0);
  const [refConfig, setRefConfig] = useState({ signupRewardLari: 10, referrerRewardCoins: 10, bonusEveryN: 5, bonusRewardCoins: 25, shareMessageTemplate: "" });
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [showExchange, setShowExchange] = useState(false);
  const [exchangeAmount, setExchangeAmount] = useState("");

  useEffect(() => {
    // Fetch user data
    getMe().then((data: any) => {
      if (data?.user) {
        updateUser(data.user);
        setCoins(data.user.coinBalance ?? 0);
        setCash(data.user.balance ?? 0);
        if (data.user.referralCode) setReferralCode(data.user.referralCode);
      }
    }).catch(() => {});

    // Activities
    setActivityLoading(true);
    apiFetch("/user/activity?limit=50").then((data: any) => {
      if (data?.success && Array.isArray(data.activities)) setActivities(data.activities);
    }).catch(() => {}).finally(() => setActivityLoading(false));

    // Referral data
    apiFetch("/user/referral").then((data: any) => {
      if (data?.success) {
        if (data.referralCode) setReferralCode(data.referralCode);
        setRefTotal(data.totalReferrals || 0);
        setRefCoinsEarned(data.totalCoinsEarned || 0);
      }
    }).catch(() => {});

    // Referral config
    apiFetch("/public/referral-config").then((data: any) => {
      if (data?.success && data.config) {
        setRefConfig({
          signupRewardLari: data.config.signupRewardLari ?? 10,
          referrerRewardCoins: data.config.referrerRewardCoins ?? 10,
          bonusEveryN: data.config.bonusEveryN ?? 5,
          bonusRewardCoins: data.config.bonusRewardCoins ?? 25,
          shareMessageTemplate: data.config.shareMessageTemplate || "",
        });
      }
    }).catch(() => {});
  }, []);

  const handleShare = async () => {
    const msg = `Join me on Shansi! Use my referral code: ${referralCode} to get ${refConfig.signupRewardLari} \u20BE`;
    const url = `https://shansi.vercel.app/?ref=${encodeURIComponent(referralCode)}`;
    try {
      await Share.share({ message: `${msg}\n\n${url}` });
    } catch {}
  };

  const handleExchange = async () => {
    const amt = parseFloat(exchangeAmount);
    if (!amt || amt <= 0 || amt > cash) return;
    try {
      const res = await apiFetch("/user/exchange", { method: "POST", body: JSON.stringify({ amount: amt }) });
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
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Top bar: back + settings ── */}
        <View style={styles.topBar}>
          <Pressable onPress={() => nav.goBack()} style={({ pressed }) => [styles.topBtn, pressed && { transform: [{ scale: 0.95 }] }]}>
            <Svg width={20} height={20} viewBox="0 0 20 20" fill="none" stroke="#FFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M13 4l-6 6 6 6" />
            </Svg>
          </Pressable>
          <Pressable onPress={() => nav.navigate("Settings")} style={({ pressed }) => [styles.topBtn, pressed && { transform: [{ scale: 0.95 }] }]}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z" />
              <SvgCircle cx={12} cy={12} r={3} />
            </Svg>
          </Pressable>
        </View>

        {/* ── Avatar ── */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarGradientBg}>
            <LinearGradient colors={["#C4E0F9", "#E8D5F5"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatarWrap}>
              <Image source={require("../../../assets/profile-avatar.png")} style={styles.avatarImage} />
            </LinearGradient>
            {/* Upload button */}
            <Pressable style={styles.uploadBtn}>
              <Svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="#FFF" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M4 14h8" />
                <Path d="M8 10V2" />
                <Path d="M5 5l3-3 3 3" />
              </Svg>
            </Pressable>
          </View>
          {/* Username with edit pencil */}
          <Pressable style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={styles.userName}>{user?.name || "User"}</Text>
            <Svg width={14} height={14} viewBox="0 0 14 14" fill="none" stroke="#666" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M10 1.5l2.5 2.5M1.5 12.5l.5-2L9.5 3l2.5 2.5L4.5 13l-3 .5z" />
            </Svg>
          </Pressable>
          {/* Level badge */}
          <View style={styles.levelBadge}>
            <Svg width={14} height={14} viewBox="0 0 14 14" fill="#F9E741">
              <Path d="M7 0.5l1.76 3.57 3.94.57-2.85 2.78.67 3.93L7 9.46l-3.52 1.89.67-3.93L1.3 4.64l3.94-.57L7 0.5z" />
            </Svg>
            <Text style={styles.levelText}>Level 1</Text>
          </View>
        </View>

        {/* ── Balance row: Coins + Lari + Card ── */}
        <View style={styles.balanceRow}>
          {/* Coins */}
          <Pressable style={styles.balanceCol}>
            <Image source={require("../../../assets/coin-icon.png")} style={{ width: 60, height: 60 }} resizeMode="contain" />
            <Text style={styles.balanceAmount}>{coins.toLocaleString()}</Text>
            <Text style={styles.balanceLabel}>Coins</Text>
          </Pressable>

          <View style={styles.balanceDivider} />

          {/* Lari winnings */}
          <Pressable style={styles.balanceCol} onPress={() => setShowBalanceModal(true)}>
            <Image source={require("../../../assets/lari-icon.png")} style={{ width: 115, height: 115 }} resizeMode="contain" />
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={styles.balanceAmount}>{cash.toFixed(2)}</Text>
              <Text style={{ color: "#999", fontSize: 10 }}>{"\u25BC"}</Text>
            </View>
            <Text style={styles.balanceLabel}>Winnings \u20BE</Text>
          </Pressable>

          <View style={styles.balanceDivider} />

          {/* Add a card */}
          <Pressable style={styles.balanceCol}>
            <Svg width={60} height={60} viewBox="0 0 48 36" fill="none">
              <Rect x={2} y={2} width={44} height={32} rx={6} fill="#1C1C1E" stroke="#333" strokeWidth={1} />
              <Rect x={6} y={10} width={20} height={3} rx={1.5} fill="#333" />
              <Rect x={6} y={16} width={12} height={2} rx={1} fill="#2A2A2A" />
              <SvgCircle cx={40} cy={26} r={4} fill="#FFD700" opacity={0.6} />
              <SvgCircle cx={36} cy={26} r={4} fill="#FFD700" opacity={0.4} />
            </Svg>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={styles.balanceAmount}>\u20BE0.00</Text>
              <Text style={{ color: "#999", fontSize: 10 }}>{"\u25BC"}</Text>
            </View>
            <Text style={styles.balanceLabel}>Add a card</Text>
          </Pressable>
        </View>

        {/* ── Referral section ── */}
        <View style={styles.referralSection}>
          <Text style={styles.referralTitle}>Give {refConfig.signupRewardLari} \u20BE, Earn Coins \uD83C\uDF89</Text>
          <Text style={styles.referralDesc}>
            Friends get <Text style={{ color: "#FFF", fontFamily: fonts.outfit.bold }}>{refConfig.signupRewardLari} \u20BE</Text> when they sign up.
            You earn <Text style={{ color: "#FFF", fontFamily: fonts.outfit.bold }}>{refConfig.referrerRewardCoins}</Text> coins per referral,
            plus <Text style={{ color: "#FFF", fontFamily: fonts.outfit.bold }}>{refConfig.bonusRewardCoins}</Text> extra every {refConfig.bonusEveryN} referrals.
          </Text>

          {/* Referral stats */}
          <View style={styles.refStats}>
            <View style={{ alignItems: "center" }}>
              <Text style={styles.refStatLabel}>REFERRALS</Text>
              <Text style={styles.refStatValue}>{refTotal}</Text>
            </View>
            <View style={{ width: 1, height: 32, backgroundColor: "rgba(255,255,255,0.1)" }} />
            <View style={{ alignItems: "center" }}>
              <Text style={styles.refStatLabel}>COINS EARNED</Text>
              <Text style={[styles.refStatValue, { color: "#FFE500" }]}>{refCoinsEarned.toLocaleString()}</Text>
            </View>
          </View>

          {/* Referral code */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 24 }}>
            <Text style={{ color: "#888", fontSize: 15, fontFamily: fonts.dmSans.regular }}>Code:</Text>
            <Text style={{ color: "#FFF", fontSize: 17, fontFamily: fonts.outfit.bold, letterSpacing: 1 }}>{referralCode}</Text>
          </View>

          {/* Share button */}
          <Pressable onPress={handleShare} style={({ pressed }) => [styles.shareButton, pressed && { transform: [{ scale: 0.97 }] }]}>
            <Svg width={20} height={20} viewBox="0 0 20 20" fill="none" stroke="#000" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M4 12v5a1 1 0 001 1h10a1 1 0 001-1v-5" />
              <Path d="M10 3v10" />
              <Path d="M7 6l3-3 3 3" />
            </Svg>
            <Text style={styles.shareButtonText}>Share</Text>
          </Pressable>
        </View>

        {/* ── All Activity ── */}
        <View style={{ marginTop: 40 }}>
          <Text style={styles.activityTitle}>All Activity</Text>
          <View style={{ height: 0.5, backgroundColor: "rgba(255,255,255,0.08)", marginBottom: 8 }} />

          {activityLoading ? (
            <View style={{ paddingVertical: 32, alignItems: "center" }}>
              <ActivityIndicator color="#FFD700" />
            </View>
          ) : activities.length === 0 ? (
            <Text style={{ color: "#666", fontSize: 14, textAlign: "center", paddingVertical: 32 }}>{"\u10D0\u10E5\u10E2\u10D8\u10D5\u10DD\u10D1\u10D0 \u10D0\u10E0 \u10D0\u10E0\u10D8\u10E1"}</Text>
          ) : (
            activities.map((a, i) => (
              <View key={a.id || i}>
                <View style={styles.activityRow}>
                  <View style={[styles.activityIcon, { backgroundColor: a.color || "#FFD700" }]}>
                    <Text style={{ fontSize: 22 }}>{getActivityEmoji(a.type)}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={styles.activityItemTitle}>{a.title}</Text>
                    <Text style={styles.activityItemDesc}>{a.description}</Text>
                    {a.transactionId && <Text style={styles.activityTxId}>ID: {a.transactionId.slice(0, 16)}</Text>}
                  </View>
                  <Text style={styles.activityTime}>{timeAgo(a.createdAt)}</Text>
                </View>
                {i < activities.length - 1 && <View style={{ height: 0.5, backgroundColor: "rgba(255,255,255,0.08)" }} />}
              </View>
            ))
          )}
        </View>

        {/* Logout */}
        <Pressable onPress={() => signOut()} style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.7 }]}>
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Balance Modal ── */}
      <Modal visible={showBalanceModal} transparent animationType="slide" onRequestClose={() => setShowBalanceModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowBalanceModal(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select an Option</Text>
            <View style={styles.modalOptions}>
              <Pressable style={styles.modalOption} onPress={() => { setShowBalanceModal(false); setExchangeAmount(""); setShowExchange(true); }}>
                <View style={styles.optionIconWhite}><Text style={{ fontSize: 22 }}>{"\u21C4"}</Text></View>
                <Text style={styles.optionText}>Exchange</Text>
              </Pressable>
              <Pressable style={styles.modalOption} onPress={() => { setShowBalanceModal(false); nav.navigate("Wallet"); }}>
                <View style={styles.optionIconGray}><Text style={{ fontSize: 22, color: "#999" }}>{"\u2197"}</Text></View>
                <Text style={[styles.optionText, { color: "#999" }]}>Redeem Balance</Text>
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
            <View style={styles.exchangeRow}>
              <Image source={require("../../../assets/lari-icon.png")} style={{ width: 50, height: 50 }} resizeMode="contain" />
              <TextInput value={exchangeAmount} onChangeText={setExchangeAmount} placeholder="0" placeholderTextColor="#666" keyboardType="decimal-pad" style={styles.exchangeInput} />
              <Text style={styles.exchangeHint}>Balance: {cash.toFixed(2)} \u20BE</Text>
            </View>
            <View style={{ alignItems: "center", paddingVertical: 8 }}>
              <Text style={{ color: "#F9E741", fontSize: 20 }}>{"\u2193"}</Text>
            </View>
            <View style={[styles.exchangeRow, { marginBottom: 16 }]}>
              <Image source={require("../../../assets/coin-icon.png")} style={{ width: 42, height: 42 }} resizeMode="contain" />
              <Text style={styles.exchangeOutput}>{exchangeAmount ? (parseFloat(exchangeAmount) * 100).toLocaleString() : "0"}</Text>
              <Text style={styles.exchangeHint}>Coins</Text>
            </View>
            <Text style={styles.exchangeRate}>1\u20BE Cash = 100 Coin</Text>
            <Pressable onPress={handleExchange} disabled={!exchangeAmount || parseFloat(exchangeAmount) <= 0 || parseFloat(exchangeAmount) > cash} style={({ pressed }) => [styles.exchangeButton, (!exchangeAmount || parseFloat(exchangeAmount) <= 0) && { opacity: 0.4 }, pressed && { transform: [{ scale: 0.97 }] }]}>
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
  scroll: { paddingHorizontal: 16, paddingBottom: 100 },
  topBar: { flexDirection: "row", justifyContent: "space-between", marginBottom: 32 },
  topBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#1C1C1E", alignItems: "center", justifyContent: "center" },

  // Avatar
  avatarSection: { alignItems: "center", marginBottom: 24 },
  avatarGradientBg: { width: 140, height: 140, borderRadius: 70, overflow: "hidden", marginBottom: 16, position: "relative" as const },
  avatarWrap: { width: 140, height: 140, borderRadius: 70, overflow: "hidden" },
  avatarImage: { width: 140, height: 140 },
  uploadBtn: { position: "absolute" as const, bottom: 0, right: 0, width: 36, height: 36, borderRadius: 18, backgroundColor: "#2C2C2E", alignItems: "center" as const, justifyContent: "center" as const },
  userName: { color: "#FFF", fontSize: 22, fontFamily: fonts.outfit.bold },
  levelBadge: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 9999, backgroundColor: "rgba(249,231,65,0.12)", borderWidth: 1, borderColor: "rgba(249,231,65,0.2)" },
  levelText: { color: "#F9E741", fontSize: 12, fontFamily: fonts.outfit.bold },

  // Balance
  balanceRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "center", marginBottom: 40 },
  balanceCol: { flex: 1, alignItems: "center" },
  balanceDivider: { width: 1, height: 50, backgroundColor: "#333" },
  balanceAmount: { color: "#FFF", fontSize: 22, fontFamily: fonts.outfit.bold, marginBottom: 4 },
  balanceLabel: { color: "#888", fontSize: 12, fontFamily: fonts.dmSans.regular },

  // Referral
  referralSection: { alignItems: "center" },
  referralTitle: { color: "#FFF", fontSize: 22, fontFamily: fonts.outfit.bold, textAlign: "center", marginBottom: 12 },
  referralDesc: { color: "#999", fontSize: 15, fontFamily: fonts.dmSans.regular, textAlign: "center", lineHeight: 22, marginBottom: 24 },
  refStats: { flexDirection: "row", alignItems: "center", gap: 24, marginBottom: 24 },
  refStatLabel: { color: "#666", fontSize: 11, fontFamily: fonts.dmSans.regular, letterSpacing: 1 },
  refStatValue: { color: "#FFF", fontSize: 20, fontFamily: fonts.outfit.bold },
  shareButton: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 64, paddingVertical: 18, borderRadius: 9999, backgroundColor: "#FFFFFF" },
  shareButtonText: { color: "#000", fontSize: 17, fontFamily: fonts.outfit.bold },

  // Activity
  activityTitle: { color: "#FFF", fontSize: 22, fontFamily: fonts.outfit.bold, marginBottom: 20 },
  activityRow: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 20 },
  activityIcon: { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  activityItemTitle: { color: "#FFF", fontSize: 15, fontFamily: fonts.dmSans.semiBold },
  activityItemDesc: { color: "#999", fontSize: 13, fontFamily: fonts.dmSans.regular, marginTop: 2 },
  activityTxId: { color: "#555", fontSize: 10, marginTop: 4 },
  activityTime: { color: "#666", fontSize: 13, fontFamily: fonts.dmSans.regular },

  // Logout
  logoutBtn: { alignItems: "center", paddingVertical: 16, marginTop: 32 },
  logoutText: { color: colors.error, fontSize: 16, fontFamily: fonts.outfit.semiBold },

  // Modals
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  modalSheet: { backgroundColor: "rgba(50,50,50,0.55)", borderTopLeftRadius: 36, borderTopRightRadius: 36, paddingTop: 12, paddingBottom: 32, paddingHorizontal: 20 },
  modalHandle: { width: 36, height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.3)", alignSelf: "center", marginBottom: 20 },
  modalTitle: { color: "#FFF", fontSize: 20, fontFamily: fonts.outfit.bold, textAlign: "center", marginBottom: 24 },
  modalOptions: { flexDirection: "row", gap: 12, marginBottom: 8 },
  modalOption: { flex: 1, alignItems: "center", gap: 12, paddingVertical: 24, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" },
  optionIconWhite: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#FFF", alignItems: "center", justifyContent: "center" },
  optionIconGray: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#3A3A3C", alignItems: "center", justifyContent: "center" },
  optionText: { color: "#FFF", fontSize: 14, fontFamily: fonts.dmSans.semiBold },
  exchangeSheet: { backgroundColor: "rgba(30,30,30,0.55)", borderTopLeftRadius: 36, borderTopRightRadius: 36, paddingTop: 12, paddingBottom: 32, paddingHorizontal: 20 },
  exchangeRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)" },
  exchangeInput: { flex: 1, color: "#FFF", fontSize: 22, fontFamily: fonts.outfit.bold, marginLeft: 8, padding: 0 },
  exchangeOutput: { flex: 1, color: "#FFF", fontSize: 22, fontFamily: fonts.outfit.bold, marginLeft: 8 },
  exchangeHint: { color: "#999", fontSize: 15, fontFamily: fonts.dmSans.semiBold },
  exchangeRate: { color: "#999", fontSize: 13, fontFamily: fonts.dmSans.regular, textAlign: "center", marginBottom: 20 },
  exchangeButton: { alignSelf: "center", paddingHorizontal: 40, paddingVertical: 18, borderRadius: 9999, backgroundColor: "#F9E741" },
  exchangeButtonText: { color: "#000", fontSize: 16, fontFamily: fonts.outfit.bold },
});
