"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface JobOpeningParams {
  page?: number;
  limit?: number;
  search?: string;
  organisationId?: string;
  jobOpeningStatus?: string;
  jobType?: string;
  industry?: string;
  isRemote?: boolean;
}

async function fetchJobOpenings(params: JobOpeningParams) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", params.page.toString());
  if (params.limit) queryParams.append("limit", params.limit.toString());
  if (params.search) queryParams.append("search", params.search);
  if (params.organisationId)
    queryParams.append("organisationId", params.organisationId);
  if (params.jobOpeningStatus)
    queryParams.append("jobOpeningStatus", params.jobOpeningStatus);
  if (params.jobType) queryParams.append("jobType", params.jobType);
  if (params.industry) queryParams.append("industry", params.industry);
  if (params.isRemote !== undefined)
    queryParams.append("isRemote", params.isRemote.toString());

  const res = await fetch(`/api/ats/job-opening?${queryParams.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch job openings");
  return res.json();
}

async function fetchJobOpeningById(id: string) {
  const res = await fetch(`/api/ats/job-opening/${id}`);
  if (!res.ok) throw new Error("Failed to fetch job opening");
  return res.json();
}

async function createJobOpening(data: any) {
  const res = await fetch("/api/ats/job-opening", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create job opening");
  }
  return res.json();
}

async function updateJobOpening({ id, data }: { id: string; data: any }) {
  const res = await fetch(`/api/ats/job-opening/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to update job opening");
  }
  return res.json();
}

async function deleteJobOpening(id: string) {
  const res = await fetch(`/api/ats/job-opening/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete job opening");
  return res.json();
}

export function useJobOpenings(params: JobOpeningParams = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["job-openings", params],
    queryFn: () => fetchJobOpenings(params),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteJobOpening,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-openings"] });
    },
  });

  return {
    jobOpenings: query.data,
    isLoading: query.isLoading,
    error: query.error,
    deleteJobOpening: deleteMutation.mutateAsync,
  };
}

export function useJobOpening(id: string) {
  return useQuery({
    queryKey: ["job-opening", id],
    queryFn: () => fetchJobOpeningById(id),
    enabled: !!id,
  });
}

export function useCreateJobOpening() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createJobOpening,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-openings"] });
    },
  });
}

export function useUpdateJobOpening() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateJobOpening,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-openings"] });
      queryClient.invalidateQueries({ queryKey: ["job-opening"] });
    },
  });
}
