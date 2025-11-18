import express, { Express } from "express"
import { initializeLoaders } from "./loaders/index"

export const createApp = async (): Promise<Express> => {
  const app = express()

  // Initialize all loaders
  await initializeLoaders(app)

  return app
}
