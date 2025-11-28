"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useSocket } from "./use-socket";
import { useEffect, useState } from "react";
import { joinConversation, leaveConversation, sendAgentMessage as sendSocketMessage } from "@/lib/socket-client";

interface Message {
  _id: string;
  orgId: string;
  conversationId: string;
  contactId?: string;
  senderType: "contact" | "agent" | "bot" | "system";
  senderId?: string;
  direction: "inbound" | "outbound";
  channel: string;
  body: {
    text?: string;
    html?: string;
  };
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const useMessages = (conversationId: string) => {
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket({ autoConnect: true });
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  // Fetch messages
  const query = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      const { data } = await api.get(`/conversations/${conversationId}/messages`);
      return data.data as Message[];
    },
    enabled: !!conversationId,
  });

  // Join conversation room and listen for new messages
  useEffect(() => {
    if (!socket || !isConnected || !conversationId) return;

    // Join the conversation room
    joinConversation(conversationId);

    const handleAgentMessage = (data: { message: Message }) => {
      console.log("Agent message received:", data);

      // Add message to cache optimistically
      queryClient.setQueryData(["messages", conversationId], (old: Message[] | undefined) => {
        if (!old) return [data.message];
        return [...old, data.message];
      });
    };

    const handleUserTyping = (data: { userId?: string; isAgent?: boolean }) => {
      if (data.userId && !data.isAgent) {
        setTypingUsers((prev) => new Set(prev).add(data.userId!));
      }
    };

    const handleUserStoppedTyping = (data: { userId?: string; isAgent?: boolean }) => {
      if (data.userId && !data.isAgent) {
        setTypingUsers((prev) => {
          const next = new Set(prev);
          next.delete(data.userId!);
          return next;
        });
      }
    };

    socket.on("agent:message", handleAgentMessage);
    socket.on("user:typing", handleUserTyping);
    socket.on("user:stopped-typing", handleUserStoppedTyping);

    return () => {
      socket.off("agent:message", handleAgentMessage);
      socket.off("user:typing", handleUserTyping);
      socket.off("user:stopped-typing", handleUserStoppedTyping);

      // Leave conversation room
      leaveConversation(conversationId);
    };
  }, [socket, isConnected, conversationId, queryClient]);

  return {
    ...query,
    typingUsers: Array.from(typingUsers),
  };
};

export const useSendMessage = (conversationId: string, orgId: string, agentId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ text }: { text: string }) => {
      // Send via HTTP API
      const { data } = await api.post(
        `/conversations/${conversationId}/messages?orgId=${orgId}`,
        { text }
      );

      // Also emit via socket for real-time delivery
      sendSocketMessage(conversationId, { text }, agentId);

      return data.data;
    },
    onMutate: async ({ text }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["messages", conversationId] });

      // Snapshot previous value
      const previousMessages = queryClient.getQueryData<Message[]>(["messages", conversationId]);

      // Optimistically update
      const optimisticMessage: Message = {
        _id: `temp-${Date.now()}`,
        orgId,
        conversationId,
        senderType: "agent",
        senderId: agentId,
        direction: "outbound",
        channel: "webchat",
        body: { text },
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<Message[]>(["messages", conversationId], (old = []) => [
        ...old,
        optimisticMessage,
      ]);

      return { previousMessages };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(["messages", conversationId], context.previousMessages);
      }
    },
    onSuccess: () => {
      // Refetch to get the actual message from server
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};
