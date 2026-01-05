import axios from "axios";
import AppCredentials from "../../models/appcredentials.model.js";
import UserModel from "../../models/user.model.js";
import { getAppConfig } from "../../utils/getAppConfig.js";

// Redirect user to LinkedIn OAuth
export const redirectToLinkedIn = async (req, res) => {
  try {
    // Get LinkedIn app config from database (with fallback to env)
    let linkedinConfig;
    try {
      linkedinConfig = await getAppConfig(mongoUserId || "default", "app/linkedin");
    } catch (error) {
      console.error("[LinkedIn Auth] Error getting app config:", error.message);
      return res.status(500).json({ message: "LinkedIn OAuth not configured. Please configure it first." });
    }

    if (!linkedinConfig.appClientId || !linkedinConfig.redirectUrl) {
      return res.status(500).json({ message: "LinkedIn OAuth not configured" });
    }
    
    const clientId = linkedinConfig.appClientId;
    const redirectUri = linkedinConfig.redirectUrl;

    // LinkedIn OpenID Connect scopes (required for OIDC)
    const scopes = [
      "openid",      // Required for OIDC authentication
      "profile",     // Required for lite profile (id, name, picture)
      "email",       // Required for email address
      "w_member_social",      // For posting to personal profile (requires app approval)
      // "w_organization_social", // For posting to organization pages (requires app approval - not enabled)
    ];

    // Get userId from query parameter (passed from frontend) or from req.user
    let userIdToUse = null;
    
    // Priority 1: Query parameter (from frontend redirect with better-auth userId)
    if (req.query.userId) {
      userIdToUse = req.query.userId;
      console.log("[LinkedIn Auth] Using userId from query parameter:", userIdToUse);
    }
    // Priority 2: req.user._id (from middleware)
    else if (req.user?._id) {
      userIdToUse = String(req.user._id);
      console.log("[LinkedIn Auth] Using userId from req.user._id:", userIdToUse);
    }
    
    // If we have a userId, try to resolve it to MongoDB _id
    let mongoUserId = userIdToUse;
    if (userIdToUse) {
      try {
        let mongoUser = await UserModel.findById(userIdToUse).lean();
        
        if (!mongoUser) {
          const userEmail = req.headers["x-user-email"];
          if (userEmail) {
            console.log("[LinkedIn Auth] MongoDB user not found by _id, trying by email:", userEmail);
            mongoUser = await UserModel.findOne({ email: userEmail }).lean();
          }
        }
        
        if (mongoUser) {
          mongoUserId = String(mongoUser._id);
          console.log("[LinkedIn Auth] Resolved to MongoDB userId:", mongoUserId);
        } else {
          console.log("[LinkedIn Auth] MongoDB user not found, using provided userId as-is:", userIdToUse);
        }
      } catch (error) {
        console.log("[LinkedIn Auth] Error looking up user:", error.message);
        mongoUserId = userIdToUse;
      }
    }

    // Include user ID in state parameter for multi-tenant support
    let state = "default";
    if (mongoUserId) {
      state = Buffer.from(JSON.stringify({ userId: mongoUserId })).toString('base64');
      console.log("[LinkedIn Auth] Setting state with userId:", mongoUserId);
    }

    const loginUrl =
      `https://www.linkedin.com/oauth/v2/authorization` +
      `?response_type=code` +
      `&client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${encodeURIComponent(state)}` +
      `&scope=${scopes.join(" ")}`;

    return res.redirect(loginUrl);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "OAuth redirect failed" });
  }
};

// Handle callback from LinkedIn OAuth
export const linkedinCallback = async (req, res) => {
  const { code, state } = req.query;
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
    console.log("[LinkedIn Callback] Using userId from state:", userId);
  } else if (req.user?._id) {
    userId = String(req.user._id);
    console.log("[LinkedIn Callback] Using userId from req.user._id:", userId);
  } else {
    const betterAuthUserId = req.headers["x-user-id"];
    const userEmail = req.headers["x-user-email"];
    
    if (betterAuthUserId) {
      console.log("[LinkedIn Callback] Trying to resolve userId from headers:", betterAuthUserId);
      try {
        let mongoUser = await UserModel.findById(betterAuthUserId).lean();
        
        if (!mongoUser && userEmail) {
          console.log("[LinkedIn Callback] MongoDB user not found by _id, trying by email:", userEmail);
          mongoUser = await UserModel.findOne({ email: userEmail }).lean();
        }
        
        if (mongoUser) {
          userId = String(mongoUser._id);
          console.log("[LinkedIn Callback] Resolved to MongoDB userId:", userId);
        } else {
          console.log("[LinkedIn Callback] MongoDB user not found, using better-auth userId as-is:", betterAuthUserId);
          userId = betterAuthUserId;
        }
      } catch (error) {
        console.log("[LinkedIn Callback] Error looking up user:", error.message);
        userId = betterAuthUserId;
      }
    }
  }
  
  if (!userId) {
    console.error("[LinkedIn Callback] No userId found - state:", state, "req.user:", req.user?._id);
    return res.redirect(
      `${process.env.FRONTEND_URL}/integrations/linkedin?error=unauthorized`
    );
  }
  
  console.log("[LinkedIn Callback] Final userId to use:", userId);

  if (!code) {
    return res.redirect(
      `${process.env.FRONTEND_URL}/integrations/linkedin?error=missing_code`
    );
  }

  try {
    // Get LinkedIn app config from database (with fallback to env)
    let linkedinConfig;
    try {
      linkedinConfig = await getAppConfig(userId, "app/linkedin");
    } catch (error) {
      console.error("[LinkedIn Callback] Error getting app config:", error.message);
      return res.redirect(
        `${process.env.FRONTEND_URL}/integrations/linkedin?error=config_error`
      );
    }

    if (!linkedinConfig.appClientId || !linkedinConfig.appClientSecret || !linkedinConfig.redirectUrl) {
      console.error("[LinkedIn Callback] LinkedIn app credentials not configured");
      return res.redirect(
        `${process.env.FRONTEND_URL}/integrations/linkedin?error=config_error`
      );
    }

    const clientId = linkedinConfig.appClientId;
    const clientSecret = linkedinConfig.appClientSecret;
    const redirectUri = linkedinConfig.redirectUrl;

    console.log("[LinkedIn Callback] Using config from:", linkedinConfig.source);

    // Step 1: Exchange code for access token
    const tokenRes = await axios.post(
      "https://www.linkedin.com/oauth/v2/accessToken",
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const accessToken = tokenRes.data.access_token;
    const idToken = tokenRes.data.id_token; // OIDC ID Token (JWT)

    console.log("[LinkedIn Callback] Access token received, fetching user info...");

    // Step 2: Get user profile using OpenID Connect userinfo endpoint
    // LinkedIn deprecated /v2/me, now use /v2/userinfo with OIDC
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
      // Fallback: Try to decode ID token if available
      if (idToken) {
        try {
          // Decode JWT (without verification for now - in production you should verify)
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

    // Step 3: Extract user data from userinfo response
    // The new userinfo endpoint returns: sub, name, given_name, family_name, picture, locale, email, email_verified
    const userData = userRes.data;
    const linkedInUserId = userData.sub; // LinkedIn subject identifier (user ID) - NOT MongoDB userId
    const userName = userData.name || `${userData.given_name || ""} ${userData.family_name || ""}`.trim();
    const email = userData.email || ""; // Email is now in userinfo response
    const profilePicture = userData.picture || "";

    console.log("[LinkedIn Callback] User data extracted:", {
      linkedInUserId, // LinkedIn user ID (e.g., '-nehK3ePun')
      mongoUserId: userId, // MongoDB userId (e.g., '692d7b14b183fc3f9a664d27')
      userName,
      hasEmail: !!email,
      hasPicture: !!profilePicture,
    });

    // Step 4: Get user's organizations (pages)
    // NOTE: Organization fetching requires 'w_organization_social' scope which is not available in development
    // Skipping organization fetch for now - can be enabled when app is approved and scope is granted
    let organizations = [];
    // try {
    //   const orgRes = await axios.get(
    //     "https://api.linkedin.com/v2/organizationalEntityAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED",
    //     {
    //       headers: {
    //         Authorization: `Bearer ${accessToken}`,
    //         "X-Restli-Protocol-Version": "2.0.0",
    //       },
    //     }
    //   );
    //   organizations = orgRes.data.elements || [];
    // } catch (err) {
    //   console.log("Could not fetch organizations:", err.response?.data || err);
    // }
    console.log("[LinkedIn Callback] Skipping organization fetch (not available in development mode)");

    const credentials = {
      user_access_token: accessToken,
      id_token: idToken, // Store ID token for future use
      user_id: linkedInUserId, // LinkedIn user ID (sub from userinfo) - NOT MongoDB userId
      user_name: userName,
      user_email: email,
      profile_picture: profilePicture,
      pages: [
        {
          pageId: linkedInUserId, // Use LinkedIn 'sub' as pageId for personal profile
          pageName: userName,
          page_access_token: accessToken,
        },
        // Organizations (company pages) will be added here when w_organization_social scope is approved
        // ...organizations.map((org) => ({
        //   pageId: org.organizationalTarget,
        //   pageName: org.organizationalTarget,
        //   page_access_token: accessToken,
        // })),
      ],
    };

    const savedCredential = await AppCredentials.findOneAndUpdate(
      {
        userId,
        platform: "LINKEDIN",
      },
      {
        userId,
        platform: "LINKEDIN",
        credentials,
        createdBy: req.user?._id || null,
      },
      { upsert: true, new: true }
    );

    console.log("[LinkedIn Callback] Credentials saved successfully:", {
      _id: savedCredential._id,
      userId: savedCredential.userId,
      platform: savedCredential.platform,
      has_credentials: !!savedCredential.credentials,
      user_name: savedCredential.credentials?.user_name,
      user_id: savedCredential.credentials?.user_id,
    });

    // Redirect to integrations page to show connected status
    return res.redirect(
      `${process.env.FRONTEND_URL}/integrations?linkedin=connected`
    );
  } catch (err) {
    console.log("LinkedIn OAuth error: ", err.response?.data || err);
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
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC", // Options: PUBLIC, CONNECTIONS, LOGGED_IN
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

