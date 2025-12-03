import fs from "fs";
import axios from "axios";
import path from "path";
import AppCredentials from "../../models/appcredentials.model.js";
import UserModel from "../../models/user.model.js";

// Redirect user to Google OAuth
export const redirectToGoogle = async (req, res) => {
  try {
    const scope = "https://www.googleapis.com/auth/youtube.force-ssl " + "https://www.googleapis.com/auth/youtube.upload";

    // Get userId from query parameter (passed from frontend) or from req.user
    let userIdToUse = null;
    
    // Priority 1: Query parameter (from frontend redirect with better-auth userId)
    if (req.query.userId) {
      userIdToUse = req.query.userId;
      console.log("[YouTube Auth] Using userId from query parameter:", userIdToUse);
    }
    // Priority 2: req.user._id (from middleware)
    else if (req.user?._id) {
      userIdToUse = String(req.user._id);
      console.log("[YouTube Auth] Using userId from req.user._id:", userIdToUse);
    }
    
    // If we have a userId, try to resolve it to MongoDB _id
    let mongoUserId = userIdToUse;
    if (userIdToUse) {
      try {
        let mongoUser = await UserModel.findById(userIdToUse).lean();
        
        if (!mongoUser) {
          const userEmail = req.headers["x-user-email"];
          if (userEmail) {
            console.log("[YouTube Auth] MongoDB user not found by _id, trying by email:", userEmail);
            mongoUser = await UserModel.findOne({ email: userEmail }).lean();
          }
        }
        
        if (mongoUser) {
          mongoUserId = String(mongoUser._id);
          console.log("[YouTube Auth] Resolved to MongoDB userId:", mongoUserId);
        } else {
          console.log("[YouTube Auth] MongoDB user not found, using provided userId as-is:", userIdToUse);
        }
      } catch (error) {
        console.log("[YouTube Auth] Error looking up user:", error.message);
        mongoUserId = userIdToUse;
      }
    }

    // Include user ID in state parameter for multi-tenant support
    let state = "default";
    if (mongoUserId) {
      state = Buffer.from(JSON.stringify({ userId: mongoUserId })).toString('base64');
      console.log("[YouTube Auth] Setting state with userId:", mongoUserId);
    }

    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${process.env.GOOGLE_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(process.env.GOOGLE_REDIRECT_URI)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scope)}` +
      `&access_type=offline` +
      `&prompt=consent` +
      `&state=${encodeURIComponent(state)}`;

    return res.redirect(authUrl);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "OAuth redirect failed" });
  }
};

// Handle callback from Google
export const youtubeCallback = async (req, res) => {
    const code = req.query.code;
    const { state } = req.query;
    
    // Extract user ID from state if available
    let userIdFromState = null;
    if (state) {
      try {
        const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
        userIdFromState = decoded.userId;
      } catch (e) {
        userIdFromState = state;
      }
    }
    
    // Multi-tenant: Use user's userId from state (most reliable for OAuth callbacks)
    // Priority: state > req.user._id > headers
    let userId = null;
    
    if (userIdFromState) {
      userId = String(userIdFromState);
      console.log("[YouTube Callback] Using userId from state:", userId);
    } else if (req.user?._id) {
      userId = String(req.user._id);
      console.log("[YouTube Callback] Using userId from req.user._id:", userId);
    } else {
      const betterAuthUserId = req.headers["x-user-id"];
      const userEmail = req.headers["x-user-email"];
      
      if (betterAuthUserId) {
        console.log("[YouTube Callback] Trying to resolve userId from headers:", betterAuthUserId);
        try {
          let mongoUser = await UserModel.findById(betterAuthUserId).lean();
          
          if (!mongoUser && userEmail) {
            console.log("[YouTube Callback] MongoDB user not found by _id, trying by email:", userEmail);
            mongoUser = await UserModel.findOne({ email: userEmail }).lean();
          }
          
          if (mongoUser) {
            userId = String(mongoUser._id);
            console.log("[YouTube Callback] Resolved to MongoDB userId:", userId);
          } else {
            console.log("[YouTube Callback] MongoDB user not found, using better-auth userId as-is:", betterAuthUserId);
            userId = betterAuthUserId;
          }
        } catch (error) {
          console.log("[YouTube Callback] Error looking up user:", error.message);
          userId = betterAuthUserId;
        }
      }
    }
    
    if (!userId) {
      console.error("[YouTube Callback] No userId found - state:", state, "req.user:", req.user?._id);
      return res.redirect(
        `${process.env.FRONTEND_URL}/integrations/youtube?error=unauthorized`
      );
    }
    
    console.log("[YouTube Callback] Final userId to use:", userId);
  
    if (!code) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/integrations/youtube?error=missing_code`
      );
    }
  
    try {
      const tokenRes = await axios.post("https://oauth2.googleapis.com/token", {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      });
  
      const tokens = {
        access_token: tokenRes.data.access_token,
        refresh_token: tokenRes.data.refresh_token,
        expires_in: tokenRes.data.expires_in,
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

      // Store credentials in database
      const credentials = {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in,
        expiry: tokens.expiry,
        channel: {
          id: channel?.id,
          title: channel?.snippet?.title,
          description: channel?.snippet?.description,
          thumbnail: channel?.snippet?.thumbnails?.default?.url,
          subscriberCount: channel?.statistics?.subscriberCount,
          videoCount: channel?.statistics?.videoCount,
        },
      };

      await AppCredentials.findOneAndUpdate(
        {
          userId,
          platform: "YOUTUBE",
        },
        {
          userId,
          platform: "YOUTUBE",
          credentials,
          createdBy: req.user?._id || null,
        },
        { upsert: true, new: true }
      );
  
      return res.redirect(
        `${process.env.FRONTEND_URL}/integrations/youtube?connected=1`
      );
    } catch (err) {
      console.log("YouTube OAuth error:", err.response?.data || err);
      return res.redirect(
        `${process.env.FRONTEND_URL}/integrations/youtube?error=token_error`
      );
    }
  };
  

// Auto-refresh
async function getValidAccessToken(userId) {
  const appCredential = await AppCredentials.findOne({
    userId,
    platform: "YOUTUBE",
  });

  if (!appCredential || !appCredential.credentials.refresh_token) {
    throw new Error("No refresh token found");
  }

  const tokens = appCredential.credentials;
  const now = Date.now();

  // Check if token is still valid (with 1 minute buffer)
  if (tokens.expiry && now < tokens.expiry - 60000) {
    return tokens.access_token;
  }

  // Refresh token
  const refreshRes = await axios.post("https://oauth2.googleapis.com/token", {
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    refresh_token: tokens.refresh_token,
    grant_type: "refresh_token",
  });

  const newAccessToken = refreshRes.data.access_token;
  const newExpiry = Date.now() + refreshRes.data.expires_in * 1000;

    // Update in database
    await AppCredentials.findOneAndUpdate(
      { userId, platform: "YOUTUBE" },
    {
      $set: {
        "credentials.access_token": newAccessToken,
        "credentials.expires_in": refreshRes.data.expires_in,
        "credentials.expiry": newExpiry,
      },
    }
  );

  return newAccessToken;
}

// Get YouTube channel info
export const getMyYouTubeChannel = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
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
    console.log(err.response?.data || err);
    return res.status(500).json({ message: "Failed to fetch channel info" });
  }
};


export const uploadYouTubeVideo = async (req, res) => {
    try {
      const file = req.file; // multer puts file info here
      const { title, description, privacyStatus = "public" } = req.body;
      if (!req.user?._id) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const orgNo = req.user?.orgNo || String(req.user._id);
  
      if (!file) {
        return res.status(400).json({ message: "No video uploaded" });
      }
  
      const accessToken = await getValidAccessToken(userId);
  
      // 1️⃣ Create YouTube Resumable Upload Session
      const createRes = await axios.post(
        "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
        {
          snippet: {
            title: title || "Untitled Video",
            description: description || "",
          },
          status: {
            privacyStatus: privacyStatus, // "public", "private", or "unlisted"
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json; charset=UTF-8",
            "X-Upload-Content-Length": file.size,
            "X-Upload-Content-Type": file.mimetype,
          },
        }
      );
  
      const uploadUrl = createRes.headers.location;
  
      // 2️⃣ Upload the actual file bytes
      const fileStream = fs.createReadStream(file.path);
  
      const uploadRes = await axios.put(uploadUrl, fileStream, {
        headers: {
          "Content-Length": file.size,
          "Content-Type": file.mimetype,
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });
  
      // 3️⃣ Cleanup uploaded file from temp folder
      fs.unlinkSync(file.path);
  
      return res.status(200).json({
        message: "Uploaded successfully to YouTube",
        youtubeResponse: uploadRes.data,
      });
    } catch (err) {
      console.log(err.response?.data || err);
      return res.status(500).json({ error: "Upload failed", details: err.response?.data || err.message });
    }
  };
