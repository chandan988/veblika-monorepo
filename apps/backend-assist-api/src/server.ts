import { createApp } from "./app"
import { config } from "./config/index"
import { logger } from "./config/logger"

const startServer = async () => {
  try {
    const {httpServer, io } = await createApp()

    console.log(config)

    httpServer.listen(config.port, () => {
      logger.info(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   🚀 Server is running!                               ║
║                                                        ║
║   📡 Port: ${config.port}                                    ║
║   🌍 Environment: ${config.nodeEnv}                    ║
║   🔗 API: ${config.api.baseUrl}${config.api.prefix}       ║
║   ❤️  Health: ${config.api.baseUrl}/health          ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
      `)
    })

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`\n${signal} received, closing server gracefully....`)
      
      // Close Socket.IO connections
      io.close(() => {
        logger.info("Socket.IO closed ")
      })
      
      httpServer.close(() => {
        logger.info("Server closed")
        process.exit(0)
      })

      // Force close after 10 seconds
      setTimeout(() => {
        logger.error("Forcing server shutdown...")
        process.exit(1)
      }, 10000)
    }

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))
    process.on("SIGINT", () => gracefulShutdown("SIGINT"))
  } catch (error) {
    logger.error("❌ Error starting server:", error)
    process.exit(1)
  }
}

startServer()
