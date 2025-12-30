"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface DesignationParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  organisationId?: string;
}

async function fetchDesignations(params: DesignationParams) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", params.page.toString());
  if (params.limit) queryParams.append("limit", params.limit.toString());
  if (params.search) queryParams.append("search", params.search);
  if (params.isActive !== undefined)
    queryParams.append("isActive", params.isActive.toString());
  if (params.organisationId)
    queryParams.append("organisationId", params.organisationId);

  const res = await fetch(`/api/designation?${queryParams.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch designations");
  return res.json();
}

async function fetchDesignationById(id: string) {
  const res = await fetch(`/api/designation/${id}`);
  if (!res.ok) throw new Error("Failed to fetch designation");
  return res.json();
}

async function createDesignation(data: any) {
  const res = await fetch("/api/designation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create designation");
  }
  return res.json();
}

async function updateDesignation({ id, data }: { id: string; data: any }) {
  const res = await fetch(`/api/designation/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to update designation");
  }
  return res.json();
}

async function deleteDesignation(id: string) {
  const res = await fetch(`/api/designation/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete designation");
  return res.json();
}

export function useDesignations(params: DesignationParams = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["designations", params],
    queryFn: () => fetchDesignations(params),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDesignation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["designations"] });
    },
  });

  return {
    designations: query.data,
    isLoading: query.isLoading,
    error: query.error,
    deleteDesignation: deleteMutation.mutateAsync,
  };
}

export function useDesignation(id: string) {
  return useQuery({
    queryKey: ["designation", id],
    queryFn: () => fetchDesignationById(id),
    enabled: !!id,
  });
}

export function useCreateDesignation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDesignation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["designations"] });
    },
  });
}

export function useUpdateDesignation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateDesignation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["designations"] });
    },
  });
}
