import Post from "../../models/post.model.js";
import AppCredentials from "../../models/appcredentials.model.js";
import axios from "axios";
import { cleanAnalyticsForPlatform, calculateEngagement } from "../../utils/analytics-validator.js";
import { getAppConfig } from "../../utils/getAppConfig.js";

// Get overview analytics dashboard data
export const getOverviewAnalytics = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = String(req.user._id);
    const { startDate, endDate } = req.query;

    // Date range (default to last 30 days)
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    // Add 1 day buffer to end date to include posts from today
    end.setHours(23, 59, 59, 999);

    console.log("[getOverviewAnalytics] Query params:", {
      userId,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      startDateParam: startDate,
      endDateParam: endDate,
    });

    // Get all posts in date range (or all posts if no date range specified)
    // First, try with date range, but if no posts found and date range is recent, try without date filter
    let query = { userId };
    if (startDate || endDate) {
      query.publishedAt = { $gte: start, $lte: end };
    }
    
    let posts = await Post.find(query).lean();
    
    // If no posts found with date filter, try without date filter to see if posts exist
    if (posts.length === 0) {
      console.log("[getOverviewAnalytics] No posts found with date filter, checking all posts...");
      const allPosts = await Post.find({ userId }).lean();
      console.log("[getOverviewAnalytics] Total posts without date filter:", allPosts.length);
      if (allPosts.length > 0) {
        // Use all posts but still respect date range for calculations
        posts = allPosts.filter((post) => {
          const postDate = post.publishedAt || post.createdAt;
          if (!postDate) return false;
          const date = new Date(postDate);
          return date >= start && date <= end;
        });
        console.log("[getOverviewAnalytics] Filtered posts after manual filter:", posts.length);
      }
    }
    
    console.log("[getOverviewAnalytics] Found posts:", {
      count: posts.length,
      platforms: [...new Set(posts.map(p => p.platform))],
      samplePost: posts[0] ? {
        _id: posts[0]._id,
        platform: posts[0].platform,
        postId: posts[0].postId,
        publishedAt: posts[0].publishedAt,
        hasTitle: !!posts[0].title,
        hasThumbnail: !!posts[0].thumbnailUrl,
      } : null,
    });

    // Calculate aggregate metrics
    const totalReach = posts.reduce((sum, post) => sum + (post.analytics?.reach || 0), 0);
    const totalImpressions = posts.reduce((sum, post) => sum + (post.analytics?.impressions || 0), 0);
    const totalEngagement = posts.reduce((sum, post) => {
      const likes = post.analytics?.likes || 0;
      const comments = post.analytics?.comments || 0;
      const shares = post.analytics?.shares || 0;
      return sum + likes + comments + shares;
    }, 0);

    // Get follower counts from connected accounts
    const connectedPlatforms = await AppCredentials.find({
      userId,
      platform: { $in: ["FACEBOOK", "INSTAGRAM", "YOUTUBE", "LINKEDIN"] },
    }).lean();

    const followers = {};
    connectedPlatforms.forEach((platform) => {
      if (platform.platform === "INSTAGRAM" && platform.credentials.instagram_followers_count) {
        followers.instagram = platform.credentials.instagram_followers_count;
      } else if (platform.platform === "FACEBOOK" && platform.credentials.pages?.[0]?.followers) {
        followers.facebook = platform.credentials.pages[0].followers;
      } else if (platform.platform === "YOUTUBE" && platform.credentials.channel?.subscriberCount) {
        followers.youtube = platform.credentials.channel.subscriberCount;
      }
    });

    // Get best performing posts (top 10 by engagement)
    const bestPosts = posts
      .map((post) => ({
        ...post,
        engagement: (post.analytics?.likes || 0) + (post.analytics?.comments || 0) + (post.analytics?.shares || 0),
      }))
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 10);

    // Platform-by-platform comparison
    const platformStats = {};
    posts.forEach((post) => {
      if (!platformStats[post.platform]) {
        platformStats[post.platform] = {
          posts: 0,
          reach: 0,
          impressions: 0,
          engagement: 0,
          likes: 0,
          comments: 0,
          shares: 0,
        };
      }
      platformStats[post.platform].posts++;
      platformStats[post.platform].reach += post.analytics?.reach || 0;
      platformStats[post.platform].impressions += post.analytics?.impressions || 0;
      platformStats[post.platform].likes += post.analytics?.likes || 0;
      platformStats[post.platform].comments += post.analytics?.comments || 0;
      platformStats[post.platform].shares += post.analytics?.shares || 0;
      platformStats[post.platform].engagement +=
        (post.analytics?.likes || 0) + (post.analytics?.comments || 0) + (post.analytics?.shares || 0);
    });

    // Growth data (daily breakdown)
    const growthData = [];
    const dateMap = {};
    posts.forEach((post) => {
      const postDate = post.publishedAt || post.createdAt || new Date();
      const date = new Date(postDate).toISOString().split("T")[0];
      if (!dateMap[date]) {
        dateMap[date] = {
          date,
          posts: 0,
          reach: 0,
          impressions: 0,
          engagement: 0,
        };
      }
      dateMap[date].posts++;
      dateMap[date].reach += post.analytics?.reach || 0;
      dateMap[date].impressions += post.analytics?.impressions || 0;
      dateMap[date].engagement +=
        (post.analytics?.likes || 0) + (post.analytics?.comments || 0) + (post.analytics?.shares || 0);
    });

    Object.keys(dateMap)
      .sort()
      .forEach((date) => {
        growthData.push(dateMap[date]);
      });

    return res.json({
      success: true,
      data: {
        overview: {
          totalReach,
          totalImpressions,
          totalEngagement,
          totalPosts: posts.length,
          followers,
        },
        bestPosts,
        platformStats,
        growthData,
      },
    });
  } catch (error) {
    console.error("Error fetching overview analytics:", error);
    return res.status(500).json({ message: "Failed to fetch analytics", error: error.message });
  }
};

// Get post-level analytics
export const getPostAnalytics = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = String(req.user._id);
    const { postId } = req.params;

    const post = await Post.findOne({ userId, postId });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Fetch fresh analytics from platform API
    const freshAnalytics = await fetchPostAnalyticsFromPlatform(userId, post.platform, post.postId, post.accountId, post.postType);

    // Update post with fresh analytics
    if (freshAnalytics) {
      // Clean analytics to only include valid fields for the platform
      const cleanedAnalytics = cleanAnalyticsForPlatform(
        post.platform,
        {
          ...post.analytics,
          ...freshAnalytics,
          lastUpdated: new Date(),
        },
        post.postType
      );
      
      post.analytics = cleanedAnalytics;
      await post.save();
    }

    // Hashtag performance (if post has hashtags)
    let hashtagPerformance = [];
    if (post.hashtags && post.hashtags.length > 0) {
      // Get all posts with these hashtags
      const hashtagPosts = await Post.find({
        userId,
        hashtags: { $in: post.hashtags },
        _id: { $ne: post._id },
      }).lean();

      // Calculate engagement for current post
      const currentPostEngagement = calculateEngagement(post.platform, post.analytics);
      
      post.hashtags.forEach((hashtag) => {
        const postsWithHashtag = hashtagPosts.filter((p) => p.hashtags.includes(hashtag));
        const totalEngagement = postsWithHashtag.reduce((sum, p) => {
          // Calculate engagement for each post
          const postEngagement = calculateEngagement(p.platform, p.analytics || {});
          return sum + postEngagement;
        }, 0);

        hashtagPerformance.push({
          hashtag: `#${hashtag}`,
          posts: postsWithHashtag.length + 1, // +1 for current post
          totalEngagement: totalEngagement + currentPostEngagement,
          avgEngagement: Math.round((totalEngagement + currentPostEngagement) / (postsWithHashtag.length + 1)),
        });
      });
    }

    // Calculate engagement on-the-fly (not stored in DB)
    const calculatedEngagement = calculateEngagement(post.platform, post.analytics);
    
    return res.json({
      success: true,
      data: {
        post: {
          ...post.toObject(),
          analytics: {
            ...post.analytics.toObject(),
            engagement: calculatedEngagement, // Add calculated engagement
          },
        },
        hashtagPerformance,
      },
    });
  } catch (error) {
    console.error("Error fetching post analytics:", error);
    return res.status(500).json({ message: "Failed to fetch post analytics", error: error.message });
  }
};

// Fetch fresh analytics from platform APIs
async function fetchPostAnalyticsFromPlatform(userId, platform, postId, accountId, postType = null) {
  try {
    const appCredential = await AppCredentials.findOne({
      userId,
      platform,
    });

    if (!appCredential) {
      return null;
    }

    switch (platform) {
      case "FACEBOOK":
        return await fetchFacebookPostAnalytics(appCredential, postId, postType);
      case "INSTAGRAM":
        return await fetchInstagramPostAnalytics(appCredential, postId, postType);
      case "YOUTUBE":
        return await fetchYouTubeVideoAnalytics(appCredential, postId, accountId);
      default:
        return null;
    }
  } catch (error) {
    console.error(`Error fetching analytics from ${platform}:`, error);
    return null;
  }
}

// Fetch Facebook post analytics
async function fetchFacebookPostAnalytics(appCredential, postId, postType = null) {
  try {
    const accessToken = appCredential.credentials.pages?.[0]?.page_access_token;
    if (!accessToken) {
      console.error("[fetchFacebookPostAnalytics] No access token available");
      return null;
    }

    // First, get the post type to determine if it's a video
    let isVideo = postType === "video";
    
    // If postType not provided, check the post's type field
    if (!isVideo) {
      try {
        const postInfo = await axios.get(`https://graph.facebook.com/v20.0/${postId}`, {
          params: {
            fields: "type",
            access_token: accessToken,
          },
        });
        isVideo = postInfo.data.type === "video" || postInfo.data.type === "native_video";
      } catch (err) {
        console.warn("[fetchFacebookPostAnalytics] Could not determine post type, assuming regular post");
      }
    }

    console.log("[fetchFacebookPostAnalytics] Post info:", {
      postId,
      postType,
      isVideo,
    });

    // Build insights metrics based on post type
    const baseMetrics = "post_impressions,post_reach,post_clicks,post_engaged_users";
    // Facebook video metrics (try multiple metric name variations for compatibility)
    const videoMetrics = isVideo 
      ? ",post_video_views,post_video_complete_views,post_video_complete_views_30s,post_video_avg_time_watched,post_video_length"
      : "";

    // Fetch post data with insights
    let response;
    let data;
    let insightsMap = {};
    
    try {
      response = await axios.get(`https://graph.facebook.com/v20.0/${postId}`, {
        params: {
          fields: "likes.summary(true),comments.summary(true),shares,reactions.summary(true),insights.metric(" + baseMetrics + videoMetrics + ")",
          access_token: accessToken,
        },
      });

      data = response.data;
      
      // Extract insights
      const insights = data.insights?.data || [];
      insights.forEach((insight) => {
        insightsMap[insight.name] = insight.values?.[0]?.value || 0;
      });
    } catch (error) {
      console.warn("[fetchFacebookPostAnalytics] Batch insights request failed, trying base metrics only:", error.response?.data?.error?.message);
      
      // Fallback: Try with base metrics only
      try {
        response = await axios.get(`https://graph.facebook.com/v20.0/${postId}`, {
          params: {
            fields: "likes.summary(true),comments.summary(true),shares,reactions.summary(true),insights.metric(" + baseMetrics + ")",
            access_token: accessToken,
          },
        });
        
        data = response.data;
        const insights = data.insights?.data || [];
        insights.forEach((insight) => {
          insightsMap[insight.name] = insight.values?.[0]?.value || 0;
        });
        
        // If it's a video, try to fetch video metrics individually
        if (isVideo) {
          const videoMetricNames = [
            "post_video_views",
            "post_video_complete_views",
            "post_video_complete_views_30s",
            "post_video_avg_time_watched",
          ];
          
          for (const metric of videoMetricNames) {
            try {
              const metricResponse = await axios.get(`https://graph.facebook.com/v20.0/${postId}/insights`, {
                params: {
                  metric: metric,
                  access_token: accessToken,
                },
              });
              const metricData = metricResponse.data.data?.[0];
              if (metricData) {
                insightsMap[metricData.name] = metricData.values?.[0]?.value || 0;
              }
            } catch (metricError) {
              console.warn(`[fetchFacebookPostAnalytics] Video metric '${metric}' not available:`, metricError.response?.data?.error?.message);
            }
          }
        }
      } catch (fallbackError) {
        console.error("[fetchFacebookPostAnalytics] Fallback request also failed:", fallbackError.response?.data || fallbackError.message);
        return null;
      }
    }

    // Build analytics object
    const analytics = {
      likes: data.likes?.summary?.total_count || data.reactions?.summary?.total_count || 0,
      comments: data.comments?.summary?.total_count || 0,
      shares: data.shares?.count || 0,
      impressions: insightsMap.post_impressions || 0,
      reach: insightsMap.post_reach || 0,
      clicks: insightsMap.post_clicks || 0,
      engagedUsers: insightsMap.post_engaged_users || 0, // Critical metric: people who engaged
    };

    // Add video-specific metrics if it's a video
    if (isVideo) {
      // Try different metric name variations for compatibility
      analytics.views = insightsMap.post_video_views || insightsMap.video_views || 0; // video_views (views at least 3 seconds)
      
      // Try both complete_views metric names (Facebook API variations)
      analytics.videoCompleteViews = insightsMap.post_video_complete_views 
        || insightsMap.post_video_complete_views_30s 
        || insightsMap.complete_views 
        || 0; // complete_views (95%+ watched or 30s+ watched)
      
      analytics.averageWatchTime = insightsMap.post_video_avg_time_watched 
        || insightsMap.avg_video_watch_time 
        || 0; // avg_video_watch_time (in seconds)
      
      // Calculate total video view time: averageWatchTime * views
      // Note: Facebook doesn't provide total_video_view_time directly, so we calculate it
      // Formula: total watch time = average watch time × number of views
      analytics.totalVideoViewTime = Math.round(analytics.averageWatchTime * analytics.views);
      
      console.log("[fetchFacebookPostAnalytics] Video metrics:", {
        views: analytics.views,
        videoCompleteViews: analytics.videoCompleteViews,
        averageWatchTime: analytics.averageWatchTime,
        totalVideoViewTime: analytics.totalVideoViewTime,
        insightsMap: Object.keys(insightsMap),
      });
    }

    console.log("[fetchFacebookPostAnalytics] ✅ Fetched analytics:", {
      postId,
      isVideo,
      analytics,
    });

    // Note: engagement is calculated, not stored (see analytics-validator.js)
    return analytics;
  } catch (error) {
    console.error("[fetchFacebookPostAnalytics] ❌ Error fetching Facebook analytics:", {
      error: error.response?.data || error.message,
      postId,
    });
    return null;
  }
}

// Fetch Instagram post analytics
async function fetchInstagramPostAnalytics(appCredential, postId, postType = null) {
  try {
    const accessToken = appCredential.credentials.instagram_user_access_token || appCredential.credentials.instagram_page_access_token;
    if (!accessToken) {
      console.error("[fetchInstagramPostAnalytics] No access token available");
      return null;
    }

    // First, get the media type to determine if it's a reel or post
    const mediaResponse = await axios.get(`https://graph.instagram.com/v24.0/${postId}`, {
      params: {
        fields: "media_type,media_product_type",
        access_token: accessToken,
      },
    });

    const mediaType = mediaResponse.data.media_type; // IMAGE, VIDEO, CAROUSEL_ALBUM
    const isReel = mediaResponse.data.media_product_type === "REELS" || postType === "reel";

    console.log("[fetchInstagramPostAnalytics] Media info:", {
      postId,
      mediaType,
      isReel,
      media_product_type: mediaResponse.data.media_product_type,
    });

    // Get basic engagement metrics first (always available)
    const basicResponse = await axios.get(`https://graph.instagram.com/v24.0/${postId}`, {
      params: {
        fields: "like_count,comments_count",
        access_token: accessToken,
      },
    });

    const analytics = {
      likes: basicResponse.data.like_count || 0,
      comments: basicResponse.data.comments_count || 0,
      saves: 0,
      impressions: 0,
      reach: 0,
    };

    // Fetch insights with error handling for each metric
    // Instagram Insights API has different metrics available for different media types:
    // - REELS: impressions, reach, saved, video_play_count
    // - Regular posts: reach, saved (impressions may not be available)
    
    const insightsToTry = [];
    
    if (isReel) {
      // For REELS, all metrics are available
      // Required: impressions, reach, saved, video_play_count, video_shares
      insightsToTry.push("impressions", "reach", "saved", "video_play_count", "video_shares");
    } else {
      // For regular posts, start with always-available metrics
      insightsToTry.push("reach", "saved");
      // Try impressions separately (may not be available for all post types)
      insightsToTry.push("impressions");
    }

    // Fetch insights metrics one by one or in groups to handle errors gracefully
    const insightsMap = {};
    
    // Try to fetch all metrics together first
    try {
      const insightsResponse = await axios.get(`https://graph.instagram.com/v24.0/${postId}/insights`, {
        params: {
          metric: insightsToTry.join(","),
          access_token: accessToken,
        },
      });

      const insights = insightsResponse.data.data || [];
      insights.forEach((insight) => {
        insightsMap[insight.name] = insight.values?.[0]?.value || 0;
      });
    } catch (insightsError) {
      // If batch request fails, try metrics individually
      console.warn("[fetchInstagramPostAnalytics] Batch insights failed, trying individual metrics:", insightsError.response?.data?.error?.message);
      
      // Always try reach and saved (most commonly available)
      for (const metric of ["reach", "saved"]) {
        try {
          const metricResponse = await axios.get(`https://graph.instagram.com/v24.0/${postId}/insights`, {
            params: {
              metric: metric,
              access_token: accessToken,
            },
          });
          const metricData = metricResponse.data.data?.[0];
          if (metricData) {
            insightsMap[metricData.name] = metricData.values?.[0]?.value || 0;
          }
        } catch (metricError) {
          console.warn(`[fetchInstagramPostAnalytics] Metric '${metric}' not available:`, metricError.response?.data?.error?.message);
        }
      }
      
      // Try impressions separately (may not be available)
      if (isReel || insightsToTry.includes("impressions")) {
        try {
          const impressionsResponse = await axios.get(`https://graph.instagram.com/v24.0/${postId}/insights`, {
            params: {
              metric: "impressions",
              access_token: accessToken,
            },
          });
          const impressionsData = impressionsResponse.data.data?.[0];
          if (impressionsData) {
            insightsMap.impressions = impressionsData.values?.[0]?.value || 0;
          }
        } catch (impressionsError) {
          console.warn("[fetchInstagramPostAnalytics] Impressions not available for this media type:", impressionsError.response?.data?.error?.message);
          // Impressions not available, set to 0
          insightsMap.impressions = 0;
        }
      }
      
      // Try video_play_count for reels/videos
      if (isReel || mediaType === "VIDEO") {
        try {
          const playsResponse = await axios.get(`https://graph.instagram.com/v24.0/${postId}/insights`, {
            params: {
              metric: "video_play_count",
              access_token: accessToken,
            },
          });
          const playsData = playsResponse.data.data?.[0];
          if (playsData) {
            insightsMap.video_play_count = playsData.values?.[0]?.value || 0;
          }
        } catch (playsError) {
          console.warn("[fetchInstagramPostAnalytics] Video play count not available:", playsError.response?.data?.error?.message);
        }
      }
      
      // Try video_shares for reels
      if (isReel) {
        try {
          const sharesResponse = await axios.get(`https://graph.instagram.com/v24.0/${postId}/insights`, {
            params: {
              metric: "video_shares",
              access_token: accessToken,
            },
          });
          const sharesData = sharesResponse.data.data?.[0];
          if (sharesData) {
            insightsMap.video_shares = sharesData.values?.[0]?.value || 0;
          }
        } catch (sharesError) {
          console.warn("[fetchInstagramPostAnalytics] Video shares not available:", sharesError.response?.data?.error?.message);
        }
      }
    }

    // Map insights to analytics object
    analytics.saves = insightsMap.saved || 0; // Normalize "saved" to "saves"
    analytics.reach = insightsMap.reach || 0;
    analytics.impressions = insightsMap.impressions || 0;

    // Only add plays and shares for reels
    if (isReel) {
      analytics.plays = insightsMap.video_play_count || 0;
      analytics.shares = insightsMap.video_shares || 0;
    } else if (mediaType === "VIDEO" && !isReel) {
      // Regular Instagram videos (not reels) have plays but no shares
      analytics.plays = insightsMap.video_play_count || 0;
      // Don't set shares for regular videos - they don't have this metric
    }
    // Regular posts (IMAGE, CAROUSEL_ALBUM) don't have plays or shares
    
    // Note: engagement is calculated, not stored (see analytics-validator.js)

    console.log("[fetchInstagramPostAnalytics] ✅ Fetched analytics:", {
      postId,
      mediaType,
      isReel,
      analytics,
      insightsMap,
    });

    return analytics;
  } catch (error) {
    console.error("[fetchInstagramPostAnalytics] ❌ Error fetching Instagram analytics:", {
      error: error.response?.data || error.message,
      postId,
    });
    return null;
  }
}

// Fetch YouTube video analytics
async function fetchYouTubeVideoAnalytics(appCredential, videoId, accountId) {
  try {
    let accessToken = appCredential.credentials.access_token;
    const tokens = appCredential.credentials;
    const now = Date.now();

    // Check if token is still valid (with 1 minute buffer)
    if (!tokens.expiry || now >= tokens.expiry - 60000) {
      // Get YouTube/Google app config from database (with fallback to env)
      let youtubeConfig;
      try {
        youtubeConfig = await getAppConfig(appCredential.userId, "app/youtube");
      } catch (error) {
        console.error("[YouTube Analytics] Error getting app config:", error.message);
        throw new Error("YouTube app configuration not found");
      }

      // Refresh token
      const refreshRes = await axios.post("https://oauth2.googleapis.com/token", {
        client_id: youtubeConfig.appClientId,
        client_secret: youtubeConfig.appClientSecret,
        refresh_token: tokens.refresh_token,
        grant_type: "refresh_token",
      });

      accessToken = refreshRes.data.access_token;
      const newExpiry = Date.now() + refreshRes.data.expires_in * 1000;

      // Update in database
      await AppCredentials.findOneAndUpdate(
        { userId: appCredential.userId, platform: "YOUTUBE" },
        {
          $set: {
            "credentials.access_token": accessToken,
            "credentials.expires_in": refreshRes.data.expires_in,
            "credentials.expiry": newExpiry,
          },
        }
      );
    }

    if (!accessToken) {
      console.error("[fetchYouTubeVideoAnalytics] No access token available");
      return null;
    }

    console.log("[fetchYouTubeVideoAnalytics] Fetching analytics for video:", videoId);

    // Get video statistics
    const statsResponse = await axios.get("https://www.googleapis.com/youtube/v3/videos", {
      params: {
        part: "statistics,contentDetails,snippet",
        id: videoId,
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    console.log("[fetchYouTubeVideoAnalytics] YouTube API response:", statsResponse.data);

    const video = statsResponse.data.items?.[0];
    if (!video) {
      console.error("[fetchYouTubeVideoAnalytics] Video not found:", videoId);
      return null;
    }

    const stats = video.statistics;
    const duration = video.contentDetails.duration; // ISO 8601 format

    // Calculate watch time (approximate: views * average watch percentage)
    // Note: YouTube API doesn't provide exact watch time without Analytics API
    const watchTime = parseInt(stats.viewCount || 0) * 60; // Rough estimate: 60 seconds average

    const analytics = {
      views: parseInt(stats.viewCount || 0),
      likes: parseInt(stats.likeCount || 0),
      comments: parseInt(stats.commentCount || 0),
      watchTime,
      duration,
      // Map to standard analytics fields
      impressions: parseInt(stats.viewCount || 0), // Views as impressions
      reach: parseInt(stats.viewCount || 0), // Views as reach
      engagement: parseInt(stats.likeCount || 0) + parseInt(stats.commentCount || 0),
    };

    console.log("[fetchYouTubeVideoAnalytics] Extracted analytics:", analytics);

    return analytics;
  } catch (error) {
    console.error("[fetchYouTubeVideoAnalytics] Error fetching YouTube analytics:", error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.error("[fetchYouTubeVideoAnalytics] Token expired, may need to refresh");
    }
    return null;
  }
}

// Refresh analytics for a specific post
export const refreshPostAnalytics = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const orgNo = req.user?.orgNo || String(req.user._id);
    const { postId } = req.params;

    const post = await Post.findOne({ orgNo, postId });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Fetch fresh analytics from platform API
    const freshAnalytics = await fetchPostAnalyticsFromPlatform(orgNo, post.platform, post.postId, post.accountId, post.postType);

    // Update post with fresh analytics
    if (freshAnalytics) {
      // Clean analytics to only include valid fields for the platform
      const cleanedAnalytics = cleanAnalyticsForPlatform(
        post.platform,
        {
          ...post.analytics,
          ...freshAnalytics,
          lastUpdated: new Date(),
        },
        post.postType
      );
      
      post.analytics = cleanedAnalytics;
      await post.save();

      return res.json({
        success: true,
        message: "Analytics refreshed successfully",
        data: {
          post: post.toObject(),
        },
      });
    } else {
      return res.json({
        success: false,
        message: "Failed to fetch fresh analytics",
        data: {
          post: post.toObject(),
        },
      });
    }
  } catch (error) {
    console.error("Error refreshing post analytics:", error);
    return res.status(500).json({ message: "Failed to refresh analytics", error: error.message });
  }
};

// Get all posts with analytics
export const getAllPosts = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = String(req.user._id);
    const { platform, startDate, endDate, limit = 50, page = 1 } = req.query;

    console.log("[getAllPosts] Query params:", {
      userId,
      platform,
      startDate,
      endDate,
      limit,
      page,
    });

    const query = { userId };
    if (platform) query.platform = platform.toUpperCase();
    if (startDate || endDate) {
      query.publishedAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.publishedAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.publishedAt.$lte = end;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const posts = await Post.find(query)
      .sort({ publishedAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    const total = await Post.countDocuments(query);
    
    console.log("[getAllPosts] Found posts:", {
      count: posts.length,
      total,
      platforms: [...new Set(posts.map(p => p.platform))],
      samplePost: posts[0] ? {
        _id: posts[0]._id,
        platform: posts[0].platform,
        postId: posts[0].postId,
        publishedAt: posts[0].publishedAt,
        title: posts[0].title || posts[0].content || "N/A",
      } : null,
    });

    return res.json({
      success: true,
      data: {
        posts,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return res.status(500).json({ message: "Failed to fetch posts", error: error.message });
  }
};

