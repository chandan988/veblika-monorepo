import mongoose from "mongoose"
import { config } from "./index"

export const connectDatabase = async (): Promise<void> => {
  try {
    // const connection = await mongoose.connect(config.mongodb.uri)
    const connection = await mongoose.connect("mongodb://backend_assist_readwrite:$tZh4tP$hqf9X79U@13.203.111.36:27017,13.201.253.16:27017/backend-assist?replicaSet=rs0&authSource=backend-assist")

    console.log(`✅ MongoDB Connected: ${connection.connection.host}`)

    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err)
    })

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB disconnected")
    })

    process.on("SIGINT", async () => {
      await mongoose.connection.close()
      console.log("🛑 MongoDB connection closed through app termination")
      process.exit(0)
    })
  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error)
    process.exit(1)
  }
}
