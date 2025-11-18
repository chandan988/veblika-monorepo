import { Ticket, ITicket } from '../models/ticket-model';
import createHttpError from 'http-errors';
import { CreateTicketInput, UpdateTicketInput } from '../validators/ticket-validator';
import { getPaginationParams, buildPaginationResult, PaginationQuery } from '../../utils/pagination';

export class TicketService {
  async createTicket(ticketData: CreateTicketInput): Promise<ITicket> {
    const ticket = new Ticket(ticketData);
    await ticket.save();
    return ticket;
  }

  async getAllTickets(query: PaginationQuery & { status?: string; priority?: string }) {
    const { page, limit, skip, sortBy, sortOrder } = getPaginationParams(query);

    // Build filter
    const filter: any = {};
    if (query.status) {
      filter.status = query.status;
    }
    if (query.priority) {
      filter.priority = query.priority;
    }

    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      Ticket.countDocuments(filter),
    ]);

    return buildPaginationResult(tickets, total, page, limit);
  }

  async getTicketById(id: string): Promise<ITicket> {
    const ticket = await Ticket.findById(id);
    if (!ticket) {
      throw createHttpError(404, 'Ticket not found');
    }
    return ticket;
  }

  async updateTicket(id: string, ticketData: UpdateTicketInput): Promise<ITicket> {
    const ticket = await Ticket.findByIdAndUpdate(
      id,
      { $set: ticketData },
      { new: true, runValidators: true }
    );
    
    if (!ticket) {
      throw createHttpError(404, 'Ticket not found');
    }
    
    return ticket;
  }

  async deleteTicket(id: string): Promise<void> {
    const ticket = await Ticket.findByIdAndDelete(id);
    if (!ticket) {
      throw createHttpError(404, 'Ticket not found');
    }
  }

  async getTicketsByCustomer(customerId: string): Promise<ITicket[]> {
    return Ticket.find({ customerId }).sort({ createdAt: -1 });
  }

  async getTicketsByStatus(status: string): Promise<ITicket[]> {
    return Ticket.find({ status }).sort({ priority: -1, createdAt: -1 });
  }
}

export const ticketService = new TicketService();
