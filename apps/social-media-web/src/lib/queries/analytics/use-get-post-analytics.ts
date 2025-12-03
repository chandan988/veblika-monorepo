import { useQuery } from "@tanstack/react-query";
import api from "@/utils/api";

interface PostAnalytics {
  post: {
    _id: string;
    platform: string;
    postId: string;
    postType: string;
    // YouTube-specific fields
    videoId?: string;
    channelId?: string;
    title?: string;
    description?: string;
    thumbnailUrl?: string;
    videoUrl?: string;
    // Legacy fields for other platforms
    content?: string;
    caption?: string;
    mediaUrl?: string;
    pageId?: string;
    accountId?: string;
    publishedAt: string;
    analytics: {
      // Common metrics
      views?: number; // YouTube and Facebook videos
      likes: number;
      comments: number;
      shares: number;
      // Instagram Reel metrics
      plays?: number; // For Instagram Reels (video_play_count)
      saves?: number; // For Instagram (saved_count) - normalized from "saved"
      // Facebook/Instagram metrics
      reach?: number;
      impressions?: number;
      engagement?: number; // Calculated, not stored
      clicks?: number;
      engagedUsers?: number; // Facebook post_engaged_users (people who engaged)
      saved?: number; // Legacy - use "saves" instead
      
      // Facebook Video metrics
      videoCompleteViews?: number; // complete_views (95%+ watched)
      averageWatchTime?: number; // avg_video_watch_time (in seconds)
      totalVideoViewTime?: number; // total video watch time (in seconds)
      // YouTube-specific metrics
      estimatedMinutesWatched?: number;
      averageViewDuration?: number; // in seconds
      averageViewPercentage?: number; // percentage (0-100)
      subscribersGained?: number;
      subscribersLost?: number;
      watchTime?: number; // legacy, in seconds
      // YouTube arrays
      trafficSources?: Array<{
        source: string;
        views: number;
        watchTime: number;
      }>;
      deviceTypes?: Array<{
        deviceType: string;
        views: number;
        watchTime: number;
      }>;
      countries?: Array<{
        country: string;
        views: number;
        watchTime: number;
      }>;
      lastUpdated?: string;
    };
    analyticsStatus?: "pending" | "synced" | "failed";
    hashtags: string[];
  };
  hashtagPerformance: Array<{
    hashtag: string;
    posts: number;
    totalEngagement: number;
    avgEngagement: number;
  }>;
}

export const useGetPostAnalytics = (postId: string) => {
  return useQuery<{ success: boolean; data: PostAnalytics }>({
    queryKey: ["analytics", "post", postId],
    queryFn: async () => {
      const response = await api.get(`/analytics/posts/${postId}`);
      return response.data;
    },
    enabled: !!postId,
  });
};

