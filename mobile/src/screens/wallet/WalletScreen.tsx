import { useState } from "react";
import {
  View, Text, ScrollView, Pressable, TextInput,
  StyleSheet, Alert, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useBalance } from "../../providers/BalanceProvider";
import { requestWithdrawal } from "../../services/wallet";
import { colors, fonts, fontSize, radii } from "../../config/theme";

const BANKS = ["BOG", "TBC", "Liberty", "Credo", "Basis"];

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const { cash } = useBalance();

  const [amount, setAmount] = useState("");
  const [iban, setIban] = useState("");
  const [bank, setBank] = useState("");
  const [holderName, setHolderName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleWithdraw = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0 || amt > cash) {
      Alert.alert("Error", "Invalid amount");
      return;
    }
    if (!iban || !bank || !holderName) {
      Alert.alert("Error", "Fill all fields");
      return;
    }
    setSubmitting(true);
    try {
      await requestWithdrawal(amt, iban, bank, holderName);
      Alert.alert("Success", "Withdrawal requested");
      setAmount("");
      setIban("");
      setBank("");
      setHolderName("");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Pressable onPress={() => nav.goBack()} style={styles.backBtn}>
            <Text style={styles.backArrow}>{"\u2039"}</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Wallet</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Balance card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>₾ {cash.toFixed(2)}</Text>
        </View>

        {/* Withdrawal form */}
        <Text style={styles.formTitle}>Withdraw Funds</Text>

        <Text style={styles.inputLabel}>Amount (₾)</Text>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          placeholderTextColor="#666"
          keyboardType="decimal-pad"
          style={styles.input}
        />

        <Text style={styles.inputLabel}>Bank</Text>
        <View style={styles.bankRow}>
          {BANKS.map((b) => (
            <Pressable
              key={b}
              onPress={() => setBank(b)}
              style={[styles.bankChip, bank === b && styles.bankChipActive]}
            >
              <Text style={[styles.bankChipText, bank === b && styles.bankChipTextActive]}>
                {b}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.inputLabel}>IBAN</Text>
        <TextInput
          value={iban}
          onChangeText={setIban}
          placeholder="GE00XX0000000000000000"
          placeholderTextColor="#666"
          autoCapitalize="characters"
          style={styles.input}
        />

        <Text style={styles.inputLabel}>Account Holder Name</Text>
        <TextInput
          value={holderName}
          onChangeText={setHolderName}
          placeholder="Full name"
          placeholderTextColor="#666"
          style={styles.input}
        />

        <Pressable
          onPress={handleWithdraw}
          disabled={submitting}
          style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
        >
          {submitting ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.submitText}>Request Withdrawal</Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  scroll: { paddingHorizontal: 16, paddingBottom: 100 },
  headerRow: {
    flexDirection: "row", alignItems: "center", paddingVertical: 12,
  },
  backBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  backArrow: { color: colors.white, fontSize: 28 },
  headerTitle: {
    flex: 1, color: colors.white, fontSize: fontSize.md + 1,
    fontFamily: fonts.outfit.semiBold, textAlign: "center",
  },
  balanceCard: {
    backgroundColor: "#1C1C1E", borderRadius: radii.lg, padding: 24,
    alignItems: "center", marginBottom: 24,
  },
  balanceLabel: {
    color: colors.textSecondary, fontSize: 14, fontFamily: fonts.dmSans.regular,
    marginBottom: 4,
  },
  balanceAmount: { color: colors.accent, fontSize: 36, fontFamily: fonts.outfit.bold },
  formTitle: {
    color: colors.white, fontSize: 20, fontFamily: fonts.outfit.bold,
    marginBottom: 16,
  },
  inputLabel: {
    color: colors.textSecondary, fontSize: 13, fontFamily: fonts.dmSans.medium,
    marginBottom: 6, marginTop: 12,
  },
  input: {
    backgroundColor: "#1C1C1E", borderRadius: radii.sm, paddingHorizontal: 16,
    paddingVertical: 14, color: colors.white, fontSize: 15,
    fontFamily: fonts.dmSans.regular,
  },
  bankRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  bankChip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    backgroundColor: "#1C1C1E",
  },
  bankChipActive: { backgroundColor: colors.accent },
  bankChipText: { color: colors.textSecondary, fontSize: 14, fontFamily: fonts.dmSans.medium },
  bankChipTextActive: { color: "#000" },
  submitBtn: {
    backgroundColor: "#FFE500", borderRadius: 32, height: 56,
    alignItems: "center", justifyContent: "center", marginTop: 24,
  },
  submitText: { color: "#000", fontSize: 17, fontFamily: fonts.outfit.bold },
});
