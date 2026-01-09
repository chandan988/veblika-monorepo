"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface HiringSourceParams {
  page?: number;
  limit?: number;
  search?: string;
  organisationId?: string;
}

async function fetchHiringSources(params: HiringSourceParams) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", params.page.toString());
  if (params.limit) queryParams.append("limit", params.limit.toString());
  if (params.search) queryParams.append("search", params.search);
  
  if (params.organisationId)
    queryParams.append("organisationId", params.organisationId);

  const res = await fetch(`/api/hiring-source?${queryParams.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch sources");
  return res.json();
}

async function fetchSourceById(id: string) {
  const res = await fetch(`/api/hiring-source/${id}`);
  if (!res.ok) throw new Error("Failed to fetch hiring-source");
  return res.json();
}

async function createHiringSource(data: any) {
  const res = await fetch("/api/hiring-source", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create hiring-source");
  }
  return res.json();
}

async function updateHiringSource({ id, data }: { id: string; data: any }) {
  const res = await fetch(`/api/hiring-source/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to update hiring-source");
  }
  return res.json();
}

async function deleteHiringSource(id: string) {
  const res = await fetch(`/api/hiring-source/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete hiring-source");
  return res.json();
}

export function useHiringSources(params: HiringSourceParams = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["hiring-sources", params],
    queryFn: () => fetchHiringSources(params),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteHiringSource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hiring-sources"] });
    },
  });

  return {
    hiringSources: query.data,
    isLoading: query.isLoading,
    error: query.error,
    deleteHiringSource: deleteMutation.mutateAsync,
  };
}

export function useHiringSource(id: string) {
  return useQuery({
    queryKey: ["hiring-source", id],
    queryFn: () => fetchSourceById(id),
    enabled: !!id,
  });
}

export function useCreateHiringSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createHiringSource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hiring-sources"] });
    },
  });
}

export function useUpdateHiringSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateHiringSource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hiring-sources"] });
    },
  });
}
