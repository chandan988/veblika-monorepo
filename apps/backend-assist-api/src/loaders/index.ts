import { Express } from "express"
import { Server as SocketIOServer } from "socket.io"
import { connectDatabase } from "../config/database"
import { expressLoader } from "./express"
import { routesLoader } from "./routes"
import { initializeSocketIO } from "./socket"
import { logger } from "../config/logger"

export const initializeLoaders = async (app: Express, io?: SocketIOServer): Promise<void> => {
  try {
    // Connect to database
    await connectDatabase()
    logger.info("✅ Database loader initialized")

    logger.info("✅ Auth initialized")

    // Load Express middleware
    await expressLoader(app)
    logger.info("✅ Express loader initialized")

    // Load routes
    routesLoader(app)
    logger.info("✅ Routes loader initialized")

    // Initialize Socket.IO
    if (io) {
      initializeSocketIO(io)
      logger.info("✅ Socket.IO loader initialized")
    }

    logger.info("🚀 All loaders initialized successfully")
  } catch (error) {
    console.log(error)
    logger.error("❌ Error initializing loaders:", error)
    throw error
  }
}
