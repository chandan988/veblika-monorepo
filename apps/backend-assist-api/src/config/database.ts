import mongoose from "mongoose"
import { config } from "./index"

export const connectDatabase = async (): Promise<void> => {
  try {
    // Prevent multiple connections in watch mode
    if (mongoose.connection.readyState >= 1) {
      console.log("🔄 Using existing MongoDB connection")
      return
    }

    const uri = config.mongodb.uri

    const connection = await mongoose.connect(uri)

    console.log(`✅ MongoDB Connected: ${connection.connection.host}`)

    // --- Event Listeners (register only once) ---
    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err)
    })

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB disconnected")
    })

    // Graceful shutdown (only register once)
    if (!process.listeners("SIGINT").length) {
      process.on("SIGINT", async () => {
        await mongoose.connection.close()
        console.log("🛑 MongoDB connection closed through app termination")
        process.exit(0)
      })
    }
  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error)
    process.exit(1)
  }
}
