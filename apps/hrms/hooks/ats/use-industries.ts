"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface IndustryParams {
  page?: number;
  limit?: number;
  search?: string;
  organisationId?: string;
}

async function fetchIndustries(params: IndustryParams) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", params.page.toString());
  if (params.limit) queryParams.append("limit", params.limit.toString());
  if (params.search) queryParams.append("search", params.search);
  if (params.organisationId)
    queryParams.append("organisationId", params.organisationId);

  const res = await fetch(`/api/ats/industry?${queryParams.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch industries");
  return res.json();
}

async function fetchIndustryById(id: string) {
  const res = await fetch(`/api/ats/industry/${id}`);
  if (!res.ok) throw new Error("Failed to fetch industry");
  return res.json();
}

async function createIndustry(data: any) {
  const res = await fetch("/api/ats/industry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create industry");
  }
  return res.json();
}

async function updateIndustry({ id, data }: { id: string; data: any }) {
  const res = await fetch(`/api/ats/industry/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to update industry");
  }
  return res.json();
}

async function deleteIndustry(id: string) {
  const res = await fetch(`/api/ats/industry/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete industry");
  return res.json();
}

export function useIndustries(params: IndustryParams = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["industries", params],
    queryFn: () => fetchIndustries(params),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteIndustry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["industries"] });
    },
  });

  return {
    industries: query.data,
    isLoading: query.isLoading,
    error: query.error,
    deleteIndustry: deleteMutation.mutateAsync,
  };
}

export function useIndustry(id: string) {
  return useQuery({
    queryKey: ["industry", id],
    queryFn: () => fetchIndustryById(id),
    enabled: !!id,
  });
}

export function useCreateIndustry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createIndustry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["industries"] });
    },
  });
}

export function useUpdateIndustry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateIndustry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["industries"] });
    },
  });
}
