"use client";

import { useQuery } from "@tanstack/react-query";
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
