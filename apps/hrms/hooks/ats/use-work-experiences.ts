"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface WorkExperienceParams {
  page?: number;
  limit?: number;
  search?: string;
  organisationId?: string;
}

async function fetchWorkExperiences(params: WorkExperienceParams) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", params.page.toString());
  if (params.limit) queryParams.append("limit", params.limit.toString());
  if (params.search) queryParams.append("search", params.search);
  if (params.organisationId)
    queryParams.append("organisationId", params.organisationId);

  const res = await fetch(`/api/ats/work-experience?${queryParams.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch work experiences");
  return res.json();
}

async function fetchWorkExperienceById(id: string) {
  const res = await fetch(`/api/ats/work-experience/${id}`);
  if (!res.ok) throw new Error("Failed to fetch work experience");
  return res.json();
}

async function createWorkExperience(data: any) {
  const res = await fetch("/api/ats/work-experience", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create work experience");
  }
  return res.json();
}

async function updateWorkExperience({ id, data }: { id: string; data: any }) {
  const res = await fetch(`/api/ats/work-experience/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to update work experience");
  }
  return res.json();
}

async function deleteWorkExperience(id: string) {
  const res = await fetch(`/api/ats/work-experience/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete work experience");
  return res.json();
}

export function useWorkExperiences(params: WorkExperienceParams = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["work-experiences", params],
    queryFn: () => fetchWorkExperiences(params),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWorkExperience,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-experiences"] });
    },
  });

  return {
    workExperiences: query.data,
    isLoading: query.isLoading,
    error: query.error,
    deleteWorkExperience: deleteMutation.mutateAsync,
  };
}

export function useWorkExperience(id: string) {
  return useQuery({
    queryKey: ["work-experience", id],
    queryFn: () => fetchWorkExperienceById(id),
    enabled: !!id,
  });
}

export function useCreateWorkExperience() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createWorkExperience,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-experiences"] });
    },
  });
}

export function useUpdateWorkExperience() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateWorkExperience,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-experiences"] });
    },
  });
}
