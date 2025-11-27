import { api } from "./api"

export type Ticket = {
  _id: string
  title: string
  description: string
  status: "open" | "in-progress" | "resolved" | "closed"
  priority: "low" | "medium" | "high" | "urgent"
  requesterName?: string
  requesterEmail?: string
  channel?: string
  source?: string
  tags?: string[]
  createdAt: string
  updatedAt: string
  lastMessageAt?: string
}

export type TicketListParams = {
  page?: number
  limit?: number
  status?: string
  priority?: string
  source?: string
  channel?: string
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

export type TicketListResult = {
  tickets: Ticket[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

type TicketApiResponse = {
  success: boolean
  message: string
  data?: {
    data?: Ticket[]
    pagination?: TicketListResult["pagination"]
  }
}

const fallbackPagination = (params?: TicketListParams): TicketListResult["pagination"] => ({
  total: 0,
  page: params?.page || 1,
  limit: params?.limit || 10,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
})

export const ticketsService = {
  async list(params?: TicketListParams): Promise<TicketListResult> {
    const { data } = await api.get<TicketApiResponse>("/tickets", { params })
    const payload = data?.data
    return {
      tickets: payload?.data || [],
      pagination: payload?.pagination || fallbackPagination(params),
    }
  },
}
