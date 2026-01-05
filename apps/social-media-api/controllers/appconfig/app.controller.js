import AppConfig from "../../models/appconfig.schema.js";
import AppCredentials from "../../models/appcredentials.model.js";
import UserModel from "../../models/user.model.js";
import { handleInstagramConnect } from "./connection-functions.js";

export const appSaveConfigController = async (req, res) => {
  try {
    const {
      clientId: appClientId,
      clientSecret: appClientSecret,
      redirectUrl,
      appname,
    } = req.body;

    if (!req.user?._id) {
      return res
        .status(401)
        .json({ message: "Authentication required", status: false });
    }

    // Use better-auth userId directly - don't require MongoDB user lookup
    // User might be in a different database
    const userId = String(req.user._id);
    const userEmail = req.headers["x-user-email"];
    
    // Optionally try to find MongoDB user for createdBy field, but don't require it
    let createdBy = userId; // Default to better-auth userId
    try {
      const userFinder = await UserModel.findById(userId).lean();
      if (userFinder) {
        createdBy = userFinder._id;
        console.log("MongoDB user found for createdBy:", userFinder._id);
      } else if (userEmail) {
        // Try by email as fallback
        const userByEmail = await UserModel.findOne({ email: userEmail }).lean();
        if (userByEmail) {
          createdBy = userByEmail._id;
          console.log("MongoDB user found by email for createdBy:", userByEmail._id);
        } else {
          console.log("MongoDB user not found, using better-auth userId for createdBy");
        }
      }
    } catch (error) {
      // Ignore MongoDB lookup errors - user might be in different database
      console.log("MongoDB lookup skipped (user may be in different database), using better-auth userId");
    }

    const savingObj = {
      userId: userId, // Use better-auth userId directly
      appName: appname,
      appClientId,
      appClientSecret,
      redirectUrl,
      createdBy: createdBy, // Use MongoDB _id if found, otherwise better-auth userId
    };

    console.log("savingObj", savingObj);

    const appConfigFinder = await AppConfig.findOne({
      userId: userId,
      appName: appname,
    });

    if (appConfigFinder) {
      const updatedAppConfig = await AppConfig.findOneAndUpdate(
        { userId: userId, appName: appname },
        { appClientId, appClientSecret, redirectUrl },
        { new: true }
      );

      return res.status(200).json({
        message: "App Config Updated Successfully",
        status: true,
        data: updatedAppConfig,
      });
    }

    const createAppConfig = new AppConfig(savingObj);
    await createAppConfig.save();

    res.status(200).json({
      message: "App Config Saved Successfully",
      status: true,
      data: createAppConfig,
    });
  } catch (error) {
    console.log("err in saving app config", error);
    return res.status(500).json({ message: error.message, status: false });
  }
};

export const getAppsArry = async (req, res) => {
  try {
    // Multi-tenant: Each user has their own userId
    // Use user._id as userId - each user is isolated
    if (!req.user?._id) {
      return res.status(401).json({ message: "Unauthorized", status: false });
    }
    
    const userId = String(req.user._id);
    
    console.log("[getAppsArry] Checking connections with userId:", userId);
    console.log("[getAppsArry] req.user:", req.user);
    
    let appConfigsFinder = [];
    let connectedPlatforms = [];

    // Query only this user's organization
    appConfigsFinder = await AppConfig.find({ userId }).lean();
    // Check which platforms are actually connected for this user
    connectedPlatforms = await AppCredentials.find({
      userId,
      platform: { $in: ["FACEBOOK", "INSTAGRAM", "LINKEDIN", "YOUTUBE"] },
    }).lean();
    
    console.log("[getAppsArry] Found connected platforms:", connectedPlatforms.map(p => ({ platform: p.platform, userId: p.userId })));

    console.log("[appconfig] Loaded env credentials", {
      hasInstagram: Boolean(process.env.INSTAGRAM_APP_ID || process.env.META_APP_ID),
      hasFacebook: Boolean(process.env.FACEBOOK_APP_ID || process.env.META_APP_ID),
      hasLinkedIn: Boolean(process.env.LINKEDIN_CLIENT_ID),
      hasYouTube: Boolean(process.env.GOOGLE_CLIENT_ID),
    });

    const envConfigs = {
      "app/instagram": {
        appClientId: process.env.INSTAGRAM_APP_ID || process.env.META_APP_ID,
        appClientSecret: process.env.INSTAGRAM_APP_SECRET || process.env.META_APP_SECRET,
        redirectUrl: process.env.INSTAGRAM_REDIRECT_URI,
        source: "env",
      },
      "app/facebook": {
        appClientId: process.env.FACEBOOK_APP_ID || process.env.META_APP_ID,
        appClientSecret: process.env.FACEBOOK_APP_SECRET || process.env.META_APP_SECRET,
        redirectUrl: process.env.FACEBOOK_REDIRECT_URI || process.env.INSTAGRAM_REDIRECT_URI,
        source: "env",
      },
      "app/linkedin": {
        appClientId: process.env.LINKEDIN_CLIENT_ID,
        appClientSecret: process.env.LINKEDIN_CLIENT_SECRET,
        redirectUrl: process.env.LINKEDIN_REDIRECT_URI,
        source: "env",
      },
      "app/youtube": {
        appClientId: process.env.GOOGLE_CLIENT_ID,
        appClientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUrl: process.env.GOOGLE_REDIRECT_URI,
        source: "env",
      },
    };

    const baseIntegrations = [
      {
        id: 1,
        name: "Instagram",
        appname: "app/instagram",
        icon: "/icons/instagram.png",
        description:
          "Schedule reels, reply to DMs, and keep your community engaged with creator-first workflows.",
      },
      {
        id: 2,
        name: "Facebook Page",
        appname: "app/facebook",
        icon: "/icons/facebook.png",
        description:
          "Manage Meta pages, publish carousels, and track engagement insights without leaving the dashboard.",
      },
      {
        id: 3,
        name: "LinkedIn",
        appname: "app/linkedin",
        icon: "icons/linkedin.png",
        description:
          "Share professional content, engage with your network, and grow your business presence on LinkedIn.",
      },
      {
        id: 4,
        name: "YouTube",
        appname: "app/youtube",
        icon: "icons/youtube.png",
        description:
          "Upload videos, manage your channel, and engage with your audience on the world's largest video platform.",
      },
    ];

    const integrations = baseIntegrations.map((integration) => {
      const envConfig = envConfigs[integration.appname];

      const matchedConfig = envConfig?.appClientId
        ? envConfig
        : appConfigsFinder.find(
        (app) => app.appName === integration.appname
          );

      // Check if platform is actually connected
      const platformMap = {
        "app/instagram": "INSTAGRAM",
        "app/facebook": "FACEBOOK",
        "app/linkedin": "LINKEDIN",
        "app/youtube": "YOUTUBE",
      };

      const platformName = platformMap[integration.appname];
      const isConnected = connectedPlatforms.some(
        (cp) => cp.platform === platformName
      );

      return {
        ...integration,
        connected: isConnected,
        config: matchedConfig
          ? {
              appClientId: matchedConfig.appClientId,
              appClientSecret: matchedConfig.appClientSecret,
              redirectUrl: matchedConfig.redirectUrl,
              source: matchedConfig.source || "user",
            }
          : null,
      };
    });

    return res.status(200).json({
      message: "App Config Fetched Successfully",
      status: true,
      data: { integrations },
    });
  } catch (error) {
    console.log("err in getting app config", error);
    return res.status(500).json({ message: error.message, status: false });
  }
};

export const handleTheConnect = async (req, res) => {
  try {
    const { code, appname } = req.body;

    if (!req.user?._id) {
      return res
        .status(401)
        .json({ message: "Authentication required", status: false });
    }

    const appCredFinder = await AppConfig.findOne({
      userId: String(req.user._id),
      appName: appname,
    }).lean();

    if (!appCredFinder) {
      return res.status(400).json({ message: "App credentials not found" });
    }
    if (appname === "app/instagram") {
      await handleInstagramConnect(req, res, code, appCredFinder);
    }
  } catch (error) {
    console.log("error in connect instagram", error);
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};
