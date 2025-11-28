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
  async verifyIntegration(websiteId: string, tenantId: string): Promise<boolean> {
    const integration = await Integration.findOne({
      'credentials.websiteId': websiteId,
      'credentials.tenantId': tenantId,
      channel: 'webchat',
      status: 'active',
    });

    return !!integration;
  }

  /**
   * Get widget configuration for a tenant
   */
  async getWidgetConfig(tenantId: string) {
    const integration = await Integration.findOne({
      'credentials.tenantId': tenantId,
      channel: 'webchat',
      status: 'active',
    }).populate('orgId');

    if (!integration) {
      throw new Error('Integration not found or inactive');
    }

    return {
      tenantId: integration.credentials?.tenantId,
      websiteId: integration.credentials?.websiteId,
      organizationName: (integration.orgId as any)?.name || 'Support Team',
      theme: {
        primaryColor: '#3B82F6',
        position: 'bottom-right',
      },
    };
  }

  /**
   * Find or create a contact from visitor information
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
    // Try to find existing contact by session ID (stored in source field)
    let contact = await Contact.findOne({
      orgId,
      source: `widget:${sessionId}`,
    });

    if (contact) {
      // Update contact info if new data provided
      if (visitorInfo?.name && !contact.name) {
        contact.name = visitorInfo.name;
      }
      if (visitorInfo?.email && !contact.email) {
        contact.email = visitorInfo.email;
      }
      if (visitorInfo?.phone && !contact.phone) {
        contact.phone = visitorInfo.phone;
      }
      await contact.save();
      return contact;
    }

    // Create new contact
    contact = await Contact.create({
      orgId,
      name: visitorInfo?.name || 'Anonymous Visitor',
      email: visitorInfo?.email || '',
      phone: visitorInfo?.phone || '',
      source: `widget:${sessionId}`,
    });

    return contact;
  }

  /**
   * Find or create a conversation
   */
  async findOrCreateConversation(
    orgId: mongoose.Types.ObjectId,
    integrationId: mongoose.Types.ObjectId,
    contactId: mongoose.Types.ObjectId,
    sessionId: string
  ): Promise<IConversation> {
    // Try to find an open conversation for this contact
    let conversation = await Conversation.findOne({
      orgId,
      integrationId,
      contactId,
      status: { $in: ['open', 'pending'] },
    });

    if (conversation) {
      return conversation;
    }

    // Create new conversation
    conversation = await Conversation.create({
      orgId,
      integrationId,
      contactId,
      channel: 'webchat',
      threadId: `widget:${sessionId}`,
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
      'credentials.websiteId': data.websiteId,
      'credentials.tenantId': data.tenantId,
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
   * Get integration by tenant ID
   */
  async getIntegrationByTenantId(tenantId: string) {
    const integration = await Integration.findOne({
      'credentials.tenantId': tenantId,
      channel: 'webchat',
      status: 'active',
    });

    return integration;
  }
}

export const widgetService = new WidgetService();
