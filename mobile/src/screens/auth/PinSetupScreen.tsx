import { useState, useRef } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { setupPin, getStoredUser } from "../../services/auth";
import { useAuth } from "../../providers/AuthProvider";
import { colors, fonts, fontSize } from "../../config/theme";

export default function PinSetupScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const route = useRoute<RouteProp<{ PinSetup: { phone: string; token: string } }, "PinSetup">>();
  const token = route.params?.token || "";
  const { signIn } = useAuth();

  const [step, setStep] = useState<"create" | "confirm">("create");
  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const [firstPin, setFirstPin] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const pinRefs = useRef<(TextInput | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...pin];
    next[index] = value;
    setPin(next);

    if (value && index < 5) pinRefs.current[index + 1]?.focus();
    if (value && index === 5 && next.every((d) => d !== "")) handleSubmit(next.join(""));
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && !pin[index] && index > 0) pinRefs.current[index - 1]?.focus();
  };

  const handleSubmit = async (code: string) => {
    if (step === "create") {
      setFirstPin(code);
      setStep("confirm");
      setPin(["", "", "", "", "", ""]);
      setError("");
      setTimeout(() => pinRefs.current[0]?.focus(), 200);
      return;
    }

    if (code !== firstPin) {
      setError("\u10DE\u10D8\u10DC\u10D4\u10D1\u10D8 \u10D0\u10E0 \u10D4\u10E0\u10D7\u10DB\u10D0\u10DC\u10D4\u10D7\u10D8. \u10E1\u10EA\u10D0\u10D3\u10D4\u10D7 \u10D7\u10D0\u10D5\u10D8\u10D3\u10D0\u10DC.");
      setPin(["", "", "", "", "", ""]);
      setTimeout(() => pinRefs.current[0]?.focus(), 200);
      return;
    }

    setSaving(true);
    setError("");
    try {
      await setupPin(code);
      const user = await getStoredUser();
      if (user && token) {
        user.hasPin = true;
        await signIn(token, user);
      }
    } catch (err: any) {
      setError(err.message || "PIN setup failed");
      setSaving(false);
      setPin(["", "", "", "", "", ""]);
      setTimeout(() => pinRefs.current[0]?.focus(), 200);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top + 12 }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        {step === "confirm" ? (
          <Pressable
            onPress={() => {
              setStep("create"); setPin(["", "", "", "", "", ""]);
              setError(""); setTimeout(() => pinRefs.current[0]?.focus(), 200);
            }}
            style={styles.backBtn}
          >
            <Text style={styles.backArrow}>{"\u2039"}</Text>
          </Pressable>
        ) : <View style={{ width: 32 }} />}
        <Text style={styles.headerTitle}>{"\u10DE\u10D8\u10DC \u10D9\u10DD\u10D3\u10D8"}</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.lockCircle}>
          <Text style={{ fontSize: 32 }}>🔒</Text>
        </View>

        <Text style={styles.title}>
          {step === "create"
            ? "\u10E8\u10D4\u10E5\u10DB\u10D4\u10DC\u10D8 \u10DE\u10D8\u10DC \u10D9\u10DD\u10D3\u10D8"
            : "\u10D2\u10D0\u10D8\u10DB\u10D4\u10DD\u10E0\u10D4\u10D7 \u10DE\u10D8\u10DC \u10D9\u10DD\u10D3\u10D8"}
        </Text>
        <Text style={styles.subtitle}>
          {step === "create"
            ? "\u10E8\u10D4\u10D8\u10E7\u10D5\u10D0\u10DC\u10D4\u10D7 6-\u10DC\u10D8\u10E8\u10DC\u10D0 \u10DE\u10D8\u10DC \u10D9\u10DD\u10D3\u10D8"
            : "\u10E8\u10D4\u10D8\u10E7\u10D5\u10D0\u10DC\u10D4\u10D7 \u10DE\u10D8\u10DC \u10D9\u10DD\u10D3\u10D8 \u10D7\u10D0\u10D5\u10D8\u10D3\u10D0\u10DC"}
        </Text>

        <View style={styles.pinRow}>
          {pin.map((digit, i) => (
            <TextInput
              key={i}
              ref={(el) => { pinRefs.current[i] = el; }}
              value={digit}
              onChangeText={(v) => handleChange(i, v)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(i, nativeEvent.key)}
              keyboardType="number-pad"
              maxLength={1}
              secureTextEntry
              autoFocus={i === 0}
              style={[styles.pinInput, digit ? styles.pinInputFilled : null]}
            />
          ))}
        </View>

        <View style={styles.dots}>
          <View style={[styles.dot, step === "create" && styles.dotActive]} />
          <View style={[styles.dot, step === "confirm" && styles.dotActive]} />
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {saving && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#FFE500" />
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  backArrow: { color: colors.white, fontSize: 28 },
  headerTitle: {
    flex: 1, color: colors.white, fontSize: fontSize.md + 1,
    fontFamily: fonts.outfit.semiBold, textAlign: "center",
  },
  content: { alignItems: "center", paddingHorizontal: 24, paddingTop: 48 },
  lockCircle: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: "#1C1C1E",
    alignItems: "center", justifyContent: "center", marginBottom: 24,
  },
  title: {
    color: colors.white, fontSize: 28, fontFamily: fonts.outfit.bold,
    textAlign: "center", lineHeight: 34,
  },
  subtitle: {
    color: "#9CA3AF", fontSize: fontSize.md, fontFamily: fonts.dmSans.regular,
    marginTop: 12, textAlign: "center",
  },
  pinRow: { flexDirection: "row", justifyContent: "center", gap: 12, marginTop: 32 },
  pinInput: {
    width: 48, height: 56, borderRadius: 16, backgroundColor: "#1C1C1E",
    color: colors.white, fontSize: 22, fontFamily: fonts.outfit.bold, textAlign: "center",
  },
  pinInputFilled: { backgroundColor: "#2A2A2E" },
  dots: { flexDirection: "row", gap: 8, marginTop: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#333" },
  dotActive: { backgroundColor: "#FFE500" },
  error: {
    color: colors.error, fontSize: 14, fontFamily: fonts.dmSans.regular,
    textAlign: "center", marginTop: 16, paddingHorizontal: 24,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center", justifyContent: "center",
  },
});
