import { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { GamesStackParamList } from "../../navigation/types";
import { apiFetch } from "../../services/api";
import { colors, fonts, fontSize, radii } from "../../config/theme";

type Nav = NativeStackNavigationProp<GamesStackParamList>;
const { width: W } = Dimensions.get("window");

const ALL_GAMES = [
  { id: 1, name: "Midnight Machine", desc: "Slot machine", gameType: "slot", route: "MidnightMachine" as const, gradient: "#4338CA", emoji: "🎰" },
  { id: 3, name: "Lucky Step", desc: "Path platformer", gameType: "chicken_rush", route: "ChickenRush" as const, gradient: "#1a237e", emoji: "🐔" },
  { id: 4, name: "Lucky Drop", desc: "Plinko ball drop", gameType: "plinko", route: "LuckyDrop" as const, gradient: "#1a237e", emoji: "🎱" },
  { id: 5, name: "Air Hockey", desc: "Multiplayer", gameType: "air_hockey", route: "AirHockey" as const, gradient: "#0A0F1C", emoji: "🏒" },
];

export default function GamesHubScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const [activeTypes, setActiveTypes] = useState<string[]>(["slot", "plinko", "chicken_rush", "air_hockey"]);

  useEffect(() => {
    apiFetch("/games/config").then((data: any) => {
      if (data?.games) {
        const types: string[] = data.games.filter((g: any) => g.isActive).map((g: any) => g.gameType);
        setActiveTypes(Array.from(new Set([...types, "air_hockey"])));
      }
    }).catch(() => {});
  }, []);

  const cardW = (W - 32 - 12) / 2;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.headerTitle}>{"\u10D7\u10D0\u10DB\u10D0\u10E8\u10D4\u10D1\u10D8"}</Text>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {ALL_GAMES.filter(g => activeTypes.includes(g.gameType)).map((game) => (
            <Pressable
              key={game.id}
              onPress={() => nav.navigate(game.route)}
              style={[styles.card, { width: cardW, backgroundColor: game.gradient }]}
            >
              <Text style={styles.emoji}>{game.emoji}</Text>
              <Text style={styles.cardName}>{game.name}</Text>
              <Text style={styles.cardDesc}>{game.desc}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  headerTitle: {
    color: colors.white, fontSize: 28, fontFamily: fonts.outfit.bold,
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
  },
  scroll: { paddingHorizontal: 16, paddingBottom: 100 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: {
    height: 160, borderRadius: radii.lg + 8, padding: 16,
    justifyContent: "flex-end",
  },
  emoji: { fontSize: 36, marginBottom: 8 },
  cardName: { color: colors.white, fontSize: 16, fontFamily: fonts.outfit.bold },
  cardDesc: { color: "rgba(255,255,255,0.6)", fontSize: 12, fontFamily: fonts.dmSans.regular, marginTop: 2 },
});
