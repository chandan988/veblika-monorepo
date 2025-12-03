import axios from "axios";
import AppCredentials from "../../models/appcredentials.model.js";
import UserModel from "../../models/user.model.js";

// Redirect user to Facebook OAuth
export const redirectToFacebook = async (req, res) => {
  try {
    const scopes = [
      "pages_manage_posts",
      "pages_read_engagement",
      "pages_show_list",
      "pages_read_user_content",
      "publish_video",
      "business_management",
      "read_insights",
      "pages_manage_metadata",
    ];

    const clientId = process.env.FACEBOOK_APP_ID || process.env.META_APP_ID;
    const redirectUri = process.env.FACEBOOK_REDIRECT_URI || process.env.INSTAGRAM_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      return res.status(500).json({ message: "Facebook OAuth not configured" });
    }

    // Get userId from query parameter (passed from frontend) or from req.user
    let userIdToUse = null;
    
    // Priority 1: Query parameter (from frontend redirect with better-auth userId)
    if (req.query.userId) {
      userIdToUse = req.query.userId;
      console.log("[Facebook Auth] Using userId from query parameter:", userIdToUse);
    }
    // Priority 2: req.user._id (from middleware)
    else if (req.user?._id) {
      userIdToUse = String(req.user._id);
      console.log("[Facebook Auth] Using userId from req.user._id:", userIdToUse);
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
            console.log("[Facebook Auth] MongoDB user not found by _id, trying by email:", userEmail);
            mongoUser = await UserModel.findOne({ email: userEmail }).lean();
          }
        }
        
        if (mongoUser) {
          mongoUserId = String(mongoUser._id);
          console.log("[Facebook Auth] Resolved to MongoDB userId:", mongoUserId);
        } else {
          console.log("[Facebook Auth] MongoDB user not found, using provided userId as-is:", userIdToUse);
        }
      } catch (error) {
        console.log("[Facebook Auth] Error looking up user:", error.message);
        // Use userIdToUse as-is if lookup fails
        mongoUserId = userIdToUse;
      }
    }

    // Include user ID in state parameter for multi-tenant support
    let state = "default";
    if (mongoUserId) {
      state = Buffer.from(JSON.stringify({ userId: mongoUserId })).toString('base64');
      console.log("[Facebook Auth] Setting state with userId:", mongoUserId);
    }

    const loginUrl =
      `https://www.facebook.com/v20.0/dialog/oauth` +
      `?client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${scopes.join(",")}` +
      `&response_type=code` +
      `&state=${encodeURIComponent(state)}`;

    return res.redirect(loginUrl);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "OAuth redirect failed" });
  }
};

// Handle callback from Facebook OAuth
export const facebookCallback = async (req, res) => {
  const { code, state } = req.query;
  // Extract user ID from state if available
  let userIdFromState = null;
  if (state) {
    try {
      const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
      userIdFromState = decoded.userId;
      console.log("[Facebook Callback] Extracted userId from state:", userIdFromState);
    } catch (e) {
      userIdFromState = state;
      console.log("[Facebook Callback] State is not JSON, using as-is:", userIdFromState);
    }
  }
  
  // Multi-tenant: Use user's userId from state (most reliable for OAuth callbacks)
  // Priority: state > req.user._id > headers
  let userId = null;
  
  if (userIdFromState) {
    // State parameter is most reliable for OAuth callbacks
    userId = String(userIdFromState);
    console.log("[Facebook Callback] Using userId from state:", userId);
  } else if (req.user?._id) {
    // If user is authenticated via cookie/token, use their userId
    userId = String(req.user._id);
    console.log("[Facebook Callback] Using userId from req.user._id:", userId);
  } else {
    // Try to get from headers as last resort
    const betterAuthUserId = req.headers["x-user-id"];
    const userEmail = req.headers["x-user-email"];
    
    if (betterAuthUserId) {
      console.log("[Facebook Callback] Trying to resolve userId from headers:", betterAuthUserId);
      try {
        // Try to find MongoDB user by _id first
        let mongoUser = await UserModel.findById(betterAuthUserId).lean();
        
        // If not found, try to find by email
        if (!mongoUser && userEmail) {
          console.log("[Facebook Callback] MongoDB user not found by _id, trying by email:", userEmail);
          mongoUser = await UserModel.findOne({ email: userEmail }).lean();
        }
        
        if (mongoUser) {
          userId = String(mongoUser._id);
          console.log("[Facebook Callback] Resolved to MongoDB userId:", userId);
        } else {
          console.log("[Facebook Callback] MongoDB user not found, using better-auth userId as-is:", betterAuthUserId);
          userId = betterAuthUserId;
        }
      } catch (error) {
        console.log("[Facebook Callback] Error looking up user:", error.message);
        userId = betterAuthUserId;
      }
    }
  }
  
  if (!userId) {
    console.error("[Facebook Callback] No userId found - state:", state, "req.user:", req.user?._id);
    return res.redirect(
      `${process.env.FRONTEND_URL}/integrations/facebook?error=unauthorized`
    );
  }
  
  console.log("[Facebook Callback] Final userId to use:", userId);

  if (!code) {
    return res.redirect(
      `${process.env.FRONTEND_URL}/integrations/facebook?error=missing_code`
    );
  }

  try {
    const clientId = process.env.FACEBOOK_APP_ID || process.env.META_APP_ID;
    const clientSecret = process.env.FACEBOOK_APP_SECRET || process.env.META_APP_SECRET;
    const redirectUri = process.env.FACEBOOK_REDIRECT_URI || process.env.INSTAGRAM_REDIRECT_URI;

    // Step 1: Exchange code → short-lived access token
    const shortToken = await axios.get(
      "https://graph.facebook.com/v20.0/oauth/access_token",
      {
        params: {
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          code,
        },
      }
    );

    const shortLivedToken = shortToken.data.access_token;

    // Step 2: Exchange short-lived → long-lived token
    const longTokenRes = await axios.get(
      "https://graph.facebook.com/v20.0/oauth/access_token",
      {
        params: {
          grant_type: "fb_exchange_token",
          client_id: clientId,
          client_secret: clientSecret,
          fb_exchange_token: shortLivedToken,
        },
      }
    );

    const longLivedToken = longTokenRes.data.access_token;

    // Step 3: Get user profile
    const userRes = await axios.get(
      "https://graph.facebook.com/v20.0/me",
      {
        params: {
          fields: "id,name,email",
          access_token: longLivedToken,
        },
      }
    );

    // Step 4: Get pages
    const pagesRes = await axios.get(
      "https://graph.facebook.com/v20.0/me/accounts",
      {
        params: { access_token: longLivedToken },
      }
    );

    const pages = pagesRes.data.data || [];

    // Step 5: Store credentials in database
    const pageData = pages.map((page) => ({
      pageId: page.id,
      pageName: page.name,
      page_access_token: page.access_token,
    }));

    const credentials = {
      user_access_token: longLivedToken,
      user_id: userRes.data.id,
      user_name: userRes.data.name,
      user_email: userRes.data.email,
      pages: pageData,
    };

    await AppCredentials.findOneAndUpdate(
      {
        userId,
        platform: "FACEBOOK",
      },
      {
        userId,
        platform: "FACEBOOK",
        credentials,
        createdBy: req.user?._id || null,
      },
      { upsert: true, new: true }
    );

    return res.redirect(
      `${process.env.FRONTEND_URL}/integrations/facebook?connected=1`
    );
  } catch (err) {
    console.log("Facebook OAuth error: ", err.response?.data || err);
    return res.redirect(
      `${process.env.FRONTEND_URL}/integrations/facebook?error=oauth_failed`
    );
  }
};

// Get Facebook pages
export const getFacebookPages = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = String(req.user._id);

    const appCredential = await AppCredentials.findOne({
      userId,
      platform: "FACEBOOK",
    });

    if (!appCredential || !appCredential.credentials.pages) {
      return res.status(404).json({ message: "Facebook not connected" });
    }

    return res.json({
      connected: true,
      pages: appCredential.credentials.pages,
    });
  } catch (err) {
    console.log(err.response?.data || err);
    return res.status(500).json({ message: "Failed to fetch Facebook pages" });
  }
};

// Post to Facebook page
export const postToFacebook = async (req, res) => {
  try {
    const { pageId, message, imageUrl } = req.body;
    if (!req.user?._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = String(req.user._id);

    const appCredential = await AppCredentials.findOne({
      userId,
      platform: "FACEBOOK",
    });

    if (!appCredential) {
      return res.status(404).json({ message: "Facebook not connected" });
    }

    const page = appCredential.credentials.pages.find(
      (p) => p.pageId === pageId
    );

    if (!page) {
      return res.status(404).json({ message: "Page not found" });
    }

    const pageToken = page.page_access_token;

    // Post to page feed
    const postData = {
      message,
      access_token: pageToken,
    };

    if (imageUrl) {
      postData.url = imageUrl;
    }

    const postRes = await axios.post(
      `https://graph.facebook.com/v20.0/${pageId}/feed`,
      {},
      { params: postData }
    );

    return res.json({
      success: true,
      postId: postRes.data.id,
      message: "Posted successfully to Facebook",
    });
  } catch (err) {
    console.log(err.response?.data || err);
    return res.status(500).json({
      message: "Facebook post failed",
      error: err.response?.data || err.message,
    });
  }
};

