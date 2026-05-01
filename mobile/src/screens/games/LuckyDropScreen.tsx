import { useState, useEffect, useCallback } from "react";
import {
  View, Text, Pressable, StyleSheet, Dimensions, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { playGame, ensureActiveTransaction } from "../../services/games";
import { useBalance } from "../../providers/BalanceProvider";
import { colors, fonts } from "../../config/theme";

// TODO: Replace with @shopify/react-native-skia canvas implementation
// for the full Plinko physics and peg rendering. This interim version
// uses the same backend API and shows results, but without the ball animation.

const { width: W, height: H } = Dimensions.get("window");
const BET_OPTIONS = [10, 25, 50, 100, 250, 500];

const MULTIPLIERS = [0, 2, 0, 5, 0, 2, 0, 5, 0, 2, 0];
const SLOT_COLORS = MULTIPLIERS.map(m => m === 0 ? "#FF3D3D" : "#00E676");

export default function LuckyDropScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const { coins, setCoins, setCash } = useBalance();

  const [balance, setBalance] = useState(0);
  const [betAmount, setBetAmount] = useState(10);
  const [showBetPicker, setShowBetPicker] = useState(true);
  const [dropping, setDropping] = useState(false);
  const [result, setResult] = useState<{ won: boolean; amount: number; slot: number } | null>(null);

  useEffect(() => {
    ensureActiveTransaction().then((tx) => {
      setBalance(tx.coinsRemaining);
      setCoins(tx.coinsRemaining);
    }).catch(() => {});
  }, []);

  const handleDrop = useCallback(async () => {
    if (dropping || balance < betAmount) return;
    setDropping(true);
    setResult(null);
    setBalance((b) => b - betAmount);

    try {
      const res = await playGame("plinko");
      setBalance(res.coinsRemaining);
      setCoins(res.coinsRemaining);

      const won = res.totalWin > 0;
      const winSlots = MULTIPLIERS.map((m, i) => ({ m, i })).filter(s => s.m > 0);
      const loseSlots = MULTIPLIERS.map((m, i) => ({ m, i })).filter(s => s.m === 0);
      const slot = won
        ? winSlots[Math.floor(Math.random() * winSlots.length)].i
        : loseSlots[Math.floor(Math.random() * loseSlots.length)].i;

      if (won) setCash(res.newBalance);
      setResult({ won, amount: res.totalWin, slot });

      // Auto-clear after delay
      setTimeout(() => setResult(null), 3000);
    } catch (err: any) {
      setBalance((b) => b + betAmount);
      Alert.alert("Error", err.message || "Drop failed");
    } finally {
      setDropping(false);
    }
  }, [balance, betAmount, dropping, setCoins, setCash]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable onPress={() => nav.goBack()} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </Pressable>
        <View style={styles.balancePill}>
          <Text style={styles.balanceText}>🪙 {balance}</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Plinko board placeholder */}
      <View style={styles.board}>
        {/* Pegs visualization (simplified) */}
        {Array.from({ length: 8 }).map((_, row) => (
          <View key={row} style={styles.pegRow}>
            {Array.from({ length: row + 3 }).map((_, col) => (
              <View key={col} style={styles.peg} />
            ))}
          </View>
        ))}

        {/* Slots at bottom */}
        <View style={styles.slotRow}>
          {MULTIPLIERS.map((mult, i) => (
            <View
              key={i}
              style={[
                styles.slot,
                { backgroundColor: SLOT_COLORS[i] + "33" },
                result?.slot === i && styles.slotActive,
              ]}
            >
              <Text style={[styles.slotText, { color: SLOT_COLORS[i] }]}>
                {mult === 0 ? "0" : `${mult}x`}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Result */}
      {result && (
        <View style={[styles.resultCard, result.won ? styles.resultWin : styles.resultLose]}>
          <Text style={styles.resultText}>
            {result.won ? `+${result.amount}₾ 🎉` : "No win this time"}
          </Text>
        </View>
      )}

      {/* Bottom controls */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        {showBetPicker ? (
          <>
            <Text style={styles.pickText}>Pick amount to play</Text>
            <View style={styles.betRow}>
              {BET_OPTIONS.map((amt) => (
                <Pressable
                  key={amt}
                  onPress={() => { setBetAmount(amt); setShowBetPicker(false); }}
                  style={styles.betChip}
                >
                  <Text style={styles.betChipText}>{amt}</Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : (
          <Pressable
            onPress={handleDrop}
            disabled={dropping || balance < betAmount}
            style={[styles.dropBtn, (dropping || balance < betAmount) && styles.dropBtnDisabled]}
          >
            <Text style={styles.dropBtnText}>
              {dropping ? "Dropping..." : `Drop (${betAmount} coins)`}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0F1C" },
  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 14, paddingVertical: 10,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center", justifyContent: "center",
  },
  closeBtnText: { color: "rgba(255,255,255,0.6)", fontSize: 16 },
  balancePill: {
    backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  balanceText: { color: colors.white, fontSize: 15, fontFamily: fonts.outfit.bold },
  board: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  pegRow: { flexDirection: "row", gap: 20, marginBottom: 16, justifyContent: "center" },
  peg: { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.4)" },
  slotRow: { flexDirection: "row", gap: 2, marginTop: 20 },
  slot: {
    width: (W - 32) / 11, height: 44, borderRadius: 6,
    alignItems: "center", justifyContent: "center",
  },
  slotActive: { borderWidth: 2, borderColor: colors.gold },
  slotText: { fontSize: 11, fontFamily: fonts.outfit.bold },
  resultCard: {
    marginHorizontal: 16, borderRadius: 16, padding: 16, alignItems: "center",
  },
  resultWin: { backgroundColor: "rgba(0,230,118,0.15)" },
  resultLose: { backgroundColor: "rgba(255,255,255,0.05)" },
  resultText: { color: colors.white, fontSize: 18, fontFamily: fonts.outfit.bold },
  bottomBar: { paddingHorizontal: 16, paddingTop: 12 },
  pickText: {
    color: "rgba(255,255,255,0.5)", fontSize: 14, fontFamily: fonts.dmSans.medium,
    textAlign: "center", marginBottom: 8,
  },
  betRow: { flexDirection: "row", gap: 8, justifyContent: "center", flexWrap: "wrap" },
  betChip: {
    backgroundColor: colors.gold, borderRadius: 20, paddingHorizontal: 24, paddingVertical: 14,
  },
  betChipText: { color: "#1a1a2e", fontSize: 18, fontFamily: fonts.outfit.bold },
  dropBtn: {
    backgroundColor: colors.gold, borderRadius: 32, height: 60,
    alignItems: "center", justifyContent: "center",
  },
  dropBtnDisabled: { backgroundColor: "#3a3a4a" },
  dropBtnText: { color: "#1a1a2e", fontSize: 19, fontFamily: fonts.outfit.extraBold },
});
