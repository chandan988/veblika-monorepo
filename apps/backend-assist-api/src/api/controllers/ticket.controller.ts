import { Request, Response } from 'express';
import { ticketService } from '../services/ticket-service';
import { asyncHandler } from '../../utils/async-handler';
import { CreateTicketInput, UpdateTicketInput } from '../validators/ticket-validator';

export class TicketController {
  createTicket = asyncHandler(async (req: Request, res: Response) => {
    const ticketData: CreateTicketInput = req.body;
    const ticket = await ticketService.createTicket(ticketData);
    return res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      data: ticket
    });
  });

  getAllTickets = asyncHandler(async (req: Request, res: Response) => {
    const result = await ticketService.getAllTickets(req.query);
    return res.status(200).json({
      success: true,
      message: 'Tickets retrieved successfully',
      data: result
    });
  });

  getTicketById = asyncHandler(async (req: Request, res: Response) => {
    const ticket = await ticketService.getTicketById(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Ticket retrieved successfully',
      data: ticket
    });
  });

  updateTicket = asyncHandler(async (req: Request, res: Response) => {
    const ticketData: UpdateTicketInput = req.body;
    const ticket = await ticketService.updateTicket(req.params.id, ticketData);
    return res.status(200).json({
      success: true,
      message: 'Ticket updated successfully',
      data: ticket
    });
  });

  deleteTicket = asyncHandler(async (req: Request, res: Response) => {
    await ticketService.deleteTicket(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Ticket deleted successfully',
      data: null
    });
  });

  getTicketsByCustomer = asyncHandler(async (req: Request, res: Response) => {
    const tickets = await ticketService.getTicketsByCustomer(req.params.customerId);
    return res.status(200).json({
      success: true,
      message: 'Customer tickets retrieved successfully',
      data: tickets
    });
  });

  getTicketsByStatus = asyncHandler(async (req: Request, res: Response) => {
    const tickets = await ticketService.getTicketsByStatus(req.params.status);
    return res.status(200).json({
      success: true,
      message: 'Tickets by status retrieved successfully',
      data: tickets
    });
  });
}

export const ticketController = new TicketController();
