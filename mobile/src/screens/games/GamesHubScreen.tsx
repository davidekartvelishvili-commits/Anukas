import { useState, useEffect } from "react";
import {
  View, Text, ScrollView, Pressable, StyleSheet, Image, Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { GamesStackParamList } from "../../navigation/types";
import { apiFetch } from "../../services/api";
import { useBalance } from "../../providers/BalanceProvider";
import { fonts } from "../../config/theme";
import Svg, { Path, Circle as SvgCircle } from "react-native-svg";

type Nav = NativeStackNavigationProp<GamesStackParamList>;
const { width: SW } = Dimensions.get("window");

interface GameDef {
  id: string;
  gameType: string | null;
  name: string;
  gradientColors: [string, string];
  cover: any;
  route: keyof GamesStackParamList | null;
}

const ALL_GAMES: GameDef[] = [
  { id: "midnight-machine", gameType: "slot", name: "Midnight Machine", gradientColors: ["#4338CA", "#6366F1"], cover: require("../../../assets/lucky-step-cover.png"), route: "MidnightMachine" },
  { id: "chicken-rush", gameType: "chicken_rush", name: "Lucky Step", gradientColors: ["#1a237e", "#7c4dff"], cover: require("../../../assets/lucky-step-cover.png"), route: "ChickenRush" },
  { id: "lucky-drop", gameType: "plinko", name: "Lucky Drop", gradientColors: ["#1a237e", "#7c4dff"], cover: require("../../../assets/lucky-drop-cover.png"), route: "LuckyDrop" },
  { id: "air-hockey", gameType: null, name: "Air Hockey", gradientColors: ["#0A0F1C", "#1C2539"], cover: require("../../../assets/air-hockey-cover.png"), route: "AirHockey" },
];

const NEWLY_ADDED = ["air-hockey", "lucky-drop", "chicken-rush"];
const FAN_FAVORITES = ["midnight-machine", "lucky-drop", "chicken-rush", "air-hockey"];
const COVERD_FAVORITES = ["midnight-machine"];

function getGame(id: string) { return ALL_GAMES.find(g => g.id === id); }

/* ── Icons ── */
function FireIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path d="M10 2C10 2 6 6.5 6 10.5C6 13 7.8 15 10 15C12.2 15 14 13 14 10.5C14 6.5 10 2 10 2Z" fill="#FF6B35" />
      <Path d="M10 7C10 7 8 9.5 8 11.5C8 12.9 8.9 14 10 14C11.1 14 12 12.9 12 11.5C12 9.5 10 7 10 7Z" fill="#FFD700" />
    </Svg>
  );
}

function StarIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="#FFD700">
      <Path d="M10 2l2.4 4.8 5.3.8-3.8 3.7.9 5.3L10 14.2l-4.8 2.4.9-5.3L2.3 7.6l5.3-.8L10 2z" />
    </Svg>
  );
}

function HeartIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="rgba(255,107,157,0.15)" stroke="#FF6B9D" strokeWidth={1.8}>
      <Path d="M10 17s-7-4.5-7-9a4 4 0 018 0 4 4 0 018 0c0 4.5-7 9-7 9z" />
    </Svg>
  );
}

/* ── Game Card ── */
function GameCard({ game, size = "medium", onPlay }: { game: GameDef; size?: "medium" | "large"; onPlay: () => void }) {
  const cardW = size === "large" ? (SW - 32 - 12) / 2 : 130;
  const cardH = size === "large" ? cardW * 1.1 : 130;

  return (
    <Pressable
      onPress={onPlay}
      style={({ pressed }) => [{
        width: cardW, height: cardH,
        borderRadius: 36, overflow: "hidden",
        backgroundColor: game.gradientColors[0],
      }, pressed && { transform: [{ scale: 0.97 }] }]}
    >
      <Image source={game.cover} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <View style={styles.cardGradient}>
        <Text style={styles.cardName}>{game.name}</Text>
      </View>
    </Pressable>
  );
}

/* ── Section Header ── */
function SectionHeader({ icon, title, showSeeAll }: { icon: React.ReactNode; title: string; showSeeAll?: boolean }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        {icon}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {showSeeAll && <Text style={styles.seeAll}>See All</Text>}
    </View>
  );
}

export default function GamesHubScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const { coins } = useBalance();
  const [activeTypes, setActiveTypes] = useState<string[]>(["slot", "plinko", "chicken_rush", "air_hockey"]);

  useEffect(() => {
    apiFetch("/games/config").then((data: any) => {
      if (data?.games) {
        const types: string[] = data.games.filter((g: any) => g.isActive).map((g: any) => g.gameType);
        setActiveTypes(Array.from(new Set([...types, "air_hockey"])));
      }
    }).catch(() => {});
  }, []);

  const playable = ALL_GAMES.filter(g => g.gameType === null || activeTypes.includes(g.gameType!));

  const navigateGame = (game: GameDef) => {
    if (game.route) nav.navigate(game.route as any);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.coinPill}>
            <Image source={require("../../../assets/coin-icon.png")} style={{ width: 22, height: 22 }} resizeMode="contain" />
            <Text style={styles.coinText}>{coins.toLocaleString()}</Text>
          </View>
        </View>

        <Text style={styles.pageTitle}>Play with Coins</Text>

        {/* Newly Added */}
        <SectionHeader icon={<StarIcon />} title="Newly Added" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {NEWLY_ADDED.map(id => { const g = getGame(id); return g ? <GameCard key={id} game={g} onPlay={() => navigateGame(g)} /> : null; })}
        </ScrollView>

        {/* Fan Favorites */}
        <SectionHeader icon={<FireIcon />} title="Fan Favorites" showSeeAll />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {FAN_FAVORITES.map(id => { const g = getGame(id); return g ? <GameCard key={id} game={g} onPlay={() => navigateGame(g)} /> : null; })}
        </ScrollView>

        {/* Coverd Favorites */}
        <SectionHeader icon={<HeartIcon />} title="Coverd Favorites" />
        <View style={styles.largeGrid}>
          {COVERD_FAVORITES.map(id => { const g = getGame(id); return g ? <GameCard key={id} game={g} size="large" onPlay={() => navigateGame(g)} /> : null; })}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  scroll: { paddingHorizontal: 16, paddingBottom: 100 },

  header: { flexDirection: "row", justifyContent: "flex-start", paddingTop: 16, marginBottom: 16 },
  coinPill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9999,
    backgroundColor: "#1C1C1E",
  },
  coinText: { color: "#FFF", fontSize: 14, fontFamily: fonts.outfit.bold },

  pageTitle: {
    color: "#FFF", fontSize: 19, fontFamily: fonts.outfit.bold,
    textAlign: "center", marginBottom: 24,
  },

  sectionHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: 12, marginTop: 8,
  },
  sectionTitle: { color: "#FFF", fontSize: 18, fontFamily: fonts.outfit.bold },
  seeAll: { color: "#999", fontSize: 14, fontFamily: fonts.dmSans.medium },

  row: { gap: 12, paddingRight: 16, marginBottom: 24 },

  largeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24 },

  cardGradient: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: 14, paddingBottom: 14, paddingTop: 30,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  cardName: { color: "#FFF", fontSize: 16, fontFamily: fonts.outfit.bold },
});
