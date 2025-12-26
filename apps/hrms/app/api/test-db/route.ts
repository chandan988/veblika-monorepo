const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI!;
console.log("MongoDB URI:", MONGODB_URI);

export async function connectDB() {
  try {
    const connection = await mongoose.connect(MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${connection.connection.host}`);

    mongoose.connection.on("error", () => {
      console.error("❌ MongoDB connection error:");
    });
    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB disconnected");
    });
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      console.log("🛑 MongoDB connection closed through app termination");
      process.exit(0);
    })

  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error);
    process.exit(1);
  }
}

await connectDB();