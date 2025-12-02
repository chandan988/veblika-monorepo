import mongoose from 'mongoose';
import { Integration } from '../models/integration-model';
import { Contact, IContact } from '../models/contact-model';
import { Conversation, IConversation } from '../models/conversation-model';
import { Message, IMessage } from '../models/message-model';
import { SendWidgetMessageInput } from '../validators/widget-validator';

export class WidgetService {
  /**
   * Verify that integration exists and is active
   */
  async verifyIntegration(integrationId: string, orgId: string): Promise<boolean> {
    const integration = await Integration.findOne({
      _id: new mongoose.Types.ObjectId(integrationId),
      orgId: new mongoose.Types.ObjectId(orgId),
      channel: 'webchat',
      status: 'active',
    });

    return !!integration;
  }

  /**
   * Get widget configuration for an integration
   */
  async getWidgetConfig(integrationId: string) {
    const integration = await Integration.findOne({
      _id: new mongoose.Types.ObjectId(integrationId),
      channel: 'webchat',
      status: 'active',
    }).populate('orgId');

    if (!integration) {
      throw new Error('Integration not found or inactive');
    }

    return {
      integrationId: integration._id.toString(),
      orgId: integration.orgId.toString(),
      organizationName: (integration.orgId as any)?.name || 'Support Team',
      theme: {
        primaryColor: '#3B82F6',
        position: 'bottom-right',
      },
    };
  }

  /**
   * Find or create a contact from visitor information
   * Priority: email -> phone -> session
   */
  async findOrCreateContact(
    orgId: mongoose.Types.ObjectId,
    sessionId: string,
    visitorInfo?: {
      name?: string;
      email?: string;
      phone?: string;
      userAgent?: string;
      referrer?: string;
    }
  ): Promise<IContact> {
    // PRIORITY 1: Find by email (if provided)
    if (visitorInfo?.email) {
      let contact = await Contact.findOne({
        orgId,
        email: visitorInfo.email,
      });

      if (contact) {
        // Update other fields if needed
        if (visitorInfo.name && !contact.name) contact.name = visitorInfo.name;
        if (visitorInfo.phone && !contact.phone) contact.phone = visitorInfo.phone;
        // Update session reference
        if (contact.source !== `session:${sessionId}`) {
          contact.source = `session:${sessionId}`;
        }
        await contact.save();
        return contact;
      }
    }

    // PRIORITY 2: Find by phone (if provided and email not found)
    if (visitorInfo?.phone) {
      let contact = await Contact.findOne({
        orgId,
        phone: visitorInfo.phone,
      });

      if (contact) {
        if (visitorInfo.name && !contact.name) contact.name = visitorInfo.name;
        if (visitorInfo.email && !contact.email) contact.email = visitorInfo.email;
        contact.source = `session:${sessionId}`;
        await contact.save();
        return contact;
      }
    }

    // PRIORITY 3: Find by session (for anonymous visitors or returning sessions)
    let contact = await Contact.findOne({
      orgId,
      source: `session:${sessionId}`,
    });

    if (contact) {
      // Visitor submitted form later, update contact
      if (visitorInfo?.name && !contact.name) contact.name = visitorInfo.name;
      if (visitorInfo?.email && !contact.email) contact.email = visitorInfo.email;
      if (visitorInfo?.phone && !contact.phone) contact.phone = visitorInfo.phone;
      await contact.save();
      return contact;
    }

    // PRIORITY 4: Create new contact
    contact = await Contact.create({
      orgId,
      name: visitorInfo?.name || 'Anonymous Visitor',
      email: visitorInfo?.email || '',
      phone: visitorInfo?.phone || '',
      source: `session:${sessionId}`,
    });

    return contact;
  }

  /**
   * Find or create a conversation with 24hr timeout
   */
  async findOrCreateConversation(
    orgId: mongoose.Types.ObjectId,
    integrationId: mongoose.Types.ObjectId,
    contactId: mongoose.Types.ObjectId,
    sessionId: string
  ): Promise<IConversation> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Find open conversation for this contact with this session
    // AND last activity within 24 hours
    let conversation = await Conversation.findOne({
      orgId,
      integrationId,
      contactId,
      threadId: `session:${sessionId}`,
      status: { $in: ['open', 'pending'] },
      lastMessageAt: { $gte: twentyFourHoursAgo },
    });

    if (conversation) {
      return conversation;
    }

    // Close old conversations for this session (older than 24hrs)
    await Conversation.updateMany(
      {
        orgId,
        integrationId,
        contactId,
        threadId: `session:${sessionId}`,
        status: { $in: ['open', 'pending'] },
        lastMessageAt: { $lt: twentyFourHoursAgo },
      },
      {
        $set: {
          status: 'closed',
          closedAt: new Date(),
        },
      }
    );

    // Create new conversation
    conversation = await Conversation.create({
      orgId,
      integrationId,
      contactId,
      channel: 'webchat',
      threadId: `session:${sessionId}`,
      status: 'open',
      priority: 'normal',
      tags: ['widget'],
      lastMessageAt: new Date(),
    });

    return conversation;
  }

  /**
   * Save a visitor message
   */
  async saveVisitorMessage(data: SendWidgetMessageInput): Promise<{
    message: IMessage;
    conversation: IConversation;
    isNewConversation: boolean;
  }> {
    // 1. Verify integration exists
    const integration = await Integration.findOne({
      _id: new mongoose.Types.ObjectId(data.integrationId),
      orgId: new mongoose.Types.ObjectId(data.orgId),
      channel: 'webchat',
      status: 'active',
    });

    if (!integration) {
      throw new Error('Integration not found or inactive');
    }

    const orgId = integration.orgId;

    // 2. Find or create contact
    const contact = await this.findOrCreateContact(
      orgId,
      data.sessionId,
      data.visitorInfo
    );

    // 3. Find or create conversation
    const existingConversation = await Conversation.findOne({
      orgId,
      integrationId: integration._id,
      contactId: contact._id,
      status: { $in: ['open', 'pending'] },
    });

    const isNewConversation = !existingConversation;

    const conversation = existingConversation || await Conversation.create({
      orgId,
      integrationId: integration._id,
      contactId: contact._id,
      channel: 'webchat',
      threadId: `widget:${data.sessionId}`,
      status: 'open',
      priority: 'normal',
      tags: ['widget'],
      lastMessageAt: new Date(),
    });

    // 4. Save message
    const message = await Message.create({
      orgId,
      conversationId: conversation._id,
      contactId: contact._id,
      senderType: 'contact',
      direction: 'inbound',
      channel: 'webchat',
      body: {
        text: data.message.text,
      },
      status: 'sent',
      attachments: [],
      metadata: {
        sessionId: data.sessionId,
        visitorInfo: data.visitorInfo,
      },
    });

    // 5. Update conversation with last message
    conversation.lastMessageAt = new Date();
    conversation.lastMessagePreview = data.message.text.substring(0, 100);
    await conversation.save();

    return {
      message,
      conversation,
      isNewConversation,
    };
  }

  /**
   * Get conversation history (messages)
   */
  async getConversationHistory(
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
   * Save agent message
   */
  async saveAgentMessage(
    conversationId: string,
    agentId: string,
    messageText: string
  ): Promise<IMessage> {
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      throw new Error('Invalid conversation ID');
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const message = await Message.create({
      orgId: conversation.orgId,
      conversationId: conversation._id,
      contactId: conversation.contactId,
      senderType: 'agent',
      senderId: agentId,
      direction: 'outbound',
      channel: 'webchat',
      body: {
        text: messageText,
      },
      status: 'sent',
      attachments: [],
    });

    // Update conversation
    conversation.lastMessageAt = new Date();
    conversation.lastMessagePreview = messageText.substring(0, 100);
    await conversation.save();

    return message;
  }

  /**
   * Get conversation history by sessionId
   */
  async getConversationHistoryBySession(
    sessionId: string,
    integrationId: string
  ): Promise<any[]> {
    // Find conversation by threadId (format: "session:xxx")
    const conversation = await Conversation.findOne({
      integrationId: new mongoose.Types.ObjectId(integrationId),
      threadId: `widget:${sessionId}`,
      status: { $in: ['open', 'pending'] },
    });

    if (!conversation) {
      return [];
    }

    // Get messages for this conversation
    const messages = await Message.find({
      conversationId: conversation._id,
    })
      .sort({ createdAt: 1 })
      .limit(100)
      .lean();

    return messages;
  }
}

export const widgetService = new WidgetService();
