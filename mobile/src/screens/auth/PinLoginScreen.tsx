import { useState, useRef } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { pinLogin } from "../../services/auth";
import { useAuth } from "../../providers/AuthProvider";
import { colors, fonts, fontSize } from "../../config/theme";

export default function PinLoginScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const route = useRoute<RouteProp<{ PinLogin: { phone: string } }, "PinLogin">>();
  const phone = route.params?.phone || "";
  const { signIn } = useAuth();

  const [pinInput, setPinInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const hiddenRef = useRef<TextInput>(null);

  const handlePinChange = async (val: string) => {
    const clean = val.replace(/\D/g, "").slice(0, 6);
    setPinInput(clean);
    setError("");

    if (clean.length === 6) {
      setLoading(true);
      try {
        const data = await pinLogin(phone, clean);
        if (data.success) {
          await signIn(data.token, data.user);
        }
      } catch (err: any) {
        setError(err.message || "Invalid PIN");
        setPinInput("");
        setLoading(false);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top + 16 }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Pressable onPress={() => nav.goBack()} style={styles.backBtn}>
        <Text style={styles.backArrow}>{"\u2039"}</Text>
      </Pressable>

      <View style={styles.content}>
        <View style={styles.lockCircle}>
          <Text style={{ fontSize: 36 }}>🔒</Text>
        </View>

        <Text style={styles.title}>Enter PIN</Text>
        <Text style={styles.subtitle}>Enter your 6-digit PIN to log in</Text>

        <Pressable onPress={() => hiddenRef.current?.focus()} style={styles.dotsRow}>
          {Array.from({ length: 6 }).map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i < pinInput.length ? styles.dotFilled : styles.dotEmpty]}
            />
          ))}
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          ref={hiddenRef}
          value={pinInput}
          onChangeText={handlePinChange}
          keyboardType="number-pad"
          maxLength={6}
          autoFocus
          style={styles.hiddenInput}
        />

        <Pressable onPress={() => hiddenRef.current?.focus()} style={styles.tapHint}>
          <Text style={styles.tapHintText}>Tap to enter PIN</Text>
        </Pressable>

        <Pressable onPress={() => nav.goBack()} style={styles.altLogin}>
          <Text style={styles.altLoginText}>Use phone number instead</Text>
        </Pressable>
      </View>

      {loading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#FFE500" />
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  backBtn: {
    width: 44, height: 44, alignItems: "center", justifyContent: "center", marginLeft: 8,
  },
  backArrow: { color: colors.white, fontSize: 28 },
  content: {
    flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24,
  },
  lockCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: "#1C1C1E",
    alignItems: "center", justifyContent: "center", marginBottom: 24,
  },
  title: { color: colors.white, fontSize: 22, fontFamily: fonts.outfit.bold, marginBottom: 8 },
  subtitle: { color: "#6B7280", fontSize: 14, fontFamily: fonts.dmSans.regular, marginBottom: 32 },
  dotsRow: { flexDirection: "row", gap: 16, marginBottom: 24 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2 },
  dotFilled: { backgroundColor: "#FFE500", borderColor: "#FFE500" },
  dotEmpty: { backgroundColor: "transparent", borderColor: "#2A2A2A" },
  error: { color: colors.error, fontSize: 13, fontFamily: fonts.dmSans.medium, marginBottom: 16 },
  hiddenInput: { position: "absolute", opacity: 0, width: 1, height: 1 },
  tapHint: { marginBottom: 32 },
  tapHintText: { color: "#6B7280", fontSize: 13, fontFamily: fonts.dmSans.regular },
  altLogin: { marginTop: 8 },
  altLoginText: { color: "#9CA3AF", fontSize: 14, fontFamily: fonts.outfit.semiBold },
  overlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center", justifyContent: "center",
  },
});
