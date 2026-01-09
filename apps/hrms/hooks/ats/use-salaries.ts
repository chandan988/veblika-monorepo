"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface SalaryParams {
  page?: number;
  limit?: number;
  search?: string;
  organisationId?: string;
}

async function fetchSalaries(params: SalaryParams) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", params.page.toString());
  if (params.limit) queryParams.append("limit", params.limit.toString());
  if (params.search) queryParams.append("search", params.search);
  if (params.organisationId)
    queryParams.append("organisationId", params.organisationId);

  const res = await fetch(`/api/ats/salary?${queryParams.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch salaries");
  return res.json();
}

async function fetchSalaryById(id: string) {
  const res = await fetch(`/api/ats/salary/${id}`);
  if (!res.ok) throw new Error("Failed to fetch salary");
  return res.json();
}

async function createSalary(data: any) {
  const res = await fetch("/api/ats/salary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create salary");
  }
  return res.json();
}

async function updateSalary({ id, data }: { id: string; data: any }) {
  const res = await fetch(`/api/ats/salary/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to update salary");
  }
  return res.json();
}

async function deleteSalary(id: string) {
  const res = await fetch(`/api/ats/salary/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete salary");
  return res.json();
}

export function useSalaries(params: SalaryParams = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["salaries", params],
    queryFn: () => fetchSalaries(params),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSalary,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salaries"] });
    },
  });

  return {
    salaries: query.data,
    isLoading: query.isLoading,
    error: query.error,
    deleteSalary: deleteMutation.mutateAsync,
  };
}

export function useSalary(id: string) {
  return useQuery({
    queryKey: ["salary", id],
    queryFn: () => fetchSalaryById(id),
    enabled: !!id,
  });
}

export function useCreateSalary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSalary,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salaries"] });
    },
  });
}

export function useUpdateSalary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSalary,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salaries"] });
    },
  });
}
