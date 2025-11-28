"use client";

import { useEffect, useState, useCallback } from "react";
import { Socket } from "socket.io-client";
import { getSocket, connectSocket, disconnectSocket, joinAgentRoom } from "@/lib/socket-client";

interface UseSocketOptions {
  orgId?: string;
  userId?: string;
  autoConnect?: boolean;
}

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
}

export function useSocket({ orgId, userId, autoConnect = true }: UseSocketOptions = {}): UseSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const socketInstance = getSocket();
    setSocket(socketInstance);

    const onConnect = () => {
      console.log("Socket connected");
      setIsConnected(true);
      
      // Auto-join agent room if credentials provided
      if (orgId && userId) {
        joinAgentRoom(orgId, userId);
      }
    };

    const onDisconnect = () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    };

    socketInstance.on("connect", onConnect);
    socketInstance.on("disconnect", onDisconnect);

    // Connect if autoConnect is true and not already connected
    if (autoConnect && !socketInstance.connected) {
      connectSocket();
    }

    return () => {
      socketInstance.off("connect", onConnect);
      socketInstance.off("disconnect", onDisconnect);
      
      // Don't disconnect on unmount as it's a singleton
      // disconnectSocket();
    };
  }, [orgId, userId, autoConnect]);

  const connect = useCallback(() => {
    connectSocket();
  }, []);

  const disconnect = useCallback(() => {
    disconnectSocket();
  }, []);

  return {
    socket,
    isConnected,
    connect,
    disconnect,
  };
}
