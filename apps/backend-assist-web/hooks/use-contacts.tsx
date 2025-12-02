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
            const { data } = await api.get("/contacts", { params });
            return data;
        },
        enabled: !!params.orgId,
    });
};

/**
 * Get a single contact
 */
export const useContact = (id: string) => {
    return useQuery({
        queryKey: ["contact", id],
        queryFn: async () => {
            const { data } = await api.get(`/contacts/${id}`);
            return data;
        },
        enabled: !!id,
    });
};

/**
 * Create contact
 */
export const useCreateContact = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (contactData: CreateContactData) => {
            const { data } = await api.post("/contacts", contactData);
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
        mutationFn: async ({ id, data }: { id: string; data: UpdateContactData }) => {
            const response = await api.put(`/contacts/${id}`, data);
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
        mutationFn: async (id: string) => {
            const { data } = await api.delete(`/contacts/${id}`);
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
