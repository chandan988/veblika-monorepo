import axios from "axios";
import AppCredentials from "../../models/appcredentials.model.js";
import UserModel from "../../models/user.model.js";
import { resolveAppConfig } from "../appconfig/app.controller.js";

// Redirect user to LinkedIn OAuth
export const redirectToLinkedIn = async (req, res) => {
  try {
    // LinkedIn OpenID Connect scopes
    const scopes = [
      "openid",
      "profile",
      "email",
      "w_member_social",
    ];

    // 1️⃣ Get userId from query or req.user
    const userId = req.query.userId || req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "User not identified" });
    }

    console.log("[LinkedIn Auth] Initial userId:", userId);
    console.log("[LinkedIn Auth] req.user:", req.user);
    console.log("[LinkedIn Auth] req.query.resellerId:", req.query.resellerId);

    // 2️⃣ Get resellerId from multiple sources (priority order)
    // Priority 1: Query parameter (from frontend)
    // Priority 2: req.user (from auth middleware headers)
    // Priority 3: Local database lookup (fallback)
    let resellerId = req.query.resellerId || req.user?.resellerId || null;

    console.log("[LinkedIn Auth] resellerId from query/headers:", resellerId);

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
          console.log("[LinkedIn Auth] Found resellerId in local DB:", resellerId);
        }
      } catch (error) {
        console.log("[LinkedIn Auth] Local DB lookup skipped:", error.message);
      }
    }

    console.log("[LinkedIn Auth] Final userId:", userId);
    console.log("[LinkedIn Auth] Final resellerId:", resellerId);

    // ✅ Build state with userId and resellerId for callback
    const state = Buffer.from(
      JSON.stringify({
        userId: String(userId),
        resellerId: resellerId,
      })
    ).toString('base64');

    // 3️⃣ Resolve app config with resellerId
    const linkedinConfig = await resolveAppConfig(
      "app/linkedin",
      resellerId
    );

    if (!linkedinConfig?.appClientId || !linkedinConfig?.redirectUrl) {
      return res.status(500).json({ 
        message: "LinkedIn OAuth not configured",
        source: linkedinConfig?.source 
      });
    }

    console.log(
      "[LinkedIn Auth] USING:",
      linkedinConfig.source,
      linkedinConfig.appClientId
    );

    const loginUrl =
      `https://www.linkedin.com/oauth/v2/authorization` +
      `?response_type=code` +
      `&client_id=${linkedinConfig.appClientId}` +
      `&redirect_uri=${encodeURIComponent(linkedinConfig.redirectUrl)}` +
      `&state=${encodeURIComponent(state)}` +
      `&scope=${scopes.join(" ")}`;

    return res.redirect(loginUrl);
  } catch (err) {
    console.log("[LinkedIn Auth] Error:", err);
    return res.status(500).json({ message: "OAuth redirect failed" });
  }
};

// Handle callback from LinkedIn OAuth
export const linkedinCallback = async (req, res) => {
  const { code, state } = req.query;
  
  // ✅ Extract userId and resellerId from state
  let userIdFromState = null;
  let resellerIdFromState = null;
  
  if (state) {
    try {
      const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
      userIdFromState = decoded.userId;
      resellerIdFromState = decoded.resellerId;
      console.log("[LinkedIn Callback] Extracted from state:", { userId: userIdFromState, resellerId: resellerIdFromState });
    } catch (e) {
      userIdFromState = state;
      console.log("[LinkedIn Callback] State is not JSON, using as userId:", userIdFromState);
    }
  }
  
  // Get userId (priority: state > req.user > headers)
  let userId = userIdFromState || req.user?._id || null;
  
  if (!userId) {
    console.error("[LinkedIn Callback] No userId found");
    return res.redirect(
      `${process.env.FRONTEND_URL}/integrations/linkedin?error=unauthorized`
    );
  }
  
  console.log("[LinkedIn Callback] Final userId:", userId);

  if (!code) {
    return res.redirect(
      `${process.env.FRONTEND_URL}/integrations/linkedin?error=missing_code`
    );
  }

  try {
    // ✅ Get resellerId (priority: state > req.user > headers > DB)
    let resellerId = resellerIdFromState || req.user?.resellerId || req.headers["x-reseller-id"];
    
    console.log("[LinkedIn Callback] resellerId from state/headers:", resellerId);

    // Fallback to DB lookup
    if (!resellerId) {
      try {
        const localUser = await UserModel.findById(userId).select("resellerId").lean();
        if (localUser?.resellerId) {
          resellerId = String(localUser.resellerId);
          console.log("[LinkedIn Callback] Found resellerId in local DB:", resellerId);
        }
      } catch (error) {
        console.log("[LinkedIn Callback] DB lookup skipped:", error.message);
      }
    }

    console.log("[LinkedIn Callback] Final resellerId:", resellerId);

    // ✅ Resolve app config with resellerId
    const linkedinConfig = await resolveAppConfig(
      "app/linkedin",
      resellerId
    );

    if (!linkedinConfig?.appClientId || !linkedinConfig?.appClientSecret || !linkedinConfig?.redirectUrl) {
      console.error("[LinkedIn Callback] LinkedIn app credentials not configured");
      return res.redirect(
        `${process.env.FRONTEND_URL}/integrations/linkedin?error=config_error`
      );
    }

    console.log("[LinkedIn Callback] USING:", linkedinConfig.source, linkedinConfig.appClientId);

    // Step 1: Exchange code for access token
    const tokenRes = await axios.post(
      "https://www.linkedin.com/oauth/v2/accessToken",
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: linkedinConfig.redirectUrl,
        client_id: linkedinConfig.appClientId,
        client_secret: linkedinConfig.appClientSecret,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const accessToken = tokenRes.data.access_token;
    const idToken = tokenRes.data.id_token;

    console.log("[LinkedIn Callback] Access token received, fetching user info...");

    // Step 2: Get user profile using OpenID Connect userinfo endpoint
    let userRes;
    try {
      userRes = await axios.get("https://api.linkedin.com/v2/userinfo", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      console.log("[LinkedIn Callback] User info received from /v2/userinfo");
    } catch (userInfoError) {
      console.error("[LinkedIn Callback] Failed to get userinfo:", userInfoError.response?.data || userInfoError.message);
      
      // Fallback: Try to decode ID token
      if (idToken) {
        try {
          const base64Url = idToken.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = JSON.parse(Buffer.from(base64, 'base64').toString());
          console.log("[LinkedIn Callback] Decoded ID token");
          userRes = { data: jsonPayload };
        } catch (decodeError) {
          console.error("[LinkedIn Callback] Failed to decode ID token:", decodeError);
          throw new Error("Failed to get user information from LinkedIn");
        }
      } else {
        throw new Error("Failed to get user information from LinkedIn");
      }
    }

    // Step 3: Extract user data
    const userData = userRes.data;
    const linkedInUserId = userData.sub;
    const userName = userData.name || `${userData.given_name || ""} ${userData.family_name || ""}`.trim();
    const email = userData.email || "";
    const profilePicture = userData.picture || "";

    console.log("[LinkedIn Callback] User data extracted:", {
      linkedInUserId,
      mongoUserId: userId,
      userName,
      hasEmail: !!email,
      hasPicture: !!profilePicture,
    });

    // Step 4: Store credentials
    const credentials = {
      user_access_token: accessToken,
      id_token: idToken,
      user_id: linkedInUserId,
      user_name: userName,
      user_email: email,
      profile_picture: profilePicture,
      pages: [
        {
          pageId: linkedInUserId,
          pageName: userName,
          page_access_token: accessToken,
        },
      ],
    };

    const savedCredential = await AppCredentials.findOneAndUpdate(
      {
        userId: String(userId),
        platform: "LINKEDIN",
      },
      {
        userId: String(userId),
        platform: "LINKEDIN",
        credentials,
        createdBy: req.user?._id || null,
      },
      { upsert: true, new: true }
    );

    console.log("[LinkedIn Callback] ✅ Credentials saved successfully:", {
      _id: savedCredential._id,
      userId: savedCredential.userId,
      platform: savedCredential.platform,
      user_name: savedCredential.credentials?.user_name,
    });

    return res.redirect(
      `${process.env.FRONTEND_URL}/integrations?linkedin=connected`
    );
  } catch (err) {
    console.log("[LinkedIn Callback] OAuth error:", err.response?.data || err);
    return res.redirect(
      `${process.env.FRONTEND_URL}/integrations/linkedin?error=oauth_failed`
    );
  }
};

// Get LinkedIn profile/pages
export const getLinkedInProfile = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: "LinkedIn not connected" });
    }
    const userId = String(req.user._id);

    const appCredential = await AppCredentials.findOne({
      userId,
      platform: "LINKEDIN",
    });

    if (!appCredential) {
      return res.status(404).json({ message: "LinkedIn not connected" });
    }

    return res.json({
      connected: true,
      profile: {
        name: appCredential.credentials.user_name,
        email: appCredential.credentials.user_email,
      },
      pages: appCredential.credentials.pages,
    });
  } catch (err) {
    console.log(err.response?.data || err);
    return res.status(500).json({ message: "Failed to fetch LinkedIn profile" });
  }
};

// Post to LinkedIn
export const postToLinkedIn = async (req, res) => {
  try {
    const { pageId, text, imageUrl } = req.body;
    if (!req.user?._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = String(req.user._id);

    const appCredential = await AppCredentials.findOne({
      userId,
      platform: "LINKEDIN",
    });

    if (!appCredential) {
      return res.status(404).json({ message: "LinkedIn not connected" });
    }

    const accessToken = appCredential.credentials.user_access_token;

    // Prepare post data
    const postData = {
      author: `urn:li:person:${pageId}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text: text,
          },
          shareMediaCategory: imageUrl ? "IMAGE" : "NONE",
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    };

    if (imageUrl) {
      // First, upload image and get URN
      const imageUploadRes = await axios.post(
        "https://api.linkedin.com/v2/assets?action=registerUpload",
        {
          registerUploadRequest: {
            recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
            owner: `urn:li:person:${pageId}`,
            serviceRelationships: [
              {
                relationshipType: "OWNER",
                identifier: "urn:li:userGeneratedContent",
              },
            ],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const uploadUrl = imageUploadRes.data.value.uploadMechanism[
        "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
      ].uploadUrl;
      const asset = imageUploadRes.data.value.asset;

      // Upload image
      const imageRes = await axios.get(imageUrl, {
        responseType: "arraybuffer",
      });
      await axios.put(uploadUrl, imageRes.data, {
        headers: {
          "Content-Type": "image/jpeg",
        },
      });

      postData.specificContent["com.linkedin.ugc.ShareContent"].media = [
        {
          status: "READY",
          description: {
            text: text,
          },
          media: asset,
          title: {
            text: "Shared Image",
          },
        },
      ];
    }

    // Post to LinkedIn
    const postRes = await axios.post(
      "https://api.linkedin.com/v2/ugcPosts",
      postData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
        },
      }
    );

    return res.json({
      success: true,
      postId: postRes.data.id,
      message: "Posted successfully to LinkedIn",
    });
  } catch (err) {
    console.log(err.response?.data || err);
    return res.status(500).json({
      message: "LinkedIn post failed",
      error: err.response?.data || err.message,
    });
  }
};