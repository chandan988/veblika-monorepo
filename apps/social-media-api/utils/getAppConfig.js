import AppConfig from "../models/appconfig.schema.js";

/**
 * Get app configuration from database, with fallback to environment variables
 * Priority:
 *  1) Reseller-level config (shared across all users of that reseller)
 *  2) User-level config
 *  3) Environment variables
 *
 * @param {string} userId - User ID (MongoDB or better-auth ID)
 * @param {string} appName - App name (e.g., "app/instagram", "app/facebook", "app/linkedin", "app/youtube")
 * @param {string} [resellerId] - Optional reseller ID
 * @returns {Promise<{appClientId: string, appClientSecret: string, redirectUrl: string, source: string}>}
 */
export async function getAppConfig(userId, appName, resellerId) {
  try {
    console.log(`[getAppConfig] Called with userId: ${userId}, appName: ${appName}, resellerId: ${resellerId}`);
    
    // 1) Try reseller-level config first (shared for all users with same resellerId)
    if (resellerId) {
      // Convert resellerId to string to ensure consistent querying
      const resellerIdStr = String(resellerId).trim();
      console.log(`[getAppConfig] Searching for reseller config with resellerId: "${resellerIdStr}", appName: "${appName}"`);
      
      // Try exact match first
      let resellerConfig = await AppConfig.findOne({ resellerId: resellerIdStr, appName }).lean();
      
      // If not found, try with ObjectId conversion (in case it's stored as ObjectId)
      if (!resellerConfig) {
        try {
          const mongoose = await import("mongoose");
          const ObjectId = mongoose.default.Types.ObjectId;
          if (ObjectId.isValid(resellerIdStr)) {
            resellerConfig = await AppConfig.findOne({ 
              resellerId: { $in: [resellerIdStr, new ObjectId(resellerIdStr)] }, 
              appName 
            }).lean();
          }
        } catch (e) {
          // Ignore ObjectId conversion errors
        }
      }
      
      if (resellerConfig) {
        console.log(
          `[getAppConfig] ✅ Found reseller config in DB for ${appName} (resellerId: ${resellerIdStr})`,
          `- ClientId: ${resellerConfig.appClientId?.substring(0, 10)}...`
        );
        return {
          appClientId: resellerConfig.appClientId,
          appClientSecret: resellerConfig.appClientSecret,
          redirectUrl: resellerConfig.redirectUrl,
          source: "reseller",
        };
      } else {
        console.log(`[getAppConfig] ❌ No reseller config found for resellerId: "${resellerIdStr}", appName: "${appName}"`);
        // Debug: Check what reseller configs exist
        const allResellerConfigs = await AppConfig.find({ resellerId: { $exists: true, $ne: null } }).lean();
        console.log(`[getAppConfig] Debug: Found ${allResellerConfigs.length} reseller configs in DB:`, 
          allResellerConfigs.map(c => ({ resellerId: String(c.resellerId), resellerIdType: typeof c.resellerId, appName: c.appName }))
        );
      }
    } else {
      console.log(`[getAppConfig] No resellerId provided, skipping reseller config lookup`);
    }

    // 2) Try user-level config
    if (userId) {
      const dbConfig = await AppConfig.findOne({ userId, appName }).lean();

      if (dbConfig) {
        console.log(`[getAppConfig] Found user config in DB for ${appName} (userId: ${userId})`);
        return {
          appClientId: dbConfig.appClientId,
          appClientSecret: dbConfig.appClientSecret,
          redirectUrl: dbConfig.redirectUrl,
          source: "database",
        };
      }
    }
    
    // Fallback to environment variables
    console.log(`[getAppConfig] No DB config found for ${appName}, using env variables`);
    
    const envConfigs = {
      "app/instagram": {
        appClientId: process.env.INSTAGRAM_APP_ID || process.env.META_APP_ID,
        appClientSecret: process.env.INSTAGRAM_APP_SECRET || process.env.META_APP_SECRET,
        redirectUrl: process.env.INSTAGRAM_REDIRECT_URI,
      },
      "app/facebook": {
        appClientId: process.env.FACEBOOK_APP_ID || process.env.META_APP_ID,
        appClientSecret: process.env.FACEBOOK_APP_SECRET || process.env.META_APP_SECRET,
        redirectUrl: process.env.FACEBOOK_REDIRECT_URI || process.env.INSTAGRAM_REDIRECT_URI,
      },
      "app/linkedin": {
        appClientId: process.env.LINKEDIN_CLIENT_ID,
        appClientSecret: process.env.LINKEDIN_CLIENT_SECRET,
        redirectUrl: process.env.LINKEDIN_REDIRECT_URI,
      },
      "app/youtube": {
        appClientId: process.env.GOOGLE_CLIENT_ID,
        appClientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUrl: process.env.GOOGLE_REDIRECT_URI,
      },
    };
    
    const envConfig = envConfigs[appName];
    
    if (!envConfig || !envConfig.appClientId || !envConfig.appClientSecret || !envConfig.redirectUrl) {
      throw new Error(`App configuration not found for ${appName}. Please configure it in the database or environment variables.`);
    }
    
    return {
      ...envConfig,
      source: "environment",
    };
  } catch (error) {
    console.error(`[getAppConfig] Error getting config for ${appName}:`, error.message);
    throw error;
  }
}


