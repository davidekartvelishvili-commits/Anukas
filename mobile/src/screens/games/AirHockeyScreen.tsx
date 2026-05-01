import { useState, useEffect, useCallback } from "react";
import {
  View, Text, Pressable, StyleSheet, Alert, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { connectSocket, disconnectSocket, getSocket } from "../../services/socket";
import { useAuth } from "../../providers/AuthProvider";
import { colors, fonts, fontSize, radii } from "../../config/theme";

// TODO: Replace with @shopify/react-native-skia canvas for full
// Air Hockey rendering with PanGestureHandler for paddle control.
// This interim version handles the Socket.IO multiplayer lobby.

type LobbyState = "idle" | "creating" | "joining" | "queued" | "playing";

export default function AirHockeyScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const { token } = useAuth();

  const [state, setState] = useState<LobbyState>("idle");
  const [roomCode, setRoomCode] = useState("");
  const [opponent, setOpponent] = useState("");
  const [score, setScore] = useState({ me: 0, them: 0 });

  useEffect(() => {
    if (!token) return;
    const socket = connectSocket(token);

    socket.on("game:start", (data: any) => {
      setState("playing");
      setOpponent(data.opponentName || "Opponent");
    });

    socket.on("game:score", (data: any) => {
      setScore({ me: data.myScore, them: data.opponentScore });
    });

    socket.on("game:end", (data: any) => {
      Alert.alert(
        "Game Over",
        data.won ? "You won! 🎉" : "You lost!",
        [{ text: "OK", onPress: () => setState("idle") }]
      );
    });

    return () => {
      disconnectSocket();
    };
  }, [token]);

  const createRoom = () => {
    setState("creating");
    const socket = getSocket();
    socket.emit("createRoom", {}, (res: any) => {
      if (res?.roomCode) {
        setRoomCode(res.roomCode);
        setState("queued");
      }
    });
  };

  const joinQueue = () => {
    setState("queued");
    const socket = getSocket();
    socket.emit("joinQueue");
  };

  if (state === "playing") {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.gameHeader}>
          <Text style={styles.scoreText}>{score.me}</Text>
          <Text style={styles.vsText}>vs</Text>
          <Text style={styles.scoreText}>{score.them}</Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldPlaceholder}>
            Air Hockey Game{"\n"}(Skia canvas coming soon)
          </Text>
          <Text style={styles.opponentLabel}>Playing vs {opponent}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.topBar}>
        <Pressable onPress={() => nav.goBack()} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </Pressable>
        <Text style={styles.title}>Air Hockey</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.lobby}>
        <Text style={{ fontSize: 64, marginBottom: 24 }}>🏒</Text>
        <Text style={styles.lobbyTitle}>Multiplayer Air Hockey</Text>
        <Text style={styles.lobbySubtitle}>Play against real players</Text>

        {state === "idle" && (
          <View style={styles.buttons}>
            <Pressable onPress={joinQueue} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Find Match</Text>
            </Pressable>
            <Pressable onPress={createRoom} style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText}>Create Room</Text>
            </Pressable>
          </View>
        )}

        {state === "queued" && (
          <View style={styles.waitingState}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.waitingText}>Waiting for opponent...</Text>
            {roomCode ? <Text style={styles.roomCode}>Room: {roomCode}</Text> : null}
            <Pressable onPress={() => { setState("idle"); disconnectSocket(); }} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
          </View>
        )}

        {state === "creating" && (
          <ActivityIndicator size="large" color={colors.accent} />
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
  title: { color: colors.white, fontSize: 17, fontFamily: fonts.outfit.bold },
  lobby: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  lobbyTitle: { color: colors.white, fontSize: 24, fontFamily: fonts.outfit.bold, marginBottom: 8 },
  lobbySubtitle: { color: colors.textSecondary, fontSize: 15, fontFamily: fonts.dmSans.regular, marginBottom: 32 },
  buttons: { width: "100%", gap: 12 },
  primaryBtn: {
    backgroundColor: colors.accent, borderRadius: 32, height: 56,
    alignItems: "center", justifyContent: "center",
  },
  primaryBtnText: { color: "#000", fontSize: 18, fontFamily: fonts.outfit.bold },
  secondaryBtn: {
    backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 32, height: 56,
    alignItems: "center", justifyContent: "center",
  },
  secondaryBtnText: { color: colors.white, fontSize: 18, fontFamily: fonts.outfit.semiBold },
  waitingState: { alignItems: "center", gap: 16 },
  waitingText: { color: colors.textSecondary, fontSize: 16, fontFamily: fonts.dmSans.medium },
  roomCode: { color: colors.gold, fontSize: 20, fontFamily: fonts.outfit.bold },
  cancelBtn: { marginTop: 8 },
  cancelBtnText: { color: colors.error, fontSize: 15, fontFamily: fonts.outfit.semiBold },
  // Game screen
  gameHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 24, paddingVertical: 16,
  },
  scoreText: { color: colors.white, fontSize: 36, fontFamily: fonts.outfit.bold },
  vsText: { color: colors.textSecondary, fontSize: 16, fontFamily: fonts.dmSans.regular },
  field: {
    flex: 1, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.03)", margin: 16, borderRadius: radii.lg,
  },
  fieldPlaceholder: {
    color: colors.textSecondary, fontSize: 16, fontFamily: fonts.dmSans.regular,
    textAlign: "center", lineHeight: 24,
  },
  opponentLabel: { color: colors.accent, fontSize: 14, fontFamily: fonts.dmSans.medium, marginTop: 12 },
});
