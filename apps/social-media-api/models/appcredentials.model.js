import mongoose from "mongoose";

const appCredentialsSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    platform: { type: String, required: true },
    credentials: { type: Object, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Create compound index to ensure one credential per platform per organization
appCredentialsSchema.index({ userId: 1, platform: 1 }, { unique: true });

const AppCredentials = mongoose.model("AppCredentials", appCredentialsSchema);

// Migration function to drop old orgNo index
export const migrateAppCredentialsIndexes = async () => {
  try {
    const indexes = await AppCredentials.collection.getIndexes();
    
    // Check if old orgNo index exists
    if (indexes.orgNo_1_platform_1) {
      console.log("[AppCredentials Migration] Dropping old orgNo_1_platform_1 index...");
      try {
        await AppCredentials.collection.dropIndex("orgNo_1_platform_1");
        console.log("[AppCredentials Migration] ✅ Successfully dropped old orgNo_1_platform_1 index");
      } catch (dropErr) {
        if (dropErr.code === 27 || dropErr.codeName === 'IndexNotFound') {
          console.log("[AppCredentials Migration] Index already dropped or doesn't exist");
        } else {
          console.error("[AppCredentials Migration] Error dropping old index:", dropErr.message);
        }
      }
    } else {
      console.log("[AppCredentials Migration] Old orgNo_1_platform_1 index not found (already migrated)");
    }
    
    // Ensure new userId index exists
    const currentIndexes = await AppCredentials.collection.getIndexes();
    if (!currentIndexes.userId_1_platform_1) {
      console.log("[AppCredentials Migration] Creating userId_1_platform_1 index...");
      await AppCredentials.collection.createIndex({ userId: 1, platform: 1 }, { unique: true });
      console.log("[AppCredentials Migration] ✅ Successfully created userId_1_platform_1 index");
    } else {
      console.log("[AppCredentials Migration] ✅ userId_1_platform_1 index already exists");
    }
  } catch (err) {
    // Collection might not exist yet, ignore
    if (err.codeName !== 'NamespaceNotFound') {
      console.error("[AppCredentials Migration] Error during migration:", err.message);
    }
  }
};

export default AppCredentials;
