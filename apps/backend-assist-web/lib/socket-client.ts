"use client";

import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_AUTH_URL

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    // Global event listeners
    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket?.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });
  }

  return socket;
};

export const connectSocket = (token?: string): Socket => {
  const socketInstance = getSocket();

  if (!socketInstance.connected) {
    if (token) {
      socketInstance.auth = { token };
    }
    socketInstance.connect();
  }

  return socketInstance;
};

export const disconnectSocket = () => {
  if (socket?.connected) {
    socket.disconnect();
  }
};

export const joinAgentRoom = (orgId: string, userId: string) => {
  const socketInstance = getSocket();

  if (socketInstance.connected) {
    socketInstance.emit("agent:join", { orgId, userId });
  }
};

export const joinConversation = (conversationId: string) => {
  const socketInstance = getSocket();

  if (socketInstance.connected) {
    socketInstance.emit("conversation:join", { conversationId });
  }
};

export const leaveConversation = (conversationId: string) => {
  const socketInstance = getSocket();

  if (socketInstance.connected) {
    socketInstance.emit("conversation:leave", { conversationId });
  }
};

export const sendAgentMessage = (
  conversationId: string,
  message: { text: string },
  agentId: string
) => {
  const socketInstance = getSocket();

  if (socketInstance.connected) {
    socketInstance.emit("agent:message", {
      conversationId,
      message,
      agentId,
    });
  }
};

export { socket };
