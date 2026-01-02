import mongoose from "mongoose";
import { cleanAnalyticsForPlatform } from "../utils/analytics-validator.js";

const postSchema = new mongoose.Schema(
  {
    userId: { 
      type: String, 
      required: true,
      index: true 
    },
    
    platform: { 
      type: String, 
      required: true,
      enum: ["FACEBOOK", "INSTAGRAM", "YOUTUBE", "LINKEDIN"],
      index: true
    },
    
    // Platform-agnostic post ID (postId for FB/IG, videoId for YouTube)
    postId: { 
      type: String, 
      required: true,
      index: true 
    },
    
    // YouTube-specific fields
    videoId: { 
      type: String, 
      required: function() {
        return this && this.platform === "YOUTUBE";
      },
      index: true,
      sparse: true
    },
    
    channelId: { 
      type: String,
      required: function() {
        return this && this.platform === "YOUTUBE";
      },
      index: true,
      sparse: true
    },
    
    // Content fields - platform-specific
    title: { 
      type: String,
      required: function() {
        return this && this.platform === "YOUTUBE";
      }
    },
    
    description: { 
      type: String,
      required: function() {
        return this && this.platform === "YOUTUBE";
      }
    },
    
    // Legacy fields for other platforms (content/caption)
    content: { 
      type: String 
    },
    
    caption: { 
      type: String 
    },
    
    // Media URLs
    thumbnailUrl: { 
      type: String 
    },
    
    videoUrl: { 
      type: String 
    },
    
    // Legacy mediaUrl for other platforms
    mediaUrl: { 
      type: String 
    },
    
    // Post type - platform-specific
    postType: { 
      type: String,
      enum: {
        values: ["post", "video", "reel", "story", "upload", "short", "live", "scheduled"],
        message: "Invalid post type for platform"
      },
      default: function() {
        // Handle case where 'this' is null (happens during findOneAndUpdate with upsert)
        if (!this || !this.platform) return "post";
        if (this.platform === "YOUTUBE") return "upload";
        if (this.platform === "INSTAGRAM") return "post";
        if (this.platform === "FACEBOOK") return "post";
        return "post";
      }
    },
    
    // Page/Account IDs - platform-specific
    pageId: { 
      type: String,
      index: true,
      sparse: true
    },
    
    accountId: { 
      type: String,
      index: true,
      sparse: true
    },
    
    publishedAt: { 
      type: Date, 
      default: Date.now,
      index: true
    },
    
    createdBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User",
      index: true
    },
    
    // Analytics - platform-specific structure
    analytics: {
      // Common metrics
      views: { type: Number, default: 0 }, // YouTube and Facebook videos
      likes: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      
      // Instagram Reel metrics
      plays: { type: Number, default: 0 }, // For Instagram Reels (video_play_count)
      saves: { type: Number, default: 0 }, // For Instagram (saved_count)
      
      // Facebook/Instagram metrics
      reach: { type: Number, default: 0 },
      impressions: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      engagedUsers: { type: Number, default: 0 }, // Facebook post_engaged_users (people who engaged)
      
      // Facebook Video metrics
      videoCompleteViews: { type: Number, default: 0 }, // complete_views (95%+ watched)
      averageWatchTime: { type: Number, default: 0 }, // avg_video_watch_time (in seconds)
      totalVideoViewTime: { type: Number, default: 0 }, // total video watch time (in seconds)
      
      // Note: engagement is calculated, not stored (see analytics-validator.js)
      
      // YouTube-specific metrics
      estimatedMinutesWatched: { type: Number, default: 0 },
      averageViewDuration: { type: Number, default: 0 }, // in seconds
      averageViewPercentage: { type: Number, default: 0 }, // percentage (0-100)
      subscribersGained: { type: Number, default: 0 },
      subscribersLost: { type: Number, default: 0 },
      watchTime: { type: Number, default: 0 }, // in seconds (legacy)
      
      // YouTube traffic sources
      trafficSources: [{
        source: { type: String },
        views: { type: Number, default: 0 },
        watchTime: { type: Number, default: 0 }
      }],
      
      // YouTube device types
      deviceTypes: [{
        deviceType: { type: String },
        views: { type: Number, default: 0 },
        watchTime: { type: Number, default: 0 }
      }],
      
      // YouTube countries
      countries: [{
        country: { type: String },
        views: { type: Number, default: 0 },
        watchTime: { type: Number, default: 0 }
      }],
      
      lastUpdated: { 
        type: Date, 
        default: Date.now 
      }
    },
    
    // Analytics sync status
    analyticsStatus: {
      type: String,
      enum: ["pending", "synced", "failed"],
      default: "pending",
      index: true
    },
    
    // Hashtags extracted from content
    hashtags: [{ 
      type: String,
      index: true
    }],
  },
  { 
    timestamps: true // Adds createdAt and updatedAt automatically
  }
);

// Compound indexes for efficient queries
postSchema.index({ userId: 1, platform: 1, publishedAt: -1 });
postSchema.index({ userId: 1, postId: 1 }, { unique: true });
postSchema.index({ userId: 1, platform: 1, analyticsStatus: 1 });
postSchema.index({ userId: 1, channelId: 1, publishedAt: -1 }); // For YouTube channel queries

// Virtual for YouTube video URL
postSchema.virtual("youtubeVideoUrl").get(function() {
  if (this.platform === "YOUTUBE" && this.videoId) {
    return `https://www.youtube.com/watch?v=${this.videoId}`;
  }
  return null;
});

// Ensure virtuals are included in JSON output
postSchema.set("toJSON", { virtuals: true });

// Pre-save hook to clean analytics based on platform
postSchema.pre("save", function(next) {
  // Only clean analytics if platform and analytics exist
  if (this.platform && this.analytics && typeof this.analytics === "object") {
    try {
      // Clean analytics to remove invalid fields for this platform
      this.analytics = cleanAnalyticsForPlatform(
        this.platform,
        this.analytics,
        this.postType
      );
    } catch (error) {
      console.error("[Post Model] Error cleaning analytics:", error);
      // Continue with save even if cleaning fails
    }
  }
  next();
});

// Pre-update hook for findOneAndUpdate, updateOne, etc.
postSchema.pre(["findOneAndUpdate", "updateOne", "updateMany"], function(next) {
  try {
    const update = this.getUpdate();
    if (!update) {
      return next();
    }
    
    // Get platform from update object or conditions
    const platform = update.platform || update.$set?.platform || this._conditions?.platform;
    
    if (!platform) {
      // No platform available, skip analytics cleaning
      return next();
    }
    
    // Handle $set operations
    if (update.$set && update.$set.analytics) {
      try {
        const postType = update.$set.postType || update.postType || this._conditions?.postType;
        update.$set.analytics = cleanAnalyticsForPlatform(
          platform,
          update.$set.analytics,
          postType
        );
      } catch (error) {
        console.error("[Post Model] Error cleaning analytics in $set update:", error);
      }
    }
    
    // Handle direct analytics update (non-$set)
    if (update.analytics && !update.$set) {
      try {
        const postType = update.postType || this._conditions?.postType;
        update.analytics = cleanAnalyticsForPlatform(
          platform,
          update.analytics,
          postType
        );
      } catch (error) {
        console.error("[Post Model] Error cleaning analytics in direct update:", error);
      }
    }
  } catch (error) {
    console.error("[Post Model] Error in pre-update hook:", error);
  }
  
  next();
});

const Post = mongoose.model("Post", postSchema);
export default Post;
