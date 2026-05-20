import { Server as IOServer } from "socket.io";
import type { Socket } from "socket.io";
import { eq, sql, and, or } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { getDb } from "../db/client.js";
import { users, transactions, gameHistory } from "../db/schema.js";
import { getEnv } from "../utils/env.js";
import { getCoinBalance, deductCoins, addCoins } from "../services/coinService.js";
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
  handleClientHit,
} from "./gameLoop.js";

// ── Disconnect timers ──
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
      return (result[0] as any).stageName || result[0].name || "Player";
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

/** Get userId from the socket's auth data (set during connection middleware). */
function getUserId(socket: Socket): string {
  return (socket.data as any)?.userId || "";
}

function getDisplayName(socket: Socket): string {
  return socketToUser.get(socket.id)?.displayName || "Player";
}


function beginGame(room: Room, io: IOServer): void {
  if (room.players.length < 2) return;
  room.status = "playing";

  const [p1, p2] = room.players;

  // Notify both players — the frontend listens for "gameStart" and
  // uses it to transition from lobby to playing mode.
  io.to(p1.socketId).emit("gameStart", {
    roomId: room.id,
    yourSide: p1.side,
    opponentName: p2.displayName,
    wager: room.wager,
    goalTarget: room.goalTarget,
  });
  io.to(p2.socketId).emit("gameStart", {
    roomId: room.id,
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

  startGameLoop(
    room.id,
    room.goalTarget,
    io,
    (roomId, scorer, score) => {
      io.to(roomId).emit("goalScored", { scorer, score });
    },
    async (roomId, winner) => {
      const r = rooms.get(roomId);
      if (!r) return;
      r.status = "finished";
      r.finishedAt = Date.now();

      const winnerPlayer = r.players.find((p) => p.side === winner);
      const loserPlayer = r.players.find((p) => p.side !== winner);
      const coinsWon = r.wager * 2;

      // Award coins to winner
      if (winnerPlayer && coinsWon > 0) {
        try {
          await addCoins(winnerPlayer.userId, coinsWon);
          // Post to live wins feed (same as Lucky Drop / Midnight Machine)
          const { nanoid } = await import("nanoid");
          const db = getDb();
          await db.insert(gameHistory).values({
            id: nanoid(),
            userId: winnerPlayer.userId,
            gameType: "air_hockey",
            betAmount: r.wager / 100, // coins → Lari
            winAmount: coinsWon / 100, // coins → Lari
          });
        } catch (e) {
          console.error("[gameOver] failed to award coins", e);
        }
      }

      if (winnerPlayer) {
        io.to(winnerPlayer.socketId).emit("gameOver", {
          winner,
          yourResult: "win",
          coinsWon,
          score: getGameState(roomId)?.score,
          opponentWasRobot: loserPlayer?.isRobot ?? false,
        });
      }
      if (loserPlayer) {
        io.to(loserPlayer.socketId).emit("gameOver", {
          winner,
          yourResult: "lose",
          coinsWon: 0,
          score: getGameState(roomId)?.score,
          opponentWasRobot: winnerPlayer?.isRobot ?? false,
        });
      }

      setTimeout(() => stopGameLoop(roomId), 2000);
    }
  );
}

function handleDisconnect(socket: Socket, io: IOServer): void {
  const userData = socketToUser.get(socket.id);
  if (!userData) return;

  const room = findRoomByUser(userData.userId);
  if (!room) {
    // Was the player in the matchmaking queue? Refund their wager.
    const entry = removeFromQueue(socket.id);
    if (entry && entry.wager > 0) {
      addCoins(entry.userId, entry.wager).catch(() => {});
    }
    socketToUser.delete(socket.id);
    return;
  }

  if (room.status === "waiting") {
    // Game never started. Refund every player still in the room
    // (typically just the host who hasn't been joined yet).
    if (room.wager > 0) {
      for (const p of room.players) {
        addCoins(p.userId, room.wager).catch(() => {});
      }
    }
    stopGameLoop(room.id);
    deleteRoom(room.id);
    socketToUser.delete(socket.id);
    return;
  }

  if (room.status === "playing") {
    const side = getPlayerSide(room, socket.id);
    if (!side) return;

    const player = room.players.find((p) => p.socketId === socket.id);
    if (player) player.disconnectedAt = Date.now();

    // Check if BOTH players are now disconnected — if so, end the game
    // immediately instead of waiting for robot timers.
    const allDisconnected = room.players.every((p) => p.disconnectedAt !== null);
    if (allDisconnected) {
      // Cancel any pending timers for the other player
      for (const p of room.players) {
        const timers = disconnectTimers.get(p.socketId);
        if (timers) {
          clearTimeout(timers.warningTimer);
          clearTimeout(timers.robotTimer);
          disconnectTimers.delete(p.socketId);
        }
        userToRoom.delete(p.userId);
      }
      stopGameLoop(room.id);
      room.status = "finished";
      room.finishedAt = Date.now();
      // Delete the room after a short delay
      setTimeout(() => deleteRoom(room.id), 5000);
      socketToUser.delete(socket.id);
      return;
    }

    // Only one player disconnected — start the warning → robot flow.
    // Event name + payload shape MUST match the client listener in
    // src/app/games/air-hockey/page.tsx ("opponentDisconnected").
    const warningTimer = setTimeout(() => {
      io.to(room.id).emit("opponentDisconnected", { countdown: 10 });
    }, 5000);

    const robotTimer = setTimeout(() => {
      setRobotPlayer(room.id, side);
      if (player) player.isRobot = true;
      io.to(room.id).emit("robotTakeover", { side });
    }, 15000);

    disconnectTimers.set(socket.id, { warningTimer, robotTimer });
  }

  // Handle finished rooms — notify remaining player and clean up
  if (room.status === "finished") {
    // Cancel any pending rematch timer
    if (room.rematchTimer) {
      clearTimeout(room.rematchTimer);
      room.rematchTimer = null;
    }
    // Notify remaining player that opponent left
    const remaining = room.players.find((p) => p.socketId !== socket.id);
    if (remaining) {
      io.to(remaining.socketId).emit("opponentLeftGame");
    }
    userToRoom.delete(userData.userId);
  }

  socketToUser.delete(socket.id);
}

// ── Main setup ──

export function setupSocketServer(httpServer: any): void {
  const io = new IOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (origin.endsWith(".vercel.app")) return callback(null, true);
        const allowed = [
          "http://localhost:3000",
          "http://localhost:3001",
          "https://shansi.app",
          "https://www.shansi.app",
          "https://merchants.shansi.app",
          process.env.FRONTEND_URL,
        ].filter(Boolean) as string[];
        if (allowed.includes(origin)) return callback(null, true);
        return callback(null, true);
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
    path: "/socket.io",
    pingTimeout: 20000,
    pingInterval: 10000,
  });

  // ── Auth middleware — extract userId from JWT token ──
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      // Allow anonymous connections for now (spectators etc.)
      (socket.data as any).userId = null;
      return next();
    }
    try {
      const env = getEnv();
      const decoded = jwt.verify(token, env.JWT_SECRET) as any;
      (socket.data as any).userId = decoded.userId || decoded.id || decoded.sub;
      return next();
    } catch {
      // Invalid token — still allow connection but no userId
      (socket.data as any).userId = null;
      return next();
    }
  });

  cleanupInterval = setInterval(() => cleanupFinished(), 10_000);

  io.on("connection", async (socket: Socket) => {
    const userId = getUserId(socket);
    console.log(`[socket.io] connected: ${socket.id} userId=${userId || "anon"}`);

    // Pre-fetch display name if authenticated
    if (userId) {
      const displayName = await fetchDisplayName(userId);
      socketToUser.set(socket.id, { userId, displayName });

      // Check for reconnection to an existing room
      const existingRoom = findRoomByUser(userId);
      if (existingRoom) {
        const player = existingRoom.players.find((p) => p.userId === userId);
        if (player) {
          // Cancel disconnect timers
          const timers = disconnectTimers.get(player.socketId);
          if (timers) {
            clearTimeout(timers.warningTimer);
            clearTimeout(timers.robotTimer);
            disconnectTimers.delete(player.socketId);
          }

          // Reassign socket
          const oldSocketId = player.socketId;
          player.socketId = socket.id;
          player.disconnectedAt = null;
          socketToUser.delete(oldSocketId);
          socketToUser.set(socket.id, { userId, displayName });

          socket.join(existingRoom.id);

          if (player.isRobot) {
            clearRobotPlayer(existingRoom.id, player.side);
            player.isRobot = false;
            io.to(existingRoom.id).emit("robotHandoff", { side: player.side });
          }

          // Send current game state to reconnected player
          const state = getGameState(existingRoom.id);
          const opponent = getOpponent(existingRoom, socket.id);
          socket.emit("gameStart", {
            roomId: existingRoom.id,
            yourSide: player.side,
            opponentName: opponent?.displayName || "Player",
            wager: existingRoom.wager,
            goalTarget: existingRoom.goalTarget,
          });
          if (state) socket.emit("gameState", state);
        }
      }
    }

    // ── createRoom ──
    // Deducts the wager up front. If the user can't afford it we bail
    // before creating the room. The wager is refunded if the room is
    // abandoned before a second player joins (see leaveRoom + disconnect).
    socket.on("createRoom", async (data: {
      wager: number;
      goalTarget: number;
      isPrivate: boolean;
    }) => {
      const uid = getUserId(socket);
      if (!uid) { socket.emit("error", { message: "Not authenticated" }); return; }

      try {
        if (data.wager > 0) {
          const ok = await deductCoins(uid, data.wager);
          if (!ok) {
            socket.emit("error", { message: "Not enough coins" });
            return;
          }
        }
        const displayName = getDisplayName(socket);
        const room = createRoom(
          { socketId: socket.id, userId: uid, displayName },
          data.wager,
          data.goalTarget,
          data.isPrivate
        );
        socket.join(room.id);
        socket.emit("roomCreated", { roomId: room.id, pin: room.pin });
      } catch (e: any) {
        // Best-effort refund if room creation throws after deduction
        if (data.wager > 0) {
          try { await addCoins(uid, data.wager); } catch {}
        }
        socket.emit("error", { message: e.message || "Failed to create room" });
      }
    });

    // ── joinRoom ──
    // Validates the room first (so a bad code doesn't cost coins),
    // then deducts the wager before joining. The wager is part of the
    // pot — winner takes 2x.
    socket.on("joinRoom", async (data: {
      roomId: string;
      pin?: string;
    }) => {
      const uid = getUserId(socket);
      if (!uid) { socket.emit("error", { message: "Not authenticated" }); return; }

      try {
        const displayName = getDisplayName(socket);

        // Pre-flight: room must exist, be waiting, have a slot, and PIN matches
        const target = rooms.get(data.roomId);
        if (!target || target.status !== "waiting" || target.players.length >= 2 || (target.isPrivate && target.pin !== data.pin)) {
          socket.emit("joinError", { message: "Cannot join room. Check room ID and PIN." });
          return;
        }
        // Prevent self-join (also handled in roomManager.joinRoom but cheaper here)
        if (target.players.some((p) => p.userId === uid)) {
          socket.emit("joinError", { message: "You are already in this room." });
          return;
        }

        // Deduct wager BEFORE joining so we don't charge on a failed join
        if (target.wager > 0) {
          const ok = await deductCoins(uid, target.wager);
          if (!ok) {
            socket.emit("joinError", { message: "Not enough coins" });
            return;
          }
        }

        const room = joinRoom(
          { socketId: socket.id, userId: uid, displayName },
          data.roomId,
          data.pin
        );

        if (!room) {
          // Race: room was filled/closed between our check and join. Refund.
          if (target.wager > 0) {
            try { await addCoins(uid, target.wager); } catch {}
          }
          socket.emit("joinError", { message: "Cannot join room. Check room ID and PIN." });
          return;
        }

        socket.join(room.id);
        const opponent = getOpponent(room, socket.id);
        socket.emit("roomJoined", {
          roomId: room.id,
          side: "top",
          opponentName: opponent?.displayName ?? "Player",
          wager: room.wager,
          goalTarget: room.goalTarget,
        });

        if (room.players.length === 2) {
          beginGame(room, io);
        }
      } catch (e: any) {
        socket.emit("joinError", { message: e.message || "Failed to join room" });
      }
    });

    // ── joinQueue ──
    // Deducts the wager up front. Refunded on leaveQueue or disconnect
    // before a match is found.
    socket.on("joinQueue", async (data: {
      wager: number;
      goalTarget: number;
    }) => {
      const uid = getUserId(socket);
      if (!uid) { socket.emit("error", { message: "Not authenticated" }); return; }

      try {
        if (data.wager > 0) {
          const ok = await deductCoins(uid, data.wager);
          if (!ok) {
            socket.emit("error", { message: "Not enough coins" });
            return;
          }
        }

        const displayName = getDisplayName(socket);
        socketToUser.set(socket.id, { userId: uid, displayName });

        const matchedRoom = addToQueue({
          socketId: socket.id,
          userId: uid,
          displayName,
          wager: data.wager,
          goalTarget: data.goalTarget,
        });

        if (matchedRoom) {
          beginGame(matchedRoom, io);
        }
      } catch (e: any) {
        if (data.wager > 0) {
          try { await addCoins(uid, data.wager); } catch {}
        }
        socket.emit("error", { message: e.message || "Failed to join queue" });
      }
    });

    // ── leaveQueue ── refund wager if the player was actually queued
    socket.on("leaveQueue", async () => {
      const entry = removeFromQueue(socket.id);
      if (entry && entry.wager > 0) {
        try { await addCoins(entry.userId, entry.wager); } catch {}
      }
      socket.emit("queueCancelled");
    });

    // ── paddleMove — velocity computed server-side from position deltas ──
    socket.on("paddleMove", (data: { x: number; y: number }) => {
      const uid = getUserId(socket);
      if (!uid) return;

      const room = findRoomByUser(uid);
      if (!room || room.status !== "playing") return;

      const side = getPlayerSide(room, socket.id);
      if (!side) return;

      updatePaddle(room.id, side, data.x, data.y);
    });

    // ── hit — client-reported collision for fast swipes ──
    socket.on("hit", (data: { nx: number; ny: number; pvx: number; pvy: number; puckX: number; puckY: number }) => {
      const uid = getUserId(socket);
      if (!uid) return;

      const room = findRoomByUser(uid);
      if (!room || room.status !== "playing") return;

      const player = room.players.find((p) => p.socketId === socket.id);
      if (!player) return;

      // Per-player cooldown 30ms — long enough to prevent same-collision
      // double-counting (one tick is ~16.67ms) but doesn't punish rapid
      // back-and-forth swings.
      const now = Date.now();
      if (player.lastHitTime && now - player.lastHitTime < 30) return;
      player.lastHitTime = now;

      handleClientHit(room.id, data.nx, data.ny, data.pvx, data.pvy, data.puckX, data.puckY);
    });

    // ── rematch — both players must click Play Again and pay wager ──
    socket.on("rematch", async () => {
      const uid = getUserId(socket);
      if (!uid) return;

      const room = findRoomByUser(uid);
      if (!room || room.status !== "finished") return;

      // Already marked ready
      if (room.rematchReady.has(uid)) return;

      // Deduct wager coins
      if (room.wager > 0) {
        const success = await deductCoins(uid, room.wager);
        if (!success) {
          socket.emit("rematchError", { message: "Not enough coins" });
          return;
        }
      }

      room.rematchReady.add(uid);
      socket.emit("rematchWaiting");

      // Notify opponent that this player is ready
      const opponent = room.players.find((p) => p.userId !== uid);
      if (opponent) {
        io.to(opponent.socketId).emit("opponentRematchReady");
      }

      // Check if both players are ready
      const allReady = room.players.every((p) => room.rematchReady.has(p.userId));
      if (allReady) {
        // Cancel timeout
        if (room.rematchTimer) {
          clearTimeout(room.rematchTimer);
          room.rematchTimer = null;
        }
        // Reset room for new game
        room.rematchReady.clear();
        room.status = "playing";
        room.finishedAt = null;
        for (const p of room.players) {
          p.isRobot = false;
          p.disconnectedAt = null;
          p.lastHitTime = 0;
        }
        // Start new game loop
        beginGame(room, io);
        return;
      }

      // Start 30s timeout — if opponent doesn't join, refund and notify
      if (!room.rematchTimer) {
        room.rematchTimer = setTimeout(async () => {
          room.rematchTimer = null;
          // Refund coins to players who were ready
          for (const readyUid of room.rematchReady) {
            if (room.wager > 0) {
              try { await addCoins(readyUid, room.wager); } catch {}
            }
            const p = room.players.find((pl) => pl.userId === readyUid);
            if (p) {
              io.to(p.socketId).emit("rematchTimeout", { message: "Opponent did not respond" });
            }
          }
          room.rematchReady.clear();
          // Clean up room
          for (const p of room.players) {
            userToRoom.delete(p.userId);
          }
          deleteRoom(room.id);
        }, 30000);
      }
    });

    // ── leaveRoom ──
    socket.on("leaveRoom", () => {
      handleDisconnect(socket, io);
    });

    // ── spectate ──
    socket.on("spectate", (data: { roomId: string }) => {
      const room = rooms.get(data.roomId);
      if (!room) { socket.emit("error", { message: "Room not found" }); return; }

      room.spectators.push(socket.id);
      socket.join(room.id);
      const state = getGameState(room.id);
      if (state) socket.emit("gameState", state);
    });

    // ── getRoomList (also aliased as "getRooms" for frontend compat) ──
    const sendRoomList = () => {
      const publicRooms = getPublicRooms();
      const list = publicRooms.map((r) => ({
        id: r.id,
        players: r.players.map((p) => ({ displayName: p.displayName, side: p.side })),
        wager: r.wager,
        goalTarget: r.goalTarget,
        status: r.status,
        spectatorCount: r.spectators.length,
        score: getGameState(r.id)?.score,
      }));
      socket.emit("roomList", list);
    };
    socket.on("getRoomList", sendRoomList);
    socket.on("getRooms", sendRoomList); // alias

    // ── disconnect ──
    socket.on("disconnect", () => {
      console.log(`[socket.io] disconnected: ${socket.id}`);
      handleDisconnect(socket, io);
    });
  });
}
