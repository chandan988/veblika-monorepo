"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";

interface Contact {
    _id: string;
    orgId: string;
    name?: string;
    email: string;
    phone: string;
    slackId?: string;
    whatsappId?: string;
    source?: string;
    createdAt: string;
    updatedAt: string;
}

interface GetContactsParams {
    orgId: string;
    page?: number;
    limit?: number;
    search?: string;
}

interface CreateContactData {
    orgId: string;
    name?: string;
    email: string;
    phone: string;
    slackId?: string;
    whatsappId?: string;
    source?: string;
}

interface UpdateContactData {
    name?: string;
    email?: string;
    phone?: string;
    slackId?: string;
    whatsappId?: string;
    source?: string;
}

/**
 * Get all contacts
 */
export const useContacts = (params: GetContactsParams) => {
    return useQuery({
        queryKey: ["contacts", params],
        queryFn: async () => {
            const { orgId, ...queryParams } = params;
            const { data } = await api.get(`/organisations/${orgId}/contacts`, { params: queryParams });
            return data;
        },
        enabled: !!params.orgId,
    });
};

/**
 * Get a single contact
 */
export const useContact = (orgId: string, id: string) => {
    return useQuery({
        queryKey: ["contact", orgId, id],
        queryFn: async () => {
            const { data } = await api.get(`/organisations/${orgId}/contacts/${id}`);
            return data;
        },
        enabled: !!orgId && !!id,
    });
};

/**
 * Create contact
 */
export const useCreateContact = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (contactData: CreateContactData) => {
            const { orgId, ...bodyData } = contactData;
            const { data } = await api.post(`/organisations/${orgId}/contacts`, bodyData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["contacts"] });
        },
        onError: (error: any) => {
            console.error("Error creating contact:", error);
            throw error;
        },
    });
};

/**
 * Update contact
 */
export const useUpdateContact = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ orgId, id, data }: { orgId: string; id: string; data: UpdateContactData }) => {
            const response = await api.put(`/organisations/${orgId}/contacts/${id}`, data);
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["contacts"] });
            queryClient.invalidateQueries({ queryKey: ["contact", variables.id] });
        },
        onError: (error: any) => {
            console.error("Error updating contact:", error);
            throw error;
        },
    });
};

/**
 * Delete contact
 */
export const useDeleteContact = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ orgId, id }: { orgId: string; id: string }) => {
            const { data } = await api.delete(`/organisations/${orgId}/contacts/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["contacts"] });
        },
        onError: (error: any) => {
            console.error("Error deleting contact:", error);
            throw error;
        },
    });
};
