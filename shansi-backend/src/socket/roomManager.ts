import { nanoid } from "nanoid";

// ── Types ──

export interface RoomPlayer {
  socketId: string;
  userId: string;
  displayName: string;
  side: "bottom" | "top"; // bottom = host, top = joiner
  isRobot: boolean;
  disconnectedAt: number | null;
  lastHitTime: number;
}

export interface Room {
  id: string;
  pin: string | null; // 4-digit for private rooms
  isPrivate: boolean;
  players: RoomPlayer[];
  spectators: string[]; // socket IDs
  wager: number; // coins each player bet
  goalTarget: number; // 5, 10, 15, or 20
  status: "waiting" | "playing" | "finished";
  createdAt: number;
  finishedAt: number | null;
  rematchReady: Set<string>; // userIds who clicked Play Again
  rematchTimer: ReturnType<typeof setTimeout> | null;
}

export interface QueueEntry {
  socketId: string;
  userId: string;
  displayName: string;
  wager: number;
  goalTarget: number;
}

// ── In-memory stores ──

export const rooms: Map<string, Room> = new Map();
export const userToRoom: Map<string, string> = new Map(); // userId → roomId
export const matchmakingQueue: QueueEntry[] = [];

// ── Helpers ──

function generatePin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

const ROOM_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // uppercase only, no confusing I/O
function generateRoomId(): string {
  let id = "";
  for (let i = 0; i < 6; i++) id += ROOM_CHARS[Math.floor(Math.random() * ROOM_CHARS.length)];
  return id;
}

// ── Room operations ──

export function createRoom(
  player: { socketId: string; userId: string; displayName: string },
  wager: number,
  goalTarget: number,
  isPrivate: boolean
): Room {
  const room: Room = {
    id: generateRoomId(),
    pin: isPrivate ? generatePin() : null,
    isPrivate,
    players: [
      {
        socketId: player.socketId,
        userId: player.userId,
        displayName: player.displayName,
        side: "bottom",
        isRobot: false,
        disconnectedAt: null,
        lastHitTime: 0,
      },
    ],
    spectators: [],
    wager,
    goalTarget,
    status: "waiting",
    createdAt: Date.now(),
    finishedAt: null,
    rematchReady: new Set(),
    rematchTimer: null,
  };

  rooms.set(room.id, room);
  userToRoom.set(player.userId, room.id);
  return room;
}

export function joinRoom(
  player: { socketId: string; userId: string; displayName: string },
  roomId: string,
  pin?: string
): Room | null {
  const room = rooms.get(roomId);
  if (!room) return null;
  if (room.status !== "waiting") return null;
  if (room.players.length >= 2) return null;
  if (room.isPrivate && room.pin !== pin) return null;

  // Prevent self-join
  if (room.players.some((p) => p.userId === player.userId)) return null;

  room.players.push({
    socketId: player.socketId,
    userId: player.userId,
    displayName: player.displayName,
    side: "top",
    isRobot: false,
    disconnectedAt: null,
    lastHitTime: 0,
  });

  userToRoom.set(player.userId, room.id);
  return room;
}

export function findRoomByUser(userId: string): Room | null {
  const roomId = userToRoom.get(userId);
  if (!roomId) return null;
  return rooms.get(roomId) ?? null;
}

export function removePlayer(socketId: string): void {
  for (const [, room] of rooms) {
    const player = room.players.find((p) => p.socketId === socketId);
    if (player) {
      player.disconnectedAt = Date.now();
      return;
    }
    // Also check spectators
    const sIdx = room.spectators.indexOf(socketId);
    if (sIdx !== -1) {
      room.spectators.splice(sIdx, 1);
    }
  }
}

export function cleanupFinished(): void {
  const now = Date.now();
  for (const [id, room] of rooms) {
    let shouldDelete = false;

    // Finished rooms — 60 seconds after game ended (not created)
    if (room.status === "finished" && room.finishedAt && now - room.finishedAt > 60_000) {
      shouldDelete = true;
    }

    // Abandoned rooms: both players disconnected for > 30 seconds
    if (room.status === "playing" && room.players.length >= 2) {
      const allGone = room.players.every(
        (p) => p.disconnectedAt !== null && now - p.disconnectedAt > 30_000
      );
      if (allGone) shouldDelete = true;
    }

    // Waiting rooms older than 5 minutes (nobody joined)
    if (room.status === "waiting" && now - room.createdAt > 5 * 60_000) {
      shouldDelete = true;
    }

    if (shouldDelete) {
      for (const p of room.players) {
        if (userToRoom.get(p.userId) === id) {
          userToRoom.delete(p.userId);
        }
      }
      rooms.delete(id);
    }
  }
}

export function getPublicRooms(): Room[] {
  const result: Room[] = [];
  for (const [, room] of rooms) {
    if (!room.isPrivate && room.status !== "finished") {
      result.push(room);
    }
  }
  return result;
}

/**
 * Removes a waiting room entirely (e.g. when creator disconnects before
 * game starts). Cleans up userToRoom mappings as well.
 */
export function deleteRoom(roomId: string): void {
  const room = rooms.get(roomId);
  if (!room) return;
  for (const p of room.players) {
    if (userToRoom.get(p.userId) === roomId) {
      userToRoom.delete(p.userId);
    }
  }
  rooms.delete(roomId);
}

// ── Matchmaking ──

/**
 * Adds a player to the matchmaking queue and attempts to pair them with
 * someone who has the same wager and goalTarget.
 *
 * Returns a newly created Room if a match was found, otherwise null.
 */
export function addToQueue(entry: QueueEntry): Room | null {
  matchmakingQueue.push(entry);
  return tryMatch();
}

export function removeFromQueue(socketId: string): QueueEntry | null {
  const idx = matchmakingQueue.findIndex((e) => e.socketId === socketId);
  if (idx === -1) return null;
  const [entry] = matchmakingQueue.splice(idx, 1);
  return entry;
}

function tryMatch(): Room | null {
  if (matchmakingQueue.length < 2) return null;

  for (let i = 0; i < matchmakingQueue.length; i++) {
    for (let j = i + 1; j < matchmakingQueue.length; j++) {
      const a = matchmakingQueue[i];
      const b = matchmakingQueue[j];

      if (a.wager === b.wager && a.goalTarget === b.goalTarget) {
        // Remove both from queue (higher index first to avoid shift issues)
        matchmakingQueue.splice(j, 1);
        matchmakingQueue.splice(i, 1);

        // Create room with player A as host, then add player B
        const room = createRoom(
          { socketId: a.socketId, userId: a.userId, displayName: a.displayName },
          a.wager,
          a.goalTarget,
          false
        );
        room.status = "waiting";

        // Join player B
        joinRoom(
          { socketId: b.socketId, userId: b.userId, displayName: b.displayName },
          room.id
        );

        return room;
      }
    }
  }

  return null;
}
