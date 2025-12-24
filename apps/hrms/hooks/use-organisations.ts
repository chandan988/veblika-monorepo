"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface OrganisationParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

async function fetchOrganisations(params: OrganisationParams) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", params.page.toString());
  if (params.limit) queryParams.append("limit", params.limit.toString());
  if (params.search) queryParams.append("search", params.search);
  if (params.isActive !== undefined)
    queryParams.append("isActive", params.isActive.toString());

  const res = await fetch(`/api/organisation?${queryParams.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch organisations");
  return res.json();
}

async function fetchOrganisationById(id: string) {
  const res = await fetch(`/api/organisation/${id}`);
  if (!res.ok) throw new Error("Failed to fetch organisation");
  return res.json();
}

async function createOrganisation(data: any) {
  const res = await fetch("/api/organisation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create organisation");
  }
  return res.json();
}

async function updateOrganisation({ id, data }: { id: string; data: any }) {
  const res = await fetch(`/api/organisation/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to update organisation");
  }
  return res.json();
}

async function deleteOrganisation(id: string) {
  const res = await fetch(`/api/organisation/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete organisation");
  return res.json();
}

export function useOrganisations(params: OrganisationParams = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["organisations", params],
    queryFn: () => fetchOrganisations(params),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteOrganisation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organisations"] });
    },
  });

  return {
    organisations: query.data,
    isLoading: query.isLoading,
    error: query.error,
    deleteOrganisation: deleteMutation.mutateAsync,
  };
}

export function useOrganisation(id: string) {
  return useQuery({
    queryKey: ["organisation", id],
    queryFn: () => fetchOrganisationById(id),
    enabled: !!id,
  });
}

export function useCreateOrganisation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createOrganisation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organisations"] });
    },
  });
}

export function useUpdateOrganisation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateOrganisation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organisations"] });
    },
  });
}
