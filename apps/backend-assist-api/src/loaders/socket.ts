import { Server as SocketIOServer, Socket } from "socket.io"
import { logger } from "../config/logger"

interface AuthenticatedSocket extends Socket {
  userId?: string
  userEmail?: string
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
