import { MongoClient, ObjectId } from "mongodb"

// Lazy initialization - only runs when auth is actually used at runtime
let client: MongoClient | null = null
let db: any = null

export function getDatabase() {
  if (!client) {
    // Use empty string as fallback - will fail at runtime if not set
    client = new MongoClient(process.env.DATABASE_URL || "")
    db = client.db()
  }

  return { client, db }
}
