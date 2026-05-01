import { useState, useEffect, useCallback } from "react";
import {
  View, Text, Pressable, StyleSheet, Dimensions, Alert,
} from "react-native";
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSequence,
  withDelay, runOnJS, Easing,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { playGame, ensureActiveTransaction } from "../../services/games";
import { useBalance } from "../../providers/BalanceProvider";
import { colors, fonts } from "../../config/theme";

// TODO: Replace with @shopify/react-native-skia or expo-three for
// 3D cylinder reel rendering. This interim version uses Reanimated
// for reel spin animation with the same backend API.

const SYMBOLS = ["👑", "🍒", "🍈", "🍌", "🔔", "💎", "7️⃣", "⭐", "🍇"];
const { width: W } = Dimensions.get("window");
const REEL_H = 80;
const BET_OPTIONS = [10, 25, 50, 100, 250, 500];

export default function MidnightMachineScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const { coins, setCoins, setCash } = useBalance();

  const [balance, setBalance] = useState(0);
  const [betAmount, setBetAmount] = useState(10);
  const [spinning, setSpinning] = useState(false);
  const [reels, setReels] = useState(["👑", "👑", "👑"]);
  const [resultText, setResultText] = useState("");

  const spin1 = useSharedValue(0);
  const spin2 = useSharedValue(0);
  const spin3 = useSharedValue(0);

  useEffect(() => {
    ensureActiveTransaction().then((tx) => {
      setBalance(tx.coinsRemaining);
      setCoins(tx.coinsRemaining);
    }).catch(() => {});
  }, []);

  const animStyle1 = useAnimatedStyle(() => ({ transform: [{ translateY: spin1.value }] }));
  const animStyle2 = useAnimatedStyle(() => ({ transform: [{ translateY: spin2.value }] }));
  const animStyle3 = useAnimatedStyle(() => ({ transform: [{ translateY: spin3.value }] }));

  const handleSpin = useCallback(async () => {
    if (spinning || balance < betAmount) return;
    setSpinning(true);
    setResultText("");
    setBalance((b) => b - betAmount);

    // Start spin animation
    const spinDist = REEL_H * 8;
    spin1.value = 0;
    spin2.value = 0;
    spin3.value = 0;
    spin1.value = withSequence(
      withTiming(-spinDist, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      withTiming(0, { duration: 400, easing: Easing.bounce })
    );
    spin2.value = withDelay(150, withSequence(
      withTiming(-spinDist, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      withTiming(0, { duration: 400, easing: Easing.bounce })
    ));
    spin3.value = withDelay(300, withSequence(
      withTiming(-spinDist, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      withTiming(0, { duration: 400, easing: Easing.bounce })
    ));

    try {
      const res = await playGame("slot");
      setBalance(res.coinsRemaining);
      setCoins(res.coinsRemaining);

      // Pick display symbols based on result
      const won = res.totalWin > 0;
      const sym = won ? "👑" : SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
      const finalReels = won
        ? ["👑", "👑", "👑"]
        : [
            SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
            SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
            SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          ];

      setTimeout(() => {
        setReels(finalReels);
        if (won) {
          setCash(res.newBalance);
          setResultText(`WIN! +${res.totalWin}₾ 🎉`);
        }
        setSpinning(false);
      }, 1600);
    } catch (err: any) {
      setBalance((b) => b + betAmount);
      Alert.alert("Error", err.message || "Spin failed");
      setSpinning(false);
    }
  }, [balance, betAmount, spinning, setCoins, setCash]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable onPress={() => nav.goBack()} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </Pressable>
        <Text style={styles.title}>Midnight Machine</Text>
        <View style={styles.balancePill}>
          <Text style={styles.balanceText}>🪙 {balance}</Text>
        </View>
      </View>

      {/* Slot reels */}
      <View style={styles.machine}>
        <View style={styles.reelRow}>
          {[animStyle1, animStyle2, animStyle3].map((style, i) => (
            <View key={i} style={styles.reelWindow}>
              <Animated.View style={[styles.reel, style]}>
                <Text style={styles.symbol}>{reels[i]}</Text>
              </Animated.View>
            </View>
          ))}
        </View>

        {resultText ? (
          <Text style={styles.resultText}>{resultText}</Text>
        ) : null}
      </View>

      {/* Bottom */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        {/* Bet selector */}
        <View style={styles.betRow}>
          {BET_OPTIONS.slice(0, 4).map((amt) => (
            <Pressable
              key={amt}
              onPress={() => setBetAmount(amt)}
              style={[styles.betChip, betAmount === amt && styles.betChipActive]}
            >
              <Text style={[styles.betChipText, betAmount === amt && { color: "#000" }]}>{amt}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={handleSpin}
          disabled={spinning || balance < betAmount}
          style={[styles.spinBtn, (spinning || balance < betAmount) && styles.spinBtnDisabled]}
        >
          <Text style={styles.spinBtnText}>{spinning ? "Spinning..." : "SPIN"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0014" },
  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 14, paddingVertical: 10,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center", justifyContent: "center",
  },
  closeBtnText: { color: "rgba(255,255,255,0.6)", fontSize: 16 },
  title: { color: colors.white, fontSize: 17, fontFamily: fonts.outfit.bold },
  balancePill: {
    backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  balanceText: { color: colors.white, fontSize: 14, fontFamily: fonts.outfit.bold },
  machine: { flex: 1, alignItems: "center", justifyContent: "center" },
  reelRow: { flexDirection: "row", gap: 12 },
  reelWindow: {
    width: (W - 80) / 3, height: REEL_H * 1.5, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 2,
    borderColor: "rgba(255,215,0,0.3)", overflow: "hidden",
    alignItems: "center", justifyContent: "center",
  },
  reel: { alignItems: "center", justifyContent: "center" },
  symbol: { fontSize: 48 },
  resultText: {
    color: colors.gold, fontSize: 24, fontFamily: fonts.outfit.bold,
    marginTop: 24, textAlign: "center",
  },
  bottomBar: { paddingHorizontal: 16, paddingTop: 12 },
  betRow: { flexDirection: "row", gap: 8, justifyContent: "center", marginBottom: 12 },
  betChip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  betChipActive: { backgroundColor: colors.gold },
  betChipText: { color: "rgba(255,255,255,0.6)", fontSize: 15, fontFamily: fonts.outfit.bold },
  spinBtn: {
    backgroundColor: "#4338CA", borderRadius: 32, height: 60,
    alignItems: "center", justifyContent: "center",
  },
  spinBtnDisabled: { backgroundColor: "#2a2a3a" },
  spinBtnText: { color: colors.white, fontSize: 20, fontFamily: fonts.outfit.extraBold },
});
