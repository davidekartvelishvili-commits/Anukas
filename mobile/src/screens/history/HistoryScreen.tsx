import { useState, useEffect } from "react";
import {
  View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { getUserTransactions } from "../../services/wallet";
import { colors, fonts, fontSize, radii } from "../../config/theme";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
  description?: string;
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchPage = async (p: number) => {
    try {
      const data = await getUserTransactions(p) as any;
      if (data?.success && Array.isArray(data.transactions)) {
        if (p === 1) setTransactions(data.transactions);
        else setTransactions((prev) => [...prev, ...data.transactions]);
        setHasMore(data.transactions.length >= 20);
      }
    } catch {}
  };

  useEffect(() => {
    fetchPage(1).finally(() => setLoading(false));
  }, []);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const next = page + 1;
    setPage(next);
    await fetchPage(next);
    setLoadingMore(false);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Pressable onPress={() => nav.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>{"\u2039"}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{"\u10D8\u10E1\u10E2\u10DD\u10E0\u10D8\u10D0"}</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <Text style={styles.empty}>No transactions yet</Text>
          }
          ListFooterComponent={
            loadingMore ? <ActivityIndicator color={colors.accent} style={{ paddingVertical: 16 }} /> : null
          }
          renderItem={({ item }) => (
            <View style={styles.txRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.txType}>{item.type}</Text>
                <Text style={styles.txDate}>{formatDate(item.createdAt)}</Text>
              </View>
              <Text style={[styles.txAmount, item.amount > 0 ? styles.txPositive : styles.txNegative]}>
                {item.amount > 0 ? "+" : ""}{item.amount}
              </Text>
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
  txRow: {
    flexDirection: "row", alignItems: "center", paddingVertical: 14,
    borderBottomWidth: 0.5, borderBottomColor: "#1C1C1E",
  },
  txType: { color: colors.white, fontSize: 15, fontFamily: fonts.dmSans.medium },
  txDate: { color: colors.textSecondary, fontSize: 12, fontFamily: fonts.dmSans.regular, marginTop: 2 },
  txAmount: { fontSize: 16, fontFamily: fonts.outfit.bold },
  txPositive: { color: colors.accent },
  txNegative: { color: colors.error },
});
