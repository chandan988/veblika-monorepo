import AppConfig from "../models/appconfig.schema.js";

/**
 * Get app configuration from database, with fallback to environment variables
 * @param {string} userId - User ID
 * @param {string} appName - App name (e.g., "app/instagram", "app/facebook", "app/linkedin", "app/youtube")
 * @returns {Promise<{appClientId: string, appClientSecret: string, redirectUrl: string, source: string}>}
 */
export async function getAppConfig(userId, appName) {
  try {
    // Try to get from database first
    const dbConfig = await AppConfig.findOne({ userId, appName }).lean();
    
    if (dbConfig) {
      console.log(`[getAppConfig] Found config in DB for ${appName} (userId: ${userId})`);
      return {
        appClientId: dbConfig.appClientId,
        appClientSecret: dbConfig.appClientSecret,
        redirectUrl: dbConfig.redirectUrl,
        source: "database",
      };
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


