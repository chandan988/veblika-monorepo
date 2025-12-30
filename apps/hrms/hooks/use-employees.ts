"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface EmployeeParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  organisationId?: string;
  branchId?: string;
  departmentId?: string;
  designationId?: string;
}

async function fetchEmployees(params: EmployeeParams) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", params.page.toString());
  if (params.limit) queryParams.append("limit", params.limit.toString());
  if (params.search) queryParams.append("search", params.search);
  if (params.isActive !== undefined)
    queryParams.append("isActive", params.isActive.toString());
  if (params.organisationId)
    queryParams.append("organisationId", params.organisationId);
  if (params.branchId)
    queryParams.append("branchId", params.branchId);
  if (params.departmentId)
    queryParams.append("departmentId", params.departmentId);
  if (params.designationId)
    queryParams.append("designationId", params.designationId);

  const res = await fetch(`/api/employee?${queryParams.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch employees");
  return res.json();
}

async function fetchEmployeeById(id: string) {
  const res = await fetch(`/api/employee/${id}`);
  if (!res.ok) throw new Error("Failed to fetch employee");
  return res.json();
}

async function createEmployee(data: any) {
  const res = await fetch("/api/employee", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create employee");
  }
  return res.json();
}

async function updateEmployee({ id, data }: { id: string; data: any }) {
  const res = await fetch(`/api/employee/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to update employee");
  }
  return res.json();
}

async function deleteEmployee(id: string) {
  const res = await fetch(`/api/employee/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete employee");
  return res.json();
}

export function useEmployees(params: EmployeeParams = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["employees", params],
    queryFn: () => fetchEmployees(params),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });

  return {
    employees: query.data,
    isLoading: query.isLoading,
    error: query.error,
    deleteEmployee: deleteMutation.mutateAsync,
  };
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: ["employee", id],
    queryFn: () => fetchEmployeeById(id),
    enabled: !!id,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}
