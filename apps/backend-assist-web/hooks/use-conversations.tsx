"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useSocket } from "./use-socket";
import { useEffect } from "react";

interface Conversation {
  _id: string;
  orgId: string;
  integrationId: string;
  contactId: any;
  channel: string;
  status: "open" | "pending" | "closed";
  priority: string;
  lastMessageAt: string;
  lastMessagePreview: string;
  tags: string[];
  assignedMemberId?: string;
}

interface GetConversationsParams {
  orgId: string;
  status?: "open" | "pending" | "closed";
  channel?: string;
  page?: number;
  limit?: number;
}

export const useConversations = (params: GetConversationsParams) => {
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket({
    orgId: params.orgId,
    autoConnect: true,
  });

  // Fetch conversations
  const query = useQuery({
    queryKey: ["conversations", params],
    queryFn: async () => {
      const { data } = await api.get("/conversations", { params });
      return data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds as fallback
  });

  // Listen for new messages via socket
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewMessage = (data: any) => {
      console.log("New message received:", data);

      // Invalidate and refetch conversations
      queryClient.invalidateQueries({ queryKey: ["conversations"] });

      // If it's a new conversation, show notification
      if (data.isNewConversation) {
        // You can emit a custom event or use a toast notification here
        console.log("New conversation started!");
      }
    };

    socket.on("new:message", handleNewMessage);

    return () => {
      socket.off("new:message", handleNewMessage);
    };
  }, [socket, isConnected, queryClient]);

  return query;
};

export const useConversation = (conversationId: string) => {
  return useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: async () => {
      const { data } = await api.get(`/conversations/${conversationId}`);
      return data.data;
    },
    enabled: !!conversationId,
  });
};

export const useUpdateConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      updates,
    }: {
      conversationId: string;
      updates: Partial<Conversation>;
    }) => {
      const { data } = await api.put(`/conversations/${conversationId}`, updates);
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["conversation", variables.conversationId] });
    },
  });
};

export const useConversationStats = (orgId: string) => {
  return useQuery({
    queryKey: ["conversation-stats", orgId],
    queryFn: async () => {
      const { data } = await api.get("/conversations/stats", {
        params: { orgId },
      });
      return data.data;
    },
    enabled: !!orgId,
  });
};
