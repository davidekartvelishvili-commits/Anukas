import { Server as IOServer } from "socket.io";
import type { Socket } from "socket.io";
import { eq } from "drizzle-orm";
import { getDb } from "../db/client.js";
import { users } from "../db/schema.js";
import {
  createRoom,
  joinRoom,
  findRoomByUser,
  removePlayer,
  cleanupFinished,
  getPublicRooms,
  deleteRoom,
  addToQueue,
  removeFromQueue,
  rooms,
  userToRoom,
} from "./roomManager.js";
import type { Room, RoomPlayer } from "./roomManager.js";
import {
  startGameLoop,
  updatePaddle,
  setRobotPlayer,
  clearRobotPlayer,
  stopGameLoop,
  getGameState,
} from "./gameLoop.js";

// ── Disconnect timers ──
// socketId → { warningTimer, robotTimer }
interface DisconnectTimers {
  warningTimer: ReturnType<typeof setTimeout>;
  robotTimer: ReturnType<typeof setTimeout>;
}
const disconnectTimers: Map<string, DisconnectTimers> = new Map();

// ── Socket-to-user mapping ──
const socketToUser: Map<string, { userId: string; displayName: string }> = new Map();

// ── Cleanup interval ──
let cleanupInterval: ReturnType<typeof setInterval> | null = null;

// ── Helpers ──

async function fetchDisplayName(userId: string): Promise<string> {
  try {
    const db = getDb();
    const result = await db
      .select({ stageName: users.stageName, name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (result.length > 0) {
      return result[0].stageName || result[0].name || "Player";
    }
  } catch (e) {
    console.error("[socket] failed to fetch display name", e);
  }
  return "Player";
}

function getPlayerSide(room: Room, socketId: string): "bottom" | "top" | null {
  const player = room.players.find((p) => p.socketId === socketId);
  return player?.side ?? null;
}

function getOpponent(room: Room, socketId: string): RoomPlayer | null {
  return room.players.find((p) => p.socketId !== socketId) ?? null;
}

function beginGame(room: Room, io: IOServer): void {
  if (room.players.length < 2) return;

  room.status = "playing";

  const [p1, p2] = room.players;

  // Notify both players
  io.to(p1.socketId).emit("gameStart", {
    yourSide: p1.side,
    opponentName: p2.displayName,
    wager: room.wager,
    goalTarget: room.goalTarget,
  });
  io.to(p2.socketId).emit("gameStart", {
    yourSide: p2.side,
    opponentName: p1.displayName,
    wager: room.wager,
    goalTarget: room.goalTarget,
  });

  // Both sockets join the Socket.io room
  const s1 = io.sockets.sockets.get(p1.socketId);
  const s2 = io.sockets.sockets.get(p2.socketId);
  s1?.join(room.id);
  s2?.join(room.id);

  // Start server-authoritative game loop
  startGameLoop(
    room.id,
    room.goalTarget,
    io,
    // onGoal
    (roomId, scorer, score) => {
      io.to(roomId).emit("goalScored", { scorer, score });
    },
    // onGameOver
    (roomId, winner) => {
      const r = rooms.get(roomId);
      if (!r) return;
      r.status = "finished";

      const winnerPlayer = r.players.find((p) => p.side === winner);
      const loserPlayer = r.players.find((p) => p.side !== winner);
      const coinsWon = r.wager * 2; // winner takes both wagers

      // Emit to winner
      if (winnerPlayer) {
        io.to(winnerPlayer.socketId).emit("gameOver", {
          winner,
          yourResult: "win" as const,
          coinsWon,
        });
        io.to(winnerPlayer.socketId).emit("coinsResult", {
          delta: r.wager, // net gain
          reason: "air_hockey_win",
        });
      }

      // Emit to loser
      if (loserPlayer) {
        io.to(loserPlayer.socketId).emit("gameOver", {
          winner,
          yourResult: "lose" as const,
          coinsWon: 0,
        });
        io.to(loserPlayer.socketId).emit("coinsResult", {
          delta: -r.wager,
          reason: "air_hockey_loss",
        });
      }

      // Clean up game loop after a short delay
      setTimeout(() => {
        stopGameLoop(roomId);
      }, 2000);
    }
  );
}

// ── Main setup ──

export function setupSocketServer(httpServer: any): void {
  const io = new IOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Same policy as Hono CORS
        if (!origin) return callback(null, true);
        if (origin.endsWith(".vercel.app")) return callback(null, true);
        const allowed = [
          "http://localhost:3000",
          "http://localhost:3001",
          process.env.FRONTEND_URL,
        ].filter(Boolean) as string[];
        if (allowed.includes(origin)) return callback(null, true);
        return callback(null, true); // permissive for dev
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
    path: "/socket.io",
  });

  // Periodic cleanup of finished rooms
  cleanupInterval = setInterval(() => {
    cleanupFinished();
  }, 10_000);

  io.on("connection", (socket: Socket) => {
    console.log(`[socket.io] connected: ${socket.id}`);

    // ── createRoom ──
    socket.on("createRoom", async (data: {
      userId: string;
      wager: number;
      goalTarget: number;
      isPrivate: boolean;
    }) => {
      try {
        const displayName = await fetchDisplayName(data.userId);
        socketToUser.set(socket.id, { userId: data.userId, displayName });

        const room = createRoom(
          { socketId: socket.id, userId: data.userId, displayName },
          data.wager,
          data.goalTarget,
          data.isPrivate
        );

        socket.join(room.id);
        socket.emit("roomCreated", {
          roomId: room.id,
          pin: room.pin,
        });
      } catch (e: any) {
        socket.emit("error", { message: e.message || "Failed to create room" });
      }
    });

    // ── joinRoom ──
    socket.on("joinRoom", async (data: {
      userId: string;
      roomId: string;
      pin?: string;
    }) => {
      try {
        const displayName = await fetchDisplayName(data.userId);
        socketToUser.set(socket.id, { userId: data.userId, displayName });

        const room = joinRoom(
          { socketId: socket.id, userId: data.userId, displayName },
          data.roomId,
          data.pin
        );

        if (!room) {
          socket.emit("error", { message: "Cannot join room. Check room ID and PIN." });
          return;
        }

        socket.join(room.id);

        const opponent = getOpponent(room, socket.id);
        socket.emit("roomJoined", {
          roomId: room.id,
          side: "top" as const,
          opponentName: opponent?.displayName ?? "Player",
          wager: room.wager,
          goalTarget: room.goalTarget,
        });

        // Room is full — start the game
        if (room.players.length === 2) {
          beginGame(room, io);
        }
      } catch (e: any) {
        socket.emit("error", { message: e.message || "Failed to join room" });
      }
    });

    // ── joinQueue ──
    socket.on("joinQueue", async (data: {
      userId: string;
      wager: number;
      goalTarget: number;
    }) => {
      try {
        const displayName = await fetchDisplayName(data.userId);
        socketToUser.set(socket.id, { userId: data.userId, displayName });

        const matchedRoom = addToQueue({
          socketId: socket.id,
          userId: data.userId,
          displayName,
          wager: data.wager,
          goalTarget: data.goalTarget,
        });

        if (matchedRoom) {
          // Both players matched — start game
          beginGame(matchedRoom, io);
        }
        // If no match yet, player stays in queue silently
      } catch (e: any) {
        socket.emit("error", { message: e.message || "Failed to join queue" });
      }
    });

    // ── paddleMove ──
    socket.on("paddleMove", (data: { x: number; y: number }) => {
      const userData = socketToUser.get(socket.id);
      if (!userData) return;

      const room = findRoomByUser(userData.userId);
      if (!room || room.status !== "playing") return;

      const side = getPlayerSide(room, socket.id);
      if (!side) return;

      updatePaddle(room.id, side, data.x, data.y);
    });

    // ── leaveRoom ──
    socket.on("leaveRoom", () => {
      handleDisconnect(socket, io);
    });

    // ── spectate ──
    socket.on("spectate", (data: { roomId: string }) => {
      const room = rooms.get(data.roomId);
      if (!room) {
        socket.emit("error", { message: "Room not found" });
        return;
      }

      room.spectators.push(socket.id);
      socket.join(room.id);

      // Send current game state if game is running
      const state = getGameState(room.id);
      if (state) {
        socket.emit("gameState", state);
      }
    });

    // ── getRoomList ──
    socket.on("getRoomList", () => {
      const publicRooms = getPublicRooms();
      socket.emit("roomList", publicRooms.map((r) => ({
        id: r.id,
        isPrivate: r.isPrivate,
        players: r.players.map((p) => ({
          displayName: p.displayName,
          side: p.side,
        })),
        wager: r.wager,
        goalTarget: r.goalTarget,
        status: r.status,
        createdAt: r.createdAt,
      })));
    });

    // ── disconnect ──
    socket.on("disconnect", () => {
      console.log(`[socket.io] disconnected: ${socket.id}`);
      handleDisconnect(socket, io);
    });
  });

  console.log("[socket.io] server initialized");
}

// ── Disconnect handling ──

function handleDisconnect(socket: Socket, io: IOServer): void {
  const userData = socketToUser.get(socket.id);

  // Remove from matchmaking queue
  removeFromQueue(socket.id);

  if (!userData) {
    removePlayer(socket.id);
    socketToUser.delete(socket.id);
    return;
  }

  const room = findRoomByUser(userData.userId);
  if (!room) {
    socketToUser.delete(socket.id);
    return;
  }

  const side = getPlayerSide(room, socket.id);

  // If room is waiting (not yet started), just delete it
  if (room.status === "waiting") {
    stopGameLoop(room.id);
    deleteRoom(room.id);
    // Notify other player if present
    const other = getOpponent(room, socket.id);
    if (other) {
      io.to(other.socketId).emit("error", { message: "Opponent left the room" });
    }
    socketToUser.delete(socket.id);
    return;
  }

  // If room is finished, just clean up
  if (room.status === "finished") {
    socketToUser.delete(socket.id);
    return;
  }

  // Game is in progress — start disconnect timer
  removePlayer(socket.id);

  if (!side) {
    socketToUser.delete(socket.id);
    return;
  }

  // Cancel any existing timers for this socket
  const existing = disconnectTimers.get(socket.id);
  if (existing) {
    clearTimeout(existing.warningTimer);
    clearTimeout(existing.robotTimer);
  }

  // After 5 seconds: warn other player
  const warningTimer = setTimeout(() => {
    io.to(room.id).emit("playerDisconnecting", { side, timeLeft: 10 });
  }, 5_000);

  // After 15 seconds: robot takes over
  const robotTimer = setTimeout(() => {
    setRobotPlayer(room.id, side);
    io.to(room.id).emit("robotTakeover", { side });
    disconnectTimers.delete(socket.id);
  }, 15_000);

  disconnectTimers.set(socket.id, { warningTimer, robotTimer });
  socketToUser.delete(socket.id);
}

// Handle reconnection: when a player reconnects, they send joinRoom
// with their userId. If findRoomByUser finds an active room, we
// restore them. This is handled naturally by the joinRoom flow +
// the reconnect logic below.

// Note: Socket.io's built-in reconnection will create a new socket.id.
// The client should re-emit a "reconnect" event with their userId.
// We can add this as an extension:
// socket.on("reconnect", ...) — but Socket.io "reconnect" is client-side.
// Instead, we handle it via a custom "rejoinGame" event.
