import { io, Socket } from "socket.io-client";

// Must match the backend URL (same as REST API — Socket.io runs on the same port)
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(API_BASE, {
      transports: ["websocket", "polling"],
      autoConnect: false,
    });
  }
  return socket;
}

export function connectSocket(token: string): Socket {
  const s = getSocket();
  s.auth = { token };
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
