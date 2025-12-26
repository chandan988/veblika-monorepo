import mongoose from "mongoose"


  const connectDatabase = async (): Promise<void> => {
  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI!)

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

await connectDatabase()