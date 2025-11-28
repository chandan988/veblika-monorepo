import { Server as SocketIOServer, Socket } from "socket.io"
import { logger } from "../config/logger"
import { widgetService } from "../api/services/widget-service"
import { notifications } from "../utils/notifications"

interface AuthenticatedSocket extends Socket {
  userId?: string
  userEmail?: string
  orgId?: string
  websiteId?: string
  tenantId?: string
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

    // Handle typing indicators
    socket.on("typing:start", (data: { roomId: string }) => {
      socket.to(data.roomId).emit("user:typing", { userId: socket.userId })
    })

    socket.on("typing:stop", (data: { roomId: string }) => {
      socket.to(data.roomId).emit("user:stopped-typing", { userId: socket.userId })
    })

    // ========== WIDGET EVENTS ==========
    
    /**
     * Widget connects and joins room
     * Visitor connects from widget UI
     */
    socket.on("widget:join", async (data: { websiteId: string; tenantId: string; sessionId: string }) => {
      try {
        logger.info(`Widget joining: ${data.websiteId}, ${data.tenantId}, ${data.sessionId}`)
        
        // Verify integration exists and is active
        const integration = await widgetService.getIntegrationByTenantId(data.tenantId)
        
        if (!integration) {
          socket.emit("widget:error", { message: "Integration not found or inactive" })
          return
        }

        // Mark socket as widget socket
        socket.isWidget = true
        socket.websiteId = data.websiteId
        socket.tenantId = data.tenantId
        socket.sessionId = data.sessionId
        socket.orgId = integration.orgId.toString()

        // Join widget-specific room for this integration
        const widgetRoom = `widget:${integration._id}`
        socket.join(widgetRoom)
        
        logger.info(`Widget socket ${socket.id} joined room ${widgetRoom}`)
        
        // Send confirmation to widget
        socket.emit("widget:connected", {
          success: true,
          integrationId: integration._id,
        })
      } catch (error) {
        logger.error("Error in widget:join:", error)
        socket.emit("widget:error", { message: "Failed to join widget room" })
      }
    })

    /**
     * Visitor sends a message from widget
     */
    socket.on("visitor:message", async (data: {
      tenantId: string;
      websiteId: string;
      sessionId: string;
      message: { text: string };
      visitorInfo?: {
        name?: string;
        email?: string;
        userAgent?: string;
        referrer?: string;
      };
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

        // Get integration to find orgId
        const integration = await widgetService.getIntegrationByTenantId(data.tenantId)
        if (!integration) return

        // Notify agents in the organization
        const agentRoom = `org:${integration.orgId}:agents`
        io.to(agentRoom).emit("new:message", {
          message: result.message,
          conversation: result.conversation,
          isNewConversation: result.isNewConversation,
        })

        // Also emit SSE notification for agents not on socket
        notifications.emit("notification", {
          type: "new_message",
          orgId: integration.orgId.toString(),
          conversationId: result.conversation._id,
          messageId: result.message._id,
          preview: data.message.text.substring(0, 100),
        })

        logger.info(`Message saved and notified to agents in ${agentRoom}`)
      } catch (error) {
        logger.error("Error in visitor:message:", error)
        socket.emit("message:error", { message: "Failed to send message" })
      }
    })

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
    socket.on("agent:message", async (data: {
      conversationId: string;
      message: { text: string };
      agentId: string;
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

        // Get integration to find the widget room
        const integration = await widgetService.getIntegrationByTenantId(socket.tenantId || "")
        
        // Find the conversation to get integrationId
        const { Conversation } = await import("../api/models/conversation-model")
        const conversation = await Conversation.findById(data.conversationId)
        
        if (conversation) {
          // Send message to widget room
          const widgetRoom = `widget:${conversation.integrationId}`
          io.to(widgetRoom).emit("agent:message", {
            message: message,
            conversationId: conversation._id,
          })
          
          logger.info(`Agent message sent to widget room ${widgetRoom}`)
        }
      } catch (error) {
        logger.error("Error in agent:message:", error)
        socket.emit("message:error", { message: "Failed to send message" })
      }
    })

    /**
     * Agent joins a specific conversation room
     */
    socket.on("conversation:join", (data: { conversationId: string }) => {
      const conversationRoom = `conversation:${data.conversationId}`
      socket.join(conversationRoom)
      logger.info(`Socket ${socket.id} joined conversation ${data.conversationId}`)
      socket.emit("conversation:joined", { conversationId: data.conversationId })
    })

    /**
     * Agent leaves a conversation room
     */
    socket.on("conversation:leave", (data: { conversationId: string }) => {
      const conversationRoom = `conversation:${data.conversationId}`
      socket.leave(conversationRoom)
      logger.info(`Socket ${socket.id} left conversation ${data.conversationId}`)
    })

    /**
     * Typing indicators for conversations
     */
    socket.on("typing:start", (data: { conversationId: string; isAgent?: boolean }) => {
      const conversationRoom = `conversation:${data.conversationId}`
      socket.to(conversationRoom).emit("user:typing", {
        conversationId: data.conversationId,
        userId: socket.userId,
        isAgent: data.isAgent,
      })
    })

    socket.on("typing:stop", (data: { conversationId: string; isAgent?: boolean }) => {
      const conversationRoom = `conversation:${data.conversationId}`
      socket.to(conversationRoom).emit("user:stopped-typing", {
        conversationId: data.conversationId,
        userId: socket.userId,
        isAgent: data.isAgent,
      })
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
export const emitToUser = (io: SocketIOServer, userId: string, event: string, data: any): void => {
  io.to(`user:${userId}`).emit(event, data)
}

// Helper function to emit to specific room
export const emitToRoom = (io: SocketIOServer, roomId: string, event: string, data: any): void => {
  io.to(roomId).emit(event, data)
}

// Helper function to broadcast to all connected clients
export const broadcastToAll = (io: SocketIOServer, event: string, data: any): void => {
  io.emit(event, data)
}
