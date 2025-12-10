import { Server as SocketIOServer, Socket } from "socket.io"
import { logger } from "../config/logger"
import { widgetService } from "../api/services/widget-service"
import { Integration } from "../api/models/integration-model"
import mongoose from "mongoose"
import { Conversation } from "../api/models/conversation-model"

interface AuthenticatedSocket extends Socket {
  userId?: string
  userEmail?: string
  orgId?: string
  integrationId?: string
  sessionId?: string
  isWidget?: boolean
}

export const initializeSocketIO = (io: SocketIOServer): void => {
  // Middleware for authentication
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token

    // TODO: Implement your JWT token verification here
    // For now, we'll allow all connections
    if (token) {
      try {
        // Verify token and extract user info
        // const decoded = jwt.verify(token, config.jwt.secret)
        // socket.userId = decoded.userId
        // socket.userEmail = decoded.email
        logger.info(`Socket authenticated with token`)
      } catch (error) {
        logger.error("Socket authentication error:", error)
        return next(new Error("Authentication error"))
      }
    }

    next()
  })

  // Handle connections
  io.on("connection", (socket: AuthenticatedSocket) => {
    logger.info(`Client connected: ${socket.id}`)

    // Join user-specific room
    if (socket.userId) {
      socket.join(`user:${socket.userId}`)
      logger.info(`Socket ${socket.id} joined room user:${socket.userId}`)
    }

    // Handle custom events
    socket.on("join:room", (roomId: string) => {
      socket.join(roomId)
      logger.info(`Socket ${socket.id} joined room ${roomId}`)
      socket.emit("room:joined", { roomId })
    })

    socket.on("leave:room", (roomId: string) => {
      socket.leave(roomId)
      logger.info(`Socket ${socket.id} left room ${roomId}`)
      socket.emit("room:left", { roomId })
    })

    // Example: Broadcast message to a room
    socket.on("message:send", (data: { roomId: string; message: string }) => {
      logger.info(`Message from ${socket.id} to room ${data.roomId}`)
      socket.to(data.roomId).emit("message:received", {
        message: data.message,
        from: socket.id,
        timestamp: new Date(),
      })
    })

    // ========== WIDGET EVENTS ==========

    /**
     * Widget connects and joins room
     * Visitor connects from widget UI
     */
    socket.on(
      "widget:join",
      async (data: {
        integrationId: string
        orgId: string
        sessionId: string
        visitorInfo?: any
      }) => {
        try {
          logger.info(
            `Widget joining: integration=${data.integrationId}, session=${data.sessionId}`
          )

          // Verify integration exists and is active
          const integration = await Integration.findOne({
            _id: new mongoose.Types.ObjectId(data.integrationId),
            orgId: new mongoose.Types.ObjectId(data.orgId),
            channel: "webchat",
            status: "active",
          })

          if (!integration) {
            socket.emit("widget:error", {
              message: "Integration not found or inactive",
            })
            return
          }

          // Mark socket with visitor session info
          socket.isWidget = true
          socket.integrationId = data.integrationId
          socket.orgId = data.orgId
          socket.sessionId = data.sessionId

          // Join session-specific room (unique per visitor)
          // Use "widget:" prefix to match conversation.threadId format
          const sessionRoom = `widget:${data.sessionId}`
          socket.join(sessionRoom)

          // Also join integration room (for broadcasts)
          const integrationRoom = `integration:${integration._id}`
          socket.join(integrationRoom)

          logger.info(
            `Widget socket ${socket.id} joined rooms: ${sessionRoom}, ${integrationRoom}`
          )

          // Send confirmation to widget
          socket.emit("widget:connected", {
            success: true,
            integrationId: integration._id,
            sessionId: data.sessionId,
          })
        } catch (error) {
          logger.error("Error in widget:join:", error)
          socket.emit("widget:error", { message: "Failed to join widget room" })
        }
      }
    )

    /**
     * Visitor sends a message from widget
     */
    socket.on(
      "visitor:message",
      async (data: {
        integrationId: string
        orgId: string
        sessionId: string
        message: { text: string }
        visitorInfo?: {
          name?: string
          email?: string
          phone?: string
          userAgent?: string
          referrer?: string
        }
      }) => {
        try {
          logger.info(`Visitor message from session ${data.sessionId}`)

          // Save message using widget service
          const result = await widgetService.saveVisitorMessage(data)

          // Send confirmation back to widget
          socket.emit("message:confirmed", {
            messageId: result.message._id,
            conversationId: result.conversation._id,
            timestamp: new Date(),
          })

          // Notify agents in the organization
          const agentRoom = `org:${data.orgId}:agents`
          io.to(agentRoom).emit("new:message", {
            message: result.message,
            conversation: result.conversation,
            isNewConversation: result.isNewConversation,
          })

          // Also emit to specific conversation room for agents viewing this conversation
          const conversationRoom = `conversation:${result.conversation._id}`
          io.to(conversationRoom).emit("new:message", {
            message: result.message,
            conversation: result.conversation,
            isNewConversation: result.isNewConversation,
          })

          logger.info(`Message saved and agents notified in ${agentRoom} and ${conversationRoom}`)
        } catch (error) {
          logger.error("Error in visitor:message:", error)
          socket.emit("message:error", { message: "Failed to send message" })
        }
      }
    )

    /**
     * Agent joins their organization's room to receive messages
     */
    socket.on("agent:join", async (data: { orgId: string; userId: string }) => {
      try {
        logger.info(`Agent ${data.userId} joining org ${data.orgId}`)

        // Store agent info in socket
        socket.userId = data.userId
        socket.orgId = data.orgId

        // Join organization's agent room
        const agentRoom = `org:${data.orgId}:agents`
        socket.join(agentRoom)

        logger.info(`Agent socket ${socket.id} joined room ${agentRoom}`)

        socket.emit("agent:connected", {
          success: true,
          room: agentRoom,
        })
      } catch (error) {
        logger.error("Error in agent:join:", error)
        socket.emit("agent:error", { message: "Failed to join agent room" })
      }
    })

    /**
     * Agent sends a message to visitor
     */
    socket.on(
      "agent:message",
      async (data: {
        conversationId: string
        message: { text: string }
        agentId: string
      }) => {
        try {
          logger.info(`Agent message to conversation ${data.conversationId}`)

          // Save agent message
          const message = await widgetService.saveAgentMessage(
            data.conversationId,
            data.agentId,
            data.message.text
          )

          // Send confirmation to agent
          socket.emit("message:confirmed", {
            messageId: message._id,
            conversationId: message.conversationId,
            timestamp: new Date(),
          })

          // Find the conversation to get sessionId from threadId
          const conversation = await Conversation.findById(data.conversationId)

          if (conversation) {
            // Use threadId directly (already has "widget:" prefix)
            const sessionRoom = conversation.threadId
            
            if (!sessionRoom) {
              logger.warn(
                `No threadId found in conversation ${data.conversationId}`
              )
              return
            }

            // Send message ONLY to this specific visitor's session room
            io.to(sessionRoom).emit("agent:message", {
              message: message,
              conversationId: conversation._id,
            })

            logger.info(`Agent message sent to session room: ${sessionRoom}`)
          }
        } catch (error) {
          logger.error("Error in agent:message:", error)
          socket.emit("message:error", { message: "Failed to send message" })
        }
      }
    )

    /**
     * Agent joins a specific conversation room
     */
    socket.on("conversation:join", (data: { conversationId: string }) => {
      const conversationRoom = `conversation:${data.conversationId}`
      socket.join(conversationRoom)
      logger.info(
        `Socket ${socket.id} joined conversation ${data.conversationId}`
      )
      socket.emit("conversation:joined", {
        conversationId: data.conversationId,
      })
    })

    /**
     * Agent leaves a conversation room
     */
    socket.on("conversation:leave", (data: { conversationId: string }) => {
      const conversationRoom = `conversation:${data.conversationId}`
      socket.leave(conversationRoom)
      logger.info(
        `Socket ${socket.id} left conversation ${data.conversationId}`
      )
    })

    // Handle disconnection
    socket.on("disconnect", (reason) => {
      logger.info(`Client disconnected: ${socket.id}, reason: ${reason}`)
    })

    // Handle errors
    socket.on("error", (error) => {
      logger.error(`Socket error for ${socket.id}:`, error)
    })
  })

  logger.info("✅ Socket.IO initialized successfully")
}

// Helper function to emit to specific user
export const emitToUser = (
  io: SocketIOServer,
  userId: string,
  event: string,
  data: any
): void => {
  io.to(`user:${userId}`).emit(event, data)
}

// Helper function to emit to specific room
export const emitToRoom = (
  io: SocketIOServer,
  roomId: string,
  event: string,
  data: any
): void => {
  io.to(roomId).emit(event, data)
}

// Helper function to broadcast to all connected clients
export const broadcastToAll = (
  io: SocketIOServer,
  event: string,
  data: any
): void => {
  io.emit(event, data)
}




// Agent message sent to session room: session:widget:session_1764669550157_oshyb4my6

