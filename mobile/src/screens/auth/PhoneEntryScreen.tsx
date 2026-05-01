import { useState, useRef } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { checkPhone, sendOtp } from "../../services/auth";
import { colors, fonts, fontSize } from "../../config/theme";

const formatPhone = (raw: string) => {
  const d = raw.replace(/\D/g, "").slice(0, 9);
  if (d.length <= 3) return d;
  if (d.length <= 5) return `${d.slice(0, 3)} ${d.slice(3)}`;
  if (d.length <= 7) return `${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 7)} ${d.slice(7)}`;
};

export default function PhoneEntryScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<NativeStackNavigationProp<any>>();
  const inputRef = useRef<TextInput>(null);
  const [phone, setPhone] = useState("");
  const [focused, setFocused] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const digits = phone.replace(/\D/g, "");
  const isValid = digits.length === 9;

  const handleContinue = async () => {
    if (!isValid || sending) return;
    setSending(true);
    setError("");
    try {
      const check = await checkPhone(digits);
      if (check.exists && check.hasPin) {
        setSending(false);
        nav.navigate("PinLogin", { phone: digits });
        return;
      }
      await sendOtp(digits);
      nav.navigate("OtpVerify", { phone: digits });
    } catch (err: any) {
      setError(err.message || "Failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top + 12 }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create account</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Enter your{"\n"}phone number</Text>
        <Text style={styles.subtitle}>Used to create your account</Text>

        {/* Phone input pill */}
        <Pressable
          onPress={() => inputRef.current?.focus()}
          style={[styles.phoneRow, focused && styles.phoneRowFocused]}
        >
          <Text style={styles.flag}>🇬🇪</Text>
          <Text style={styles.prefix}>+995</Text>
          <TextInput
            ref={inputRef}
            value={formatPhone(phone)}
            onChangeText={(t) => setPhone(t.replace(/\D/g, "").slice(0, 9))}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Phone number"
            placeholderTextColor="#4B5563"
            keyboardType="number-pad"
            maxLength={12}
            style={styles.phoneInput}
          />
        </Pressable>
      </View>

      {/* Bottom section */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 12 }]}>
        <Text style={styles.terms}>
          By clicking Continue, you confirm that you are at least 18 years old and
          that you agree to our Terms of Service and Privacy Policy.
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          onPress={handleContinue}
          disabled={!isValid || sending}
          style={[styles.button, isValid && !sending && styles.buttonActive]}
        >
          {sending ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={[styles.buttonText, isValid && !sending && styles.buttonTextActive]}>
              Continue
            </Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  header: { alignItems: "center", paddingVertical: 12 },
  headerTitle: {
    color: colors.white,
    fontSize: fontSize.md + 1,
    fontFamily: fonts.outfit.semiBold,
  },
  content: { alignItems: "center", paddingHorizontal: 24, paddingTop: 32 },
  title: {
    color: colors.white,
    fontSize: 32,
    fontFamily: fonts.outfit.bold,
    textAlign: "center",
    lineHeight: 37,
  },
  subtitle: {
    color: "#9CA3AF",
    fontSize: fontSize.md,
    fontFamily: fonts.dmSans.regular,
    marginTop: 12,
    textAlign: "center",
  },
  phoneRow: {
    width: "100%",
    marginTop: 32,
    flexDirection: "row",
    alignItems: "center",
    height: 60,
    borderRadius: 30,
    paddingHorizontal: 24,
    gap: 12,
    backgroundColor: "#1C1C1E",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  phoneRowFocused: { borderColor: "#3A3A3C" },
  flag: { fontSize: 22 },
  prefix: { color: "#9CA3AF", fontSize: 17, fontFamily: fonts.dmSans.medium },
  phoneInput: {
    flex: 1,
    color: colors.white,
    fontSize: 17,
    fontFamily: fonts.dmSans.regular,
    padding: 0,
  },
  bottom: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  terms: {
    color: "#6B7280",
    fontSize: fontSize.sm,
    fontFamily: fonts.dmSans.regular,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },
  error: {
    color: colors.error,
    fontSize: fontSize.sm,
    fontFamily: fonts.dmSans.regular,
    textAlign: "center",
    marginBottom: 8,
  },
  button: {
    width: "100%",
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1C1C1E",
  },
  buttonActive: { backgroundColor: "#FFE500" },
  buttonText: { fontSize: 18, fontFamily: fonts.outfit.bold, color: "#4B5563" },
  buttonTextActive: { color: "#000000" },
});
