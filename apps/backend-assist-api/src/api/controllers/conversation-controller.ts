import { Request, Response } from "express"
import { conversationService } from "../services/conversation-service"
import { asyncHandler } from "../../utils/async-handler"
import {
  GetConversationsQuery,
  UpdateConversationInput,
  SendMessageInput,
  GetMessagesQuery,
} from "../validators/conversation-validator"

export class ConversationController {
  /**
   * Get all conversations with filters
   */
  getConversations = asyncHandler(async (req: Request, res: Response) => {
    const query: GetConversationsQuery = {
      ...req.query,
      orgId: req.params.orgId as string,
      assignedMemberId: req.member?._id?.toString(),
    }

    if (
      req.member?.roleId?.slug === "owner" ||
      req.member?.roleId?.slug === "admin"
    ) {
      // Admins and Owners can see all conversations, so we don't set assignedMemberId
      delete query.assignedMemberId
    }

    console.log(query, "Query")
    const result = await conversationService.getConversations(query)

    return res.status(200).json({
      success: true,
      message: "Conversations retrieved successfully",
      data: result.conversations,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
    })
  })

  /**
   * Get conversation by ID
   */
  getConversationById = asyncHandler(async (req: Request, res: Response) => {
    const conversation = await conversationService.getConversationById(
      req.params.id!
    )

    return res.status(200).json({
      success: true,
      message: "Conversation retrieved successfully",
      data: conversation,
    })
  })

  /**
   * Update conversation
   */
  updateConversation = asyncHandler(async (req: Request, res: Response) => {
    const data: UpdateConversationInput = req.body
    const memberId = req.member?._id?.toString() // Get current member from loadMemberAbility middleware
    
    // Check if updating assignment and verify permission
    if (data.assignedMemberId !== undefined) {
      // Determine subject based on conversation channel
      const conversation = await conversationService.getConversationById(req.params.id!)
      const subject = conversation.channel === 'gmail' ? 'Ticket' : 'Chat'
      
      if (!req.ability?.can('assign', subject)) {
        return res.status(403).json({
          success: false,
          error: `You don't have permission to assign ${subject.toLowerCase()}s`,
        })
      }
    }
    
    const updatedConversation = await conversationService.updateConversation(
      req.params.id!,
      data,
      memberId
    )

    return res.status(200).json({
      success: true,
      message: "Conversation updated successfully",
      data: updatedConversation,
    })
  })

  /**
   * Get messages for a conversation with cursor-based pagination
   */
  getConversationMessages = asyncHandler(
    async (req: Request, res: Response) => {
      const { limit, before } = req.query as GetMessagesQuery
      const result = await conversationService.getConversationMessages(
        req.params.id!,
        limit ? parseInt(limit) : 50,
        before
      )

      return res.status(200).json({
        success: true,
        message: "Messages retrieved successfully",
        data: result.messages,
        pagination: {
          hasMore: result.hasMore,
          nextCursor: result.nextCursor,
          limit: limit ? parseInt(limit) : 50,
        },
      })
    }
  )

  /**
   * Send message to conversation
   */
  sendMessage = asyncHandler(async (req: Request, res: Response) => {
    const data: SendMessageInput = req.body

    // Get orgId from route params (org-scoped route)
    const orgId = req.params.orgId
    const agentId = req.user?.id || ""

    const message = await conversationService.sendMessage(
      req.params.id!,
      agentId,
      data.text,
      orgId,
      data.internal === true
    )

    // Include sanitized delivery info (if available) so frontend can notify user
    let deliveryInfo: any = undefined
    try {
      if (message && message.metadata) {
        deliveryInfo = {
          emailSent: message.metadata.emailSent === true,
          emailError: message.metadata.emailError
            ? {
                message: message.metadata.emailError.message,
                code: message.metadata.emailError.code,
              }
            : undefined,
        }
      }
    } catch (err) {
      // ignore errors while reading metadata
    }

    // Log a concise server-side entry if delivery failed
    if (
      deliveryInfo &&
      deliveryInfo.emailSent === false &&
      deliveryInfo.emailError
    ) {
      console.warn("Message delivered to DB but email send failed", {
        conversationId: req.params.id,
        agentId,
        error: deliveryInfo.emailError,
      })
    }

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: message,
      delivery: deliveryInfo,
    })
  })

  /**
   * Get conversation statistics
   */
  getConversationStats = asyncHandler(async (req: Request, res: Response) => {
    const orgId = req.params.orgId!
    const stats = await conversationService.getConversationStats(orgId)

    return res.status(200).json({
      success: true,
      message: "Statistics retrieved successfully",
      data: stats,
    })
  })
}

export const conversationController = new ConversationController()
