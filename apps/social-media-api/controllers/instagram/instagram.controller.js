import axios from "axios";
import AppCredentials from "../../models/appcredentials.model.js";
import UserModel from "../../models/user.model.js";

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

  // Get userId from query parameter (passed from frontend) or from req.user
  let userIdToUse = null;
  
  // Priority 1: Query parameter (from frontend redirect with better-auth userId)
  if (req.query.userId) {
    userIdToUse = req.query.userId;
    console.log("[Instagram Auth] Using userId from query parameter:", userIdToUse);
  }
  // Priority 2: req.user._id (from middleware)
  else if (req.user?._id) {
    userIdToUse = String(req.user._id);
    console.log("[Instagram Auth] Using userId from req.user._id:", userIdToUse);
  }
  
  // If we have a userId, try to resolve it to MongoDB _id
  let mongoUserId = userIdToUse;
  if (userIdToUse) {
    try {
      // Try to find MongoDB user by _id first
      let mongoUser = await UserModel.findById(userIdToUse).lean();
      
      // If not found, try to find by email (in case userId is better-auth ID and we need to find MongoDB user)
      if (!mongoUser) {
        const userEmail = req.headers["x-user-email"];
        if (userEmail) {
          console.log("[Instagram Auth] MongoDB user not found by _id, trying by email:", userEmail);
          mongoUser = await UserModel.findOne({ email: userEmail }).lean();
        }
      }
      
      if (mongoUser) {
        mongoUserId = String(mongoUser._id);
        console.log("[Instagram Auth] Resolved to MongoDB userId:", mongoUserId);
      } else {
        console.log("[Instagram Auth] MongoDB user not found, using provided userId as-is:", userIdToUse);
      }
    } catch (error) {
      console.log("[Instagram Auth] Error looking up user:", error.message);
      // Use userIdToUse as-is if lookup fails
      mongoUserId = userIdToUse;
    }
  }

  // Include user ID in state parameter for multi-tenant support
  let state = "default";
  if (mongoUserId) {
    state = Buffer.from(JSON.stringify({ userId: mongoUserId })).toString('base64');
    console.log("[Instagram Auth] Setting state with userId:", mongoUserId);
  }

  // Use Instagram app ID and secret (or fallback to META_APP_ID if not set)
  const instagramAppId = process.env.INSTAGRAM_APP_ID || process.env.META_APP_ID;
  
  if (!instagramAppId) {
    return res.status(500).json({ error: "Instagram app ID not configured" });
  }

  // Instagram Business Login - Use Instagram's OAuth endpoint directly
  // This redirects to instagram.com for authentication
  const loginUrl =
    `https://www.instagram.com/oauth/authorize` +
    `?client_id=${instagramAppId}` +
    `&redirect_uri=${encodeURIComponent(process.env.INSTAGRAM_REDIRECT_URI)}` +
    `&scope=${scopes.join(",")}` +
    `&response_type=code` +
    `&state=${encodeURIComponent(state)}` +
    `&force_reauth=true`; // Force re-authentication

  console.log("[Instagram Business Login] Redirecting to Instagram OAuth:", loginUrl);
  return res.redirect(loginUrl);
};


// 2️⃣ Callback from Instagram Business Login OAuth
export const instagramCallback = async (req, res) => {
  const { code, state } = req.query;
  // Extract user ID from state if available
  let userIdFromState = null;
  if (state) {
    try {
      const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
      userIdFromState = decoded.userId;
      console.log("[Instagram Callback] Extracted userId from state:", userIdFromState);
    } catch (e) {
      userIdFromState = state;
      console.log("[Instagram Callback] State is not JSON, using as-is:", userIdFromState);
    }
  }
  
  // Multi-tenant: Use user's userId from state (most reliable for OAuth callbacks)
  // Priority: state > req.user._id > headers
  let userId = null;
  
  if (userIdFromState) {
    // State parameter is most reliable for OAuth callbacks
    userId = String(userIdFromState);
    console.log("[Instagram Callback] Using userId from state:", userId);
  } else if (req.user?._id) {
    // If user is authenticated via cookie/token, use their userId
    userId = String(req.user._id);
    console.log("[Instagram Callback] Using userId from req.user._id:", userId);
  } else {
    // Try to get from headers as last resort
    const betterAuthUserId = req.headers["x-user-id"];
    const userEmail = req.headers["x-user-email"];
    
    if (betterAuthUserId) {
      console.log("[Instagram Callback] Trying to resolve userId from headers:", betterAuthUserId);
      try {
        // Try to find MongoDB user by _id first
        let mongoUser = await UserModel.findById(betterAuthUserId).lean();
        
        // If not found, try to find by email
        if (!mongoUser && userEmail) {
          console.log("[Instagram Callback] MongoDB user not found by _id, trying by email:", userEmail);
          mongoUser = await UserModel.findOne({ email: userEmail }).lean();
        }
        
        if (mongoUser) {
          userId = String(mongoUser._id);
          console.log("[Instagram Callback] Resolved to MongoDB userId:", userId);
        } else {
          console.log("[Instagram Callback] MongoDB user not found, using better-auth userId as-is:", betterAuthUserId);
          userId = betterAuthUserId;
        }
      } catch (error) {
        console.log("[Instagram Callback] Error looking up user:", error.message);
        userId = betterAuthUserId;
      }
    }
  }
  
  if (!userId) {
    console.error("[Instagram Callback] No userId found - state:", state, "req.user:", req.user?._id);
    return res.redirect(
      `${process.env.FRONTEND_URL}/integrations/instagram?error=unauthorized`
    );
  }
  
  console.log("[Instagram Callback] Final userId to use:", userId);

  if (!code) {
    return res.redirect(
      `${process.env.FRONTEND_URL}/integrations/instagram?error=missing_code`
    );
  }

  try {
    // Use Instagram app ID and secret (or fallback to META_APP_ID if not set)
    const instagramAppId = process.env.INSTAGRAM_APP_ID || process.env.META_APP_ID;
    const instagramAppSecret = process.env.INSTAGRAM_APP_SECRET || process.env.META_APP_SECRET;

    if (!instagramAppId || !instagramAppSecret) {
      console.error("Instagram app credentials not configured");
      return res.redirect(
        `${process.env.FRONTEND_URL}/integrations/instagram?error=config_error`
      );
    }

    // Step 1: Exchange code → short-lived Instagram User access token
    // According to Instagram Business Login docs, use POST to api.instagram.com/oauth/access_token
    console.log("[Instagram Callback] Exchanging code for token...");
    console.log("[Instagram Callback] Code:", code);
    console.log("[Instagram Callback] Redirect URI:", process.env.INSTAGRAM_REDIRECT_URI);
    console.log("[Instagram Callback] App ID:", instagramAppId);
    
    // Use Instagram's token endpoint as per documentation
    const shortToken = await axios.post(
      "https://api.instagram.com/oauth/access_token",
      new URLSearchParams({
        client_id: instagramAppId,
        client_secret: instagramAppSecret,
        grant_type: "authorization_code",
        redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
        code,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    
    console.log("[Instagram Callback] Token exchange response:", JSON.stringify(shortToken.data, null, 2));
    
    // Handle response format: { "data": [{ "access_token": "...", "user_id": "...", "permissions": "..." }] }
    let tokenData;
    if (Array.isArray(shortToken.data.data)) {
      // Response wrapped in data array
      tokenData = shortToken.data.data[0];
      console.log("[Instagram Callback] Response wrapped in data array, using first item");
    } else if (shortToken.data.access_token) {
      // Direct object format
      tokenData = shortToken.data;
      console.log("[Instagram Callback] Response is direct object");
    } else {
      console.error("[Instagram Callback] Unexpected token response format:", shortToken.data);
      throw new Error("Unexpected token response format");
    }

    if (!tokenData?.access_token) {
      console.error("[Instagram Callback] No access token in response:", tokenData);
      throw new Error("Failed to get access token from Instagram");
    }

    const shortLivedToken = tokenData.access_token;
    const userIdFromToken = tokenData.user_id; // Instagram App-scoped User ID from token response
    console.log("[Instagram Callback] ✅ Short-lived token obtained");
    console.log("[Instagram Callback] User ID from token:", userIdFromToken);
    
    // Store userIdFromToken for use in error handling
    const instagramUserIdFromToken = userIdFromToken;

    // Step 2: Exchange short-lived → long-lived Instagram User access token
    // Try both GET and POST methods as the API might have changed
    console.log("[Instagram Callback] Exchanging short-lived token for long-lived token...");
    let longLivedToken = shortLivedToken; // Default to short-lived token
    let tokenExpiresIn = 3600; // Default 1 hour for short-lived tokens
    
    try {
      // Try GET first (as per documentation)
      console.log("[Instagram Callback] Trying GET request to graph.instagram.com/access_token");
      try {
        const longTokenRes = await axios.get(
          "https://graph.instagram.com/access_token",
          {
            params: {
              grant_type: "ig_exchange_token",
              client_secret: instagramAppSecret,
              access_token: shortLivedToken,
            },
          }
        );
        
        console.log("[Instagram Callback] Long-lived token exchange response:", longTokenRes.data);
        
        if (longTokenRes.data?.access_token) {
          longLivedToken = longTokenRes.data.access_token;
          tokenExpiresIn = longTokenRes.data.expires_in || 5184000; // Default 60 days
          console.log("[Instagram Callback] ✅ Long-lived token obtained successfully via GET!");
          console.log("[Instagram Callback] Token expires in:", tokenExpiresIn, "seconds (", Math.round(tokenExpiresIn / 86400), "days)");
        }
      } catch (getError) {
        // If GET fails, try POST
        console.log("[Instagram Callback] GET failed, trying POST method...");
        console.log("[Instagram Callback] GET error:", getError.response?.data || getError.message);
        
        const longTokenRes = await axios.post(
          "https://graph.instagram.com/access_token",
          new URLSearchParams({
            grant_type: "ig_exchange_token",
            client_secret: instagramAppSecret,
            access_token: shortLivedToken,
          }),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }
        );
        
        console.log("[Instagram Callback] Long-lived token exchange response (POST):", longTokenRes.data);
        
        if (longTokenRes.data?.access_token) {
          longLivedToken = longTokenRes.data.access_token;
          tokenExpiresIn = longTokenRes.data.expires_in || 5184000; // Default 60 days
          console.log("[Instagram Callback] ✅ Long-lived token obtained successfully via POST!");
          console.log("[Instagram Callback] Token expires in:", tokenExpiresIn, "seconds (", Math.round(tokenExpiresIn / 86400), "days)");
        } else {
          console.warn("[Instagram Callback] ⚠️ No access_token in long-lived token response, using short-lived token");
        }
      }
    } catch (exchangeError) {
      // If both methods fail, log the error but continue with short-lived token
      console.error("[Instagram Callback] ❌ Token exchange failed with both GET and POST!");
      console.error("[Instagram Callback] Exchange error response:", exchangeError.response?.data || exchangeError.response);
      console.error("[Instagram Callback] Exchange error message:", exchangeError.message);
      console.log("[Instagram Callback] Will use short-lived token - it may need to be refreshed later");
      
      // Don't throw error - continue with short-lived token
      // The user can still use the app, but token will expire in 1 hour
    }

    // Step 3: Get Instagram user info using graph.instagram.com /me endpoint
    // According to Instagram Business Login docs, /me returns data in a data array
    console.log("[Instagram Callback] Fetching Instagram user info...");
    let userRes;
    
    try {
      // Use graph.instagram.com /me endpoint with Instagram User access token
      // Request user_id and username as per documentation
      // Try GET first, then POST if GET fails
      let meResponse;
      try {
        console.log("[Instagram Callback] Trying GET request to /me endpoint");
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
        // If GET fails, try POST
        console.log("[Instagram Callback] GET /me failed, trying POST...");
        console.log("[Instagram Callback] GET error:", getError.response?.data || getError.message);
        
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
      
      console.log("[Instagram Callback] Instagram /me response:", meResponse.data);
      
      // Handle response format: could be direct object or wrapped in data array
      let userData;
      if (Array.isArray(meResponse.data.data)) {
        // Response is wrapped in data array: { "data": [{ "user_id": "...", "username": "..." }] }
        userData = meResponse.data.data[0];
        console.log("[Instagram Callback] Response wrapped in data array, using first item");
      } else if (meResponse.data.user_id || meResponse.data.username) {
        // Response is direct object: { "user_id": "...", "username": "..." }
        userData = meResponse.data;
        console.log("[Instagram Callback] Response is direct object");
      } else {
        throw new Error("Unexpected response format from /me endpoint");
      }
      
      userRes = {
        data: {
          id: userData.id || userData.user_id, // App-scoped ID
          user_id: userData.user_id, // Instagram Professional account ID (IG_ID)
          username: userData.username,
          name: userData.name || userData.username,
          account_type: userData.account_type || "BUSINESS",
          profile_picture_url: userData.profile_picture_url,
          followers_count: userData.followers_count,
          follows_count: userData.follows_count,
          media_count: userData.media_count,
        },
      };
      
      console.log("[Instagram Callback] Parsed user info:", {
        id: userRes.data.id,
        user_id: userRes.data.user_id,
        username: userRes.data.username,
      });
      
    } catch (igError) {
      console.error("[Instagram Callback] Failed to get user info from Instagram:", igError.response?.data || igError.message);
      // Use user_id from token response - this is the Instagram App-scoped User ID
      // For Instagram Business Login, this user_id can be used as the account ID for posting
      if (instagramUserIdFromToken) {
        userRes = {
          data: {
            id: instagramUserIdFromToken, // App-scoped ID
            user_id: instagramUserIdFromToken, // Instagram Professional account ID (IG_ID) - same as user_id for Business Login
            username: `instagram_${instagramUserIdFromToken}`, // Temporary username until we can get real one
            account_type: "BUSINESS",
          },
        };
        console.log("[Instagram Callback] Using user_id from token response as account ID");
        console.log("[Instagram Callback] Note: Username will be updated when /me endpoint works");
      } else {
        // Last resort: create minimal user info
        userRes = {
          data: {
            id: "unknown",
            user_id: "unknown",
            username: "Instagram Account",
            account_type: "BUSINESS",
          },
        };
        console.log("[Instagram Callback] Using fallback user info");
      }
    }

    // Step 4: Store credentials in database
    // For Instagram Business Login, we use Instagram User access token directly
    // Important: user_id is the IG_ID (Instagram Professional account ID) needed for posting
    // id is the app-scoped ID
    const credentials = {
      instagram_user_access_token: longLivedToken, // Instagram User access token (used for all API calls)
      token_expires_in: tokenExpiresIn,
      instagram_user_id: userRes.data.id, // Instagram App-scoped User ID
      instagram_account_id: userRes.data.user_id, // Instagram Professional account ID (IG_ID) - used for posting endpoints
      instagram_username: userRes.data.username,
      instagram_name: userRes.data.name || userRes.data.username,
      instagram_profile_picture: userRes.data.profile_picture_url,
      instagram_account_type: userRes.data.account_type || "BUSINESS",
      instagram_followers_count: userRes.data.followers_count,
      instagram_media_count: userRes.data.media_count,
    };
    
    // Validate that we have the required fields
    if (!credentials.instagram_account_id) {
      console.error("[Instagram Callback] Missing user_id (IG_ID) in response:", userRes.data);
      return res.redirect(
        `${process.env.FRONTEND_URL}/integrations/instagram?error=missing_user_id`
      );
    }
    
    if (!credentials.instagram_username) {
      console.error("[Instagram Callback] Missing username in response:", userRes.data);
      return res.redirect(
        `${process.env.FRONTEND_URL}/integrations/instagram?error=missing_username`
      );
    }
    
    console.log("[Instagram Callback] Storing credentials with:", {
      has_token: !!credentials.instagram_user_access_token,
      account_id: credentials.instagram_account_id,
      username: credentials.instagram_username,
      token_expires_in: credentials.token_expires_in,
    });

    console.log("[Instagram Callback] Saving credentials with userId:", userId);
    console.log("[Instagram Callback] Credentials structure:", {
      instagram_account_id: credentials.instagram_account_id,
      instagram_username: credentials.instagram_username,
      has_token: !!credentials.instagram_user_access_token,
    });

    const savedCredential = await AppCredentials.findOneAndUpdate(
      {
        userId,
        platform: "INSTAGRAM",
      },
      {
        userId,
        platform: "INSTAGRAM",
        credentials,
        createdBy: req.user?._id || null,
      },
      { upsert: true, new: true }
    );

    console.log("[Instagram Callback] Credentials saved successfully:", {
      _id: savedCredential._id,
      userId: savedCredential.userId,
      platform: savedCredential.platform,
      has_credentials: !!savedCredential.credentials,
    });

    return res.redirect(
      `${process.env.FRONTEND_URL}/integrations/instagram?connected=1`
    );
  } catch (err) {
    console.log("Instagram OAuth error: ", err.response?.data || err);
    return res.redirect(
      `${process.env.FRONTEND_URL}/integrations/instagram?error=oauth_failed`
    );
  }
};


// ⭐ 3️⃣ Return Instagram account details for frontend ⭐
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

    // Check for new Instagram Business Login structure
    if (!appCredential || !appCredential.credentials.instagram_account_id) {
      // Fallback: Check for old structure with pages
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

// 4️⃣ Upload media to Instagram (using Instagram Business Login)
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

    // Use new Instagram Business Login structure
    const igAccountId = appCredential.credentials.instagram_account_id; // IG_ID
    const instagramToken = appCredential.credentials.instagram_user_access_token;

    if (!igAccountId || !instagramToken) {
      // Fallback: Try old structure with pages
      const page = appCredential.credentials.pages?.find((p) => p.instagram_account_id);
      if (page) {
        const igAccountIdOld = page.instagram_account_id;
        const pageToken = page.page_access_token;

        // Use graph.facebook.com for old structure
        const containerRes = await axios.post(
          `https://graph.facebook.com/v20.0/${igAccountIdOld}/media`,
          null,
          {
            params: {
              image_url: imageUrl,
              caption: caption || "",
              access_token: pageToken,
            },
          }
        );

        const containerId = containerRes.data.id;

        const publishRes = await axios.post(
          `https://graph.facebook.com/v20.0/${igAccountIdOld}/media_publish`,
          null,
          {
            params: {
              creation_id: containerId,
              access_token: pageToken,
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

    // Use graph.instagram.com for new Instagram Business Login
    // Note: Instagram API with Instagram Login uses graph.instagram.com but posting might still use graph.facebook.com
    // Let's try graph.instagram.com first, fallback to graph.facebook.com if needed
    try {
      // Step 1: Create media container using graph.instagram.com
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

      // Step 2: Publish the media
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
      // Fallback to graph.facebook.com if graph.instagram.com doesn't support posting
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

