/**
 * Migration script to drop old orgNo index from appcredentials collection
 * Run this script once to migrate from orgNo to userId indexes
 * 
 * Usage: node scripts/migrate-orgno-to-userid.js
 */

import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import { migrateAppCredentialsIndexes } from "../models/appcredentials.model.js";

const runMigration = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URL);
    console.log("✅ Connected to MongoDB");
    
    console.log("\nRunning migration...");
    await migrateAppCredentialsIndexes();
    
    console.log("\n✅ Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

runMigration();

