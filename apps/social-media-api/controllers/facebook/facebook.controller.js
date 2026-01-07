import axios from "axios";
import AppCredentials from "../../models/appcredentials.model.js";
import UserModel from "../../models/user.model.js";
import { resolveAppConfig } from "../appconfig/app.controller.js";

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

    // 1️⃣ Get userId from query or req.user
    const userId = req.query.userId || req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "User not identified" });
    }

    console.log("[Facebook Auth] Initial userId:", userId);
    console.log("[Facebook Auth] req.user:", req.user);
    console.log("[Facebook Auth] req.query.resellerId:", req.query.resellerId);

    // 2️⃣ Get resellerId from multiple sources (priority order)
    // Priority 1: Query parameter (from frontend)
    // Priority 2: req.user (from auth middleware headers)
    // Priority 3: Local database lookup (fallback)
    let resellerId = req.query.resellerId || req.user?.resellerId || null;

    console.log("[Facebook Auth] resellerId from query/headers:", resellerId);

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
          console.log("[Facebook Auth] Found resellerId in local DB:", resellerId);
        }
      } catch (error) {
        console.log("[Facebook Auth] Local DB lookup skipped:", error.message);
      }
    }

    console.log("[Facebook Auth] Final userId:", userId);
    console.log("[Facebook Auth] Final resellerId:", resellerId);

    // ✅ Build state with userId and resellerId for callback
    const state = Buffer.from(
      JSON.stringify({
        userId: String(userId),
        resellerId: resellerId,
      })
    ).toString('base64');

    // 3️⃣ Resolve app config with resellerId
    const facebookConfig = await resolveAppConfig(
      "app/facebook",
      resellerId
    );
    
    if (!facebookConfig?.appClientId || !facebookConfig?.redirectUrl) {
      return res.status(500).json({ 
        message: "Facebook OAuth not configured",
        source: facebookConfig?.source 
      });
    }

    console.log(
      "[Facebook Auth] USING:",
      facebookConfig.source,
      facebookConfig.appClientId
    );

    const loginUrl =
      `https://www.facebook.com/v20.0/dialog/oauth` +
      `?client_id=${facebookConfig.appClientId}` +
      `&redirect_uri=${encodeURIComponent(facebookConfig.redirectUrl)}` +
      `&scope=${scopes.join(",")}` +
      `&response_type=code` +
      `&state=${encodeURIComponent(state)}`;

    return res.redirect(loginUrl);
  } catch (err) {
    console.log("[Facebook Auth] Error:", err);
    return res.status(500).json({ message: "OAuth redirect failed" });
  }
};

// Handle callback from Facebook OAuth
export const facebookCallback = async (req, res) => {
  const { code, state } = req.query;
  
  // ✅ Extract userId and resellerId from state
  let userIdFromState = null;
  let resellerIdFromState = null;
  
  if (state) {
    try {
      const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
      userIdFromState = decoded.userId;
      resellerIdFromState = decoded.resellerId;
      console.log("[Facebook Callback] Extracted from state:", { userId: userIdFromState, resellerId: resellerIdFromState });
    } catch (e) {
      userIdFromState = state;
      console.log("[Facebook Callback] State is not JSON, using as userId:", userIdFromState);
    }
  }
  
  // Get userId (priority: state > req.user > headers)
  let userId = userIdFromState || req.user?._id || null;
  
  if (!userId) {
    console.error("[Facebook Callback] No userId found");
    return res.redirect(
      `${process.env.FRONTEND_URL}/integrations/facebook?error=unauthorized`
    );
  }
  
  console.log("[Facebook Callback] Final userId:", userId);

  if (!code) {
    return res.redirect(
      `${process.env.FRONTEND_URL}/integrations/facebook?error=missing_code`
    );
  }

  try {
    // ✅ Get resellerId (priority: state > req.user > headers > DB)
    let resellerId = resellerIdFromState || req.user?.resellerId || req.headers["x-reseller-id"];
    
    console.log("[Facebook Callback] resellerId from state/headers:", resellerId);

    // Fallback to DB lookup
    if (!resellerId) {
      try {
        const localUser = await UserModel.findById(userId).select("resellerId").lean();
        if (localUser?.resellerId) {
          resellerId = String(localUser.resellerId);
          console.log("[Facebook Callback] Found resellerId in local DB:", resellerId);
        }
      } catch (error) {
        console.log("[Facebook Callback] DB lookup skipped:", error.message);
      }
    }

    console.log("[Facebook Callback] Final resellerId:", resellerId);

    // ✅ Resolve app config with resellerId
    const facebookConfig = await resolveAppConfig(
      "app/facebook",
      resellerId
    );

    if (!facebookConfig?.appClientId || !facebookConfig?.appClientSecret || !facebookConfig?.redirectUrl) {
      console.error("[Facebook Callback] Facebook app credentials not configured");
      return res.redirect(
        `${process.env.FRONTEND_URL}/integrations/facebook?error=config_error`
      );
    }

    console.log("[Facebook Callback] USING:", facebookConfig.source, facebookConfig.appClientId);

    // Step 1: Exchange code → short-lived access token
    const shortToken = await axios.get(
      "https://graph.facebook.com/v20.0/oauth/access_token",
      {
        params: {
          client_id: facebookConfig.appClientId,
          client_secret: facebookConfig.appClientSecret,
          redirect_uri: facebookConfig.redirectUrl,
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
          client_id: facebookConfig.appClientId,
          client_secret: facebookConfig.appClientSecret,
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

    // Step 4: Get pages with profile pictures
    const pagesRes = await axios.get(
      "https://graph.facebook.com/v20.0/me/accounts",
      {
        params: { 
          access_token: longLivedToken,
          fields: "id,name,access_token,picture.type(large)"
        },
      }
    );

    const pages = pagesRes.data.data || [];

    // Step 5: Store credentials in database
    const pageData = pages.map((page) => ({
      pageId: page.id,
      pageName: page.name,
      page_access_token: page.access_token,
      picture: page.picture?.data?.url || null,
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
        userId: String(userId),
        platform: "FACEBOOK",
      },
      {
        userId: String(userId),
        platform: "FACEBOOK",
        credentials,
        createdBy: req.user?._id || null,
      },
      { upsert: true, new: true }
    );

    console.log("[Facebook Callback] ✅ Credentials saved successfully");

    return res.redirect(
      `${process.env.FRONTEND_URL}/integrations/facebook?connected=1`
    );
  } catch (err) {
    console.log("[Facebook Callback] OAuth error:", err.response?.data || err);
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