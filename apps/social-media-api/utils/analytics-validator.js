/**
 * Platform-specific analytics field validation and cleaning
 * Ensures only valid fields are stored per platform
 */

// Platform-specific allowed analytics fields
const PLATFORM_ANALYTICS_FIELDS = {
  INSTAGRAM: {
    // Core metrics (all post types)
    likes: true,
    comments: true,
    saves: true, // Instagram uses "saved" in API, but we normalize to "saves"
    impressions: true,
    reach: true,
    
    // Reels only
    plays: true, // For reels (video_play_count) - REQUIRED for reels
    shares: true, // Only for reels (video_shares)
    
    // Note: engagement is calculated, not stored
    // engagement = likes + comments + saves + shares (for reels)
    // engagement = likes + comments + saves (for regular posts)
    
    // Metadata
    lastUpdated: true,
  },
  
  FACEBOOK: {
    // Core metrics (all post types)
    likes: true,
    comments: true,
    shares: true,
    reactions: true,
    impressions: true,
    reach: true,
    clicks: true, // Facebook Pages have clicks
    engagedUsers: true, // post_engaged_users (people who engaged - critical metric)
    
    // Facebook Video metrics (for video posts only)
    views: true, // video_views (views at least 3 seconds)
    videoCompleteViews: true, // complete_views (95%+ watched)
    averageWatchTime: true, // avg_video_watch_time (in seconds)
    totalVideoViewTime: true, // total video watch time (in seconds)
    
    // Note: engagement is calculated, not stored
    // engagement = likes + comments + shares
    // engagedUsers is a separate metric from Facebook API (post_engaged_users)
    
    // Metadata
    lastUpdated: true,
  },
  
  YOUTUBE: {
    // Core metrics
    views: true,
    likes: true,
    comments: true,
    shares: true,
    
    // YouTube-specific metrics
    estimatedMinutesWatched: true,
    averageViewDuration: true, // in seconds
    averageViewPercentage: true, // percentage (0-100)
    subscribersGained: true,
    subscribersLost: true,
    watchTime: true, // in seconds
    
    // YouTube analytics arrays
    trafficSources: true,
    deviceTypes: true,
    countries: true,
    
    // Note: engagement is calculated, not stored
    // engagement = likes + comments + shares
    // impressions and reach are derived from views
    
    // Metadata
    lastUpdated: true,
  },
  
  LINKEDIN: {
    // Core metrics
    likes: true,
    comments: true,
    shares: true,
    impressions: true,
    clicks: true,
    
    // Note: engagement is calculated, not stored
    // engagement = likes + comments + shares
    
    // Metadata
    lastUpdated: true,
  },
};

/**
 * Calculate engagement based on platform
 */
function calculateEngagement(platform, analytics) {
  const likes = analytics.likes || 0;
  const comments = analytics.comments || 0;
  const shares = analytics.shares || 0;
  const saves = analytics.saves || 0;
  
  switch (platform) {
    case "INSTAGRAM":
      // For Instagram: likes + comments + saves
      // Shares only count for reels
      return likes + comments + saves + (analytics.shares || 0);
    
    case "FACEBOOK":
    case "LINKEDIN":
      return likes + comments + shares;
    
    case "YOUTUBE":
      return likes + comments + shares;
    
    default:
      return likes + comments + shares;
  }
}

/**
 * Clean analytics object to only include valid fields for the platform
 * @param {string} platform - Platform name (INSTAGRAM, FACEBOOK, YOUTUBE, LINKEDIN)
 * @param {object} analytics - Raw analytics object
 * @param {string} postType - Optional post type (post, reel, video, etc.)
 * @returns {object} Cleaned analytics object
 */
export function cleanAnalyticsForPlatform(platform, analytics, postType = null) {
  if (!analytics || typeof analytics !== "object") {
    return {};
  }
  
  const allowedFields = PLATFORM_ANALYTICS_FIELDS[platform.toUpperCase()];
  if (!allowedFields) {
    console.warn(`[cleanAnalyticsForPlatform] Unknown platform: ${platform}`);
    return {};
  }
  
  const cleaned = {
    lastUpdated: analytics.lastUpdated || new Date(),
  };
  
  // Copy only allowed fields (excluding engagement - it's calculated)
  for (const [key, value] of Object.entries(analytics)) {
    // Skip engagement - it's calculated, not stored
    if (key === "engagement") {
      continue;
    }
    
    if (allowedFields[key]) {
      // Platform-specific field handling
      if (platform.toUpperCase() === "INSTAGRAM") {
        // Instagram-specific rules
        if (key === "saved") {
          // Normalize "saved" to "saves"
          cleaned.saves = value;
        } else if (key === "views" && postType !== "reel") {
          // Views only allowed for reels, rename to "plays"
          // Skip views for photo posts
          continue;
        } else if (key === "views" && postType === "reel") {
          // Rename views to plays for reels
          cleaned.plays = value;
        } else if (key === "shares" && postType !== "reel") {
          // Shares only for reels
          continue;
        } else {
          cleaned[key] = value;
        }
      } else if (platform.toUpperCase() === "FACEBOOK") {
        // Facebook-specific rules
        if (postType !== "video") {
          // For non-video posts, skip video-specific metrics
          if (key === "views" || key === "videoCompleteViews" || key === "averageWatchTime" || key === "totalVideoViewTime") {
            continue;
          }
        }
        cleaned[key] = value;
      } else {
        cleaned[key] = value;
      }
    }
  }
  
  // Note: engagement is calculated on-the-fly when needed, not stored
  // Use calculateEngagement() function to get engagement value
  
  return cleaned;
}

/**
 * Validate analytics object structure
 * @param {string} platform - Platform name
 * @param {object} analytics - Analytics object to validate
 * @returns {object} { valid: boolean, errors: string[] }
 */
export function validateAnalytics(platform, analytics) {
  const errors = [];
  const allowedFields = PLATFORM_ANALYTICS_FIELDS[platform.toUpperCase()];
  
  if (!allowedFields) {
    return { valid: false, errors: [`Unknown platform: ${platform}`] };
  }
  
  if (!analytics || typeof analytics !== "object") {
    return { valid: false, errors: ["Analytics must be an object"] };
  }
  
  // Check for invalid fields
  for (const key of Object.keys(analytics)) {
    if (key === "lastUpdated") continue; // Always allowed
    
    if (!allowedFields[key]) {
      errors.push(`Invalid field '${key}' for platform '${platform}'`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get allowed analytics fields for a platform
 * @param {string} platform - Platform name
 * @returns {string[]} Array of allowed field names
 */
export function getAllowedAnalyticsFields(platform) {
  const allowedFields = PLATFORM_ANALYTICS_FIELDS[platform.toUpperCase()];
  if (!allowedFields) {
    return [];
  }
  
  return Object.keys(allowedFields).filter(key => key !== "lastUpdated");
}

/**
 * Platform analytics field mapping (for documentation/reference)
 */
export const ANALYTICS_FIELD_MAPPING = {
  INSTAGRAM: {
    required: ["likes", "comments", "saves", "impressions", "reach"],
    optional: ["plays", "shares"], // plays for reels (REQUIRED for reels), shares for reels
    calculated: ["engagement"], // Calculated: likes + comments + saves + shares (reels) or likes + comments + saves (posts)
    invalid: [
      "views", // Use "plays" for reels only
      "clicks", // Not available for Instagram
      "engagement", // Calculated, not stored
      "estimatedMinutesWatched",
      "averageViewDuration",
      "averageViewPercentage",
      "subscribersGained",
      "subscribersLost",
      "watchTime",
      "trafficSources",
      "deviceTypes",
      "countries",
    ],
  },
  FACEBOOK: {
    required: ["likes", "comments", "shares", "impressions", "reach"],
    optional: ["clicks", "reactions", "views", "videoCompleteViews", "averageWatchTime", "totalVideoViewTime"], // Video metrics for video posts
    calculated: ["engagement"],
    invalid: [
      "saves", // Not available for Facebook
      "plays", // Not available for Facebook (use "views" for videos)
      "estimatedMinutesWatched",
      "averageViewDuration",
      "averageViewPercentage",
      "subscribersGained",
      "subscribersLost",
      "watchTime",
      "trafficSources",
      "deviceTypes",
      "countries",
    ],
  },
  YOUTUBE: {
    required: ["views", "likes", "comments"],
    optional: [
      "shares",
      "estimatedMinutesWatched",
      "averageViewDuration",
      "averageViewPercentage",
      "subscribersGained",
      "subscribersLost",
      "watchTime",
      "trafficSources",
      "deviceTypes",
      "countries",
    ],
    calculated: ["engagement", "impressions", "reach"],
    invalid: [
      "saves", // Not available for YouTube
      "plays", // YouTube uses "views"
      "clicks", // Not available for YouTube
    ],
  },
  LINKEDIN: {
    required: ["likes", "comments", "shares", "impressions"],
    optional: ["clicks"],
    calculated: ["engagement"],
    invalid: [
      "saves",
      "plays",
      "views",
      "estimatedMinutesWatched",
      "averageViewDuration",
      "averageViewPercentage",
      "subscribersGained",
      "subscribersLost",
      "watchTime",
      "trafficSources",
      "deviceTypes",
      "countries",
    ],
  },
};

// Export calculateEngagement for use in controllers
export { calculateEngagement };

export default {
  cleanAnalyticsForPlatform,
  validateAnalytics,
  getAllowedAnalyticsFields,
  ANALYTICS_FIELD_MAPPING,
  calculateEngagement,
};

