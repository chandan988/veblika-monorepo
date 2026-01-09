"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface DepartmentParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  organisationId?: string;
}

async function fetchDepartments(params: DepartmentParams) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", params.page.toString());
  if (params.limit) queryParams.append("limit", params.limit.toString());
  if (params.search) queryParams.append("search", params.search);
  if (params.isActive !== undefined)
    queryParams.append("isActive", params.isActive.toString());
  if (params.organisationId)
    queryParams.append("organisationId", params.organisationId);

  const res = await fetch(`/api/department?${queryParams.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch departments");
  return res.json();
}

async function fetchDepartmentById(id: string) {
  const res = await fetch(`/api/department/${id}`);
  if (!res.ok) throw new Error("Failed to fetch department");
  return res.json();
}

async function createDepartment(data: any) {
  const res = await fetch("/api/department", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create department");
  }
  return res.json();
}

async function updateDepartment({ id, data }: { id: string; data: any }) {
  const res = await fetch(`/api/department/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to update department");
  }
  return res.json();
}

async function deleteDepartment(id: string) {
  const res = await fetch(`/api/department/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete department");
  return res.json();
}

export function useDepartments(params: DepartmentParams = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["departments", params],
    queryFn: () => fetchDepartments(params),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });

  return {
    departments: query.data,
    isLoading: query.isLoading,
    error: query.error,
    deleteDepartment: deleteMutation.mutateAsync,
  };
}

export function useDepartment(id: string) {
  return useQuery({
    queryKey: ["department", id],
    queryFn: () => fetchDepartmentById(id),
    enabled: !!id,
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
}
