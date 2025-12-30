import { google } from "googleapis"
import { config } from "../../config/index"
import { logger } from "../../config/logger"
import { Integration } from "../models/integration-model"
import { Contact } from "../models/contact-model"
import { Conversation } from "../models/conversation-model"
import { Message, IAttachment } from "../models/message-model"
import { ProcessedGmailMessage } from "../models/processed-gmail-message-model"
import { parseGmailMessage } from "../../utils/gmail-parser"
import { getSocketIO } from "../../utils/socket-io"
import { s3Service } from "../../services/s3"

// Function to create OAuth2 client with dynamic redirect URI
const createOAuth2Client = (redirectUri: string) => {
  return new google.auth.OAuth2(
    config.google.clientId,
    config.google.clientSecret,
    redirectUri
  )
}

const oauth2Client = createOAuth2Client(`${config.google.redirectUri}`)

const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.modify",
]

// Helper to check if a MIME type is an image
const isImageMimeType = (mimeType: string): boolean => {
  return mimeType.startsWith("image/")
}

// Helper to download Gmail attachment and upload to S3
const processAttachment = async (
  gmail: any,
  gmailMessageId: string,
  attachment: any,
  orgId: string
): Promise<IAttachment> => {
  const { filename, mimeType, size, attachmentId } = attachment

  // Default attachment object (without S3 upload)
  const baseAttachment: IAttachment = {
    name: filename,
    type: mimeType,
    size: size,
    attachmentId: attachmentId,
    isImage: isImageMimeType(mimeType),
    isDownloaded: false,
  }

  // Skip if no attachmentId (inline content without ID)
  if (!attachmentId) {
    logger.info({ filename, mimeType }, "Skipping attachment without ID")
    return baseAttachment
  }

  try {
    // Download attachment from Gmail
    const attachmentResponse = await gmail.users.messages.attachments.get({
      userId: "me",
      messageId: gmailMessageId,
      id: attachmentId,
    })

    const attachmentData = attachmentResponse.data.data
    if (!attachmentData) {
      logger.warn({ attachmentId, filename }, "Empty attachment data from Gmail")
      return baseAttachment
    }

    // Decode base64url to buffer
    const fileBuffer = Buffer.from(
      attachmentData.replace(/-/g, "+").replace(/_/g, "/"),
      "base64"
    )

    // Upload to S3 with orgId prefix
    const uploadResult = await s3Service.uploadFile({
      orgId: orgId,
      fileName: filename || `attachment-${attachmentId}`,
      fileBuffer,
      mimeType: mimeType || "application/octet-stream",
      folder: "attachments/gmail",
      metadata: {
        gmailMessageId,
        gmailAttachmentId: attachmentId,
      },
    })

    logger.info(
      {
        filename,
        s3Key: uploadResult.key,
        size: uploadResult.size,
        orgId,
      },
      "Attachment uploaded to S3 successfully"
    )

    return {
      name: filename,
      type: mimeType,
      size: uploadResult.size,
      attachmentId: attachmentId,
      url: uploadResult.url,
      s3Key: uploadResult.key,
      isImage: isImageMimeType(mimeType),
      isDownloaded: true,
    }
  } catch (error) {
    logger.error(
      { error, attachmentId, filename, gmailMessageId },
      "Failed to process attachment, storing metadata only"
    )
    return baseAttachment
  }
}

// Helper to check idempotency - returns true if message was already processed
const isMessageAlreadyProcessed = async (
  gmailMessageId: string,
  emailAddress: string
): Promise<boolean> => {
  try {
    const existing = await ProcessedGmailMessage.findOne({
      gmailMessageId,
      emailAddress,
    })
    return !!existing
  } catch (error) {
    logger.error(
      { error, gmailMessageId, emailAddress },
      "Error checking message idempotency"
    )
    return false
  }
}

// Helper to mark message as processed (idempotency)
const markMessageAsProcessed = async (
  gmailMessageId: string,
  emailAddress: string,
  orgId: string,
  conversationId?: string,
  messageId?: string
): Promise<void> => {
  try {
    await ProcessedGmailMessage.create({
      gmailMessageId,
      emailAddress,
      orgId,
      conversationId,
      messageId,
      processedAt: new Date(),
    })
    logger.debug(
      { gmailMessageId, emailAddress },
      "Message marked as processed (idempotency)"
    )
  } catch (error: any) {
    // Ignore duplicate key errors (message already marked as processed)
    if (error.code === 11000) {
      logger.debug(
        { gmailMessageId, emailAddress },
        "Message already marked as processed (duplicate key)"
      )
      return
    }
    logger.error(
      { error, gmailMessageId, emailAddress },
      "Error marking message as processed"
    )
  }
}

export const integrationGmailService = {
  /**
   * Generate Gmail OAuth authorization URL
   */
  generateAuthUrl: (orgId: string, userId: string) => {
    try {
      const state = Buffer.from(
        JSON.stringify({ orgId, userId, timestamp: Date.now() })
      ).toString("base64")

      const redirectUri = `${config.google.redirectUri}`
      const client = createOAuth2Client(redirectUri)
      logger.info({ redirectUri }, "Creating OAuth2 client with redirect URI")

      const authUrl = client.generateAuthUrl({
        access_type: "offline",
        scope: GMAIL_SCOPES,
        state,
        prompt: "consent",
        redirect_uri: redirectUri, // Explicitly set redirect_uri
      })

      logger.info({ orgId, userId, redirectUri }, "Generated Gmail OAuth URL")
      return { authUrl, state }
    } catch (error) {
      logger.error(
        { error, orgId, userId },
        "Failed to generate Gmail OAuth URL"
      )
      throw error
    }
  },

  /**
   * Handle OAuth callback and create/update integration
   */
  handleOAuthCallback: async (
    code: string,
    state: string,
    orgId: string,
    userId: string
  ) => {
    try {
      // Validate state parameter
      let stateData
      try {
        stateData = JSON.parse(Buffer.from(state, "base64").toString())
      } catch (err) {
        throw new Error("Invalid state parameter")
      }

      if (stateData.orgId !== orgId) {
        throw new Error("State validation failed: orgId mismatch")
      }

      // Exchange authorization code for tokens with correct redirect_uri
      const redirectUri = `${config.google.redirectUri}`
      const client = createOAuth2Client(redirectUri)
      const { tokens } = await client.getToken({
        code,
        redirect_uri: redirectUri,
      })
      client.setCredentials(tokens)

      // Get user's Gmail profile
      const gmail = google.gmail({ version: "v1", auth: client })
      const profile = await gmail.users.getProfile({ userId: "me" })

      const email = profile.data.emailAddress

      if (!email) {
        throw new Error("Failed to retrieve Gmail email address")
      }

      // Check if integration already exists
      let integration = await Integration.findOne({
        orgId,
        channel: "gmail",
        channelEmail: email,
      })

      if (integration) {
        // Update existing integration
        integration.credentials = {
          accessToken: tokens.access_token || undefined,
          refreshToken: tokens.refresh_token || undefined,
          expiryDate: tokens.expiry_date
            ? new Date(tokens.expiry_date)
            : undefined,
          email,
        }
        integration.status = "connected"
        integration.markModified("credentials")
        await integration.save()
        logger.info(
          { integrationId: integration._id, email },
          "Updated Gmail integration"
        )
      } else {
        // Create new integration
        integration = await Integration.create({
          orgId,
          channel: "gmail",
          provider: "google",
          name: `Gmail - ${email}`,
          status: "connected",
          channelEmail: email,
          credentials: {
            accessToken: tokens.access_token || undefined,
            refreshToken: tokens.refresh_token || undefined,
            expiryDate: tokens.expiry_date
              ? new Date(tokens.expiry_date)
              : undefined,
            email,
          },
        })
        logger.info(
          { integrationId: integration._id, email },
          "Created Gmail integration"
        )
      }

      return integration
    } catch (error) {
      logger.error(
        { error, code, state },
        "Failed to handle Gmail OAuth callback"
      )
      throw error
    }
  },

  /**
   * Verify Gmail integration by making a test API call
   */
  verifyIntegration: async (integrationId: string) => {
    try {
      const integration = await Integration.findById(integrationId)
      if (!integration || integration.channel !== "gmail") {
        throw new Error("Gmail integration not found")
      }

      const credentials = integration.credentials
      if (!credentials?.accessToken) {
        throw new Error("No access token found")
      }

      oauth2Client.setCredentials({
        access_token: credentials.accessToken,
        refresh_token: credentials.refreshToken,
        expiry_date: credentials.expiryDate
          ? new Date(credentials.expiryDate).getTime()
          : undefined,
      })

      // Test Gmail API with a simple call
      const gmail = google.gmail({ version: "v1", auth: oauth2Client })
      const profile = await gmail.users.getProfile({ userId: "me" })

      logger.info(
        { integrationId, email: profile.data.emailAddress },
        "Gmail integration verified successfully"
      )

      return {
        success: true,
        email: profile.data.emailAddress,
        messagesTotal: profile.data.messagesTotal,
        threadsTotal: profile.data.threadsTotal,
      }
    } catch (error) {
      logger.error(
        { error, integrationId },
        "Failed to verify Gmail integration"
      )
      throw error
    }
  },

  /**
   * Disconnect Gmail integration
   */
  deleteIntegration: async (integrationId: string) => {
    try {
      const integration = await Integration.findById(integrationId)
      if (!integration || integration.channel !== "gmail") {
        throw new Error("Gmail integration not found")
      }

      integration.status = "disconnected"
      await integration.save()

      logger.info({ integrationId }, "Gmail integration disconnected")
      return integration
    } catch (error) {
      logger.error(
        { error, integrationId },
        "Failed to disconnect Gmail integration"
      )
      throw error
    }
  },

  /**
   * Start Gmail Push Notifications (Pub/Sub watch)
   */
  startWatch: async (integrationId: string) => {
    try {
      const integration = await Integration.findById(integrationId)
      if (!integration || integration.channel !== "gmail") {
        throw new Error("Gmail integration not found")
      }

      const credentials = integration.credentials
      if (!credentials?.accessToken) {
        throw new Error("No access token found")
      }

      // Setup OAuth client with credentials
      oauth2Client.setCredentials({
        access_token: credentials.accessToken,
        refresh_token: credentials.refreshToken,
        expiry_date: credentials.expiryDate
          ? new Date(credentials.expiryDate).getTime()
          : undefined,
      })

      // Start watching Gmail inbox
      const gmail = google.gmail({ version: "v1", auth: oauth2Client })
      const watchResponse = await gmail.users.watch({
        userId: "me",
        requestBody: {
          topicName: config.google.gmailPubsubTopic,
          labelIds: ["INBOX"], // Watch only inbox
        },
      })

      // Store watch details in integration
      if (integration.credentials) {
        integration.credentials.historyId = watchResponse.data.historyId
        integration.credentials.watchExpiration = watchResponse.data.expiration
          ? new Date(parseInt(watchResponse.data.expiration))
          : undefined

        integration.markModified("credentials")
      }

      await integration.save()

      logger.info(
        { integrationId, historyId: watchResponse.data.historyId },
        "Gmail watch started successfully"
      )

      return {
        success: true,
        historyId: watchResponse.data.historyId,
        expiration: watchResponse.data.expiration,
      }
    } catch (error) {
      logger.error({ error, integrationId }, "Failed to start Gmail watch")
      throw error
    }
  },

  /**
   * Stop Gmail Push Notifications
   */
  stopWatch: async (integrationId: string) => {
    try {
      const integration = await Integration.findById(integrationId)
      if (!integration || integration.channel !== "gmail") {
        throw new Error("Gmail integration not found")
      }

      const credentials = integration.credentials
      if (!credentials?.accessToken) {
        throw new Error("No access token found")
      }

      // Setup OAuth client
      oauth2Client.setCredentials({
        access_token: credentials.accessToken,
        refresh_token: credentials.refreshToken,
        expiry_date: credentials.expiryDate
          ? new Date(credentials.expiryDate).getTime()
          : undefined,
      })

      // Stop watching
      const gmail = google.gmail({ version: "v1", auth: oauth2Client })
      await gmail.users.stop({ userId: "me" })

      // Clear watch details
      if (integration.credentials) {
        integration.credentials.historyId = undefined
        integration.credentials.watchExpiration = undefined
        integration.markModified("credentials")
      }
      await integration.save()

      logger.info({ integrationId }, "Gmail watch stopped successfully")
      return { success: true }
    } catch (error) {
      logger.error({ error, integrationId }, "Failed to stop Gmail watch")
      throw error
    }
  },

  /**
   * Helper function to process a single Gmail message
   * Handles idempotency, contact/conversation creation, attachments, and notifications
   */
  processGmailMessageHelper: async (
    gmail: any,
    gmailMessageId: string,
    emailAddress: string,
    integration: any,
    source: "history" | "fallback"
  ) => {
    try {
      // ========== IDEMPOTENCY CHECK ==========
      const alreadyProcessed = await isMessageAlreadyProcessed(
        gmailMessageId,
        emailAddress
      )
      
      if (alreadyProcessed) {
        logger.info(
          { gmailMessageId, emailAddress, source },
          "Message already processed, skipping (idempotency)"
        )
        return null
      }

      // Fetch full message details with error handling
      let gmailMessage
      try {
        const messageResponse = await gmail.users.messages.get({
          userId: "me",
          id: gmailMessageId,
          format: "full",
        })
        gmailMessage = messageResponse.data
      } catch (fetchError: any) {
        // Handle specific errors
        if (fetchError?.code === 404 || fetchError?.status === 404) {
          logger.warn(
            { gmailMessageId, emailAddress },
            "Message not found (404), may have been deleted"
          )
          // Mark as processed to avoid retrying
          await markMessageAsProcessed(
            gmailMessageId,
            emailAddress,
            integration.orgId.toString()
          )
          return null
        }
        
        if (fetchError?.code === 401 || fetchError?.status === 401) {
          logger.error(
            { gmailMessageId, emailAddress },
            "Unauthorized (401) - Token may have expired"
          )
          throw new Error("Gmail API authentication failed - token may be expired")
        }
        
        // Re-throw other errors
        throw fetchError
      }

      const parsed = parseGmailMessage(gmailMessage)

      logger.info(
        {
          gmailMessageId,
          from: parsed.from,
          subject: parsed.subject,
          threadId: parsed.threadId,
          attachmentCount: parsed.attachments?.length || 0,
          source,
        },
        "Processing Gmail message"
      )

      // Skip if this is an outbound email (from our integration email)
      if (parsed.from?.toLowerCase().includes(emailAddress.toLowerCase())) {
        logger.info(
          { gmailMessageId, from: parsed.from },
          "Skipping outbound email"
        )
        // Mark as processed even for outbound to prevent reprocessing
        await markMessageAsProcessed(
          gmailMessageId,
          emailAddress,
          integration.orgId.toString()
        )
        return null
      }

      // Extract sender email from "Name <email@example.com>" format
      const fromMatch = parsed.from.match(/<(.+?)>/)
      const senderEmail = fromMatch
        ? fromMatch[1]?.trim() || parsed.from.trim()
        : parsed.from.trim()

      // Extract sender name
      const nameMatch = parsed.from.match(/^(.+?)\s*</)
      const senderName = nameMatch
        ? nameMatch[1]?.trim() || senderEmail
        : senderEmail

      // ========== CONTACT LOGIC ==========
      const contact = await Contact.findOneAndUpdate(
        {
          orgId: integration.orgId,
          email: senderEmail,
        },
        {
          $setOnInsert: {
            orgId: integration.orgId,
            email: senderEmail,
            name: senderName,
            source: "gmail",
          },
        },
        {
          upsert: true,
          new: true,
        }
      )

      logger.info(
        { contactId: contact._id, email: senderEmail, source },
        "Contact found or created"
      )

      // ========== CONVERSATION LOGIC ==========
      let conversation = await Conversation.findOne({
        orgId: integration.orgId,
        integrationId: integration._id,
        channel: "gmail",
        threadId: parsed.threadId,
      })

      let isNewConversation = false

      if (!conversation) {
        conversation = await Conversation.create({
          orgId: integration.orgId,
          integrationId: integration._id,
          contactId: contact._id,
          channel: "gmail",
          threadId: parsed.threadId,
          status: "open",
          priority: "normal",
          lastMessageAt: new Date(),
          lastMessagePreview:
            parsed.snippet || parsed.text?.substring(0, 100),
          sourceMetadata: {
            subject: parsed.subject,
            from: parsed.from,
            to: parsed.to,
          },
        })
        isNewConversation = true
        logger.info(
          {
            conversationId: conversation._id,
            threadId: parsed.threadId,
            source,
          },
          "New conversation created"
        )
      } else {
        if (conversation.status === "closed") {
          conversation.status = "open"
          logger.info(
            { conversationId: conversation._id, source },
            "Reopened closed conversation"
          )
        }
        conversation.lastMessageAt = new Date()
        conversation.lastMessagePreview =
          parsed.snippet || parsed.text?.substring(0, 100)
        await conversation.save()
        logger.info(
          {
            conversationId: conversation._id,
            threadId: parsed.threadId,
            source,
          },
          "Existing conversation updated"
        )
      }

      // ========== PROCESS ATTACHMENTS ==========
      const processedAttachments: IAttachment[] = []
      
      if (parsed.attachments && parsed.attachments.length > 0) {
        logger.info(
          {
            gmailMessageId,
            attachmentCount: parsed.attachments.length,
            orgId: integration.orgId.toString(),
          },
          "Processing attachments"
        )

        for (const att of parsed.attachments) {
          const processedAtt = await processAttachment(
            gmail,
            gmailMessageId,
            att,
            integration.orgId.toString()
          )
          processedAttachments.push(processedAtt)
        }

        logger.info(
          {
            gmailMessageId,
            processedCount: processedAttachments.length,
            downloadedCount: processedAttachments.filter((a) => a.isDownloaded).length,
          },
          "Attachments processed"
        )
      }

      // ========== MESSAGE LOGIC ==========
      const message = await Message.create({
        orgId: integration.orgId,
        conversationId: conversation._id,
        contactId: contact._id,
        senderType: "contact",
        senderId: contact._id,
        direction: "inbound",
        channel: "gmail",
        body: {
          text: parsed.text,
          html: parsed.html,
        },
        attachments: processedAttachments,
        status: "delivered",
        deliveredAt: new Date(),
        metadata: {
          gmailMessageId: parsed.id,
          gmailThreadId: parsed.threadId,
          subject: parsed.subject,
          from: parsed.from,
          to: parsed.to,
          date: parsed.date,
          messageIdHeader: parsed.messageIdHeader,
        },
      })

      logger.info(
        {
          messageId: message._id,
          gmailMessageId: parsed.id,
          attachmentCount: processedAttachments.length,
          source,
        },
        "Message created"
      )

      // ========== MARK AS PROCESSED (IDEMPOTENCY) ==========
      await markMessageAsProcessed(
        gmailMessageId,
        emailAddress,
        integration.orgId.toString(),
        conversation._id.toString(),
        message._id.toString()
      )

      // ========== SOCKET.IO NOTIFICATION ==========
      try {
        const io = getSocketIO()
        const agentRoom = `org:${integration.orgId}:agents`

        io.to(agentRoom).emit("gmail:new-message", {
          conversation: {
            _id: conversation._id,
            contactId: contact._id,
            threadId: parsed.threadId,
            subject: parsed.subject,
            status: conversation.status,
            isNew: isNewConversation,
          },
          contact: {
            _id: contact._id,
            name: contact.name,
            email: contact.email,
          },
          message: {
            _id: message._id,
            body: message.body,
            attachments: processedAttachments.map((att) => ({
              name: att.name,
              type: att.type,
              size: att.size,
              url: att.url,
              isImage: att.isImage,
            })),
            snippet: parsed.snippet,
            createdAt: (message as any).createdAt,
          },
          integration: {
            _id: integration._id,
            name: integration.name,
          },
        })

        logger.info(
          { agentRoom, conversationId: conversation._id, source },
          "Socket.IO notification sent"
        )
      } catch (socketError) {
        logger.error(
          { error: socketError, source },
          "Failed to send Socket.IO notification"
        )
      }

      return { message, conversation, contact }
    } catch (error) {
      logger.error(
        { error, gmailMessageId, emailAddress, source },
        "Error processing Gmail message"
      )
      throw error
    }
  },

  /**
   * Process Gmail Push Notification from Pub/Sub
   * Handles Contact and Conversation duplicate logic
   * Implements idempotency to prevent duplicate message processing
   * Downloads and stores attachments in S3
   */
  processGmailPushNotification: async (
    emailAddress: string,
    historyId: string
  ) => {
    try {
      // Find integration by email
      const integration = await Integration.findOne({
        channel: "gmail",
        channelEmail: emailAddress,
        status: "connected",
      })

      if (!integration) {
        logger.warn(
          { emailAddress },
          "No active Gmail integration found for email"
        )
        return
      }

      const credentials = integration.credentials
      if (!credentials?.accessToken) {
        logger.warn({ emailAddress }, "Missing access token")
        return
      }

      // Use historyId from notification if we don't have one stored yet
      const startHistoryId = credentials.historyId || historyId

      logger.info(
        {
          emailAddress,
          storedHistoryId: credentials.historyId,
          notificationHistoryId: historyId,
          usingHistoryId: startHistoryId,
        },
        "Processing Gmail notification with historyId"
      )

      // Setup OAuth client with token refresh capability
      const client = createOAuth2Client(config.google.redirectUri)
      client.setCredentials({
        access_token: credentials.accessToken,
        refresh_token: credentials.refreshToken,
        expiry_date: credentials.expiryDate
          ? new Date(credentials.expiryDate).getTime()
          : undefined,
      })

      // Set up automatic token refresh
      client.on("tokens", async (tokens) => {
        logger.info(
          { emailAddress, hasRefreshToken: !!tokens.refresh_token },
          "OAuth tokens refreshed automatically"
        )
        
        // Update stored tokens
        if (integration.credentials) {
          if (tokens.access_token) {
            integration.credentials.accessToken = tokens.access_token
          }
          if (tokens.refresh_token) {
            integration.credentials.refreshToken = tokens.refresh_token
          }
          if (tokens.expiry_date) {
            integration.credentials.expiryDate = new Date(tokens.expiry_date)
          }
          integration.markModified("credentials")
          
          try {
            await integration.save()
            logger.info({ emailAddress }, "Updated integration with refreshed tokens")
          } catch (saveError) {
            logger.error(
              { error: saveError, emailAddress },
              "Failed to save refreshed tokens"
            )
          }
        }
      })

      const gmail = google.gmail({ version: "v1", auth: client })

      // Fetch history changes since last historyId
      let historyResponse
      try {
        historyResponse = await gmail.users.history.list({
          userId: "me",
          startHistoryId: startHistoryId,
          historyTypes: ["messageAdded"],
        })

        logger.info(
          {
            emailAddress,
            startHistoryId,
            responseHistoryId: historyResponse.data.historyId,
            historyCount: historyResponse.data.history?.length || 0,
          },
          "Gmail history API response"
        )
      } catch (historyError: any) {
        // If historyId is too old or invalid, get current profile to update historyId
        if (
          historyError?.code === 404 ||
          historyError?.message?.includes("historyId")
        ) {
          logger.warn(
            {
              emailAddress,
              historyId: startHistoryId,
              error: historyError.message,
            },
            "Invalid historyId, fetching current profile to reset"
          )

          const profile = await gmail.users.getProfile({ userId: "me" })
          if (integration.credentials && profile.data.historyId) {
            integration.credentials.historyId = profile.data.historyId
            integration.markModified("credentials")
            await integration.save()
            logger.info(
              { emailAddress, newHistoryId: profile.data.historyId },
              "Reset historyId from profile"
            )
          }
          return
        }
        throw historyError
      }

      const history = historyResponse.data.history || []
      const newHistoryId = historyResponse.data.historyId

      if (history.length === 0) {
        logger.info(
          {
            emailAddress,
            newHistoryId,
            startHistoryId,
            message:
              "This usually means: 1) Email already processed, 2) Email not in INBOX, 3) Outbound email, or 4) historyId already current",
          },
          "No new messages in history"
        )

        // Try fetching recent messages directly as fallback
        logger.info(
          { emailAddress },
          "Attempting to fetch recent messages directly"
        )
        const messagesResponse = await gmail.users.messages.list({
          userId: "me",
          labelIds: ["INBOX", "UNREAD"],
          maxResults: 5,
        })

        const recentMessages = messagesResponse.data.messages || []
        logger.info(
          {
            emailAddress,
            recentMessageCount: recentMessages.length,
          },
          "Recent messages fetched"
        )

        if (recentMessages.length > 0) {
          // Create a fake history structure for processing
          const fakeHistory = recentMessages.map((msg) => ({
            messagesAdded: [{ message: { id: msg.id } }],
          }))

          // Process messages using the helper function
          for (const record of fakeHistory) {
            const messagesAdded = record.messagesAdded || []
            for (const added of messagesAdded) {
              const messageId = added.message?.id
              if (!messageId) continue

              await integrationGmailService.processGmailMessageHelper(
                gmail,
                messageId,
                emailAddress,
                integration,
                "fallback"
              )
            }
          }
        }

        // Update historyId even when there are no messages
        if (integration.credentials && newHistoryId) {
          integration.credentials.historyId = newHistoryId
          integration.markModified("credentials")
          await integration.save()
        }
        return
      }

      logger.info(
        { emailAddress, historyCount: history.length },
        "Processing Gmail history"
      )

      // Process each history record
      for (const record of history) {
        const messagesAdded = record.messagesAdded || []

        for (const added of messagesAdded) {
          const messageId = added.message?.id
          if (!messageId) continue

          await integrationGmailService.processGmailMessageHelper(
            gmail,
            messageId,
            emailAddress,
            integration,
            "history"
          )
        }
      }

      // Update integration with latest historyId
      if (integration.credentials) {
        integration.credentials.historyId = historyResponse.data.historyId
        integration.markModified("credentials")
      }
      await integration.save()

      logger.info(
        { emailAddress, newHistoryId: historyResponse.data.historyId },
        "Gmail push notification processed successfully"
      )
    } catch (error) {
      logger.error(
        { error, emailAddress, historyId },
        "Failed to process Gmail push notification"
      )
      throw error
    }
  },

  /**
   * Send an email via Gmail API
   * Supports replies (threading) by providing threadId, inReplyTo, and references
   * Creates a message record in the database after successful send
   */
  sendGmailMessage: async (options: {
    integrationId: string
    to: string
    subject: string
    body: string
    htmlBody?: string
    threadId?: string
    inReplyTo?: string
    references?: string
    cc?: string
    bcc?: string
  }) => {
    try {
      const {
        integrationId,
        to,
        subject,
        body,
        htmlBody,
        threadId,
        inReplyTo,
        references,
        cc,
        bcc,
      } = options

      const integration = await Integration.findById(integrationId)
      if (!integration || integration.channel !== "gmail") {
        throw new Error("Gmail integration not found")
      }

      if (integration.status !== "connected") {
        throw new Error("Gmail integration is not connected")
      }

      const credentials = integration.credentials
      if (!credentials?.accessToken) {
        throw new Error("No access token found")
      }

      // Setup OAuth client
      oauth2Client.setCredentials({
        access_token: credentials.accessToken,
        refresh_token: credentials.refreshToken,
        expiry_date: credentials.expiryDate
          ? new Date(credentials.expiryDate).getTime()
          : undefined,
      })

      const gmail = google.gmail({ version: "v1", auth: oauth2Client })

      // Get sender email from integration
      const fromEmail = credentials.email || integration.channelEmail
      if (!fromEmail) {
        throw new Error("Sender email not found in integration")
      }

      // Build RFC 2822 compliant email
      const boundary = `boundary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const emailLines: string[] = []
      
      // Headers
      emailLines.push(`From: ${fromEmail}`)
      emailLines.push(`To: ${to}`)
      if (cc) emailLines.push(`Cc: ${cc}`)
      if (bcc) emailLines.push(`Bcc: ${bcc}`)
      emailLines.push(`Subject: ${subject}`)
      emailLines.push(`MIME-Version: 1.0`)
      
      // Threading headers for replies
      if (inReplyTo) {
        emailLines.push(`In-Reply-To: ${inReplyTo}`)
      }
      if (references) {
        emailLines.push(`References: ${references}`)
      }
      
      // Content-Type for multipart (text + html)
      if (htmlBody) {
        emailLines.push(`Content-Type: multipart/alternative; boundary="${boundary}"`)
        emailLines.push("")
        emailLines.push(`--${boundary}`)
        emailLines.push(`Content-Type: text/plain; charset="UTF-8"`)
        emailLines.push("")
        emailLines.push(body)
        emailLines.push(`--${boundary}`)
        emailLines.push(`Content-Type: text/html; charset="UTF-8"`)
        emailLines.push("")
        emailLines.push(htmlBody)
        emailLines.push(`--${boundary}--`)
      } else {
        emailLines.push(`Content-Type: text/plain; charset="UTF-8"`)
        emailLines.push("")
        emailLines.push(body)
      }

      const rawEmail = emailLines.join("\r\n")
      
      // Base64url encode the email
      const encodedEmail = Buffer.from(rawEmail)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "")

      // Send the email
      const sendRequest: any = {
        userId: "me",
        requestBody: {
          raw: encodedEmail,
        },
      }

      // Include threadId for replies to keep in same thread
      if (threadId) {
        sendRequest.requestBody.threadId = threadId
      }

      const response = await gmail.users.messages.send(sendRequest)

      logger.info(
        {
          integrationId,
          to,
          subject,
          threadId,
          messageId: response.data.id,
          gmailThreadId: response.data.threadId,
        },
        "Gmail message sent successfully"
      )

      // ========== SAVE SENT MESSAGE TO DATABASE ==========
      try {
        // Find the conversation by threadId
        let conversation = await Conversation.findOne({
          orgId: integration.orgId,
          integrationId: integration._id,
          channel: "gmail",
          threadId: response.data.threadId || threadId,
        })

        if (conversation) {
          // Update conversation last message timestamp
          conversation.lastMessageAt = new Date()
          conversation.lastMessagePreview = body.substring(0, 100)
          await conversation.save()

          // Create outbound message record
          const message = await Message.create({
            orgId: integration.orgId,
            conversationId: conversation._id,
            contactId: conversation.contactId,
            senderType: "agent",
            senderId: integration.orgId, // TODO: Get actual agent/member ID from request context
            direction: "outbound",
            channel: "gmail",
            body: {
              text: body,
              html: htmlBody,
            },
            attachments: [], // TODO: Handle attachments in send
            status: "sent",
            deliveredAt: new Date(),
            metadata: {
              gmailMessageId: response.data.id,
              gmailThreadId: response.data.threadId || threadId,
              subject: subject,
              to: to,
              cc: cc,
              bcc: bcc,
            },
          })

          logger.info(
            {
              messageId: message._id,
              conversationId: conversation._id,
              gmailMessageId: response.data.id,
            },
            "Sent message saved to database"
          )

          // ========== SOCKET.IO NOTIFICATION ==========
          try {
            const io = getSocketIO()
            const agentRoom = `org:${integration.orgId}:agents`

            io.to(agentRoom).emit("gmail:message-sent", {
              conversation: {
                _id: conversation._id,
                threadId: response.data.threadId || threadId,
                subject: subject,
              },
              message: {
                _id: message._id,
                body: message.body,
                createdAt: (message as any).createdAt,
              },
            })

            logger.info(
              { agentRoom, conversationId: conversation._id },
              "Socket.IO notification sent for outbound message"
            )
          } catch (socketError) {
            logger.error(
              { error: socketError },
              "Failed to send Socket.IO notification for sent message"
            )
          }
        } else {
          logger.warn(
            {
              threadId: response.data.threadId || threadId,
              orgId: integration.orgId,
            },
            "Conversation not found for sent message"
          )
        }
      } catch (dbError) {
        logger.error(
          { error: dbError, messageId: response.data.id },
          "Failed to save sent message to database (email was sent successfully)"
        )
      }

      return {
        success: true,
        messageId: response.data.id,
        threadId: response.data.threadId,
        labelIds: response.data.labelIds,
      }
    } catch (error: any) {
      logger.error({ error, options }, "Failed to send Gmail message")
      throw error
    }
  },
}
