"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";

interface GenerateAuthUrlInput {
  orgId: string;
}

interface GenerateAuthUrlResponse {
  authUrl: string;
  state: string;
}

interface OAuthCallbackInput {
  code: string;
  state: string;
  orgId: string;
}

export const useGenerateGmailAuthUrl = () => {
  return useMutation({
    mutationFn: async (input: GenerateAuthUrlInput) => {
      const { orgId } = input;
      const { data } = await api.post<{ success: boolean; data: GenerateAuthUrlResponse }>(
        `/organisations/${orgId}/integrations/gmail/auth-url`,
        {}
      );
      return data.data;
    },
  });
};

export const useGmailOAuthCallback = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: OAuthCallbackInput) => {
      const { orgId, ...bodyData } = input;
      const { data } = await api.post(`/organisations/${orgId}/integrations/gmail/callback`, bodyData);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
    },
  });
};

export const useVerifyGmailIntegration = () => {
  return useMutation({
    mutationFn: async ({ orgId, integrationId }: { orgId: string; integrationId: string }) => {
      const { data } = await api.post(
        `/organisations/${orgId}/integrations/gmail/${integrationId}/verify`
      );
      return data.data;
    },
  });
};

export const useStartGmailWatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orgId, integrationId }: { orgId: string; integrationId: string }) => {
      const { data } = await api.post(
        `/organisations/${orgId}/integrations/gmail/${integrationId}/watch`
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
    },
  });
};

export const useStopGmailWatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orgId, integrationId }: { orgId: string; integrationId: string }) => {
      const { data } = await api.post(
        `/organisations/${orgId}/integrations/gmail/${integrationId}/stop-watch`
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
    },
  });
};

export const useDeleteGmailIntegration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orgId, integrationId }: { orgId: string; integrationId: string }) => {
      const { data } = await api.delete(`/organisations/${orgId}/integrations/gmail/${integrationId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
    },
  });
};
