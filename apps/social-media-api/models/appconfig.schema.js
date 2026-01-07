import mongoose from "mongoose";

const appSchema = new mongoose.Schema(
  {
    userId: { type: String, required: false }, // Optional - not required for reseller credentials
    appName: { type: String, required: true },
    appClientId: { type: String, required: true },
    appClientSecret: { type: String, required: true },
    redirectUrl: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resellerId: { type: String, required: false }, // For reseller-level credentials
  },
  { timestamps: true }
);

// Compound unique index: one config per user per app (when userId is present)
appSchema.index({ userId: 1, appName: 1 }, { unique: true, sparse: true });
// Compound unique index: one config per reseller per app (when resellerId is present)
appSchema.index({ resellerId: 1, appName: 1 }, { unique: true, sparse: true });

const AppConfig = mongoose.model("AppConfig", appSchema);

// Migration function to drop old orgNo index
export const migrateAppConfigIndexes = async () => {
  try {
    const indexes = await AppConfig.collection.getIndexes();

    // 1) Drop old orgNo index if it exists
    if (indexes.orgNo_1) {
      console.log("[AppConfig Migration] Dropping old orgNo_1 index...");
      try {
        await AppConfig.collection.dropIndex("orgNo_1");
        console.log("[AppConfig Migration] ✅ Successfully dropped old orgNo_1 index");
      } catch (dropErr) {
        if (dropErr.code === 27 || dropErr.codeName === "IndexNotFound") {
          console.log("[AppConfig Migration] orgNo_1 index already dropped or doesn't exist");
        } else {
          console.error("[AppConfig Migration] Error dropping orgNo_1 index:", dropErr.message);
        }
      }
    } else {
      console.log("[AppConfig Migration] Old orgNo_1 index not found (already migrated)");
    }

    // 2) Drop old single-field userId index if it exists (causes dup key on userId: null)
    if (indexes.userId_1) {
      console.log("[AppConfig Migration] Dropping old userId_1 index...");
      try {
        await AppConfig.collection.dropIndex("userId_1");
        console.log("[AppConfig Migration] ✅ Successfully dropped old userId_1 index");
      } catch (dropErr) {
        if (dropErr.code === 27 || dropErr.codeName === "IndexNotFound") {
          console.log("[AppConfig Migration] userId_1 index already dropped or doesn't exist");
        } else {
          console.error("[AppConfig Migration] Error dropping userId_1 index:", dropErr.message);
        }
      }
    } else {
      console.log("[AppConfig Migration] Old userId_1 index not found (already migrated)");
    }

    // Ensure new indexes exist
    const currentIndexes = await AppConfig.collection.getIndexes();
    
    // Check and create userId index if needed
    if (!currentIndexes.userId_1_appName_1) {
      console.log("[AppConfig Migration] Creating userId_1_appName_1 index...");
      await AppConfig.collection.createIndex({ userId: 1, appName: 1 }, { unique: true, sparse: true });
      console.log("[AppConfig Migration] ✅ Successfully created userId_1_appName_1 index");
    } else {
      console.log("[AppConfig Migration] ✅ userId_1_appName_1 index already exists");
    }
    
    // Check and create resellerId index if needed
    if (!currentIndexes.resellerId_1_appName_1) {
      console.log("[AppConfig Migration] Creating resellerId_1_appName_1 index...");
      await AppConfig.collection.createIndex({ resellerId: 1, appName: 1 }, { unique: true, sparse: true });
      console.log("[AppConfig Migration] ✅ Successfully created resellerId_1_appName_1 index");
    } else {
      console.log("[AppConfig Migration] ✅ resellerId_1_appName_1 index already exists");
    }
  } catch (err) {
    // Collection might not exist yet, ignore
    if (err.codeName !== 'NamespaceNotFound') {
      console.error("[AppConfig Migration] Error during migration:", err.message);
    }
  }
};

export default AppConfig;
