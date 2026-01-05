import AppCredentials from "../../models/appcredentials.model.js";

import UserModel from "../../models/user.model.js";

export const getConnectedAccounts = async (req, res) => {
  try {
    // Multi-tenant: Each user has their own userId
    // No fallback to "default" - each user is isolated
    if (!req.user?._id) {
      return res.status(401).json({ message: "Unauthorized", status: false });
    }
    
    let userId = String(req.user._id);
    
    console.log("[getConnectedAccounts] Checking with userId:", userId);
    console.log("[getConnectedAccounts] req.user:", req.user);

    // Query with the userId from req.user
    let connectedPlatforms = await AppCredentials.find({
      userId,
      platform: { $in: ["FACEBOOK", "INSTAGRAM", "LINKEDIN", "YOUTUBE"] },
    }).lean();

    console.log("[getConnectedAccounts] Found platforms with userId:", userId, "Count:", connectedPlatforms.length);
    console.log("[getConnectedAccounts] Platform details:", connectedPlatforms.map(p => ({ platform: p.platform, userId: p.userId })));

    // If no platforms found, try to find by email as fallback
    // This handles cases where credentials were saved with a different userId
    if (connectedPlatforms.length === 0) {
      console.log("[getConnectedAccounts] No platforms found with userId:", userId);
      
      // Try to find by email if available in headers
      const userEmail = req.headers["x-user-email"];
      if (userEmail) {
        console.log("[getConnectedAccounts] Trying to find user by email:", userEmail);
        const userByEmail = await UserModel.findOne({ email: userEmail }).lean();
        if (userByEmail) {
          console.log("[getConnectedAccounts] User found by email, _id:", userByEmail._id);
          const mongoUserId = String(userByEmail._id);
          
          // Query with MongoDB user _id (this is the correct userId to use)
          connectedPlatforms = await AppCredentials.find({
            userId: mongoUserId,
            platform: { $in: ["FACEBOOK", "INSTAGRAM", "LINKEDIN", "YOUTUBE"] },
          }).lean();
          console.log("[getConnectedAccounts] Found platforms with MongoDB _id from email lookup:", connectedPlatforms.length);
          
          // Update userId to MongoDB _id for consistency
          if (connectedPlatforms.length > 0) {
            userId = mongoUserId;
          }
        }
      }
      
      // If still no platforms found and userId from middleware doesn't match MongoDB _id,
      // try querying with the better-auth userId directly (in case credentials were saved with that)
      if (connectedPlatforms.length === 0) {
        console.log("[getConnectedAccounts] Trying direct lookup with better-auth userId:", userId);
        connectedPlatforms = await AppCredentials.find({
          userId: userId,
          platform: { $in: ["FACEBOOK", "INSTAGRAM", "LINKEDIN", "YOUTUBE"] },
        }).lean();
        console.log("[getConnectedAccounts] Direct lookup with better-auth userId result:", connectedPlatforms.length);
      }
    }

    const accounts = {};

    connectedPlatforms.forEach((platform) => {
      const credentials = platform.credentials;
      
      if (platform.platform === "INSTAGRAM") {
        console.log("[getConnectedAccounts] Instagram platform found:", {
          userId: platform.userId,
          has_credentials: !!credentials,
          credentials_keys: credentials ? Object.keys(credentials) : [],
          instagram_account_id: credentials?.instagram_account_id,
          instagram_username: credentials?.instagram_username,
        });

        // Check for new Instagram Business Login structure first
        if (credentials?.instagram_account_id && credentials?.instagram_username) {
          accounts["app/instagram"] = {
            connected: true,
            accountName: credentials.instagram_username,
            accountId: credentials.instagram_account_id,
            profilePicture: credentials.instagram_profile_picture,
            name: credentials.instagram_name,
            accountType: credentials.instagram_account_type,
            followersCount: credentials.instagram_followers_count,
            mediaCount: credentials.instagram_media_count,
          };
          console.log("[getConnectedAccounts] Instagram marked as connected with new structure");
        } else if (credentials?.pages && credentials.pages.length > 0) {
          // Fallback: Old structure with pages
          accounts["app/instagram"] = {
            connected: true,
            accountName: credentials.pages[0].instagram_username || credentials.pages[0].pageName,
            accountId: credentials.pages[0].instagram_account_id,
            profilePicture: credentials.pages[0].instagram_profile_picture,
            pages: credentials.pages,
          };
        } else if (credentials) {
          // Still mark as connected if credentials exist (even without account_id/username)
          accounts["app/instagram"] = {
            connected: true,
            accountName: credentials.user_name || credentials.instagram_username || "Instagram Account",
            pages: [],
          };
          console.log("[getConnectedAccounts] Instagram marked as connected (fallback)");
        } else {
          console.log("[getConnectedAccounts] Instagram platform found but no credentials");
        }
      } else if (platform.platform === "FACEBOOK") {
        // Mark as connected if credentials exist, even if no pages
        const firstPage = credentials.pages && credentials.pages.length > 0 ? credentials.pages[0] : null;
        accounts["app/facebook"] = {
          connected: true,
          accountName: firstPage 
            ? firstPage.pageName 
            : credentials.user_name || "Facebook Account",
          accountId: firstPage 
            ? firstPage.pageId 
            : credentials.user_id,
          profilePicture: firstPage?.picture || null, // Use page profile picture if available
          pages: credentials.pages || [],
        };
      } else if (platform.platform === "LINKEDIN") {
        accounts["app/linkedin"] = {
          connected: true,
          accountName: credentials.user_name,
          accountEmail: credentials.user_email,
          accountId: credentials.user_id, // LinkedIn user ID (sub from OIDC)
          profile_picture: credentials.profile_picture, // LinkedIn profile picture
          pages: credentials.pages || [],
        };
      } else if (platform.platform === "YOUTUBE") {
        // Mark as connected if credentials exist
        if (credentials.channel) {
          accounts["app/youtube"] = {
            connected: true,
            accountName: credentials.channel.title,
            accountId: credentials.channel.id,
            thumbnail: credentials.channel.thumbnail,
            subscriberCount: credentials.channel.subscriberCount,
          };
        } else {
          // Still mark as connected if credentials exist
          accounts["app/youtube"] = {
            connected: true,
            accountName: "YouTube Account",
          };
        }
      }
    });

    return res.status(200).json({
      message: "Connected accounts fetched",
      status: true,
      data: accounts,
    });
  } catch (error) {
    console.log("Error fetching connected accounts:", error);
    return res.status(500).json({ message: error.message, status: false });
  }
};

