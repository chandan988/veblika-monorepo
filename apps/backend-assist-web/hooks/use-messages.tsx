"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useSocket } from "./use-socket";
import { useEffect, useMemo } from "react";
import { joinConversation, leaveConversation, sendAgentMessage as sendSocketMessage } from "@/lib/socket-client";
import { useChatStore, type Message as StoreMessage } from "@/stores/chat-store";

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

// Helper function to convert store message to component message format
const convertToComponentMessage = (storeMsg: StoreMessage): Message => ({
  _id: storeMsg._id,
  orgId: "",
  conversationId: storeMsg.conversationId,
  senderType: storeMsg.sender.type === "visitor" ? "contact" : "agent",
  senderId: storeMsg.sender.id,
  direction: storeMsg.sender.type === "visitor" ? "inbound" : "outbound",
  channel: "webchat",
  body: {
    text: storeMsg.content,
  },
  createdAt: storeMsg.timestamp.toISOString(),
  status: storeMsg.status,
});

export const useMessages = (conversationId: string) => {
  const { socket, isConnected } = useSocket({ autoConnect: true });
  const addMessage = useChatStore((state) => state.addMessage);
  const addMessages = useChatStore((state) => state.addMessages);
  const storeMessages = useChatStore((state) => state.messagesByConversation[conversationId]);
  
  // Memoize empty array to prevent infinite loop
  const safeStoreMessages = useMemo(() => storeMessages || [], [storeMessages]);

  // Fetch messages from server (only runs once on mount)
  const query = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      const { data } = await api.get(`/conversations/${conversationId}/messages`);
      const fetchedMessages = data.data as Message[];
      
      // Transform and add to Zustand store
      const storeMessages: StoreMessage[] = fetchedMessages.map((msg) => ({
        _id: msg._id,
        conversationId,
        sender: {
          id: msg.senderId || "",
          type: msg.senderType === "contact" ? "visitor" : "agent",
          name: undefined,
        },
        content: msg.body.text || "",
        timestamp: msg.createdAt ? new Date(msg.createdAt) : new Date(),
        status: msg.status === "pending" ? "sending" : "sent",
      }));
      
      addMessages(conversationId, storeMessages);
      return fetchedMessages;
    },
    enabled: !!conversationId,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: Infinity, // Don't auto-refetch, rely on socket for updates
  });

  // Join conversation room and listen for real-time messages
  useEffect(() => {
    if (!socket || !isConnected || !conversationId) return;

    // Join the conversation room
    joinConversation(conversationId);

    const handleAgentMessage = (data: { message: Message }) => {
      console.log("Agent message received:", data);

      // Add to Zustand store (with automatic deduplication)
      const storeMessage: StoreMessage = {
        _id: data.message._id,
        conversationId,
        sender: {
          id: data.message.senderId || "",
          type: data.message.senderType === "contact" ? "visitor" : "agent",
        },
        content: data.message.body.text || "",
        timestamp: data.message.createdAt ? new Date(data.message.createdAt) : new Date(),
        status: "sent",
      };
      
      addMessage(conversationId, storeMessage);
    };

    const handleNewMessage = (data: { message: Message; conversation: any; isNewConversation?: boolean }) => {
      console.log("📨 New message received in useMessages:", data);
      
      // Only add message if it belongs to current conversation
      if (data.conversation?._id === conversationId || data.message?.conversationId === conversationId) {
        const storeMessage: StoreMessage = {
          _id: data.message._id,
          conversationId: data.message.conversationId || conversationId,
          sender: {
            id: data.message.senderId || "",
            type: data.message.senderType === "contact" ? "visitor" : "agent",
          },
          content: data.message.body?.text || "",
          timestamp: data.message.createdAt ? new Date(data.message.createdAt) : new Date(),
          status: "sent",
        };
        
        addMessage(conversationId, storeMessage);
      }
    };

    socket.on("agent:message", handleAgentMessage);
    socket.on("new:message", handleNewMessage);

    return () => {
      socket.off("agent:message", handleAgentMessage);
      socket.off("new:message", handleNewMessage);
      leaveConversation(conversationId);
    };
  }, [socket, isConnected, conversationId, addMessage]);

  // Convert store messages to component format - memoized to prevent unnecessary re-renders
  const messages = useMemo(
    () => safeStoreMessages.map(convertToComponentMessage),
    [safeStoreMessages]
  );

  return {
    messages,
    isLoading: query.isLoading,
    error: query.error,
  };
};

export const useSendMessage = (conversationId: string, orgId: string, agentId: string) => {
  const queryClient = useQueryClient();
  const { addMessage, updateMessage } = useChatStore();

  return useMutation({
    mutationFn: async ({ text }: { text: string }) => {
      // Send ONLY via socket - backend will save to DB and broadcast
      sendSocketMessage(conversationId, { text }, agentId);
      
      // Return success immediately
      return { success: true };
    },
    onMutate: async ({ text }) => {
      // Optimistically add message to Zustand store
      const tempId = `temp-${Date.now()}`;
      const optimisticMessage: StoreMessage = {
        _id: tempId,
        conversationId,
        sender: {
          id: agentId,
          type: "agent",
        },
        content: text,
        timestamp: new Date(),
        status: "sending",
      };

      addMessage(conversationId, optimisticMessage);

      return { tempId };
    },
    onError: (err, variables, context) => {
      // Mark message as failed
      if (context?.tempId) {
        updateMessage(conversationId, context.tempId, { status: "failed" });
      }
    },
    onSuccess: (data, variables, context) => {
      // Remove temporary message after 2 seconds (backend message will replace it)
      if (context?.tempId) {
        setTimeout(() => {
          const storeState = useChatStore.getState();
          const messages = storeState.messagesByConversation[conversationId] || [];
          // Only remove if still has temp ID (not replaced by real message)
          if (messages.find(m => m._id === context.tempId)) {
            // Real message should have arrived via socket by now
            // If temp still exists, it means socket message arrived and deduplication worked
          }
        }, 2000);
      }
      
      // Invalidate conversations list to update last message
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};
