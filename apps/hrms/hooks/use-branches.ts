"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface BranchParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  organisationId?: string;
}

async function fetchBranches(params: BranchParams) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", params.page.toString());
  if (params.limit) queryParams.append("limit", params.limit.toString());
  if (params.search) queryParams.append("search", params.search);
  if (params.isActive !== undefined)
    queryParams.append("isActive", params.isActive.toString());
  if (params.organisationId)
    queryParams.append("organisationId", params.organisationId);

  const res = await fetch(`/api/branch?${queryParams.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch branches");
  return res.json();
}

async function fetchBranchById(id: string) {
  const res = await fetch(`/api/branch/${id}`);
  if (!res.ok) throw new Error("Failed to fetch branch");
  return res.json();
}

async function createBranch(data: any) {
  const res = await fetch("/api/branch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create branch");
  }
  return res.json();
}

async function updateBranch({ id, data }: { id: string; data: any }) {
  const res = await fetch(`/api/branch/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to update branch");
  }
  return res.json();
}

async function deleteBranch(id: string) {
  const res = await fetch(`/api/branch/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete branch");
  return res.json();
}

export function useBranches(params: BranchParams = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["branches", params],
    queryFn: () => fetchBranches(params),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBranch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
    },
  });

  return {
    branches: query.data,
    isLoading: query.isLoading,
    error: query.error,
    deleteBranch: deleteMutation.mutateAsync,
  };
}

export function useBranch(id: string) {
  return useQuery({
    queryKey: ["branch", id],
    queryFn: () => fetchBranchById(id),
    enabled: !!id,
  });
}

export function useCreateBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBranch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
    },
  });
}

export function useUpdateBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateBranch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
    },
  });
}
