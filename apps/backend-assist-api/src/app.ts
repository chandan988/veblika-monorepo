import express, { Express } from "express"
import { Server as HTTPServer } from "http"
import { Server as SocketIOServer } from "socket.io"
import { initializeLoaders } from "./loaders/index"
import { config } from "./config/index"

export const createApp = async (): Promise<{
  app: Express
  httpServer: HTTPServer
  io: SocketIOServer
}> => {
  const app = express()
  const httpServer = new HTTPServer(app)

  // Initialize Socket.IO with CORS
  const io = new SocketIOServer(httpServer, {
    cors: {
      allowedHeaders: ["*"],
      origin: "*",
    },
    transports: ["websocket"],
    pingTimeout: 60000,
    pingInterval: 25000,
  })

  // Initialize all loaders (including Socket.IO)
  await initializeLoaders(app, io)

  return { app, httpServer, io }
}
