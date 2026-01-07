import fs from "fs";
import axios from "axios";
import path from "path";
import AppCredentials from "../../models/appcredentials.model.js";
import UserModel from "../../models/user.model.js";
import { resolveAppConfig } from "../appconfig/app.controller.js";


// Redirect user to Google OAuth
export const redirectToGoogle = async (req, res) => {
  try {
    const scope =
      "https://www.googleapis.com/auth/youtube.force-ssl " +
      "https://www.googleapis.com/auth/youtube.upload";

    // 1️⃣ Get userId from query or req.user
    const userId = req.query.userId || req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "User not identified" });
    }

    console.log("[YouTube Connect] Initial userId:", userId);
    console.log("[YouTube Connect] req.user:", req.user);
    console.log("[YouTube Connect] req.query.resellerId:", req.query.resellerId);

    // 2️⃣ Get resellerId from multiple sources (priority order):
    // Priority 1: Query parameter (from frontend)
    // Priority 2: req.user (from auth middleware headers)
    // Priority 3: Local database lookup
    let resellerId = req.query.resellerId || req.user?.resellerId || null;

    console.log("[YouTube Connect] resellerId from query/headers:", resellerId);
    console.log("[YouTube Connect] req.user.role:", req.user?.role);

    // If resellerId is not in req.user, try to get it from this project's UserModel
    // (in case some users exist in both databases)
    if (!resellerId) {
      try {
        const localUser = await UserModel.findById(userId)
          .select("resellerId")
          .lean();
        
        if (localUser?.resellerId) {
          resellerId = typeof localUser.resellerId === 'object' && localUser.resellerId._id
            ? String(localUser.resellerId._id)
            : String(localUser.resellerId);
          console.log("[YouTube Connect] Found resellerId in local DB:", resellerId);
        } else {
          console.log("[YouTube Connect] No resellerId found in local DB");
        }
      } catch (error) {
        console.log("[YouTube Connect] Local DB lookup skipped:", error.message);
      }
    }

    console.log("[YouTube Connect] Final userId:", userId);
    console.log("[YouTube Connect] Final resellerId:", resellerId);

    // 3️⃣ Resolve app config
    const youtubeConfig = await resolveAppConfig(
      "app/youtube",
      resellerId
    );

    if (!youtubeConfig?.appClientId || !youtubeConfig?.redirectUrl) {
      return res.status(500).json({
        message: "YouTube OAuth not configured",
      });
    }

    console.log(
      "[YouTube Connect] USING:",
      youtubeConfig.source,
      youtubeConfig.appClientId
    );

    // 4️⃣ Build state with userId and resellerId for callback
    const state = Buffer.from(
      JSON.stringify({
        userId: String(userId),
        resellerId: resellerId,
      })
    ).toString("base64");

    // 5️⃣ Redirect
    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${youtubeConfig.appClientId}` +
      `&redirect_uri=${encodeURIComponent(youtubeConfig.redirectUrl)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scope)}` +
      `&access_type=offline` +
      `&prompt=consent` +
      `&state=${state}`;

    return res.redirect(authUrl);
  } catch (err) {
    console.error("[YouTube OAuth ERROR]", err);
    return res.status(500).json({ message: "OAuth redirect failed" });
  }
};


// Handle callback from Google
export const youtubeCallback = async (req, res) => {
  const { code, state } = req.query;

  let userId = null;
  let resellerId = null;

  // Decode state to get userId and resellerId
  if (state) {
    try {
      const decoded = JSON.parse(
        Buffer.from(state, "base64").toString()
      );
      userId = decoded.userId;
      resellerId = decoded.resellerId || null;
    } catch {
      // Fallback if state is just userId string
      userId = state;
    }
  }

  // Fallback to req.user if available
  if (!userId && req.user?._id) {
    userId = req.user._id;
    resellerId = req.user.resellerId || null;
  }

  if (!userId) {
    return res.redirect(
      `${process.env.FRONTEND_URL}/integrations/youtube?error=unauthorized`
    );
  }

  try {
    console.log("[YouTube Callback] userId:", userId);
    console.log("[YouTube Callback] resellerId:", resellerId);

    // ✅ Resolve YouTube config with resellerId
    const youtubeConfig = await resolveAppConfig(
      "app/youtube",
      resellerId
    );

    if (
      !youtubeConfig?.appClientId ||
      !youtubeConfig?.appClientSecret ||
      !youtubeConfig?.redirectUrl
    ) {
      console.error("[YouTube Callback] Config missing");
      return res.redirect(
        `${process.env.FRONTEND_URL}/integrations/youtube?error=config_error`
      );
    }

    console.log(
      "[YouTube Callback] USING:",
      youtubeConfig.source,
      youtubeConfig.appClientId
    );

    // Exchange code for tokens
    const tokenRes = await axios.post(
      "https://oauth2.googleapis.com/token",
      {
        code,
        client_id: youtubeConfig.appClientId,
        client_secret: youtubeConfig.appClientSecret,
        redirect_uri: youtubeConfig.redirectUrl,
        grant_type: "authorization_code",
      }
    );

    const tokens = {
      access_token: tokenRes.data.access_token,
      refresh_token: tokenRes.data.refresh_token,
      expiry: Date.now() + tokenRes.data.expires_in * 1000,
    };

    // Get YouTube channel info
    const ytRes = await axios.get(
      "https://www.googleapis.com/youtube/v3/channels",
      {
        params: { part: "snippet,statistics", mine: true },
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      }
    );

    const channel = ytRes.data.items?.[0];

    // Save credentials to database
    await AppCredentials.findOneAndUpdate(
      { userId, platform: "YOUTUBE" },
      {
        userId,
        platform: "YOUTUBE",
        credentials: {
          ...tokens,
          channel: {
            id: channel?.id,
            title: channel?.snippet?.title,
            thumbnail: channel?.snippet?.thumbnails?.default?.url,
            subscriberCount: channel?.statistics?.subscriberCount,
          },
        },
      },
      { upsert: true, new: true }
    );

    return res.redirect(
      `${process.env.FRONTEND_URL}/integrations/youtube?connected=1`
    );
  } catch (err) {
    console.error("[YouTube Callback ERROR]", err);
    return res.redirect(
      `${process.env.FRONTEND_URL}/integrations/youtube?error=token_error`
    );
  }
};

// Auto-refresh access token
async function getValidAccessToken(userId, resellerId = null) {
  const appCredential = await AppCredentials.findOne({
    userId,
    platform: "YOUTUBE",
  });

  if (!appCredential?.credentials?.refresh_token) {
    throw new Error("No refresh token found");
  }

  // Check if token is still valid (with 1 minute buffer)
  if (appCredential.credentials.expiry > Date.now() + 60000) {
    return appCredential.credentials.access_token;
  }

  console.log("[YouTube Token Refresh] Refreshing token for userId:", userId);
  console.log("[YouTube Token Refresh] resellerId:", resellerId);

  // ✅ Resolve YouTube config with resellerId
  const youtubeConfig = await resolveAppConfig(
    "app/youtube",
    resellerId
  );

  if (!youtubeConfig?.appClientId || !youtubeConfig?.appClientSecret) {
    throw new Error("YouTube OAuth not configured");
  }

  console.log(
    "[YouTube Token Refresh] USING:",
    youtubeConfig.source,
    youtubeConfig.appClientId
  );

  // Refresh the token
  const refreshRes = await axios.post(
    "https://oauth2.googleapis.com/token",
    {
      client_id: youtubeConfig.appClientId,
      client_secret: youtubeConfig.appClientSecret,
      refresh_token: appCredential.credentials.refresh_token,
      grant_type: "refresh_token",
    }
  );

  const newExpiry = Date.now() + refreshRes.data.expires_in * 1000;

  // Update credentials in database
  await AppCredentials.findOneAndUpdate(
    { userId, platform: "YOUTUBE" },
    {
      $set: {
        "credentials.access_token": refreshRes.data.access_token,
        "credentials.expiry": newExpiry,
      },
    }
  );

  return refreshRes.data.access_token;
}

// Get YouTube channel info
export const getMyYouTubeChannel = async (req, res) => {
  try {
    const userId = String(req.user._id);

    const appCredential = await AppCredentials.findOne({
      userId,
      platform: "YOUTUBE",
    });

    if (!appCredential) {
      return res.status(404).json({ message: "YouTube not connected" });
    }

    return res.json({
      connected: true,
      channel: appCredential.credentials.channel,
    });
  } catch (err) {
    console.error("[Get YouTube Channel ERROR]", err);
    return res.status(500).json({ message: "Failed to fetch channel info" });
  }
};

// Upload video
export const uploadYouTubeVideo = async (req, res) => {
  try {
    const userId = String(req.user._id);
    const resellerId = req.user?.resellerId || null;

    console.log("[YouTube Upload] userId:", userId);
    console.log("[YouTube Upload] resellerId:", resellerId);

    // Get valid access token (will auto-refresh if needed)
    const accessToken = await getValidAccessToken(userId, resellerId);

    const file = req.file;
    const { title, description, privacyStatus = "public" } = req.body;

    if (!file) {
      return res.status(400).json({ message: "No video file provided" });
    }

    // Create video resource
    const createRes = await axios.post(
      "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
      {
        snippet: { title, description },
        status: { privacyStatus },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Upload-Content-Length": file.size,
          "X-Upload-Content-Type": file.mimetype,
        },
      }
    );

    // Upload video file
    await axios.put(
      createRes.headers.location,
      fs.createReadStream(file.path),
      {
        headers: {
          "Content-Length": file.size,
          "Content-Type": file.mimetype,
        },
        maxBodyLength: Infinity,
      }
    );

    // Clean up uploaded file
    fs.unlinkSync(file.path);

    return res.json({ message: "Uploaded successfully to YouTube" });
  } catch (err) {
    console.error("[YouTube Upload ERROR]", err);
    
    // Clean up file on error
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    return res.status(500).json({ 
      message: "Upload failed",
      error: err.message 
    });
  }
};