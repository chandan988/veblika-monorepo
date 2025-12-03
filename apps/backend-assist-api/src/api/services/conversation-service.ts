import mongoose from 'mongoose';
import { Conversation, IConversation } from '../models/conversation-model';
import { Message, IMessage } from '../models/message-model';
import { Contact } from '../models/contact-model';
import { GetConversationsQuery, UpdateConversationInput } from '../validators/conversation-validator';

export class ConversationService {
  /**
   * Get all conversations with filters and pagination
   */
  async getConversations(query: GetConversationsQuery): Promise<{
    conversations: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    const filter: any = {};
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '50');
    const skip = (page - 1) * limit;

    if (query.orgId) {
      filter.orgId = new mongoose.Types.ObjectId(query.orgId);
    }
    if (query.status) {
      filter.status = query.status;
    }
    if (query.channel) {
      filter.channel = query.channel;
    }
    if (query.assignedMemberId) {
      filter.assignedMemberId = query.assignedMemberId;
    }

    const [conversations, total] = await Promise.all([
      Conversation.find(filter)
        .populate('contactId')
        .populate('integrationId')
        .sort({ lastMessageAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Conversation.countDocuments(filter),
    ]);

    return {
      conversations,
      total,
      page,
      limit,
    };
  }

  /**
   * Get conversation by ID
   */
  async getConversationById(id: string): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid conversation ID');
    }

    const conversation = await Conversation.findById(id)
      .populate('contactId')
      .populate('integrationId')
      .lean();

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    return conversation;
  }

  /**
   * Update conversation
   */
  async updateConversation(id: string, data: UpdateConversationInput): Promise<IConversation> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid conversation ID');
    }

    const updateData: any = { ...data };

    // If closing conversation, set closedAt timestamp
    if (data.status === 'closed') {
      updateData.closedAt = new Date();
    }

    const conversation = await Conversation.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    return conversation;
  }

  /**
   * Get messages for a conversation
   */
  async getConversationMessages(
    conversationId: string,
    limit: number = 50,
    before?: string
  ): Promise<IMessage[]> {
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      throw new Error('Invalid conversation ID');
    }

    const query: any = {
      conversationId: new mongoose.Types.ObjectId(conversationId),
    };

    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return messages.reverse() as any[];
  }

  /**
   * Send message to conversation (from agent)
   */
  async sendMessage(
    conversationId: string,
    agentId: string,
    messageText: string,
    orgId: string,
    internal: boolean = false
  ): Promise<IMessage> {
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      throw new Error('Invalid conversation ID');
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Verify orgId matches
    if (conversation.orgId.toString() !== orgId) {
      throw new Error('Unauthorized: Conversation does not belong to your organization');
    }

    const messagePayload: any = {
      orgId: conversation.orgId,
      conversationId: conversation._id,
      contactId: conversation.contactId,
      senderType: 'agent',
      senderId: agentId,
      direction: internal ? 'internal' : 'outbound',
      channel: conversation.channel,
      body: {
        text: messageText,
      },
      status: 'sent',
      attachments: [],
      metadata: {},
    };

    if (internal) {
      messagePayload.metadata.internal = true;
    }

    const message = await Message.create(messagePayload);

    // Update conversation
    conversation.lastMessageAt = new Date();
    conversation.lastMessagePreview = messageText.substring(0, 100);
    await conversation.save();

    return message;
  }

  /**
   * Get conversation statistics for an organization
   */
  async getConversationStats(orgId: string): Promise<{
    total: number;
    open: number;
    pending: number;
    closed: number;
  }> {
    if (!mongoose.Types.ObjectId.isValid(orgId)) {
      throw new Error('Invalid organization ID');
    }

    const stats = await Conversation.aggregate([
      {
        $match: {
          orgId: new mongoose.Types.ObjectId(orgId),
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const result = {
      total: 0,
      open: 0,
      pending: 0,
      closed: 0,
    };

    stats.forEach((stat) => {
      result[stat._id as keyof typeof result] = stat.count;
      result.total += stat.count;
    });

    return result;
  }
}

export const conversationService = new ConversationService();
