import { useState, useEffect } from "react";
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  Share, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { getMyReferral, getReferralConfigPublic } from "../../services/referral";
import { colors, fonts, fontSize, radii } from "../../config/theme";

export default function ReferralScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [totalReferrals, setTotalReferrals] = useState(0);
  const [totalCoins, setTotalCoins] = useState(0);
  const [rewardCoins, setRewardCoins] = useState(0);

  useEffect(() => {
    Promise.all([
      getMyReferral().catch(() => null),
      getReferralConfigPublic().catch(() => null),
    ]).then(([ref, cfg]: any[]) => {
      if (ref?.success) {
        setCode(ref.referralCode || "");
        setTotalReferrals(ref.totalReferrals || 0);
        setTotalCoins(ref.totalCoinsEarned || 0);
      }
      if (cfg?.success && cfg.config) {
        setRewardCoins(cfg.config.referrerRewardCoins || 0);
      }
      setLoading(false);
    });
  }, []);

  const handleShare = async () => {
    if (!code) return;
    try {
      await Share.share({
        message: `Join Shansi with my code ${code} and get free coins! https://shansi.ge?ref=${code}`,
      });
    } catch {}
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => nav.goBack()} style={styles.backBtn}>
            <Text style={styles.backArrow}>{"\u2039"}</Text>
          </Pressable>
          <Text style={styles.headerTitle}>{"\u10E0\u10D4\u10E4\u10D4\u10E0\u10D0\u10DA\u10D8"}</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Code card */}
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Your Referral Code</Text>
          <Text style={styles.codeValue}>{code || "---"}</Text>
          <Text style={styles.codeReward}>
            Earn {rewardCoins} coins for each friend!
          </Text>
        </View>

        <Pressable onPress={handleShare} style={styles.shareBtn}>
          <Text style={styles.shareBtnText}>Share Code</Text>
        </Pressable>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalReferrals}</Text>
            <Text style={styles.statLabel}>Friends Invited</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalCoins}</Text>
            <Text style={styles.statLabel}>Coins Earned</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  center: { alignItems: "center", justifyContent: "center" },
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
  codeCard: {
    backgroundColor: "#1C1C1E", borderRadius: radii.lg, padding: 24,
    alignItems: "center", marginBottom: 16,
  },
  codeLabel: {
    color: colors.textSecondary, fontSize: 14, fontFamily: fonts.dmSans.regular, marginBottom: 8,
  },
  codeValue: { color: colors.gold, fontSize: 28, fontFamily: fonts.outfit.bold, marginBottom: 8 },
  codeReward: { color: colors.accent, fontSize: 14, fontFamily: fonts.dmSans.medium },
  shareBtn: {
    backgroundColor: colors.accent, borderRadius: 32, height: 56,
    alignItems: "center", justifyContent: "center", marginBottom: 24,
  },
  shareBtnText: { color: "#000", fontSize: 17, fontFamily: fonts.outfit.bold },
  statsRow: { flexDirection: "row", gap: 12 },
  statCard: {
    flex: 1, backgroundColor: "#1C1C1E", borderRadius: radii.lg,
    padding: 16, alignItems: "center",
  },
  statValue: { color: colors.white, fontSize: 24, fontFamily: fonts.outfit.bold },
  statLabel: {
    color: colors.textSecondary, fontSize: 12, fontFamily: fonts.dmSans.regular, marginTop: 4,
  },
});
