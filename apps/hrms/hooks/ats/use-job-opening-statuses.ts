"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface JobOpeningStatusParams {
  page?: number;
  limit?: number;
  search?: string;
  organisationId?: string;
}

async function fetchJobOpeningStatuses(params: JobOpeningStatusParams) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", params.page.toString());
  if (params.limit) queryParams.append("limit", params.limit.toString());
  if (params.search) queryParams.append("search", params.search);
  if (params.organisationId)
    queryParams.append("organisationId", params.organisationId);

  const res = await fetch(`/api/ats/job-opening-status?${queryParams.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch job opening statuses");
  return res.json();
}

async function fetchJobOpeningStatusById(id: string) {
  const res = await fetch(`/api/ats/job-opening-status/${id}`);
  if (!res.ok) throw new Error("Failed to fetch job opening status");
  return res.json();
}

async function createJobOpeningStatus(data: any) {
  const res = await fetch("/api/ats/job-opening-status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create job opening status");
  }
  return res.json();
}

async function updateJobOpeningStatus({ id, data }: { id: string; data: any }) {
  const res = await fetch(`/api/ats/job-opening-status/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to update job opening status");
  }
  return res.json();
}

async function deleteJobOpeningStatus(id: string) {
  const res = await fetch(`/api/ats/job-opening-status/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete job opening status");
  return res.json();
}

export function useJobOpeningStatuses(params: JobOpeningStatusParams = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["job-opening-statuses", params],
    queryFn: () => fetchJobOpeningStatuses(params),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteJobOpeningStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-opening-statuses"] });
    },
  });

  return {
    jobOpeningStatuses: query.data,
    isLoading: query.isLoading,
    error: query.error,
    deleteJobOpeningStatus: deleteMutation.mutateAsync,
  };
}

export function useJobOpeningStatus(id: string) {
  return useQuery({
    queryKey: ["job-opening-status", id],
    queryFn: () => fetchJobOpeningStatusById(id),
    enabled: !!id,
  });
}

export function useCreateJobOpeningStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createJobOpeningStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-opening-statuses"] });
    },
  });
}

export function useUpdateJobOpeningStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateJobOpeningStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-opening-statuses"] });
    },
  });
}
