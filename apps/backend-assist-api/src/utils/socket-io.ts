import { Server as SocketIOServer } from "socket.io"
import { logger } from "../config/logger"

let io: SocketIOServer | null = null

/**
 * Store Socket.IO instance for use across the application
 */
export const setSocketIO = (socketIO: SocketIOServer): void => {
  io = socketIO
  logger.info("Socket.IO instance stored in global utility")
}

/**
 * Get the Socket.IO instance
 */
export const getSocketIO = (): SocketIOServer => {
  if (!io) {
    throw new Error("Socket.IO has not been initialized. Call setSocketIO first.")
  }
  return io
}

/**
 * Check if Socket.IO is initialized
 */
export const hasSocketIO = (): boolean => {
  return io !== null
}
