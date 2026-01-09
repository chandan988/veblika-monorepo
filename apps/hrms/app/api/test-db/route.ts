import { NextResponse } from "next/server";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

export async function GET() {
  try {
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      return NextResponse.json({ 
        success: true, 
        message: 'MongoDB already connected!',
        database: mongoose.connection.db?.databaseName || 'unknown',
        host: mongoose.connection.host
      });
    }

    // Connect to MongoDB
    const connection = await mongoose.connect(MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${connection.connection.host}`);

    return NextResponse.json({ 
      success: true, 
      message: 'MongoDB connected successfully with Mongoose!',
      database: mongoose.connection.db?.databaseName || 'unknown',
      host: connection.connection.host
    });

  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to connect to MongoDB',
      error: errorMessage 
    }, { status: 500 });
  }
}