import mongoose from "mongoose";
import AppConfig from "../../models/appconfig.schema.js";
import AppCredentials from "../../models/appcredentials.model.js";
import { handleInstagramConnect } from "./connection-functions.js";

/**
 * ========================================================
 * Helper: Decode OAuth State
 * ========================================================
 */
const decodeOAuthState = (state) => {
  try {
    return JSON.parse(Buffer.from(state, "base64").toString("utf-8"));
  } catch {
    return null;
  }
};

/**
 * ========================================================
 * Resolve OAuth App Config
 *
 * Order:
 * 1. Reseller AppConfig (MANDATORY if resellerId exists)
 * 2. ENV fallback (ONLY if reseller config not found)
 * ========================================================
 */
export const resolveAppConfig = async (appName, resellerId) => {
  console.log("--------------------------------------------------");
  console.log("[resolveAppConfig] START");
  console.log("[resolveAppConfig] appName:", appName);
  console.log("[resolveAppConfig] resellerId (raw):", resellerId);
  console.log(
    "[resolveAppConfig] resellerId valid ObjectId:",
    resellerId && mongoose.Types.ObjectId.isValid(resellerId)
  );

  // 1️⃣ Try reseller config first
  if (resellerId && mongoose.Types.ObjectId.isValid(resellerId)) {
    const resellerObjectId = new mongoose.Types.ObjectId(resellerId);
    console.log("[resolveAppConfig] resellerObjectId:", resellerObjectId.toString());

    const resellerConfig = await AppConfig.findOne({
      appName,
      resellerId: resellerObjectId,
    }).lean();

    console.log(
      "[resolveAppConfig] DB QUERY RESULT:",
      resellerConfig ? "FOUND" : "NOT FOUND"
    );

    if (resellerConfig) {
      console.log("[resolveAppConfig] ✅ USING RESELLER CONFIG");
      console.log("[resolveAppConfig] resellerConfig:", resellerConfig);

      return {
        appClientId: resellerConfig.appClientId,
        appClientSecret: resellerConfig.appClientSecret,
        redirectUrl: resellerConfig.redirectUrl,
        source: "reseller",
      };
    }
  }

  console.warn("[resolveAppConfig] ⚠️ FALLING BACK TO ENV");

  const ENV_MAP = {
    "app/instagram": {
      appClientId: process.env.INSTAGRAM_APP_ID || process.env.META_APP_ID,
      appClientSecret:
        process.env.INSTAGRAM_APP_SECRET || process.env.META_APP_SECRET,
      redirectUrl: process.env.INSTAGRAM_REDIRECT_URI,
    },
    "app/facebook": {
      appClientId: process.env.FACEBOOK_APP_ID || process.env.META_APP_ID,
      appClientSecret:
        process.env.FACEBOOK_APP_SECRET || process.env.META_APP_SECRET,
      redirectUrl:
        process.env.FACEBOOK_REDIRECT_URI ||
        process.env.INSTAGRAM_REDIRECT_URI,
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

  console.log("[resolveAppConfig] ENV USED FOR:", appName);
  console.log("--------------------------------------------------");

  return ENV_MAP[appName]
    ? { ...ENV_MAP[appName], source: "env" }
    : null;
};


/**
 * ========================================================
 * SAVE / UPDATE APP CONFIG (RESELLER ONLY)
 * ========================================================
 */
export const appSaveConfigController = async (req, res) => {
  try {
    if (!req.user?._id || req.user.role !== "reseller") {
      return res.status(403).json({
        status: false,
        message: "Only resellers can configure OAuth apps",
      });
    }

    const { clientId, clientSecret, redirectUrl, appname } = req.body;
    const resellerId = req.user.resellerId;

    if (!mongoose.Types.ObjectId.isValid(resellerId)) {
      return res.status(400).json({
        status: false,
        message: "Invalid resellerId",
      });
    }
    console.log("[appSaveConfigController] Saving config:");
    console.log("appname:", appname);
    console.log("resellerId:", resellerId);
    console.log("clientId:", clientId);
    console.log("clientSecret:", clientSecret);
    console.log("redirectUrl:", redirectUrl);


    const saved = await AppConfig.findOneAndUpdate(
      {
        appName: appname,
        resellerId: new mongoose.Types.ObjectId(resellerId),
      },
      {
        appName: appname,
        resellerId: new mongoose.Types.ObjectId(resellerId),
        appClientId: clientId,
        appClientSecret: clientSecret,
        redirectUrl,
        createdBy: req.user._id,
      },
      { upsert: true, new: true }
    );

    return res.json({
      status: true,
      message: "App Config Saved Successfully",
      data: saved,
    });
  } catch (error) {
    console.error("[appSaveConfigController]", error);
    return res.status(500).json({ status: false, message: error.message });
  }
};

/**
 * ========================================================
 * GET AVAILABLE INTEGRATIONS
 * ========================================================
 */
export const getAppsArry = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ status: false, message: "Unauthorized" });
    }

    const resellerId = req.user.resellerId;
    const userId = String(req.user._id);

    const connectedPlatforms = await AppCredentials.find({
      userId,
      platform: { $in: ["FACEBOOK", "INSTAGRAM", "LINKEDIN", "YOUTUBE"] },
    }).lean();

    const baseIntegrations = [
      { name: "Instagram", appname: "app/instagram", platform: "INSTAGRAM" },
      { name: "Facebook Page", appname: "app/facebook", platform: "FACEBOOK" },
      { name: "LinkedIn", appname: "app/linkedin", platform: "LINKEDIN" },
      { name: "YouTube", appname: "app/youtube", platform: "YOUTUBE" },
    ];

    const integrations = await Promise.all(
      
      baseIntegrations.map(async (integration) => {
        console.log("[getAppsArry] resellerId from req.user:", req.user.resellerId);
        const config = await resolveAppConfig(
          integration.appname,
          resellerId
        );

        return {
          ...integration,
          connected: connectedPlatforms.some(
            (p) => p.platform === integration.platform
          ),
          config: config
            ? {
                appClientId: config.appClientId,
                redirectUrl: config.redirectUrl,
                source: config.source,
              }
            : null,
        };
      })
    );

    return res.json({ status: true, data: { integrations } });
  } catch (error) {
    console.error("[getAppsArry]", error);
    return res.status(500).json({ status: false, message: error.message });
  }
};

/**
 * ========================================================
 * HANDLE CONNECT (OAUTH CALLBACK)
 * ========================================================
 */
export const handleTheConnect = async (req, res) => {
  try {
    const { code, appname, state } = req.body;

    // Restore user context from OAuth state (IMPORTANT)
    if (!req.user && state) {
      const decoded = decodeOAuthState(state);
      if (decoded?.userId) {
        req.user = {
          _id: decoded.userId,
          resellerId: decoded.resellerId || null,
        };
      }
    }

    if (!req.user?._id) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized OAuth callback",
      });
    }

    const appConfig = await resolveAppConfig(
      appname,
      req.user.resellerId
    );

    if (!appConfig) {
      return res.status(400).json({
        status: false,
        message: "OAuth app not configured",
      });
    }

    if (appname === "app/instagram") {
      return await handleInstagramConnect(req, res, code, appConfig);
    }

    return res.status(400).json({
      status: false,
      message: "Unsupported platform",
    });
  } catch (error) {
    console.error("[handleTheConnect]", error);
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};
