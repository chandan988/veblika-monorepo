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
      const params: Record<string, string> = {};
      if (channel) params.channel = channel;

      const { data } = await api.get(`/organisations/${orgId}/integrations`, { params });
      return data.data as Integration[];
    },
    enabled: !!orgId,
  });
};

export const useIntegration = (orgId: string, integrationId: string) => {
  return useQuery({
    queryKey: ["integration", orgId, integrationId],
    queryFn: async () => {
      const { data } = await api.get(`/organisations/${orgId}/integrations/${integrationId}`);
      return data.data as Integration;
    },
    enabled: !!orgId && !!integrationId,
  });
};

export const useCreateWebchatIntegration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateWebchatIntegrationInput) => {
      const { orgId, ...bodyData } = input;
      const { data } = await api.post(`/organisations/${orgId}/integrations/webchat`, bodyData);
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
    mutationFn: async ({ orgId, integrationId }: { orgId: string; integrationId: string }) => {
      const { data } = await api.delete(`/organisations/${orgId}/integrations/${integrationId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
    },
  });
};

export const useGetEmbedScript = (orgId: string, integrationId: string) => {
  return useQuery({
    queryKey: ["embed-script", orgId, integrationId],
    queryFn: async () => {
      const { data } = await api.get(`/organisations/${orgId}/integrations/${integrationId}/embed-script`);
      return data.data.embedScript as string;
    },
    enabled: !!orgId && !!integrationId,
  });
};
