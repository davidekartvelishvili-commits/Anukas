import { useState, useRef, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  Dimensions, ActivityIndicator, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { startChickenRush, type ChickenRushServerResult } from "../../services/chickenRush";
import { ensureActiveTransaction } from "../../services/games";
import { useBalance } from "../../providers/BalanceProvider";
import { colors, fonts, fontSize } from "../../config/theme";

type Difficulty = "easy" | "medium" | "hard" | "extreme";
type TileState = "hidden" | "safe" | "trap" | "revealed-trap";

const DIFFICULTIES: Record<Difficulty, { cols: number; rows: number; multiplierPerStep: number; label: string; color: string }> = {
  easy:    { cols: 5, rows: 25, multiplierPerStep: 1.2, label: "Easy", color: "#00E676" },
  medium:  { cols: 4, rows: 20, multiplierPerStep: 1.3, label: "Medium", color: "#FFC107" },
  hard:    { cols: 3, rows: 15, multiplierPerStep: 1.45, label: "Hard", color: "#FF9800" },
  extreme: { cols: 2, rows: 10, multiplierPerStep: 1.9, label: "Extreme", color: "#FF3D00" },
};

const { width: W } = Dimensions.get("window");
const BET_OPTIONS = [10, 25, 50, 100, 250, 500];

export default function ChickenRushScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const { coins, setCoins, setCash } = useBalance();
  const scrollRef = useRef<ScrollView>(null);

  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [betAmount, setBetAmount] = useState(10);
  const [balance, setBalance] = useState(0);
  const [tiles, setTiles] = useState<TileState[][]>([]);
  const [currentRow, setCurrentRow] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [chickenPos, setChickenPos] = useState<{ row: number; col: number } | null>(null);
  const [resultText, setResultText] = useState("");
  const serverRef = useRef<ChickenRushServerResult | null>(null);

  const config = DIFFICULTIES[difficulty];
  const tileSize = Math.min((W - 32 - (config.cols - 1) * 4) / config.cols, 64);

  useEffect(() => {
    ensureActiveTransaction().then((tx) => {
      setBalance(tx.coinsRemaining);
      setCoins(tx.coinsRemaining);
    }).catch(() => {});
  }, []);

  const startRound = useCallback(async () => {
    if (balance < betAmount) return;
    setResultText("");
    try {
      const sr = await startChickenRush(betAmount, difficulty);
      serverRef.current = sr;
      setBalance(sr.coinsRemaining);
      setCoins(sr.coinsRemaining);
      const newTiles: TileState[][] = [];
      for (let r = 0; r < sr.totalSteps; r++) newTiles.push(Array(sr.cols).fill("hidden"));
      setTiles(newTiles);
      setCurrentRow(0);
      setMultiplier(1);
      setGameOver(false);
      setChickenPos(null);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to start");
    }
  }, [balance, betAmount, difficulty, setCoins]);

  useEffect(() => { startRound(); }, []);

  const handleTilePress = useCallback((row: number, col: number) => {
    if (gameOver || animating || row !== currentRow) return;
    const sr = serverRef.current;
    if (!sr) return;
    setAnimating(true);

    const isTrap = row >= sr.trapStep && col === sr.trapMap[row];

    if (!isTrap) {
      const newTiles = tiles.map((r) => [...r]);
      newTiles[row][col] = "safe";
      setTiles(newTiles);
      const nextRow = row + 1;
      const stepVal = sr.stepValues[row] || 0;
      setCurrentRow(nextRow);
      setMultiplier(Math.round(stepVal * 100) / 100);
      setChickenPos({ row, col });

      if (nextRow >= sr.totalSteps) {
        setGameOver(true);
        setCash(sr.totalWin);
        setResultText(`LEGENDARY! +${sr.totalWin}₾`);
        setTimeout(() => startRound(), 3000);
      }
    } else {
      const newTiles = tiles.map((r) => [...r]);
      newTiles[row][col] = "trap";
      // Reveal all traps
      sr.trapMap.forEach((tc, r) => {
        if (r !== row && newTiles[r]) newTiles[r][tc] = "revealed-trap";
      });
      setTiles(newTiles);
      setChickenPos({ row, col });
      setGameOver(true);
      if (sr.minWin > 0) setCash(sr.minWin);
      setResultText("You hit a trap!");
      setTimeout(() => startRound(), 2500);
    }
    setTimeout(() => setAnimating(false), 300);
  }, [tiles, currentRow, gameOver, animating, startRound, setCash]);

  const handleCashout = useCallback(() => {
    if (gameOver || currentRow === 0) return;
    const sr = serverRef.current;
    if (!sr) return;
    if (currentRow < (sr.cashoutUnlockStep ?? 10)) return;
    const idx = Math.max(0, currentRow - 1);
    const winAmt = sr.stepValues[idx] || sr.minWin;
    if (winAmt > 0) setCash(winAmt);
    setGameOver(true);
    setResultText(`Cashed out! +${winAmt}₾`);
    setTimeout(() => startRound(), 2500);
  }, [currentRow, gameOver, startRound, setCash]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable onPress={() => nav.goBack()} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </Pressable>
        <View style={styles.betPill}>
          <Text style={styles.betText}>₾{betAmount}</Text>
          <Text style={styles.betLabel}>Lucky Step</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Multiplier */}
      <Text style={styles.multiplier}>x{multiplier.toFixed(2)}</Text>

      {/* Difficulty pills */}
      <View style={styles.diffRow}>
        {(Object.keys(DIFFICULTIES) as Difficulty[]).map((d) => (
          <Pressable
            key={d}
            onPress={() => setDifficulty(d)}
            style={[styles.diffPill, difficulty === d && { backgroundColor: DIFFICULTIES[d].color }]}
          >
            <Text style={[styles.diffText, difficulty === d && { color: "#000" }]}>
              {DIFFICULTIES[d].label}
            </Text>
          </Pressable>
        ))}
      </View>

      {resultText ? <Text style={styles.resultText}>{resultText}</Text> : null}

      {/* Grid */}
      <ScrollView
        ref={scrollRef}
        style={styles.gridScroll}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
      >
        {tiles.map((row, rowIdx) => (
          <View key={rowIdx} style={styles.tileRow}>
            {row.map((state, colIdx) => {
              const isChicken = chickenPos?.row === rowIdx && chickenPos?.col === colIdx;
              const isCurrent = rowIdx === currentRow;
              return (
                <Pressable
                  key={colIdx}
                  onPress={() => handleTilePress(rowIdx, colIdx)}
                  style={[
                    styles.tile,
                    { width: tileSize, height: tileSize },
                    state === "safe" && styles.tileSafe,
                    state === "trap" && styles.tileTrap,
                    state === "revealed-trap" && styles.tileRevealedTrap,
                    isCurrent && state === "hidden" && styles.tileCurrent,
                  ]}
                >
                  {isChicken && state === "safe" && <Text style={{ fontSize: tileSize * 0.5 }}>🐔</Text>}
                  {state === "trap" && <Text style={{ fontSize: tileSize * 0.5 }}>💥</Text>}
                  {state === "revealed-trap" && <Text style={{ fontSize: tileSize * 0.35, opacity: 0.5 }}>💣</Text>}
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>

      {/* Bottom: cashout + bet */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        {currentRow > 0 && !gameOver && (
          <Pressable onPress={handleCashout} style={styles.cashoutBtn}>
            <Text style={styles.cashoutText}>Cash Out</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050a1a" },
  topBar: {
    flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between",
    paddingHorizontal: 14, paddingVertical: 10,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center", justifyContent: "center",
  },
  closeBtnText: { color: "rgba(255,255,255,0.6)", fontSize: 16 },
  betPill: {
    backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 22,
    paddingHorizontal: 20, paddingVertical: 8, alignItems: "center",
  },
  betText: { color: colors.white, fontSize: 17, fontFamily: fonts.outfit.bold },
  betLabel: { color: "rgba(255,255,255,0.45)", fontSize: 10, fontFamily: fonts.dmSans.medium },
  multiplier: {
    color: colors.white, fontSize: 28, fontFamily: fonts.outfit.extraBold,
    textAlign: "center", paddingVertical: 4,
  },
  diffRow: { flexDirection: "row", justifyContent: "center", gap: 6, paddingVertical: 4 },
  diffPill: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  diffText: { color: "rgba(255,255,255,0.6)", fontSize: 12, fontFamily: fonts.outfit.semiBold },
  resultText: {
    color: colors.gold, fontSize: 18, fontFamily: fonts.outfit.bold,
    textAlign: "center", paddingVertical: 8,
  },
  gridScroll: { flex: 1 },
  gridContent: { alignItems: "center", paddingVertical: 12 },
  tileRow: { flexDirection: "row", gap: 4, marginBottom: 4 },
  tile: {
    borderRadius: 10, backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  tileSafe: { backgroundColor: "rgba(0,230,118,0.25)", borderColor: "rgba(0,230,118,0.5)" },
  tileTrap: { backgroundColor: "rgba(255,61,0,0.3)", borderColor: "rgba(255,61,0,0.6)" },
  tileRevealedTrap: { backgroundColor: "rgba(255,61,0,0.1)", borderColor: "rgba(255,61,0,0.2)" },
  tileCurrent: { borderColor: "rgba(124,77,255,0.5)", backgroundColor: "rgba(124,77,255,0.12)" },
  bottomBar: { paddingHorizontal: 16, paddingTop: 8 },
  cashoutBtn: {
    backgroundColor: "#FFE500", borderRadius: 32, height: 56,
    alignItems: "center", justifyContent: "center",
  },
  cashoutText: { color: "#000", fontSize: 18, fontFamily: fonts.outfit.bold },
});
