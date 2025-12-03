import { useQuery } from "@tanstack/react-query";
import api from "@/utils/api";

interface OverviewAnalytics {
  overview: {
    totalReach: number;
    totalImpressions: number;
    totalEngagement: number;
    totalPosts: number;
    followers: {
      instagram?: number;
      facebook?: number;
      youtube?: number;
    };
  };
  bestPosts: Array<{
    _id: string;
    platform: string;
    postId: string;
    postType?: string; // post, video, reel, etc.
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
    publishedAt: string;
    engagement: number;
    analytics: {
      likes: number;
      comments: number;
      shares: number;
      views?: number;
      engagement?: number; // Calculated engagement
      reach?: number;
      impressions?: number;
      clicks?: number;
      estimatedMinutesWatched?: number;
      averageViewDuration?: number;
      averageViewPercentage?: number;
      subscribersGained?: number;
      subscribersLost?: number;
      // Instagram metrics
      plays?: number;
      saves?: number;
      // Note: plays is used for Instagram Reels
      // Facebook metrics
      engagedUsers?: number;
      videoCompleteViews?: number;
      averageWatchTime?: number;
      totalVideoViewTime?: number;
    };
  }>;
  platformStats: Record<string, {
    posts: number;
    reach: number;
    impressions: number;
    engagement: number;
    likes: number;
    comments: number;
    shares: number;
  }>;
  growthData: Array<{
    date: string;
    posts: number;
    reach: number;
    impressions: number;
    engagement: number;
  }>;
}

export const useGetOverviewAnalytics = (startDate?: string, endDate?: string) => {
  return useQuery<{ success: boolean; data: OverviewAnalytics }>({
    queryKey: ["analytics", "overview", startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      
      const response = await api.get(`/analytics/overview?${params.toString()}`);
      return response.data;
    },
  });
};

