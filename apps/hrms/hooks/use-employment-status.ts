"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface EmploymentStatusParams {
  page?: number;
  limit?: number;
  search?: string;
  organisationId?: string;
}

async function fetchEmploymentStatus(params: EmploymentStatusParams) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", params.page.toString());
  if (params.limit) queryParams.append("limit", params.limit.toString());
  if (params.search) queryParams.append("search", params.search);

  if (params.organisationId)
    queryParams.append("organisationId", params.organisationId);

  const res = await fetch(`/api/employment-status?${queryParams.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch employment-status");
  return res.json();
}

async function fetchEmploymentStatusById(id: string) {
  const res = await fetch(`/api/employment-status/${id}`);
  if (!res.ok) throw new Error("Failed to fetch employment-status");
  return res.json();
}

async function createEmploymentStatus(data: any) {
  const res = await fetch("/api/employment-status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create employment-status");
  }
  return res.json();
}

async function updateEmploymentStatus({ id, data }: { id: string; data: any }) {
  const res = await fetch(`/api/employment-status/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to update employment-status");
  }
  return res.json();
}

async function deleteEmploymentStatus(id: string) {
  const res = await fetch(`/api/employment-status/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete employment-status");
  return res.json();
}

export function useEmploymentStatuses(params: EmploymentStatusParams = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["employment-statuses", params],
    queryFn: () => fetchEmploymentStatus(params),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEmploymentStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employment-statuses"] });
    },
  });

  return {
    employmentStatuses: query.data,
    isLoading: query.isLoading,
    error: query.error,
    deleteEmploymentStatus: deleteMutation.mutateAsync,
  };
}

export function useEmploymentStatus(id: string) {
  return useQuery({
    queryKey: ["employment-status", id],
    queryFn: () => fetchEmploymentStatusById(id),
    enabled: !!id,
  });
}

export function useCreateEmploymentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createEmploymentStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employment-statuses"] });
    },
  });
}

export function useUpdateEmploymentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateEmploymentStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employment-statuses"] });
    },
  });
}
