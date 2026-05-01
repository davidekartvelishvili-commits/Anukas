import { useState, useEffect } from "react";
import {
  View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { apiFetch } from "../../services/api";
import { colors, fonts, fontSize, radii } from "../../config/theme";

interface MerchantDetail {
  id: string;
  name: string;
  description?: string;
  address?: string;
  offers?: { id: string; title: string; description: string }[];
}

export default function PlaceDetailScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const route = useRoute<any>();
  const { id } = route.params;
  const [merchant, setMerchant] = useState<MerchantDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/public/merchants/${id}`)
      .then((d: any) => {
        if (d?.merchant) setMerchant(d.merchant);
        else if (d?.id) setMerchant(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => nav.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>{"‹"}</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {merchant?.name || "Details"}
        </Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {merchant?.address && (
          <Text style={styles.address}>{merchant.address}</Text>
        )}
        {merchant?.description && (
          <Text style={styles.description}>{merchant.description}</Text>
        )}

        {merchant?.offers && merchant.offers.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Offers</Text>
            {merchant.offers.map((o) => (
              <View key={o.id} style={styles.offerCard}>
                <Text style={styles.offerTitle}>{o.title}</Text>
                <Text style={styles.offerDesc} numberOfLines={2}>{o.description}</Text>
              </View>
            ))}
          </>
        )}

        {!merchant && <Text style={styles.empty}>Merchant not found</Text>}
      </ScrollView>
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
  scroll: { paddingHorizontal: 16, paddingBottom: 100 },
  address: { color: colors.textSecondary, fontSize: 14, fontFamily: fonts.dmSans.regular, marginBottom: 12 },
  description: { color: colors.white, fontSize: 15, fontFamily: fonts.dmSans.regular, lineHeight: 22, marginBottom: 20 },
  sectionTitle: { color: colors.white, fontSize: 18, fontFamily: fonts.outfit.semiBold, marginBottom: 12 },
  offerCard: { backgroundColor: "#1C1C1E", borderRadius: radii.lg, padding: 16, marginBottom: 10 },
  offerTitle: { color: colors.white, fontSize: 15, fontFamily: fonts.dmSans.semiBold, marginBottom: 4 },
  offerDesc: { color: colors.textSecondary, fontSize: 13, fontFamily: fonts.dmSans.regular },
  empty: { color: colors.textSecondary, fontSize: 16, fontFamily: fonts.dmSans.regular, textAlign: "center", marginTop: 48 },
});
