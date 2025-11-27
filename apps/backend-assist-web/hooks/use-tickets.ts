import { useQuery } from "@tanstack/react-query"
import { ticketsService, TicketListParams, TicketListResult } from "@/services/tickets"

export const useTickets = (params: TicketListParams) =>
  useQuery<TicketListResult>({
    queryKey: ["tickets", params],
    queryFn: () => ticketsService.list(params),
    refetchOnWindowFocus: false,
  })

