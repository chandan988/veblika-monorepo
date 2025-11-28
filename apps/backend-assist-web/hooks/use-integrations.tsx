"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";

interface Integration {
  _id: string;
  orgId: string;
  channel: string;
  name: string;
  status: string;
  channelEmail?: string;
  credentials?: {
    websiteId?: string;
    tenantId?: string;
    email?: string;
    historyId?: string;
    watchExpiration?: string | Date;
    [key: string]: unknown;
  };
  createdAt?: string;
  updatedAt?: string;
}

interface CreateWebchatIntegrationInput {
  name: string;
  orgId: string;
}

export const useIntegrations = (orgId: string, channel?: string) => {
  return useQuery({
    queryKey: ["integrations", orgId, channel],
    queryFn: async () => {
      const params: Record<string, string> = { orgId };
      if (channel) params.channel = channel;

      const { data } = await api.get("/integrations", { params });
      return data.data as Integration[];
    },
    enabled: !!orgId,
  });
};

export const useIntegration = (integrationId: string) => {
  return useQuery({
    queryKey: ["integration", integrationId],
    queryFn: async () => {
      const { data } = await api.get(`/integrations/${integrationId}`);
      return data.data as Integration;
    },
    enabled: !!integrationId,
  });
};

export const useCreateWebchatIntegration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateWebchatIntegrationInput) => {
      const { data } = await api.post("/integrations/webchat", input);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
    },
  });
};

export const useDeleteIntegration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (integrationId: string) => {
      const { data } = await api.delete(`/integrations/${integrationId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
    },
  });
};

export const useGetEmbedScript = (integrationId: string) => {
  return useQuery({
    queryKey: ["embed-script", integrationId],
    queryFn: async () => {
      const { data } = await api.get(`/integrations/${integrationId}/embed-script`);
      return data.data.embedScript as string;
    },
    enabled: !!integrationId,
  });
};
