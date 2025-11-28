import { google } from "googleapis"
import { config } from "../../config/index"
import { logger } from "../../config/logger"
import { Integration } from "../models/integration-model"
import { Contact } from "../models/contact-model"
import { Conversation } from "../models/conversation-model"
import { Message } from "../models/message-model"
import { parseGmailMessage } from "../../utils/gmail-parser"
import { getSocketIO } from "../../utils/socket-io"

// Function to create OAuth2 client with dynamic redirect URI
const createOAuth2Client = (redirectUri?: string) => {
  return new google.auth.OAuth2(
    config.google.clientId,
    config.google.clientSecret,
    redirectUri || `${config.client.url}/oauth/callback`
  )
}

const oauth2Client = createOAuth2Client()

const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.modify",
]

export const integrationGmailService = {
  /**
   * Generate Gmail OAuth authorization URL
   */
  generateAuthUrl: (orgId: string, userId: string) => {
    try {
      const state = Buffer.from(
        JSON.stringify({ orgId, userId, timestamp: Date.now() })
      ).toString("base64")

      const redirectUri = `${config.google.redirectUri}`;
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
      const redirectUri = `${config.client.url}/oauth2/callback`
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
          topicName: config.google.gmailPubsubTopic, // e.g., "projects/PROJECT_ID/topics/gmail-notifications"
          labelIds: ["INBOX"], // Watch only inbox
        },
      })

      // Store watch details in integration
      if (integration.credentials) {
        integration.credentials.historyId = watchResponse.data.historyId
        integration.credentials.watchExpiration = watchResponse.data.expiration
          ? new Date(parseInt(watchResponse.data.expiration))
          : undefined
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
   * Process Gmail Push Notification from Pub/Sub
   * Handles Contact and Conversation duplicate logic
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
        { emailAddress, storedHistoryId: credentials.historyId, notificationHistoryId: historyId, usingHistoryId: startHistoryId },
        "Processing Gmail notification with historyId"
      )

      // Setup OAuth client
      oauth2Client.setCredentials({
        access_token: credentials.accessToken,
        refresh_token: credentials.refreshToken,
        expiry_date: credentials.expiryDate
          ? new Date(credentials.expiryDate).getTime()
          : undefined,
      })

      const gmail = google.gmail({ version: "v1", auth: oauth2Client })

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
            rawHistory: historyResponse.data.history 
          },
          "Gmail history API response"
        )
      } catch (historyError: any) {
        // If historyId is too old or invalid, get current profile to update historyId
        if (historyError?.code === 404 || historyError?.message?.includes("historyId")) {
          logger.warn(
            { emailAddress, historyId: startHistoryId, error: historyError.message },
            "Invalid historyId, fetching current profile to reset"
          )
          
          const profile = await gmail.users.getProfile({ userId: "me" })
          if (integration.credentials && profile.data.historyId) {
            integration.credentials.historyId = profile.data.historyId
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
            message: "This usually means: 1) Email already processed, 2) Email not in INBOX, 3) Outbound email, or 4) historyId already current"
          },
          "No new messages in history"
        )
        
        // Try fetching recent messages directly as fallback
        logger.info({ emailAddress }, "Attempting to fetch recent messages directly")
        const messagesResponse = await gmail.users.messages.list({
          userId: "me",
          labelIds: ["INBOX", "UNREAD"],
          maxResults: 5,
        })
        
        const recentMessages = messagesResponse.data.messages || []
        logger.info(
          { emailAddress, recentMessageCount: recentMessages.length, messages: recentMessages },
          "Recent messages fetched"
        )
        
        if (recentMessages.length > 0) {
          logger.info(
            { emailAddress, messageCount: recentMessages.length },
            "Found recent messages, will process them"
          )
          // Continue to process these messages
          // Create a fake history structure
          const fakeHistory = recentMessages.map(msg => ({
            messagesAdded: [{ message: { id: msg.id } }]
          }))
          
          // Process messages (code will continue below)
          for (const record of fakeHistory) {
            const messagesAdded = record.messagesAdded || []
            for (const added of messagesAdded) {
              const messageId = added.message?.id
              if (!messageId) continue
              
              // Fetch full message details
              const messageResponse = await gmail.users.messages.get({
                userId: "me",
                id: messageId,
                format: "full",
              })

              const gmailMessage = messageResponse.data
              const parsed = parseGmailMessage(gmailMessage)
              
              logger.info(
                { messageId, from: parsed.from, subject: parsed.subject, threadId: parsed.threadId },
                "Processing fallback message"
              )

              // Skip if this is an outbound email (from our integration email)
              if (parsed.from?.toLowerCase().includes(emailAddress.toLowerCase())) {
                logger.info({ messageId, from: parsed.from }, "Skipping outbound email")
                continue
              }

              // Extract sender email from "Name <email@example.com>" format
              const fromMatch = parsed.from.match(/<(.+?)>/)
              const senderEmail = fromMatch
                ? fromMatch[1]?.trim() || parsed.from.trim()
                : parsed.from.trim()

              // Extract sender name
              const nameMatch = parsed.from.match(/^(.+?)\s*</)
              const senderName = nameMatch ? nameMatch[1]?.trim() || senderEmail : senderEmail

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
                { contactId: contact._id, email: senderEmail },
                "Contact found or created (fallback)"
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
                  lastMessagePreview: parsed.snippet || parsed.text?.substring(0, 100),
                  sourceMetadata: {
                    subject: parsed.subject,
                    from: parsed.from,
                    to: parsed.to,
                  },
                })
                isNewConversation = true
                logger.info(
                  { conversationId: conversation._id, threadId: parsed.threadId },
                  "New conversation created (fallback)"
                )
              } else {
                if (conversation.status === "closed") {
                  conversation.status = "open"
                  logger.info(
                    { conversationId: conversation._id },
                    "Reopened closed conversation (fallback)"
                  )
                }
                conversation.lastMessageAt = new Date()
                conversation.lastMessagePreview =
                  parsed.snippet || parsed.text?.substring(0, 100)
                await conversation.save()
                logger.info(
                  { conversationId: conversation._id, threadId: parsed.threadId },
                  "Existing conversation updated (fallback)"
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
                attachments: parsed.attachments.map((att: any) => ({
                  name: att.filename,
                  type: att.mimeType,
                  size: att.size,
                  attachmentId: att.attachmentId,
                })),
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
                { messageId: message._id, gmailMessageId: parsed.id },
                "Message created (fallback)"
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
                    snippet: parsed.snippet,
                    createdAt: (message as any).createdAt,
                  },
                  integration: {
                    _id: integration._id,
                    name: integration.name,
                  },
                })

                logger.info(
                  { agentRoom, conversationId: conversation._id },
                  "Socket.IO notification sent (fallback)"
                )
              } catch (socketError) {
                logger.error(
                  { error: socketError },
                  "Failed to send Socket.IO notification (fallback)"
                )
              }
            }
          }
        }
        
        // Update historyId even when there are no messages
        if (integration.credentials && newHistoryId) {
          integration.credentials.historyId = newHistoryId
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

          // Fetch full message details
          const messageResponse = await gmail.users.messages.get({
            userId: "me",
            id: messageId,
            format: "full",
          })

          const gmailMessage = messageResponse.data
          const parsed = parseGmailMessage(gmailMessage)

          // Skip if this is an outbound email (from our integration email)
          if (
            parsed.from?.toLowerCase().includes(emailAddress.toLowerCase())
          ) {
            logger.info({ messageId }, "Skipping outbound email")
            continue
          }

          // Extract sender email from "Name <email@example.com>" format
          const fromMatch = parsed.from.match(/<(.+?)>/)
          const senderEmail = fromMatch
            ? fromMatch[1]?.trim() || parsed.from.trim()
            : parsed.from.trim()

          // Extract sender name
          const nameMatch = parsed.from.match(/^(.+?)\s*</)
          const senderName = nameMatch ? nameMatch[1]?.trim() || senderEmail : senderEmail

          // ========== CONTACT LOGIC ==========
          // Find or create contact by email (unique per org)
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
            { contactId: contact._id, email: senderEmail },
            "Contact found or created"
          )

          // ========== CONVERSATION LOGIC ==========
          // Find conversation by threadId (Gmail thread = conversation)
          let conversation = await Conversation.findOne({
            orgId: integration.orgId,
            integrationId: integration._id,
            channel: "gmail",
            threadId: parsed.threadId,
          })

          let isNewConversation = false

          if (!conversation) {
            // Create new conversation for this thread
            conversation = await Conversation.create({
              orgId: integration.orgId,
              integrationId: integration._id,
              contactId: contact._id,
              channel: "gmail",
              threadId: parsed.threadId,
              status: "open",
              priority: "normal",
              lastMessageAt: new Date(),
              lastMessagePreview: parsed.snippet || parsed.text?.substring(0, 100),
              sourceMetadata: {
                subject: parsed.subject,
                from: parsed.from,
                to: parsed.to,
              },
            })
            isNewConversation = true
            logger.info(
              { conversationId: conversation._id, threadId: parsed.threadId },
              "New conversation created"
            )
          } else {
            // Update existing conversation
            // Reopen if closed
            if (conversation.status === "closed") {
              conversation.status = "open"
              logger.info(
                { conversationId: conversation._id },
                "Reopened closed conversation"
              )
            }

            conversation.lastMessageAt = new Date()
            conversation.lastMessagePreview =
              parsed.snippet || parsed.text?.substring(0, 100)
            await conversation.save()

            logger.info(
              { conversationId: conversation._id, threadId: parsed.threadId },
              "Existing conversation updated"
            )
          }

          // ========== MESSAGE LOGIC ==========
          // Create message record
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
            attachments: parsed.attachments.map((att: any) => ({
              name: att.filename,
              type: att.mimeType,
              size: att.size,
              attachmentId: att.attachmentId,
            })),
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
            { messageId: message._id, gmailMessageId: parsed.id },
            "Message created"
          )

          // ========== REAL-TIME NOTIFICATION ==========
          // Emit Socket.IO event to agents
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
                snippet: parsed.snippet,
                createdAt: (message as any).createdAt,
              },
              integration: {
                _id: integration._id,
                name: integration.name,
              },
            })

            logger.info(
              { agentRoom, conversationId: conversation._id },
              "Socket.IO notification sent to agents"
            )
          } catch (socketError) {
            logger.error(
              { error: socketError },
              "Failed to send Socket.IO notification"
            )
          }
        }
      }

      // Update integration with latest historyId
      if (integration.credentials) {
        integration.credentials.historyId = historyResponse.data.historyId
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
}
