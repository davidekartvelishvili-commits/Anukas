import { useState, useEffect } from "react";
import {
  View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { apiFetch } from "../../services/api";
import { colors, fonts, fontSize, radii } from "../../config/theme";

interface Offer {
  id: string;
  title: string;
  description: string;
  merchantName?: string;
}

export default function PromosScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/offers?active=true")
      .then((d: any) => {
        if (Array.isArray(d.offers)) setOffers(d.offers);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => nav.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>{"‹"}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>აქციები</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={offers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No active promos</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              {item.merchantName && (
                <Text style={styles.merchant}>{item.merchantName}</Text>
              )}
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.desc} numberOfLines={3}>{item.description}</Text>
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
  card: {
    backgroundColor: "#1C1C1E", borderRadius: radii.lg, padding: 16, marginBottom: 12,
  },
  merchant: {
    color: colors.accent, fontSize: 12, fontFamily: fonts.dmSans.semiBold,
    textTransform: "uppercase", marginBottom: 4,
  },
  title: { color: colors.white, fontSize: 16, fontFamily: fonts.outfit.semiBold, marginBottom: 6 },
  desc: { color: colors.textSecondary, fontSize: 13, fontFamily: fonts.dmSans.regular, lineHeight: 18 },
});
