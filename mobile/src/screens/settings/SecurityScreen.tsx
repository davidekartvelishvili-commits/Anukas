import { useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet, Alert, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { apiFetch } from "../../services/api";
import { colors, fonts, fontSize, radii } from "../../config/theme";

export default function SecurityScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (currentPin.length !== 6 || newPin.length !== 6) {
      Alert.alert("Error", "PIN must be 6 digits");
      return;
    }
    setSaving(true);
    try {
      await apiFetch("/auth/pin/setup", {
        method: "POST",
        body: JSON.stringify({ currentPin, newPin }),
      });
      Alert.alert("Success", "PIN updated successfully");
      nav.goBack();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to update PIN");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => nav.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>{"‹"}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>უსაფრთხოება</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>Current PIN / მიმდინარე PIN</Text>
        <TextInput
          style={styles.input}
          value={currentPin}
          onChangeText={setCurrentPin}
          keyboardType="number-pad"
          maxLength={6}
          secureTextEntry
          placeholder="000000"
          placeholderTextColor="#555"
        />

        <Text style={[styles.label, { marginTop: 20 }]}>New PIN / ახალი PIN</Text>
        <TextInput
          style={styles.input}
          value={newPin}
          onChangeText={setNewPin}
          keyboardType="number-pad"
          maxLength={6}
          secureTextEntry
          placeholder="000000"
          placeholderTextColor="#555"
        />

        <Pressable onPress={handleSave} style={styles.saveBtn} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.saveBtnText}>Save PIN</Text>
          )}
        </Pressable>
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
  label: { color: colors.textSecondary, fontSize: 13, fontFamily: fonts.dmSans.medium, marginBottom: 8 },
  input: {
    backgroundColor: "#1C1C1E", borderRadius: radii.sm, height: 52, paddingHorizontal: 16,
    color: colors.white, fontSize: 20, fontFamily: fonts.outfit.semiBold,
    letterSpacing: 8, textAlign: "center",
  },
  saveBtn: {
    backgroundColor: colors.accent, borderRadius: 32, height: 56,
    alignItems: "center", justifyContent: "center", marginTop: 32,
  },
  saveBtnText: { color: "#000", fontSize: 17, fontFamily: fonts.outfit.bold },
});
