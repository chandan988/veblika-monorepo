import axios from "axios";
import AppCredentials from "../../models/appcredentials.model.js";
import Post from "../../models/post.model.js";

// Platform-specific API endpoints and methods
const GRAPH_API_VERSION = "v20.0";
const INSTAGRAM_API_VERSION = "v24.0";

/**
 * Get all posts for a user across all connected platforms
 */
export const getAllPosts = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { platform, limit = 20, offset = 0 } = req.query;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized", status: false });
    }

    // Build query
    const query = { userId: userId.toString() };
    if (platform && platform !== "all") {
      query.platform = platform.toUpperCase();
    }

    // Fetch posts from database
    const posts = await Post.find(query)
      .sort({ publishedAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .lean();

    const totalCount = await Post.countDocuments(query);

    // Enrich posts with platform-specific data
    const enrichedPosts = posts.map((post) => ({
      id: post._id,
      postId: post.postId,
      platform: post.platform,
      content: post.content || post.caption || post.description || "",
      title: post.title || "",
      mediaUrl: post.mediaUrl || post.thumbnailUrl || post.videoUrl || "",
      postType: post.postType,
      publishedAt: post.publishedAt,
      analytics: {
        likes: post.analytics?.likes || 0,
        comments: post.analytics?.comments || 0,
        shares: post.analytics?.shares || 0,
        views: post.analytics?.views || post.analytics?.videoViews || 0,
      },
    }));

    return res.status(200).json({
      status: true,
      data: enrichedPosts,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + posts.length < totalCount,
      },
    });
  } catch (error) {
    console.error("[getAllPosts] Error:", error);
    return res.status(500).json({ message: error.message, status: false });
  }
};

/**
 * Get comments for a specific post
 */
export const getPostComments = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { postId, platform } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized", status: false });
    }

    if (!postId || !platform) {
      return res.status(400).json({ message: "postId and platform are required", status: false });
    }

    const appCredential = await AppCredentials.findOne({
      userId,
      platform: platform.toUpperCase(),
    });

    if (!appCredential) {
      return res.status(404).json({ message: "Platform not connected", status: false });
    }

    let comments = [];

    switch (platform.toUpperCase()) {
      case "FACEBOOK":
        comments = await getFacebookComments(appCredential, postId);
        break;
      case "INSTAGRAM":
        comments = await getInstagramComments(appCredential, postId);
        break;
      case "YOUTUBE":
        comments = await getYouTubeComments(appCredential, postId);
        break;
      case "LINKEDIN":
        comments = await getLinkedInComments(appCredential, postId);
        break;
      default:
        return res.status(400).json({ message: "Unsupported platform", status: false });
    }

    return res.status(200).json({
      status: true,
      data: comments,
    });
  } catch (error) {
    console.error("[getPostComments] Error:", error);
    return res.status(500).json({ message: error.message, status: false });
  }
};

/**
 * Post a comment on a post
 */
export const postComment = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { postId, platform, message, parentId } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized", status: false });
    }

    if (!postId || !platform || !message) {
      return res.status(400).json({ message: "postId, platform, and message are required", status: false });
    }

    const appCredential = await AppCredentials.findOne({
      userId,
      platform: platform.toUpperCase(),
    });

    if (!appCredential) {
      return res.status(404).json({ message: "Platform not connected", status: false });
    }

    let result;

    switch (platform.toUpperCase()) {
      case "FACEBOOK":
        result = await postFacebookComment(appCredential, postId, message, parentId);
        break;
      case "INSTAGRAM":
        result = await postInstagramComment(appCredential, postId, message, parentId);
        break;
      case "YOUTUBE":
        result = await postYouTubeComment(appCredential, postId, message, parentId);
        break;
      case "LINKEDIN":
        result = await postLinkedInComment(appCredential, postId, message, parentId);
        break;
      default:
        return res.status(400).json({ message: "Unsupported platform", status: false });
    }

    return res.status(200).json({
      status: true,
      data: result,
      message: "Comment posted successfully",
    });
  } catch (error) {
    console.error("[postComment] Error:", error);
    return res.status(500).json({ message: error.message, status: false });
  }
};

// ==================== FACEBOOK ====================

async function getFacebookComments(appCredential, postId) {
  const accessToken = appCredential.credentials.pages?.[0]?.page_access_token;
  if (!accessToken) {
    throw new Error("Facebook access token not found");
  }

  try {
    const response = await axios.get(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${postId}/comments`,
      {
        params: {
          access_token: accessToken,
          fields: "id,message,created_time,from{id,name,picture},comment_count,like_count,attachment",
          order: "reverse_chronological",
          limit: 50,
        },
      }
    );

    return (response.data.data || []).map((comment) => ({
      id: comment.id,
      message: comment.message,
      createdAt: comment.created_time,
      author: {
        id: comment.from?.id,
        name: comment.from?.name || "Facebook User",
        avatar: comment.from?.picture?.data?.url,
      },
      likeCount: comment.like_count || 0,
      replyCount: comment.comment_count || 0,
      hasReplies: comment.comment_count > 0,
      attachment: comment.attachment,
    }));
  } catch (error) {
    console.error("[getFacebookComments] Error:", error.response?.data || error.message);
    return [];
  }
}

async function postFacebookComment(appCredential, postId, message, parentId) {
  const accessToken = appCredential.credentials.pages?.[0]?.page_access_token;
  if (!accessToken) {
    throw new Error("Facebook access token not found");
  }

  const targetId = parentId || postId;
  
  try {
    // Facebook Graph API expects parameters as URL query params, not JSON body
    const response = await axios.post(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${targetId}/comments`,
      null, // No body
      {
        params: {
          message,
          access_token: accessToken,
        },
      }
    );

    return {
      id: response.data.id,
      message,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[postFacebookComment] Error:", {
      status: error.response?.status,
      error: error.response?.data?.error,
      targetId,
    });
    
    // Provide user-friendly error message
    const fbError = error.response?.data?.error;
    if (fbError) {
      throw new Error(`Facebook API Error: ${fbError.message || fbError.error_user_msg || "Permission denied"}`);
    }
    throw error;
  }
}

// ==================== INSTAGRAM ====================

async function getInstagramComments(appCredential, postId) {
  const accessToken = appCredential.credentials.instagram_user_access_token ||
    appCredential.credentials.instagram_page_access_token;
    
  if (!accessToken) {
    throw new Error("Instagram access token not found");
  }

  try {
    const response = await axios.get(
      `https://graph.instagram.com/${INSTAGRAM_API_VERSION}/${postId}/comments`,
      {
        params: {
          access_token: accessToken,
          fields: "id,text,timestamp,username,like_count,replies{id,text,timestamp,username,like_count}",
          limit: 50,
        },
      }
    );

    return (response.data.data || []).map((comment) => ({
      id: comment.id,
      message: comment.text,
      createdAt: comment.timestamp,
      author: {
        id: comment.username,
        name: comment.username,
        avatar: null, // Instagram doesn't provide avatar in comments API
      },
      likeCount: comment.like_count || 0,
      replyCount: comment.replies?.data?.length || 0,
      hasReplies: comment.replies?.data?.length > 0,
      replies: comment.replies?.data?.map((reply) => ({
        id: reply.id,
        message: reply.text,
        createdAt: reply.timestamp,
        author: {
          id: reply.username,
          name: reply.username,
          avatar: null,
        },
        likeCount: reply.like_count || 0,
      })),
    }));
  } catch (error) {
    console.error("[getInstagramComments] Error:", error.response?.data || error.message);
    return [];
  }
}

async function postInstagramComment(appCredential, postId, message, parentId) {
  const accessToken = appCredential.credentials.instagram_user_access_token ||
    appCredential.credentials.instagram_page_access_token;
    
  if (!accessToken) {
    throw new Error("Instagram access token not found");
  }

  // Instagram API uses different endpoints:
  // - POST /{media-id}/comments for new comments on a post
  // - POST /{comment-id}/replies for replies to existing comments
  const endpoint = parentId
    ? `https://graph.instagram.com/${INSTAGRAM_API_VERSION}/${parentId}/replies`
    : `https://graph.instagram.com/${INSTAGRAM_API_VERSION}/${postId}/comments`;

  const response = await axios.post(
    endpoint,
    null,
    {
      params: {
        message,
        access_token: accessToken,
      },
    }
  );

  return {
    id: response.data.id,
    message,
    createdAt: new Date().toISOString(),
  };
}

// ==================== YOUTUBE ====================

// Helper function to get valid YouTube access token with auto-refresh
async function getValidYouTubeToken(appCredential) {
  const tokens = appCredential.credentials;
  const now = Date.now();

  // Check if token is still valid (with 1 minute buffer)
  if (tokens.expiry && now < tokens.expiry - 60000) {
    return tokens.access_token;
  }

  // Token expired or about to expire, refresh it
  if (!tokens.refresh_token) {
    throw new Error("YouTube refresh token not found. Please reconnect your YouTube account.");
  }

  console.log("[YouTube] Access token expired, refreshing...");

  // Get YouTube/Google app config from database (with fallback to env)
  let youtubeConfig;
  try {
    youtubeConfig = await getAppConfig(appCredential.userId, "app/youtube");
  } catch (error) {
    console.error("[YouTube refreshToken] Error getting app config:", error.message);
    throw new Error("YouTube app configuration not found");
  }

  const refreshRes = await axios.post("https://oauth2.googleapis.com/token", {
    client_id: youtubeConfig.appClientId,
    client_secret: youtubeConfig.appClientSecret,
    refresh_token: tokens.refresh_token,
    grant_type: "refresh_token",
  });

  const newAccessToken = refreshRes.data.access_token;
  const newExpiry = Date.now() + refreshRes.data.expires_in * 1000;

  // Update in database
  await AppCredentials.findOneAndUpdate(
    { userId: appCredential.userId, platform: "YOUTUBE" },
    {
      $set: {
        "credentials.access_token": newAccessToken,
        "credentials.expires_in": refreshRes.data.expires_in,
        "credentials.expiry": newExpiry,
      },
    }
  );

  console.log("[YouTube] Access token refreshed successfully");
  return newAccessToken;
}

async function getYouTubeComments(appCredential, videoId) {
  const accessToken = await getValidYouTubeToken(appCredential);
  if (!accessToken) {
    throw new Error("YouTube access token not found");
  }

  try {
    const response = await axios.get(
      "https://www.googleapis.com/youtube/v3/commentThreads",
      {
        params: {
          part: "snippet,replies",
          videoId,
          maxResults: 50,
          order: "time",
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return (response.data.items || []).map((thread) => {
      const topComment = thread.snippet.topLevelComment.snippet;
      return {
        id: thread.id,
        commentId: thread.snippet.topLevelComment.id,
        message: topComment.textDisplay,
        createdAt: topComment.publishedAt,
        author: {
          id: topComment.authorChannelId?.value,
          name: topComment.authorDisplayName,
          avatar: topComment.authorProfileImageUrl,
        },
        likeCount: topComment.likeCount || 0,
        replyCount: thread.snippet.totalReplyCount || 0,
        hasReplies: thread.snippet.totalReplyCount > 0,
        replies: thread.replies?.comments?.map((reply) => ({
          id: reply.id,
          message: reply.snippet.textDisplay,
          createdAt: reply.snippet.publishedAt,
          author: {
            id: reply.snippet.authorChannelId?.value,
            name: reply.snippet.authorDisplayName,
            avatar: reply.snippet.authorProfileImageUrl,
          },
          likeCount: reply.snippet.likeCount || 0,
        })),
      };
    });
  } catch (error) {
    console.error("[getYouTubeComments] Error:", error.response?.data || error.message);
    return [];
  }
}

async function postYouTubeComment(appCredential, videoId, message, parentId) {
  const accessToken = await getValidYouTubeToken(appCredential);
  if (!accessToken) {
    throw new Error("YouTube access token not found");
  }

  if (parentId) {
    // Reply to a comment
    const response = await axios.post(
      "https://www.googleapis.com/youtube/v3/comments",
      {
        snippet: {
          parentId,
          textOriginal: message,
        },
      },
      {
        params: { part: "snippet" },
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    return {
      id: response.data.id,
      message,
      createdAt: new Date().toISOString(),
    };
  } else {
    // New top-level comment
    const response = await axios.post(
      "https://www.googleapis.com/youtube/v3/commentThreads",
      {
        snippet: {
          videoId,
          topLevelComment: {
            snippet: {
              textOriginal: message,
            },
          },
        },
      },
      {
        params: { part: "snippet" },
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    return {
      id: response.data.id,
      message,
      createdAt: new Date().toISOString(),
    };
  }
}

// ==================== LINKEDIN ====================

async function getLinkedInComments(appCredential, postId) {
  const accessToken = appCredential.credentials.access_token;
  if (!accessToken) {
    throw new Error("LinkedIn access token not found");
  }

  try {
    // LinkedIn uses URN format for posts
    const postUrn = postId.startsWith("urn:") ? postId : `urn:li:share:${postId}`;
    
    const response = await axios.get(
      "https://api.linkedin.com/v2/socialActions/" + encodeURIComponent(postUrn) + "/comments",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Restli-Protocol-Version": "2.0.0",
        },
        params: {
          count: 50,
        },
      }
    );

    return (response.data.elements || []).map((comment) => ({
      id: comment["$URN"] || comment.id,
      message: comment.message?.text || comment.comment,
      createdAt: comment.created?.time ? new Date(comment.created.time).toISOString() : null,
      author: {
        id: comment.actor,
        name: "LinkedIn User", // LinkedIn API doesn't always include name
        avatar: null,
      },
      likeCount: comment.likesSummary?.totalLikes || 0,
      replyCount: comment.commentsSummary?.totalFirstLevelComments || 0,
      hasReplies: (comment.commentsSummary?.totalFirstLevelComments || 0) > 0,
    }));
  } catch (error) {
    console.error("[getLinkedInComments] Error:", error.response?.data || error.message);
    return [];
  }
}

async function postLinkedInComment(appCredential, postId, message, parentId) {
  const accessToken = appCredential.credentials.access_token;
  if (!accessToken) {
    throw new Error("LinkedIn access token not found");
  }

  const personId = appCredential.credentials.user_id;
  const postUrn = postId.startsWith("urn:") ? postId : `urn:li:share:${postId}`;

  const response = await axios.post(
    "https://api.linkedin.com/v2/socialActions/" + encodeURIComponent(postUrn) + "/comments",
    {
      actor: `urn:li:person:${personId}`,
      message: {
        text: message,
      },
      ...(parentId && { parentComment: parentId }),
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
    }
  );

  return {
    id: response.data["$URN"] || response.data.id,
    message,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Fetch fresh posts from platform APIs (sync)
 * This performs a FULL sync - removes deleted posts and adds new ones
 */
export const syncPosts = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { platform } = req.query;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized", status: false });
    }

    const platforms = platform && platform !== "all" 
      ? [platform.toUpperCase()] 
      : ["FACEBOOK", "INSTAGRAM", "YOUTUBE", "LINKEDIN"];

    const results = { synced: 0, deleted: 0, errors: [] };

    for (const plat of platforms) {
      try {
        const credential = await AppCredentials.findOne({ userId, platform: plat });
        
        if (!credential) {
          console.log(`[syncPosts] No credential found for ${plat} (userId: ${userId})`);
          continue;
        }

        console.log(`[syncPosts] Found credential for ${plat}, userId: ${userId}`);
        console.log(`[syncPosts] Credential keys:`, Object.keys(credential.credentials || {}));

        let posts = [];
        switch (plat) {
          case "FACEBOOK":
            posts = await fetchFacebookPosts(credential);
            break;
          case "INSTAGRAM":
            posts = await fetchInstagramPosts(credential);
            if (posts.length === 0) {
              console.warn(`[syncPosts] No posts fetched from ${plat}. This could indicate an API error or the account has no posts.`);
            }
            break;
          case "YOUTUBE":
            posts = await fetchYouTubePosts(credential);
            break;
          case "LINKEDIN":
            posts = await fetchLinkedInPosts(credential);
            break;
        }

        console.log(`[syncPosts] Fetched ${posts.length} posts from ${plat}`);

        // Get all post IDs from the platform
        const platformPostIds = new Set(posts.map(p => p.postId));

        // Delete posts that no longer exist on the platform
        const existingPosts = await Post.find({ 
          userId: userId.toString(), 
          platform: plat 
        }).select('postId');

        for (const existingPost of existingPosts) {
          if (!platformPostIds.has(existingPost.postId)) {
            await Post.deleteOne({ 
              userId: userId.toString(), 
              postId: existingPost.postId 
            });
            results.deleted++;
            console.log(`[syncPosts] Deleted post ${existingPost.postId} (no longer exists on ${plat})`);
          }
        }

        // Upsert posts to database
        for (const post of posts) {
          try {
            await Post.findOneAndUpdate(
              { userId: userId.toString(), postId: post.postId },
              { ...post, userId: userId.toString() },
              { upsert: true, new: true }
            );
            results.synced++;
          } catch (err) {
            console.error(
              `[syncPosts] Upsert failed for ${plat} postId=${post.postId}:`,
              err
            );
            results.errors.push({ platform: plat, error: err.message });
          }
        }
      } catch (err) {
        console.error(`[syncPosts] Error syncing ${plat}:`, err.message);
        results.errors.push({ platform: plat, error: err.message });
      }
    }

    return res.status(200).json({
      status: true,
      message: `Synced ${results.synced} posts, removed ${results.deleted} deleted posts`,
      data: results,
    });
  } catch (error) {
    console.error("[syncPosts] Error:", error);
    return res.status(500).json({ message: error.message, status: false });
  }
};

// ==================== FETCH POSTS FROM PLATFORMS ====================

async function fetchFacebookPosts(credential) {
  const pageId = credential.credentials.pages?.[0]?.pageId;
  const accessToken = credential.credentials.pages?.[0]?.page_access_token;
  
  console.log(`[fetchFacebookPosts] Checking credentials - pageId: ${pageId ? 'present' : 'missing'}, accessToken: ${accessToken ? 'present' : 'missing'}`);
  
  if (!pageId || !accessToken) {
    console.log(`[fetchFacebookPosts] Missing credentials - Available keys:`, Object.keys(credential.credentials || {}));
    return [];
  }

  const allPosts = [];
  let nextPageUrl = null;
  let pageCount = 0;
  const maxPages = 5; // Fetch up to 5 pages (500 posts max)

  try {
    // Initial request
    let response = await axios.get(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${pageId}/posts`,
      {
        params: {
          access_token: accessToken,
          fields: "id,message,created_time,full_picture,permalink_url,shares,reactions.summary(true),comments.summary(true)",
          limit: 100, // Increased from 25 to 100
        },
      }
    );

    // Process first page
    const posts = (response.data.data || []).map((post) => ({
      platform: "FACEBOOK",
      postId: post.id,
      content: post.message || "",
      mediaUrl: post.full_picture || "",
      postType: "post",
      publishedAt: new Date(post.created_time),
      pageId,
      analytics: {
        likes: post.reactions?.summary?.total_count || 0,
        comments: post.comments?.summary?.total_count || 0,
        shares: post.shares?.count || 0,
      },
    }));
    allPosts.push(...posts);
    pageCount++;

    // Fetch additional pages if available
    nextPageUrl = response.data.paging?.next;
    while (nextPageUrl && pageCount < maxPages) {
      response = await axios.get(nextPageUrl);
      const morePosts = (response.data.data || []).map((post) => ({
        platform: "FACEBOOK",
        postId: post.id,
        content: post.message || "",
        mediaUrl: post.full_picture || "",
        postType: "post",
        publishedAt: new Date(post.created_time),
        pageId,
        analytics: {
          likes: post.reactions?.summary?.total_count || 0,
          comments: post.comments?.summary?.total_count || 0,
          shares: post.shares?.count || 0,
        },
      }));
      allPosts.push(...morePosts);
      nextPageUrl = response.data.paging?.next;
      pageCount++;
    }

    console.log(`[fetchFacebookPosts] Fetched ${allPosts.length} posts from ${pageCount} pages`);
    return allPosts;
  } catch (error) {
    console.error("[fetchFacebookPosts] Error:", error.response?.data || error.message);
    return allPosts; // Return what we have so far
  }
}

async function fetchInstagramPosts(credential) {
  // Instagram credentials can be stored with different keys depending on auth method:
  // New Instagram Business Login: instagram_account_id, instagram_user_access_token
  // Old Facebook Pages method: instagram_business_account_id, pages[].instagram_page_access_token
  const accountId = credential.credentials.instagram_account_id || 
    credential.credentials.instagram_business_account_id ||
    credential.credentials.pages?.[0]?.instagram_account_id;
    
  const accessToken = credential.credentials.instagram_user_access_token ||
    credential.credentials.instagram_page_access_token ||
    credential.credentials.pages?.[0]?.instagram_page_access_token;
  
  console.log(`[fetchInstagramPosts] Checking credentials - accountId: ${accountId ? 'present' : 'missing'}, accessToken: ${accessToken ? 'present' : 'missing'}`);
  
  if (!accountId || !accessToken) {
    const errorMsg = `Missing Instagram credentials - accountId: ${accountId ? 'present' : 'missing'}, accessToken: ${accessToken ? 'present' : 'missing'}`;
    console.error(`[fetchInstagramPosts] ${errorMsg}`);
    console.log(`[fetchInstagramPosts] Available credential keys:`, Object.keys(credential.credentials || {}));
    throw new Error(errorMsg);
  }
  
  // Validate accountId format (Instagram account IDs are typically numeric strings)
  if (typeof accountId !== 'string' || accountId.trim().length === 0) {
    const errorMsg = `Invalid Instagram accountId format: ${accountId}`;
    console.error(`[fetchInstagramPosts] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  const allPosts = [];
  let nextPageUrl = null;
  let pageCount = 0;
  const maxPages = 5; // Fetch up to 5 pages (500 posts max)

  try {
    console.log(`[fetchInstagramPosts] Fetching posts for accountId: ${accountId}, API version: ${INSTAGRAM_API_VERSION}`);
    
    // Initial request
    let response = await axios.get(
      `https://graph.instagram.com/${INSTAGRAM_API_VERSION}/${accountId}/media`,
      {
        params: {
          access_token: accessToken,
          fields: "id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count",
          limit: 100, // Increased from 25 to 100
        },
      }
    );

    console.log(`[fetchInstagramPosts] API response status: ${response.status}, data length: ${response.data?.data?.length || 0}`);

    // Check if response has data
    if (!response.data || !response.data.data) {
      console.warn(`[fetchInstagramPosts] No data in response:`, response.data);
      return [];
    }

    // Process first page
    const posts = (response.data.data || []).map((post) => {
      // Determine post type: REELS have media_product_type === "REELS", regular videos are just "VIDEO"
      let postType = "post";
      if (post.media_product_type === "REELS") {
        postType = "reel";
      } else if (post.media_type === "VIDEO") {
        postType = "video";
      } else if (post.media_type === "CAROUSEL_ALBUM") {
        postType = "carousel";
      }
      
      return {
        platform: "INSTAGRAM",
        postId: post.id,
        content: post.caption || "",
        mediaUrl: post.media_url || post.thumbnail_url || "",
        postType: postType,
        publishedAt: new Date(post.timestamp),
        accountId,
        analytics: {
          likes: post.like_count || 0,
          comments: post.comments_count || 0,
        },
      };
    });
    allPosts.push(...posts);
    pageCount++;

    console.log(`[fetchInstagramPosts] Processed ${posts.length} posts from page ${pageCount}`);

    // Fetch additional pages if available
    nextPageUrl = response.data.paging?.next;
    while (nextPageUrl && pageCount < maxPages) {
      try {
        response = await axios.get(nextPageUrl);
        const morePosts = (response.data.data || []).map((post) => {
          // Determine post type: REELS have media_product_type === "REELS", regular videos are just "VIDEO"
          let postType = "post";
          if (post.media_product_type === "REELS") {
            postType = "reel";
          } else if (post.media_type === "VIDEO") {
            postType = "video";
          } else if (post.media_type === "CAROUSEL_ALBUM") {
            postType = "carousel";
          }
          
          return {
            platform: "INSTAGRAM",
            postId: post.id,
            content: post.caption || "",
            mediaUrl: post.media_url || post.thumbnail_url || "",
            postType: postType,
            publishedAt: new Date(post.timestamp),
            accountId,
            analytics: {
              likes: post.like_count || 0,
              comments: post.comments_count || 0,
            },
          };
        });
        allPosts.push(...morePosts);
        nextPageUrl = response.data.paging?.next;
        pageCount++;
        console.log(`[fetchInstagramPosts] Processed ${morePosts.length} posts from page ${pageCount}`);
      } catch (pageError) {
        console.error(`[fetchInstagramPosts] Error fetching page ${pageCount + 1}:`, pageError.response?.data || pageError.message);
        break; // Stop pagination on error
      }
    }

    console.log(`[fetchInstagramPosts] Successfully fetched ${allPosts.length} posts from ${pageCount} pages`);
    return allPosts;
  } catch (error) {
    const errorDetails = {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
    };
    console.error("[fetchInstagramPosts] Error fetching Instagram posts:", JSON.stringify(errorDetails, null, 2));
    
    // If it's an authentication/authorization error, throw it so it can be caught by sync function
    if (error.response?.status === 401 || error.response?.status === 403) {
      const errorMsg = error.response?.data?.error?.message || "Instagram authentication/authorization error. Check if access token has required permissions: instagram_basic, pages_read_engagement";
      console.error(`[fetchInstagramPosts] ${errorMsg}`);
      throw new Error(`Instagram API Error (${error.response?.status}): ${errorMsg}`);
    }
    
    // If it's a 400 error, throw it with details
    if (error.response?.status === 400) {
      const errorMsg = error.response?.data?.error?.message || "Bad request error. Check accountId and API parameters.";
      console.error(`[fetchInstagramPosts] ${errorMsg}`);
      throw new Error(`Instagram API Error (400): ${errorMsg}`);
    }
    
    // For other errors, still throw but with less detail
    if (error.response?.status >= 500) {
      throw new Error(`Instagram API Server Error (${error.response?.status}): ${error.response?.data?.error?.message || error.message}`);
    }
    
    // For network errors or unknown errors, return what we have
    console.warn(`[fetchInstagramPosts] Non-fatal error, returning ${allPosts.length} posts fetched so far`);
    return allPosts; // Return what we have so far (empty array if first request failed)
  }
}

async function fetchYouTubePosts(credential) {
  // Channel ID can be stored in different locations
  const channelId = credential.credentials.channel_id || credential.credentials.channel?.id;
  
  if (!channelId) {
    console.log("[fetchYouTubePosts] No channel ID found");
    return [];
  }

  try {
    // Get valid access token with auto-refresh
    const accessToken = await getValidYouTubeToken(credential);
    if (!accessToken) return [];

    // Get uploads playlist
    const channelResponse = await axios.get(
      "https://www.googleapis.com/youtube/v3/channels",
      {
        params: {
          part: "contentDetails",
          id: channelId,
        },
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const uploadsPlaylistId = channelResponse.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsPlaylistId) return [];

    // Fetch all videos with pagination
    const allVideos = [];
    let nextPageToken = null;
    let pageCount = 0;
    const maxPages = 10; // Fetch up to 10 pages (500 videos max)

    do {
      const videosResponse = await axios.get(
        "https://www.googleapis.com/youtube/v3/playlistItems",
        {
          params: {
            part: "snippet,contentDetails",
            playlistId: uploadsPlaylistId,
            maxResults: 50, // Increased from 25 to 50 (YouTube max)
            pageToken: nextPageToken,
          },
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      allVideos.push(...(videosResponse.data.items || []));
      nextPageToken = videosResponse.data.nextPageToken;
      pageCount++;
    } while (nextPageToken && pageCount < maxPages);

    console.log(`[fetchYouTubePosts] Fetched ${allVideos.length} videos from ${pageCount} pages`);

    if (allVideos.length === 0) return [];

    // Get video statistics (in batches of 50)
    const statsMap = {};
    for (let i = 0; i < allVideos.length; i += 50) {
      const batch = allVideos.slice(i, i + 50);
      const videoIds = batch.map((item) => item.contentDetails.videoId).join(",");
      
      const statsResponse = await axios.get(
        "https://www.googleapis.com/youtube/v3/videos",
        {
          params: {
            part: "statistics",
            id: videoIds,
          },
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      statsResponse.data.items.forEach((item) => {
        statsMap[item.id] = item.statistics;
      });
    }

    return allVideos.map((item) => {
      const videoId = item.contentDetails.videoId;
      const stats = statsMap[videoId] || {};
      return {
        platform: "YOUTUBE",
        postId: videoId,
        videoId,
        channelId,
        title: item.snippet.title,
        description: item.snippet.description,
        content: item.snippet.title,
        mediaUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
        thumbnailUrl: item.snippet.thumbnails?.high?.url,
        postType: "video",
        publishedAt: new Date(item.snippet.publishedAt),
        analytics: {
          views: parseInt(stats.viewCount) || 0,
          likes: parseInt(stats.likeCount) || 0,
          comments: parseInt(stats.commentCount) || 0,
        },
      };
    });
  } catch (error) {
    console.error("[fetchYouTubePosts] Error:", error.response?.data || error.message);
    return [];
  }
}

async function fetchLinkedInPosts(credential) {
  const personId = credential.credentials.user_id;
  // LinkedIn stores token as user_access_token
  const accessToken = credential.credentials.user_access_token || credential.credentials.access_token;
  
  console.log(`[fetchLinkedInPosts] Checking credentials - personId: ${personId ? "present" : "missing"}, accessToken: ${accessToken ? "present" : "missing"}`);
  
  if (!personId || !accessToken) {
    console.log("[fetchLinkedInPosts] Missing credentials, returning empty array");
    return [];
  }

  const allPosts = [];

  try {
    // Try the newer Posts API first (v2/posts)
    try {
      const response = await axios.get(
        "https://api.linkedin.com/v2/posts",
        {
          params: {
            author: `urn:li:person:${personId}`,
            q: "author",
            count: 100,
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "LinkedIn-Version": "202401",
          },
        }
      );

      const posts = (response.data.elements || []).map((post) => ({
        platform: "LINKEDIN",
        postId: post.id || post.urn,
        content: post.commentary || post.specificContent?.["com.linkedin.ugc.ShareContent"]?.shareCommentary?.text || "",
        mediaUrl: post.content?.media?.[0]?.thumbnails?.[0]?.url || "",
        postType: "post",
        publishedAt: post.createdAt ? new Date(post.createdAt) : new Date(),
        accountId: personId,
        analytics: {
          likes: post.likeCount || 0,
          comments: post.commentCount || 0,
          shares: post.shareCount || 0,
        },
      }));

      allPosts.push(...posts);
      console.log(`[fetchLinkedInPosts] Fetched ${allPosts.length} posts using v2/posts API`);
      return allPosts;
    } catch (postsError) {
      console.log("[fetchLinkedInPosts] v2/posts failed, trying ugcPosts:", postsError.response?.status);
    }

    // Fallback to UGC Posts API - use pre-encoded URL to avoid axios encoding issues
    try {
      const ugcUrl = `https://api.linkedin.com/v2/ugcPosts?q=authors&authors=List(urn%3Ali%3Aperson%3A${personId})&count=100`;
      const response = await axios.get(ugcUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Restli-Protocol-Version": "2.0.0",
        },
      });

      const posts = (response.data.elements || []).map((post) => ({
        platform: "LINKEDIN",
        postId: post.id,
        content: post.specificContent?.["com.linkedin.ugc.ShareContent"]?.shareCommentary?.text || "",
        mediaUrl: post.specificContent?.["com.linkedin.ugc.ShareContent"]?.media?.[0]?.thumbnails?.[0]?.url || "",
        postType: "post",
        publishedAt: post.created?.time ? new Date(post.created.time) : new Date(),
        accountId: personId,
        analytics: {
          likes: 0,
          comments: 0,
          shares: 0,
        },
      }));

      allPosts.push(...posts);
      console.log(`[fetchLinkedInPosts] Fetched ${allPosts.length} posts using ugcPosts API`);
      return allPosts;
    } catch (ugcError) {
      console.log("[fetchLinkedInPosts] ugcPosts failed:", ugcError.response?.status, ugcError.response?.data);
    }

    // Last resort: try old shares API with pre-encoded URL
    try {
      const sharesUrl = `https://api.linkedin.com/v2/shares?q=owners&owners=urn%3Ali%3Aperson%3A${personId}&count=100`;
      const response = await axios.get(sharesUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Restli-Protocol-Version": "2.0.0",
        },
      });

      const posts = (response.data.elements || []).map((post) => ({
        platform: "LINKEDIN",
        postId: post.id || post.activity,
        content: post.text?.text || "",
        mediaUrl: post.content?.contentEntities?.[0]?.thumbnails?.[0]?.resolvedUrl || "",
        postType: "post",
        publishedAt: post.created?.time ? new Date(post.created.time) : new Date(),
        accountId: personId,
        analytics: {
          likes: 0,
          comments: 0,
          shares: 0,
        },
      }));

      allPosts.push(...posts);
      console.log(`[fetchLinkedInPosts] Fetched ${allPosts.length} posts using shares API`);
      return allPosts;
    } catch (sharesError) {
      console.log("[fetchLinkedInPosts] shares failed:", sharesError.response?.status, sharesError.response?.data);
    }

    return allPosts;
  } catch (error) {
    console.error("[fetchLinkedInPosts] All APIs failed:", error.response?.data || error.message);
    return allPosts;
  }
}

/**
 * Get comment replies
 */
export const getCommentReplies = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { commentId, platform } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized", status: false });
    }

    const appCredential = await AppCredentials.findOne({
      userId,
      platform: platform.toUpperCase(),
    });

    if (!appCredential) {
      return res.status(404).json({ message: "Platform not connected", status: false });
    }

    let replies = [];

    switch (platform.toUpperCase()) {
      case "FACEBOOK":
        replies = await getFacebookReplies(appCredential, commentId);
        break;
      case "YOUTUBE":
        replies = await getYouTubeReplies(appCredential, commentId);
        break;
      default:
        // Instagram and LinkedIn replies are included in main comments call
        break;
    }

    return res.status(200).json({
      status: true,
      data: replies,
    });
  } catch (error) {
    console.error("[getCommentReplies] Error:", error);
    return res.status(500).json({ message: error.message, status: false });
  }
};

async function getFacebookReplies(appCredential, commentId) {
  const accessToken = appCredential.credentials.pages?.[0]?.page_access_token;
  if (!accessToken) return [];

  try {
    const response = await axios.get(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${commentId}/comments`,
      {
        params: {
          access_token: accessToken,
          fields: "id,message,created_time,from{id,name,picture},like_count",
          limit: 50,
        },
      }
    );

    return (response.data.data || []).map((reply) => ({
      id: reply.id,
      message: reply.message,
      createdAt: reply.created_time,
      author: {
        id: reply.from?.id,
        name: reply.from?.name || "Facebook User",
        avatar: reply.from?.picture?.data?.url,
      },
      likeCount: reply.like_count || 0,
    }));
  } catch (error) {
    console.error("[getFacebookReplies] Error:", error.response?.data || error.message);
    return [];
  }
}

async function getYouTubeReplies(appCredential, commentId) {
  try {
    const accessToken = await getValidYouTubeToken(appCredential);
    if (!accessToken) return [];

    const response = await axios.get(
      "https://www.googleapis.com/youtube/v3/comments",
      {
        params: {
          part: "snippet",
          parentId: commentId,
          maxResults: 50,
        },
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    return (response.data.items || []).map((reply) => ({
      id: reply.id,
      message: reply.snippet.textDisplay,
      createdAt: reply.snippet.publishedAt,
      author: {
        id: reply.snippet.authorChannelId?.value,
        name: reply.snippet.authorDisplayName,
        avatar: reply.snippet.authorProfileImageUrl,
      },
      likeCount: reply.snippet.likeCount || 0,
    }));
  } catch (error) {
    console.error("[getYouTubeReplies] Error:", error.response?.data || error.message);
    return [];
  }
}

