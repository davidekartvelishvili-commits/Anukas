import { useState } from "react";
import { View, Text, Pressable, StyleSheet, Switch } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { colors, fonts, fontSize, radii } from "../../config/theme";

export default function AudioSettingsScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const [bgMusic, setBgMusic] = useState(true);
  const [sfx, setSfx] = useState(true);
  const [gameSounds, setGameSounds] = useState(true);

  const toggles = [
    { label: "Background Music", labelKa: "ფონის მუსიკა", value: bgMusic, onToggle: setBgMusic },
    { label: "Sound Effects", labelKa: "ხმოვანი ეფექტები", value: sfx, onToggle: setSfx },
    { label: "Game Sounds", labelKa: "თამაშის ხმები", value: gameSounds, onToggle: setGameSounds },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => nav.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>{"‹"}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>აუდიო</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.content}>
        {toggles.map((t) => (
          <View key={t.label} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{t.label}</Text>
              <Text style={styles.labelKa}>{t.labelKa}</Text>
            </View>
            <Switch
              value={t.value}
              onValueChange={t.onToggle}
              trackColor={{ false: "#3A3A3C", true: colors.accent }}
              thumbColor={colors.white}
            />
          </View>
        ))}
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
  content: { paddingHorizontal: 16, marginTop: 8 },
  row: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#1C1C1E",
    borderRadius: radii.lg, padding: 16, marginBottom: 10,
  },
  label: { color: colors.white, fontSize: 15, fontFamily: fonts.dmSans.medium },
  labelKa: { color: colors.textSecondary, fontSize: 12, fontFamily: fonts.dmSans.regular, marginTop: 2 },
});
