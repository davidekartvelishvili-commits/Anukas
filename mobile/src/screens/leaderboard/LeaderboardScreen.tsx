import { useState, useEffect } from "react";
import {
  View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { apiFetch } from "../../services/api";
import { colors, fonts, fontSize, radii } from "../../config/theme";

interface RankedUser {
  id: string;
  name: string;
  referralCount: number;
}

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const [users, setUsers] = useState<RankedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/user/leaderboard")
      .then((d: any) => {
        if (d?.success && Array.isArray(d.leaderboard)) setUsers(d.leaderboard);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const medal = (rank: number) =>
    rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `${rank}`;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => nav.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>{"‹"}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>ლიდერბორდი</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No data yet</Text>}
          renderItem={({ item, index }) => (
            <View style={styles.row}>
              <Text style={styles.rank}>{medal(index + 1)}</Text>
              <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.count}>{item.referralCount}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  headerRow: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  backArrow: { color: colors.white, fontSize: 28 },
  headerTitle: {
    flex: 1, color: colors.white, fontSize: fontSize.md + 1,
    fontFamily: fonts.outfit.semiBold, textAlign: "center",
  },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  empty: {
    color: colors.textSecondary, fontSize: 16, fontFamily: fonts.dmSans.regular,
    textAlign: "center", marginTop: 48,
  },
  row: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#1C1C1E",
    borderRadius: radii.lg, padding: 16, marginBottom: 10,
  },
  rank: { fontSize: 20, width: 40, textAlign: "center", color: colors.white, fontFamily: fonts.outfit.bold },
  name: { flex: 1, color: colors.white, fontSize: 15, fontFamily: fonts.dmSans.medium },
  count: { color: colors.accent, fontSize: 16, fontFamily: fonts.outfit.bold },
});
