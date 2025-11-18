import { Router } from 'express';
import { ticketController } from '../controllers/ticket.controller';
import { validate } from '../../middleware/validator';
import { createTicketSchema, updateTicketSchema, ticketIdSchema } from '../validators/ticket-validator';

const router:Router = Router();

/**
 * @route   POST /api/tickets
 * @desc    Create a new ticket
 * @access  Public
 */
router.post('/', validate(createTicketSchema), ticketController.createTicket);

/**
 * @route   GET /api/tickets
 * @desc    Get all tickets with pagination and filters
 * @access  Public
 * @query   ?page=1&limit=10&status=open&priority=high&sortBy=createdAt&sortOrder=desc
 */
router.get('/', ticketController.getAllTickets);

/**
 * @route   GET /api/tickets/:id
 * @desc    Get ticket by ID
 * @access  Public
 */
router.get('/:id', validate(ticketIdSchema), ticketController.getTicketById);

/**
 * @route   PUT /api/tickets/:id
 * @desc    Update ticket by ID
 * @access  Public
 */
router.put('/:id', validate(ticketIdSchema.merge(updateTicketSchema)), ticketController.updateTicket);

/**
 * @route   DELETE /api/tickets/:id
 * @desc    Delete ticket by ID
 * @access  Public
 */
router.delete('/:id', validate(ticketIdSchema), ticketController.deleteTicket);

/**
 * @route   GET /api/tickets/customer/:customerId
 * @desc    Get all tickets for a specific customer
 * @access  Public
 */
router.get('/customer/:customerId', ticketController.getTicketsByCustomer);

/**
 * @route   GET /api/tickets/status/:status
 * @desc    Get all tickets by status
 * @access  Public
 */
router.get('/status/:status', ticketController.getTicketsByStatus);

export default router;
