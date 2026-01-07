import axios from "axios";
import AppCredentials from "../../models/appcredentials.model.js";
import UserModel from "../../models/user.model.js";
import { resolveAppConfig } from "../appconfig/app.controller.js";

// 1️⃣ Redirect user to Instagram Business Login OAuth
export const redirectToFB = async (req, res) => {
  // Instagram Business Login scopes (using instagram_business_* scopes)
  const scopes = [
    "instagram_business_basic",
    "instagram_business_manage_messages",
    "instagram_business_manage_comments",
    "instagram_business_content_publish",
    "instagram_business_manage_insights",
  ];

  // 1️⃣ Get userId from query or req.user
  const userId = req.query.userId || req.user?._id;

  if (!userId) {
    return res.status(401).json({ error: "User not identified" });
  }

  console.log("[Instagram Auth] Initial userId:", userId);
  console.log("[Instagram Auth] req.user:", req.user);
  console.log("[Instagram Auth] req.query.resellerId:", req.query.resellerId);

  // 2️⃣ Get resellerId from multiple sources (priority order)
  // Priority 1: Query parameter (from frontend)
  // Priority 2: req.user (from auth middleware headers)
  // Priority 3: Local database lookup (fallback)
  let resellerId = req.query.resellerId || req.user?.resellerId || null;

  console.log("[Instagram Auth] resellerId from query/headers:", resellerId);

  // If resellerId not found, try local DB lookup as fallback
  if (!resellerId) {
    try {
      const localUser = await UserModel.findById(userId)
        .select("resellerId")
        .lean();
      
      if (localUser?.resellerId) {
        resellerId = typeof localUser.resellerId === 'object' && localUser.resellerId._id
          ? String(localUser.resellerId._id)
          : String(localUser.resellerId);
        console.log("[Instagram Auth] Found resellerId in local DB:", resellerId);
      }
    } catch (error) {
      console.log("[Instagram Auth] Local DB lookup skipped:", error.message);
    }
  }

  console.log("[Instagram Auth] Final userId:", userId);
  console.log("[Instagram Auth] Final resellerId:", resellerId);

  // ✅ Build state with userId and resellerId for callback
  const state = Buffer.from(
    JSON.stringify({
      userId: String(userId),
      resellerId: resellerId,
    })
  ).toString('base64');

  // 3️⃣ Resolve app config with resellerId
  const instagramConfig = await resolveAppConfig(
    "app/instagram",
    resellerId
  );

  if (!instagramConfig?.appClientId || !instagramConfig?.redirectUrl) {
    return res.status(500).json({ 
      error: "Instagram OAuth not configured",
      source: instagramConfig?.source 
    });
  }

  console.log(
    "[Instagram Auth] USING:",
    instagramConfig.source,
    instagramConfig.appClientId
  );

  // Instagram Business Login - Use Instagram's OAuth endpoint directly
  const loginUrl =
    `https://www.instagram.com/oauth/authorize` +
    `?client_id=${instagramConfig.appClientId}` +
    `&redirect_uri=${encodeURIComponent(instagramConfig.redirectUrl)}` +
    `&scope=${scopes.join(",")}` +
    `&response_type=code` +
    `&state=${encodeURIComponent(state)}` +
    `&force_reauth=true`;

  console.log("[Instagram Business Login] Redirecting to Instagram OAuth");
  return res.redirect(loginUrl);
};


// 2️⃣ Callback from Instagram Business Login OAuth
export const instagramCallback = async (req, res) => {
  const { code, state } = req.query;
  
  // ✅ Extract userId and resellerId from state
  let userIdFromState = null;
  let resellerIdFromState = null;
  
  if (state) {
    try {
      const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
      userIdFromState = decoded.userId;
      resellerIdFromState = decoded.resellerId;
      console.log("[Instagram Callback] Extracted from state:", { userId: userIdFromState, resellerId: resellerIdFromState });
    } catch (e) {
      userIdFromState = state;
      console.log("[Instagram Callback] State is not JSON, using as userId:", userIdFromState);
    }
  }
  
  // Get userId (priority: state > req.user > headers)
  let userId = userIdFromState || req.user?._id || null;
  
  if (!userId) {
    console.error("[Instagram Callback] No userId found");
    return res.redirect(
      `${process.env.FRONTEND_URL}/integrations/instagram?error=unauthorized`
    );
  }
  
  console.log("[Instagram Callback] Final userId:", userId);

  if (!code) {
    return res.redirect(
      `${process.env.FRONTEND_URL}/integrations/instagram?error=missing_code`
    );
  }

  try {
    // ✅ Get resellerId (priority: state > req.user > headers > DB)
    let resellerId = resellerIdFromState || req.user?.resellerId || req.headers["x-reseller-id"];
    
    console.log("[Instagram Callback] resellerId from state/headers:", resellerId);

    // Fallback to DB lookup
    if (!resellerId) {
      try {
        const localUser = await UserModel.findById(userId).select("resellerId").lean();
        if (localUser?.resellerId) {
          resellerId = String(localUser.resellerId);
          console.log("[Instagram Callback] Found resellerId in local DB:", resellerId);
        }
      } catch (error) {
        console.log("[Instagram Callback] DB lookup skipped:", error.message);
      }
    }

    console.log("[Instagram Callback] Final resellerId:", resellerId);

    // ✅ Resolve app config with resellerId
    const instagramConfig = await resolveAppConfig(
      "app/instagram",
      resellerId
    );

    if (!instagramConfig?.appClientId || !instagramConfig?.appClientSecret || !instagramConfig?.redirectUrl) {
      console.error("[Instagram Callback] Instagram app credentials not configured");
      return res.redirect(
        `${process.env.FRONTEND_URL}/integrations/instagram?error=config_error`
      );
    }

    console.log("[Instagram Callback] USING:", instagramConfig.source, instagramConfig.appClientId);

    // Step 1: Exchange code → short-lived Instagram User access token
    console.log("[Instagram Callback] Exchanging code for token...");
    
    const shortToken = await axios.post(
      "https://api.instagram.com/oauth/access_token",
      new URLSearchParams({
        client_id: instagramConfig.appClientId,
        client_secret: instagramConfig.appClientSecret,
        grant_type: "authorization_code",
        redirect_uri: instagramConfig.redirectUrl,
        code,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    
    console.log("[Instagram Callback] Token exchange response:", JSON.stringify(shortToken.data, null, 2));
    
    // Handle response format
    let tokenData;
    if (Array.isArray(shortToken.data.data)) {
      tokenData = shortToken.data.data[0];
    } else if (shortToken.data.access_token) {
      tokenData = shortToken.data;
    } else {
      console.error("[Instagram Callback] Unexpected token response format:", shortToken.data);
      throw new Error("Unexpected token response format");
    }

    if (!tokenData?.access_token) {
      console.error("[Instagram Callback] No access token in response:", tokenData);
      throw new Error("Failed to get access token from Instagram");
    }

    const shortLivedToken = tokenData.access_token;
    const userIdFromToken = tokenData.user_id;
    console.log("[Instagram Callback] ✅ Short-lived token obtained");
    console.log("[Instagram Callback] User ID from token:", userIdFromToken);
    
    const instagramUserIdFromToken = userIdFromToken;

    // Step 2: Exchange short-lived → long-lived token
    console.log("[Instagram Callback] Exchanging short-lived token for long-lived token...");
    let longLivedToken = shortLivedToken;
    let tokenExpiresIn = 3600;
    
    try {
      // Try GET first
      try {
        const longTokenRes = await axios.get(
          "https://graph.instagram.com/access_token",
          {
            params: {
              grant_type: "ig_exchange_token",
              client_secret: instagramConfig.appClientSecret,
              access_token: shortLivedToken,
            },
          }
        );
        
        if (longTokenRes.data?.access_token) {
          longLivedToken = longTokenRes.data.access_token;
          tokenExpiresIn = longTokenRes.data.expires_in || 5184000;
          console.log("[Instagram Callback] ✅ Long-lived token obtained via GET!");
        }
      } catch (getError) {
        // Try POST
        console.log("[Instagram Callback] GET failed, trying POST...");
        
        const longTokenRes = await axios.post(
          "https://graph.instagram.com/access_token",
          new URLSearchParams({
            grant_type: "ig_exchange_token",
            client_secret: instagramConfig.appClientSecret,
            access_token: shortLivedToken,
          }),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }
        );
        
        if (longTokenRes.data?.access_token) {
          longLivedToken = longTokenRes.data.access_token;
          tokenExpiresIn = longTokenRes.data.expires_in || 5184000;
          console.log("[Instagram Callback] ✅ Long-lived token obtained via POST!");
        }
      }
    } catch (exchangeError) {
      console.error("[Instagram Callback] Token exchange failed, using short-lived token");
    }

    // Step 3: Get Instagram user info
    console.log("[Instagram Callback] Fetching Instagram user info...");
    let userRes;
    
    try {
      let meResponse;
      try {
        meResponse = await axios.get(
          "https://graph.instagram.com/v24.0/me",
          {
            params: {
              fields: "id,user_id,username,name,account_type,profile_picture_url,followers_count,follows_count,media_count",
              access_token: longLivedToken,
            },
          }
        );
      } catch (getError) {
        meResponse = await axios.post(
          "https://graph.instagram.com/v24.0/me",
          new URLSearchParams({
            fields: "id,user_id,username,name,account_type,profile_picture_url,followers_count,follows_count,media_count",
            access_token: longLivedToken,
          }),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }
        );
      }
      
      let userData;
      if (Array.isArray(meResponse.data.data)) {
        userData = meResponse.data.data[0];
      } else if (meResponse.data.user_id || meResponse.data.username) {
        userData = meResponse.data;
      } else {
        throw new Error("Unexpected response format from /me endpoint");
      }
      
      userRes = {
        data: {
          id: userData.id || userData.user_id,
          user_id: userData.user_id,
          username: userData.username,
          name: userData.name || userData.username,
          account_type: userData.account_type || "BUSINESS",
          profile_picture_url: userData.profile_picture_url,
          followers_count: userData.followers_count,
          follows_count: userData.follows_count,
          media_count: userData.media_count,
        },
      };
      
    } catch (igError) {
      console.error("[Instagram Callback] Failed to get user info:", igError.response?.data || igError.message);
      
      if (instagramUserIdFromToken) {
        userRes = {
          data: {
            id: instagramUserIdFromToken,
            user_id: instagramUserIdFromToken,
            username: `instagram_${instagramUserIdFromToken}`,
            account_type: "BUSINESS",
          },
        };
      } else {
        userRes = {
          data: {
            id: "unknown",
            user_id: "unknown",
            username: "Instagram Account",
            account_type: "BUSINESS",
          },
        };
      }
    }

    // Step 4: Store credentials
    const credentials = {
      instagram_user_access_token: longLivedToken,
      token_expires_in: tokenExpiresIn,
      instagram_user_id: userRes.data.id,
      instagram_account_id: userRes.data.user_id,
      instagram_username: userRes.data.username,
      instagram_name: userRes.data.name || userRes.data.username,
      instagram_profile_picture: userRes.data.profile_picture_url,
      instagram_account_type: userRes.data.account_type || "BUSINESS",
      instagram_followers_count: userRes.data.followers_count,
      instagram_media_count: userRes.data.media_count,
    };
    
    if (!credentials.instagram_account_id) {
      console.error("[Instagram Callback] Missing user_id (IG_ID)");
      return res.redirect(
        `${process.env.FRONTEND_URL}/integrations/instagram?error=missing_user_id`
      );
    }
    
    if (!credentials.instagram_username) {
      console.error("[Instagram Callback] Missing username");
      return res.redirect(
        `${process.env.FRONTEND_URL}/integrations/instagram?error=missing_username`
      );
    }

    try {
      const savedCredential = await AppCredentials.findOneAndUpdate(
        {
          userId: String(userId),
          platform: "INSTAGRAM",
        },
        {
          userId: String(userId),
          platform: "INSTAGRAM",
          credentials,
          createdBy: req.user?._id || null,
        },
        { upsert: true, new: true, runValidators: true }
      );

      if (!savedCredential) {
        throw new Error("Failed to save credentials");
      }

      console.log("[Instagram Callback] ✅ Credentials saved successfully");

      return res.redirect(
        `${process.env.FRONTEND_URL}/integrations/instagram?connected=1`
      );
    } catch (dbError) {
      console.error("[Instagram Callback] Database error:", dbError.message);
      
      return res.redirect(
        `${process.env.FRONTEND_URL}/integrations/instagram?error=database_error&details=${encodeURIComponent(dbError.message)}`
      );
    }
  } catch (err) {
    console.error("[Instagram Callback] OAuth error:", err.message);
    return res.redirect(
      `${process.env.FRONTEND_URL}/integrations/instagram?error=oauth_failed&details=${encodeURIComponent(err.message)}`
    );
  }
};


// 3️⃣ Return Instagram account details
export const getInstagramDetails = async (req, res) => {
  try {
    const userId = req.user?._id ? String(req.user._id) : req.query.userId;

    if (!userId) {
      return res.json({ connected: false });
    }

    const appCredential = await AppCredentials.findOne({
      userId,
      platform: "INSTAGRAM",
    });

    if (!appCredential || !appCredential.credentials.instagram_account_id) {
      if (appCredential?.credentials?.pages?.length) {
        return res.json({
          connected: true,
          instagram: {
            username: appCredential.credentials.pages[0].instagram_username,
            profile_picture_url: appCredential.credentials.pages[0].instagram_profile_picture,
            account_id: appCredential.credentials.pages[0].instagram_account_id,
          },
          pages: appCredential.credentials.pages,
        });
      }
      return res.json({ connected: false });
    }

    return res.json({
      connected: true,
      instagram: {
        username: appCredential.credentials.instagram_username,
        profile_picture_url: appCredential.credentials.instagram_profile_picture,
        account_id: appCredential.credentials.instagram_account_id,
        name: appCredential.credentials.instagram_name,
        account_type: appCredential.credentials.instagram_account_type,
        followers_count: appCredential.credentials.instagram_followers_count,
        media_count: appCredential.credentials.instagram_media_count,
      },
    });
  } catch (err) {
    console.log("Error getting Instagram details:", err.response?.data || err);
    return res.json({ connected: false });
  }
};

// 4️⃣ Upload media to Instagram
export const uploadInstagramMedia = async (req, res) => {
  try {
    const { imageUrl, caption } = req.body;
    if (!req.user?._id) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const userId = String(req.user._id);

    const appCredential = await AppCredentials.findOne({
      userId,
      platform: "INSTAGRAM",
    });

    if (!appCredential) {
      return res.status(404).json({ error: "Instagram not connected" });
    }

    const igAccountId = appCredential.credentials.instagram_account_id;
    const instagramToken = appCredential.credentials.instagram_user_access_token;

    if (!igAccountId || !instagramToken) {
      const page = appCredential.credentials.pages?.find((p) => p.instagram_account_id);
      if (page) {
        const containerRes = await axios.post(
          `https://graph.facebook.com/v20.0/${page.instagram_account_id}/media`,
          null,
          {
            params: {
              image_url: imageUrl,
              caption: caption || "",
              access_token: page.page_access_token,
            },
          }
        );

        const containerId = containerRes.data.id;

        const publishRes = await axios.post(
          `https://graph.facebook.com/v20.0/${page.instagram_account_id}/media_publish`,
          null,
          {
            params: {
              creation_id: containerId,
              access_token: page.page_access_token,
            },
          }
        );

        return res.json({
          message: "Posted successfully to Instagram",
          publishResponse: publishRes.data,
        });
      }

      return res.status(404).json({ error: "Instagram account not found" });
    }

    try {
      const containerRes = await axios.post(
        `https://graph.instagram.com/v24.0/${igAccountId}/media`,
        null,
        {
          params: {
            image_url: imageUrl,
            caption: caption || "",
            access_token: instagramToken,
          },
        }
      );

      const containerId = containerRes.data.id;

      const publishRes = await axios.post(
        `https://graph.instagram.com/v24.0/${igAccountId}/media_publish`,
        null,
        {
          params: {
            creation_id: containerId,
            access_token: instagramToken,
          },
        }
      );

      return res.json({
        message: "Posted successfully to Instagram",
        publishResponse: publishRes.data,
      });
    } catch (igError) {
      console.log("Trying graph.facebook.com as fallback:", igError.response?.data || igError.message);
      
      const containerRes = await axios.post(
        `https://graph.facebook.com/v20.0/${igAccountId}/media`,
        null,
        {
          params: {
            image_url: imageUrl,
            caption: caption || "",
            access_token: instagramToken,
          },
        }
      );

      const containerId = containerRes.data.id;

      const publishRes = await axios.post(
        `https://graph.facebook.com/v20.0/${igAccountId}/media_publish`,
        null,
        {
          params: {
            creation_id: containerId,
            access_token: instagramToken,
          },
        }
      );

      return res.json({
        message: "Posted successfully to Instagram",
        publishResponse: publishRes.data,
      });
    }
  } catch (err) {
    console.log("Instagram upload error:", err.response?.data || err);
    return res.status(500).json({ 
      error: "Instagram post failed", 
      details: err.response?.data || err.message 
    });
  }
};