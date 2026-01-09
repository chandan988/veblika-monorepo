import mongoose from "mongoose"
import { Conversation, IConversation } from "../models/conversation-model"
import { Message, IMessage } from "../models/message-model"
import { Contact } from "../models/contact-model"
import {
  GetConversationsQuery,
  UpdateConversationInput,
} from "../validators/conversation-validator"
import { integrationGmailService } from "./integration-gmail-service"

export class ConversationService {
  /**
   * Get all conversations with filters and pagination
   */
  async getConversations(query: GetConversationsQuery): Promise<{
    conversations: any[]
    total: number
    page: number
    limit: number
  }> {
    const filter: any = {}
    const page = parseInt(query.page || "1")
    const limit = parseInt(query.limit || "30")
    const skip = (page - 1) * limit

    if (query.orgId) {
      filter.orgId = new mongoose.Types.ObjectId(query.orgId)
    }
    if (query.status) {
      filter.status = query.status
    }
    if (query.channel) {
      filter.channel = query.channel
    }
    if (query.assignedMemberId) {
      // Filter for conversations with no assignee
      filter.$or = [
        { assignedMemberId: { $exists: false } },
        { assignedMemberId: query.assignedMemberId },
      ]
    }

    const [conversations, total] = await Promise.all([
      Conversation.find(filter)
        .populate("contactId")
        .populate("integrationId")
        .sort({ lastMessageAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Conversation.countDocuments(filter),
    ])

    return {
      conversations,
      total,
      page,
      limit,
    }
  }

  /**
   * Get conversation by ID
   */
  async getConversationById(id: string): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid conversation ID")
    }

    const conversation = await Conversation.findById(id)
      .populate("contactId")
      .populate("integrationId")
      .lean()

    if (!conversation) {
      throw new Error("Conversation not found")
    }

    return conversation
  }

  /**
   * Update conversation
   * @param memberId - The member ID (from req.member._id) performing the update
   */
  async updateConversation(
    id: string,
    data: UpdateConversationInput,
    memberId?: string
  ): Promise<IConversation> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid conversation ID")
    }

    const updateData: any = { ...data }

    // Track assignment - store member ID who did the assignment
    if (data.assignedMemberId !== undefined) {
      updateData.assignedBy = memberId
      updateData.assignedAt = new Date()
    }

    // If closing conversation, set closedAt and closedBy with member ID
    if (data.status === "closed") {
      updateData.closedAt = new Date()
      updateData.closedBy = memberId
      // Set default closed reason if not provided
      if (!data.closedReason) {
        updateData.closedReason = "resolved"
      }
    }

    const conversation = await Conversation.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )

    if (!conversation) {
      throw new Error("Conversation not found")
    }

    return conversation
  }

  /**
   * Get messages for a conversation with cursor-based pagination
   */
  async getConversationMessages(
    conversationId: string,
    limit: number = 50,
    before?: string
  ): Promise<{
    messages: IMessage[]
    hasMore: boolean
    nextCursor: string | null
  }> {
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      throw new Error("Invalid conversation ID")
    }

    const query: any = {
      conversationId: new mongoose.Types.ObjectId(conversationId),
    }

    if (before) {
      query.createdAt = { $lt: new Date(before) }
    }

    // Fetch one extra to determine if there are more messages
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .lean()

    const hasMore = messages.length > limit

    // Remove the extra message if we fetched more than limit
    if (hasMore) {
      messages.pop()
    }

    // Reverse to get chronological order (oldest first)
    const orderedMessages = messages.reverse() as unknown as IMessage[]

    // Next cursor is the oldest message's createdAt (first in ordered array)
    const nextCursor =
      hasMore && orderedMessages.length > 0
        ? (orderedMessages[0] as any).createdAt?.toISOString() || null
        : null

    return {
      messages: orderedMessages,
      hasMore,
      nextCursor,
    }
  }

  /**
   * Send message to conversation (from agent)
   */
  async sendMessage(
    conversationId: string,
    agentId: string,
    messageText: string,
    orgId?: string,
    internal: boolean = false
  ): Promise<IMessage> {
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      throw new Error("Invalid conversation ID")
    }

    const conversation =
      await Conversation.findById(conversationId).populate("contactId")
    if (!conversation) {
      throw new Error("Conversation not found")
    }

    // If orgId provided, verify it matches the conversation orgId
    if (orgId && conversation.orgId.toString() !== orgId) {
      throw new Error(
        "Unauthorized: Conversation does not belong to your organization"
      )
    }

    const messagePayload: any = {
      orgId: conversation.orgId,
      conversationId: conversation._id,
      contactId: conversation.contactId,
      senderType: "agent",
      senderId: agentId,
      direction: internal ? "internal" : "outbound",
      channel: conversation.channel,
      body: {
        text: messageText,
      },
      status: "sent",
      attachments: [],
      metadata: {},
    }

    if (internal) {
      messagePayload.metadata.internal = true
    }

    const message = await Message.create(messagePayload)

    // Update conversation
    conversation.lastMessageAt = new Date()
    conversation.lastMessagePreview = messageText.substring(0, 100)
    await conversation.save()

    // If this is NOT an internal note and the conversation is an email-like channel,
    // attempt to send the reply via configured SMTP/email provider.
    try {
      if (
        !internal &&
        ["gmail", "smtp", "imap", "email"].includes(conversation.channel)
      ) {
        // contactId may be populated above
        const contact: any =
          (conversation.contactId as any) ||
          (await Contact.findById(conversation.contactId))
        const to = contact?.email
        if (to) {
          // For Gmail channel, use Gmail API to send from user's Gmail account
          if (conversation.channel === "gmail" && conversation.integrationId) {
            const integrationId = conversation.integrationId.toString()

            // Get threading info from the last inbound message
            const lastInboundMessage = await Message.findOne({
              conversationId: conversation._id,
              direction: "inbound",
            })
              .sort({ createdAt: -1 })
              .lean()

            const subject = conversation.sourceMetadata?.subject
              ? conversation.sourceMetadata.subject.startsWith("Re:")
                ? conversation.sourceMetadata.subject
                : `Re: ${conversation.sourceMetadata.subject}`
              : "Re: Support"

            const htmlBody = `<div>${messageText.replace(/\n/g, "<br/>")}</div>`

            const sendResult = await integrationGmailService.sendGmailMessage({
              integrationId,
              to,
              subject,
              body: messageText,
              htmlBody,
              threadId: conversation.threadId,
              inReplyTo: (lastInboundMessage as any)?.metadata?.messageIdHeader,
              references: (lastInboundMessage as any)?.metadata
                ?.referencesHeader
                ? `${(lastInboundMessage as any).metadata.referencesHeader} ${(lastInboundMessage as any).metadata?.messageIdHeader || ""}`
                : (lastInboundMessage as any)?.metadata?.messageIdHeader,
            })

            // Store delivery result in metadata
            message.metadata = message.metadata || {}
            message.metadata.emailSent = sendResult.success === true
            if (sendResult.messageId)
              message.metadata.gmailMessageId = sendResult.messageId
            if (sendResult.threadId)
              message.metadata.gmailThreadId = sendResult.threadId
            await message.save()
          } else {
            // For other email channels, use SMTP
            const { emailService } = await import("../../services/email")
            const subject =
              conversation.sourceMetadata?.subject ||
              `Re: ${conversation.sourceMetadata?.subject || "Support"}`
            const html = `<div>${messageText.replace(/\n/g, "<br/>")}</div>`

            const sendResult = await emailService.sendEmail({
              to,
              subject,
              html,
              text: messageText,
            })

            // store delivery result and any error info in metadata
            message.metadata = message.metadata || {}
            message.metadata.emailSent = sendResult.success === true
            if (sendResult.messageId)
              message.metadata.emailMessageId = sendResult.messageId
            if (!sendResult.success && sendResult.error) {
              // save structured error (non-sensitive)
              message.metadata.emailError = sendResult.error
              console.error("Outbound email send failed", {
                conversationId: conversation._id?.toString(),
                to,
                error: sendResult.error,
              })
            }
            await message.save()
          }
        }
      }
    } catch (err: any) {
      // Persist error details on the message metadata but do not fail the API call
      try {
        message.metadata = message.metadata || {}
        message.metadata.emailSent = false
        message.metadata.emailError = {
          message: err?.message || String(err),
          code: err?.code,
        }
        await message.save()
      } catch (saveErr) {
        console.error(
          "Failed to save message metadata after email send error",
          saveErr
        )
      }

      console.error(
        "Failed to send outbound email for conversation reply (exception):",
        {
          conversationId: conversation._id?.toString(),
          error: err?.message || err,
        }
      )
    }

    return message
  }

  /**
   * Get conversation statistics for an organization
   */
  async getConversationStats(orgId: string): Promise<{
    total: number
    open: number
    pending: number
    closed: number
  }> {
    if (!mongoose.Types.ObjectId.isValid(orgId)) {
      throw new Error("Invalid organization ID")
    }

    const stats = await Conversation.aggregate([
      {
        $match: {
          orgId: new mongoose.Types.ObjectId(orgId),
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ])

    const result = {
      total: 0,
      open: 0,
      pending: 0,
      closed: 0,
    }

    stats.forEach((stat) => {
      result[stat._id as keyof typeof result] = stat.count
      result.total += stat.count
    })

    return result
  }
}

export const conversationService = new ConversationService()
