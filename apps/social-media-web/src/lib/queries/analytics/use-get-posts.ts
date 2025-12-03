import { useQuery } from "@tanstack/react-query";
import api from "@/utils/api";

interface Post {
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
    views: number;
    likes: number;
    comments: number;
    shares: number;
      // Facebook/Instagram metrics
      reach?: number;
      impressions?: number;
      engagement?: number;
      clicks?: number;
      saved?: number;
      // Instagram metrics
      plays?: number; // For Instagram Reels
      saves?: number; // For Instagram (normalized from 'saved')
      // Facebook metrics
      engagedUsers?: number;
      videoCompleteViews?: number;
      averageWatchTime?: number;
      totalVideoViewTime?: number;
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
}

export const useGetPosts = (filters?: {
  platform?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) => {
  return useQuery<{ success: boolean; data: { posts: Post[]; pagination: any } }>({
    queryKey: ["analytics", "posts", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.platform) params.append("platform", filters.platform);
      if (filters?.startDate) params.append("startDate", filters.startDate);
      if (filters?.endDate) params.append("endDate", filters.endDate);
      if (filters?.page) params.append("page", filters.page.toString());
      if (filters?.limit) params.append("limit", filters.limit.toString());
      
      const response = await api.get(`/analytics/posts?${params.toString()}`);
      return response.data;
    },
  });
};

