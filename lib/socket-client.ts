// lib/socket-client.ts
import { io, Socket } from "socket.io-client";
import { API_BASE } from "./api";

let socket: Socket | null = null;
let socketToken: string | null = null;

export function getSocket(token: string): Socket {
  // ✅ If token changed, discard old socket entirely
  if (socket && socketToken && socketToken !== token) {
    socket.disconnect();
    socket = null;
    socketToken = null;
  }

  if (socket) return socket;

  socketToken = token;

  socket = io(API_BASE, {
    auth: token ? { token } : {},  
    withCredentials: true,          
    transports: ["websocket"],
    autoConnect: true,
    path: "/socket.io",
  });

  socket.on("connect", () => {
    console.log("[SOCKET] connected:", socket?.id);
  });

  socket.on("disconnect", () => {
    console.log("[SOCKET] disconnected");
  });

  return socket;
}

export function closeSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    socketToken = null;
  }
}
