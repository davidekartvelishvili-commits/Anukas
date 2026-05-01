import { useState } from "react";
import {
  View, Text, Pressable, StyleSheet, ActivityIndicator, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { apiFetch } from "../../services/api";
import { colors, fonts, fontSize, radii } from "../../config/theme";

export default function MysteryBoxScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const [opening, setOpening] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleOpen = async () => {
    if (opening) return;
    setOpening(true);
    try {
      const d: any = await apiFetch("/user/mystery-box", { method: "POST" });
      setResult(d.message || `You won ${d.reward ?? 0} coins!`);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Could not open box");
    } finally {
      setOpening(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => nav.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>{"‹"}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Mystery Box</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.body}>
        <Text style={styles.emoji}>🎁</Text>
        <Text style={styles.title}>Mystery Box</Text>
        <Text style={styles.subtitle}>Tap below to reveal your reward</Text>

        {result ? (
          <View style={styles.resultCard}>
            <Text style={styles.resultText}>{result}</Text>
          </View>
        ) : (
          <Pressable onPress={handleOpen} style={styles.openBtn} disabled={opening}>
            {opening ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.openBtnText}>Tap to Open</Text>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  headerRow: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  backArrow: { color: colors.white, fontSize: 28 },
  headerTitle: {
    flex: 1, color: colors.white, fontSize: fontSize.md + 1,
    fontFamily: fonts.outfit.semiBold, textAlign: "center",
  },
  body: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  emoji: { fontSize: 80, marginBottom: 16 },
  title: { color: colors.white, fontSize: 28, fontFamily: fonts.outfit.bold, marginBottom: 8 },
  subtitle: { color: colors.textSecondary, fontSize: 14, fontFamily: fonts.dmSans.regular, marginBottom: 32 },
  openBtn: {
    backgroundColor: colors.accent, borderRadius: 32, height: 56,
    width: "100%", alignItems: "center", justifyContent: "center",
  },
  openBtnText: { color: "#000", fontSize: 17, fontFamily: fonts.outfit.bold },
  resultCard: {
    backgroundColor: "#1C1C1E", borderRadius: radii.lg, padding: 24, alignItems: "center", width: "100%",
  },
  resultText: { color: colors.accent, fontSize: 18, fontFamily: fonts.outfit.semiBold, textAlign: "center" },
});
