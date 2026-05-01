import { useState, useRef, useEffect } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { verifyOtp, sendOtp } from "../../services/auth";
import { useAuth } from "../../providers/AuthProvider";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors, fonts, fontSize } from "../../config/theme";

const formatDisplay = (d: string) => {
  if (d.length <= 3) return `+995 ${d}`;
  if (d.length <= 5) return `+995 ${d.slice(0, 3)} ${d.slice(3)}`;
  if (d.length <= 7) return `+995 ${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5)}`;
  return `+995 ${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 7)} ${d.slice(7)}`;
};

export default function OtpVerifyScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<{ OtpVerify: { phone: string } }, "OtpVerify">>();
  const phone = route.params?.phone || "";
  const { signIn } = useAuth();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    setTimeout(() => inputRefs.current[0]?.focus(), 300);
    AsyncStorage.getItem("pending_referral_code").then((v) => {
      if (v) setReferralCode(v);
    });
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    if (value && index === 5 && next.every((d) => d !== "")) {
      submitOtp(next.join(""));
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const submitOtp = async (code: string) => {
    setVerifying(true);
    setError("");
    try {
      const data = await verifyOtp(phone, code, referralCode.trim() || undefined);
      AsyncStorage.removeItem("pending_referral_code");

      if (data.isNewUser) {
        setVerifying(false);
        nav.navigate("PinSetup", { phone, token: data.token });
        return;
      }
      await signIn(data.token, data.user);
    } catch (err: any) {
      setError(err.message || "Invalid code");
      setVerifying(false);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    setOtp(["", "", "", "", "", ""]);
    setError("");
    inputRefs.current[0]?.focus();
    try { await sendOtp(phone); } catch {}
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top + 12 }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => nav.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>{"\u2039"}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Create account</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Verify your{"\n"}phone number</Text>
        <Text style={styles.subtitle}>Enter 6-digit code sent to</Text>
        <Text style={styles.phoneDisplay}>{formatDisplay(phone)}</Text>

        {/* OTP inputs */}
        <View style={styles.otpRow}>
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              value={digit}
              onChangeText={(v) => handleChange(i, v)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(i, nativeEvent.key)}
              keyboardType="number-pad"
              maxLength={1}
              style={[styles.otpInput, digit ? styles.otpInputFilled : null]}
            />
          ))}
        </View>

        {/* Referral code */}
        <TextInput
          value={referralCode}
          onChangeText={(v) => setReferralCode(v.toUpperCase())}
          placeholder={"\u10E0\u10D4\u10E4\u10D4\u10E0\u10D0\u10DA \u10D9\u10DD\u10D3\u10D8 (\u10D0\u10E0\u10D0\u10E1\u10D0\u10D5\u10D0\u10DA\u10D3\u10D4\u10D1\u10E3\u10DA\u10DD)"}
          placeholderTextColor="#666"
          autoCapitalize="characters"
          style={[styles.referralInput, referralCode ? styles.referralActive : null]}
        />
        <Text style={referralCode ? styles.referralHintOk : styles.referralHintGrey}>
          {referralCode
            ? "\u2713 \u10E0\u10D4\u10E4\u10D4\u10E0\u10D0\u10DA\u10D8 \u10D9\u10DD\u10D3\u10D8 \u10D2\u10D0\u10DB\u10DD\u10E7\u10D4\u10DC\u10D4\u10D1\u10E3\u10DA\u10D8\u10D0"
            : "\u10DB\u10D0\u10D2: SHANSI-A7B3K9"}
        </Text>
      </View>

      {/* Bottom */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 16 }]}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable onPress={handleResend} style={styles.resendBtn}>
          <Text style={styles.resendText}>Resend Code</Text>
        </Pressable>
      </View>

      {verifying && (
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
  content: { alignItems: "center", paddingHorizontal: 24, paddingTop: 32 },
  title: {
    color: colors.white, fontSize: 32, fontFamily: fonts.outfit.bold,
    textAlign: "center", lineHeight: 37,
  },
  subtitle: {
    color: "#9CA3AF", fontSize: fontSize.md, fontFamily: fonts.dmSans.regular,
    marginTop: 12, textAlign: "center",
  },
  phoneDisplay: {
    color: colors.white, fontSize: fontSize.md,
    fontFamily: fonts.dmSans.medium, marginTop: 4,
  },
  otpRow: { flexDirection: "row", justifyContent: "center", gap: 12, marginTop: 32 },
  otpInput: {
    width: 48, height: 56, borderRadius: 16, backgroundColor: "#1C1C1E",
    color: colors.white, fontSize: 22, fontFamily: fonts.outfit.bold, textAlign: "center",
  },
  otpInputFilled: { backgroundColor: "#2A2A2E" },
  referralInput: {
    width: "100%", marginTop: 24, paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 12, backgroundColor: "#1C1C1E", color: colors.white,
    fontSize: 14, fontFamily: fonts.dmSans.regular, textAlign: "center",
    borderWidth: 1, borderColor: "transparent",
  },
  referralActive: { borderColor: "#22C55E" },
  referralHintOk: {
    color: "#22C55E", fontSize: 11, fontFamily: fonts.dmSans.regular,
    marginTop: 6, textAlign: "center",
  },
  referralHintGrey: {
    color: "#666666", fontSize: 11, fontFamily: fonts.dmSans.regular,
    marginTop: 6, textAlign: "center",
  },
  bottom: { flex: 1, justifyContent: "flex-end", paddingHorizontal: 24 },
  error: {
    color: colors.error, fontSize: 14, fontFamily: fonts.dmSans.regular,
    textAlign: "center", marginBottom: 8,
  },
  resendBtn: { alignItems: "center", paddingVertical: 16 },
  resendText: { color: colors.white, fontSize: 16, fontFamily: fonts.outfit.semiBold },
  overlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center", justifyContent: "center",
  },
});
