import { useState, useEffect } from "react";
import {
  View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { apiFetch } from "../../services/api";
import { colors, fonts, fontSize, radii } from "../../config/theme";

interface Notification {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/user/notifications")
      .then((d: any) => {
        if (Array.isArray(d.notifications)) setItems(d.notifications);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => nav.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>{"‹"}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>შეტყობინებები</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No notifications</Text>}
          renderItem={({ item }) => (
            <View style={[styles.card, !item.read && styles.unread]}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
              <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
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
    backgroundColor: "#1C1C1E", borderRadius: radii.lg, padding: 16, marginBottom: 10,
  },
  unread: { borderLeftWidth: 3, borderLeftColor: colors.accent },
  title: { color: colors.white, fontSize: 15, fontFamily: fonts.dmSans.semiBold, marginBottom: 4 },
  body: { color: colors.textSecondary, fontSize: 13, fontFamily: fonts.dmSans.regular, marginBottom: 6 },
  date: { color: colors.textSecondary, fontSize: 11, fontFamily: fonts.dmSans.regular },
});
