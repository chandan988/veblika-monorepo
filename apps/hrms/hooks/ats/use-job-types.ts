"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface JobTypeParams {
  page?: number;
  limit?: number;
  search?: string;
  organisationId?: string;
}

async function fetchJobTypes(params: JobTypeParams) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", params.page.toString());
  if (params.limit) queryParams.append("limit", params.limit.toString());
  if (params.search) queryParams.append("search", params.search);
  if (params.organisationId)
    queryParams.append("organisationId", params.organisationId);

  const res = await fetch(`/api/ats/job-type?${queryParams.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch job types");
  return res.json();
}

async function fetchJobTypeById(id: string) {
  const res = await fetch(`/api/ats/job-type/${id}`);
  if (!res.ok) throw new Error("Failed to fetch job type");
  return res.json();
}

async function createJobType(data: any) {
  const res = await fetch("/api/ats/job-type", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create job type");
  }
  return res.json();
}

async function updateJobType({ id, data }: { id: string; data: any }) {
  const res = await fetch(`/api/ats/job-type/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to update job type");
  }
  return res.json();
}

async function deleteJobType(id: string) {
  const res = await fetch(`/api/ats/job-type/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete job type");
  return res.json();
}

export function useJobTypes(params: JobTypeParams = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["job-types", params],
    queryFn: () => fetchJobTypes(params),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteJobType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-types"] });
    },
  });

  return {
    jobTypes: query.data,
    isLoading: query.isLoading,
    error: query.error,
    deleteJobType: deleteMutation.mutateAsync,
  };
}

export function useJobType(id: string) {
  return useQuery({
    queryKey: ["job-type", id],
    queryFn: () => fetchJobTypeById(id),
    enabled: !!id,
  });
}

export function useCreateJobType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createJobType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-types"] });
    },
  });
}

export function useUpdateJobType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateJobType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-types"] });
    },
  });
}
