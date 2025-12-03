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

    const userFinder = await UserModel.findById(req.user._id).lean();
    if (!userFinder) {
      return res.status(404).json({ message: "User not found", status: false });
    }

    console.log("userFinder", userFinder);

    const savingObj = {
      userId: String(userFinder._id),
      appName: appname,
      appClientId,
      appClientSecret,
      redirectUrl,
      createdBy: userFinder._id,
    };

    console.log("savingObj", savingObj);

    const appConfigFinder = await AppConfig.findOne({
      userId: String(userFinder._id),
      appName: appname,
    });

    if (appConfigFinder) {
      const updatedAppConfig = await AppConfig.findOneAndUpdate(
        { userId: String(userFinder._id), appName: appname },
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
        name: "Facebook Pages",
        appname: "app/facebook",
        icon: "/icons/facebook.svg",
        description:
          "Manage Meta pages, publish carousels, and track engagement insights without leaving the dashboard.",
      },
      {
        id: 3,
        name: "LinkedIn",
        appname: "app/linkedin",
        icon: "https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png",
        description:
          "Share professional content, engage with your network, and grow your business presence on LinkedIn.",
      },
      {
        id: 4,
        name: "YouTube",
        appname: "app/youtube",
        icon: "https://upload.wikimedia.org/wikipedia/commons/4/42/YouTube_icon_%282013-2017%29.png",
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
