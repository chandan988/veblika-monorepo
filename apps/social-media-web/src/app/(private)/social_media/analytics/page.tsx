"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/utils/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Heart,
  MessageCircle,
  Share2,
  Eye,
  RefreshCw,
  Play,
  Clock,
  TrendingUp,
  Users,
  BarChart3,
  Bookmark,
  ThumbsUp,
  MousePointer,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Platform configuration
const PLATFORMS = [
  { id: "all", name: "All", icon: null, color: "bg-gray-500" },
  { id: "INSTAGRAM", name: "Instagram", icon: "/icons/instagram.png", color: "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500" },
  { id: "FACEBOOK", name: "Facebook", icon: "/icons/facebook.png", color: "bg-blue-600" },
  { id: "YOUTUBE", name: "YouTube", icon: "/icons/youtube.png", color: "bg-red-600" },
  { id: "LINKEDIN", name: "LinkedIn", icon: "/icons/linkedin.png", color: "bg-blue-700" },
];

const COLORS = ["#8b5cf6", "#3b82f6", "#ef4444", "#0077b5", "#22c55e"];

interface Post {
  _id: string;
  postId: string;
  platform: string;
  content?: string;
  caption?: string;
  title?: string;
  description?: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  postType: string;
  publishedAt: string;
  analytics: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
    plays?: number;
    saves?: number;
    reach?: number;
    impressions?: number;
    engagedUsers?: number;
    videoCompleteViews?: number;
    averageWatchTime?: number;
    estimatedMinutesWatched?: number;
    averageViewDuration?: number;
    averageViewPercentage?: number;
    subscribersGained?: number;
    subscribersLost?: number;
    clicks?: number;
  };
}

export default function AnalyticsPage() {
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Fetch all posts
  const {
    data: postsData,
    isLoading: isLoadingPosts,
    refetch: refetchPosts,
  } = useQuery({
    queryKey: ["analytics-posts", selectedPlatform],
    queryFn: async () => {
      const params: any = { limit: 500 }; // Get all posts
      if (selectedPlatform !== "all") {
        params.platform = selectedPlatform;
      }
      const res = await api.get("/engage/posts", { params });
      return res.data;
    },
    refetchOnWindowFocus: false,
  });

  const posts: Post[] = postsData?.data || [];

  // Calculate overview stats
  const overviewStats = React.useMemo(() => {
    const stats = {
      totalPosts: posts.length,
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      totalReach: 0,
      totalImpressions: 0,
      platformStats: {} as Record<string, { posts: number; engagement: number; views: number }>,
    };

    posts.forEach((post) => {
      stats.totalViews += post.analytics?.views || post.analytics?.plays || 0;
      stats.totalLikes += post.analytics?.likes || 0;
      stats.totalComments += post.analytics?.comments || 0;
      stats.totalShares += post.analytics?.shares || 0;
      stats.totalReach += post.analytics?.reach || 0;
      stats.totalImpressions += post.analytics?.impressions || 0;

      const platform = post.platform;
      if (!stats.platformStats[platform]) {
        stats.platformStats[platform] = { posts: 0, engagement: 0, views: 0 };
      }
      stats.platformStats[platform].posts++;
      stats.platformStats[platform].engagement += 
        (post.analytics?.likes || 0) + 
        (post.analytics?.comments || 0) + 
        (post.analytics?.shares || 0);
      stats.platformStats[platform].views += post.analytics?.views || post.analytics?.plays || 0;
    });

    return stats;
  }, [posts]);

  // Format numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num?.toString() || "0";
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle post click
  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
    setSheetOpen(true);
  };

  // Get platform icon
  const getPlatformIcon = (platform: string) => {
    const platformConfig = PLATFORMS.find(
      (p) => p.id.toUpperCase() === platform.toUpperCase()
    );
    return platformConfig?.icon || null;
  };

  // Get platform badge style
  const getPlatformBadgeStyle = (platform: string, postType?: string) => {
    switch (platform.toUpperCase()) {
      case "YOUTUBE":
        return "bg-red-600 text-white";
      case "INSTAGRAM":
        if (postType === "reel") {
          return "bg-gradient-to-r from-purple-500 to-pink-500 text-white";
        }
        return "bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white";
      case "FACEBOOK":
        return "bg-blue-600 text-white";
      case "LINKEDIN":
        return "bg-blue-700 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  // Get post card style
  const getPostCardStyle = (platform: string, postType?: string) => {
    switch (platform.toUpperCase()) {
      case "YOUTUBE":
        return "border-red-200 bg-red-50/50 hover:bg-red-50";
      case "INSTAGRAM":
        if (postType === "reel") {
          return "border-purple-200 bg-gradient-to-r from-purple-50/50 to-pink-50/50 hover:from-purple-50 hover:to-pink-50";
        }
        return "border-pink-200 bg-pink-50/50 hover:bg-pink-50";
      case "FACEBOOK":
        return "border-blue-200 bg-blue-50/50 hover:bg-blue-50";
      case "LINKEDIN":
        return "border-blue-300 bg-blue-50/50 hover:bg-blue-100/50";
      default:
        return "border-gray-200 bg-gray-50/50 hover:bg-gray-50";
    }
  };

  // Get post display name
  const getPostDisplayName = (post: Post) => {
    if (post.platform === "YOUTUBE") {
      return post.title || "Untitled Video";
    }
    if (post.platform === "INSTAGRAM" && post.postType === "reel") {
      return "Instagram Reel";
    }
    return post.content || post.caption || "Untitled Post";
  };

  // Platform comparison data for pie chart
  const platformComparisonData = Object.entries(overviewStats.platformStats).map(
    ([platform, stats], index) => ({
      name: platform,
      value: stats.engagement,
      posts: stats.posts,
      views: stats.views,
      color: COLORS[index % COLORS.length],
    })
  );

  if (isLoadingPosts) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>
            <p className="text-slate-600 mt-1">
              Track performance across all your social media posts
            </p>
          </div>
          <Button
            onClick={() => refetchPosts()}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="bg-white/80 backdrop-blur">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
                <BarChart3 className="w-4 h-4" />
                Total Posts
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {formatNumber(overviewStats.totalPosts)}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
                <Eye className="w-4 h-4" />
                Total Views
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {formatNumber(overviewStats.totalViews)}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
                <Heart className="w-4 h-4" />
                Total Likes
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {formatNumber(overviewStats.totalLikes)}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
                <MessageCircle className="w-4 h-4" />
                Total Comments
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {formatNumber(overviewStats.totalComments)}
              </div>
            </CardContent>
          </Card>
          {/* <Card className="bg-white/80 backdrop-blur">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
                <Share2 className="w-4 h-4" />
                Total Shares
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {formatNumber(overviewStats.totalShares)}
              </div>
            </CardContent>
          </Card> */}
          <Card className="bg-white/80 backdrop-blur">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
                <TrendingUp className="w-4 h-4" />
                Total Engagement
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {formatNumber(
                  overviewStats.totalLikes +
                    overviewStats.totalComments +
                    overviewStats.totalShares
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Platform Filter Tabs */}
        <Tabs value={selectedPlatform} onValueChange={setSelectedPlatform}>
          <TabsList className="bg-white/80 backdrop-blur p-1 h-auto flex-wrap">
            {PLATFORMS.map((platform) => (
              <TabsTrigger
                key={platform.id}
                value={platform.id}
                className="gap-2 data-[state=active]:bg-slate-900 data-[state=active]:text-white"
              >
                {platform.icon && (
                  <img
                    src={platform.icon}
                    alt={platform.name}
                    className="w-4 h-4"
                  />
                )}
                {platform.name}
                {platform.id !== "all" && overviewStats.platformStats[platform.id] && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {overviewStats.platformStats[platform.id]?.posts || 0}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Platform Comparison Chart */}
        {platformComparisonData.length > 0 && selectedPlatform === "all" && (
          <Card className="bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg">Platform Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={platformComparisonData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${((percent || 0) * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {platformComparisonData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  {platformComparisonData.map((platform, index) => (
                    <div
                      key={platform.name || `platform-${index}`}
                      className="flex items-center justify-between  bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: platform.color }}
                        />
                        <img
                          src={getPlatformIcon(platform.name) || ""}
                          alt={platform.name}
                          className=" h-5"
                        />
                        <span className="font-medium">{platform.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {formatNumber(platform.value)} engagement
                        </div>
                        <div className="text-sm text-slate-600">
                          {platform.posts} posts • {formatNumber(platform.views)} views
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Posts List */}
        <Card className="bg-white/80 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">
              All Posts ({posts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {posts.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No posts found</p>
                <p className="text-sm mt-1">
                  Go to Social Media → Post to create your first post
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {posts.map((post, index) => (
                  <div
                    key={post._id || `post-${index}`}
                    onClick={() => handlePostClick(post)}
                    className={`border rounded-xl p-4 cursor-pointer transition-all duration-200 ${getPostCardStyle(
                      post.platform,
                      post.postType
                    )}`}
                  >
                    <div className="flex gap-4">
                      {/* Thumbnail */}
                      {(post.thumbnailUrl || post.mediaUrl) && (
                        <div className="flex-shrink-0">
                          <img
                            src={post.thumbnailUrl || post.mediaUrl}
                            alt={getPostDisplayName(post)}
                            className="w-32 h-20 object-cover rounded-lg"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "/placeholder-image.png";
                            }}
                          />
                        </div>
                      )}
                      {!post.thumbnailUrl && !post.mediaUrl && (
                        <div className="flex-shrink-0 w-32 h-20 bg-slate-200 rounded-lg flex items-center justify-center">
                          <BarChart3 className="w-8 h-8 text-slate-400" />
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            className={`${getPlatformBadgeStyle(
                              post.platform,
                              post.postType
                            )} text-xs`}
                          >
                            {post.platform === "INSTAGRAM" && post.postType === "reel"
                              ? "REEL"
                              : post.platform}
                          </Badge>
                          <span className="text-sm text-slate-500">
                            {formatDistanceToNow(new Date(post.publishedAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>

                        <h3 className="font-semibold text-slate-900 mb-2 line-clamp-1">
                          {getPostDisplayName(post)}
                        </h3>

                        {post.description && post.platform === "YOUTUBE" && (
                          <p className="text-sm text-slate-600 line-clamp-1 mb-2">
                            {post.description}
                          </p>
                        )}

                        {/* Analytics Summary */}
                        <div className="flex flex-wrap gap-4 text-sm">
                          {post.platform === "INSTAGRAM" && post.postType === "reel" ? (
                            <span className="flex items-center gap-1 text-slate-600">
                              <Play className="w-4 h-4" />
                              {formatNumber(post.analytics?.plays || 0)} plays
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-slate-600">
                              <Eye className="w-4 h-4" />
                              {formatNumber(post.analytics?.views || 0)} views
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-slate-600">
                            <Heart className="w-4 h-4" />
                            {formatNumber(post.analytics?.likes || 0)}
                          </span>
                          <span className="flex items-center gap-1 text-slate-600">
                            <MessageCircle className="w-4 h-4" />
                            {formatNumber(post.analytics?.comments || 0)}
                          </span>
                          <span className="flex items-center gap-1 text-slate-600">
                            <Share2 className="w-4 h-4" />
                            {formatNumber(post.analytics?.shares || 0)}
                          </span>
                          {(post.platform === "INSTAGRAM") && (
                            <span className="flex items-center gap-1 text-purple-600 font-medium">
                              <Bookmark className="w-4 h-4" />
                              {formatNumber(post.analytics?.saves || 0)} saves
                            </span>
                          )}
                          {post.platform === "YOUTUBE" && post.analytics?.estimatedMinutesWatched && (
                            <span className="flex items-center gap-1 text-red-600 font-medium">
                              <Clock className="w-4 h-4" />
                              {Math.floor(post.analytics.estimatedMinutesWatched)} min
                            </span>
                          )}
                        </div>

                        <div className="mt-2 text-xs text-blue-600 font-medium">
                          Click to view detailed analytics →
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Analytics Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {selectedPost && (
                <>
                  <img
                    src={getPlatformIcon(selectedPost.platform) || ""}
                    alt={selectedPost.platform}
                    className="w-5 h-5"
                  />
                  Post Analytics
                </>
              )}
            </SheetTitle>
          </SheetHeader>

          {selectedPost && (
            <div className="mt-6 space-y-6">
              {/* Post Preview */}
              <div className="rounded-xl overflow-hidden border">
                {(selectedPost.thumbnailUrl || selectedPost.mediaUrl) && (
                  <img
                    src={selectedPost.thumbnailUrl || selectedPost.mediaUrl}
                    alt={getPostDisplayName(selectedPost)}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4 bg-slate-50">
                  <Badge
                    className={`${getPlatformBadgeStyle(
                      selectedPost.platform,
                      selectedPost.postType
                    )} mb-2`}
                  >
                    {selectedPost.platform === "INSTAGRAM" && selectedPost.postType === "reel"
                      ? "INSTAGRAM REEL"
                      : selectedPost.platform === "FACEBOOK" && selectedPost.postType === "video"
                      ? "FACEBOOK VIDEO"
                      : selectedPost.platform}
                  </Badge>
                  <h3 className="font-semibold text-lg">
                    {getPostDisplayName(selectedPost)}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Published {formatDistanceToNow(new Date(selectedPost.publishedAt), { addSuffix: true })}
                  </p>
                </div>
              </div>

              {/* Main Analytics */}
              <div>
                <h4 className="font-semibold mb-3 text-slate-900">Performance</h4>
                <div className="grid grid-cols-2 gap-3">
                  {/* Views/Plays */}
                  <Card className="bg-slate-50">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
                        {selectedPost.platform === "INSTAGRAM" && selectedPost.postType === "reel" ? (
                          <Play className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                        {selectedPost.platform === "INSTAGRAM" && selectedPost.postType === "reel"
                          ? "Plays"
                          : "Views"}
                      </div>
                      <div className="text-xl font-bold">
                        {formatNumber(
                          selectedPost.platform === "INSTAGRAM" && selectedPost.postType === "reel"
                            ? selectedPost.analytics?.plays || 0
                            : selectedPost.analytics?.views || 0
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Likes */}
                  <Card className="bg-slate-50">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
                        <Heart className="w-4 h-4" />
                        Likes
                      </div>
                      <div className="text-xl font-bold">
                        {formatNumber(selectedPost.analytics?.likes || 0)}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Comments */}
                  <Card className="bg-slate-50">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
                        <MessageCircle className="w-4 h-4" />
                        Comments
                      </div>
                      <div className="text-xl font-bold">
                        {formatNumber(selectedPost.analytics?.comments || 0)}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Shares */}
                  <Card className="bg-slate-50">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
                        <Share2 className="w-4 h-4" />
                        Shares
                      </div>
                      <div className="text-xl font-bold">
                        {formatNumber(selectedPost.analytics?.shares || 0)}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Platform-Specific Analytics */}
              {selectedPost.platform === "INSTAGRAM" && (
                <div>
                  <h4 className="font-semibold mb-3 text-slate-900">Instagram Metrics</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <Card className="bg-purple-50">
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 text-purple-600 text-sm mb-1">
                          <Bookmark className="w-4 h-4" />
                          Saves
                        </div>
                        <div className="text-xl font-bold text-purple-700">
                          {formatNumber(selectedPost.analytics?.saves || 0)}
                        </div>
                      </CardContent>
                    </Card>
                    {selectedPost.analytics?.reach && (
                      <Card className="bg-purple-50">
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-2 text-purple-600 text-sm mb-1">
                            <Users className="w-4 h-4" />
                            Reach
                          </div>
                          <div className="text-xl font-bold text-purple-700">
                            {formatNumber(selectedPost.analytics.reach)}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    {selectedPost.analytics?.impressions && (
                      <Card className="bg-purple-50">
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-2 text-purple-600 text-sm mb-1">
                            <Eye className="w-4 h-4" />
                            Impressions
                          </div>
                          <div className="text-xl font-bold text-purple-700">
                            {formatNumber(selectedPost.analytics.impressions)}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              )}

              {selectedPost.platform === "YOUTUBE" && (
                <div>
                  <h4 className="font-semibold mb-3 text-slate-900">YouTube Metrics</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedPost.analytics?.estimatedMinutesWatched !== undefined && (
                      <Card className="bg-red-50">
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-2 text-red-600 text-sm mb-1">
                            <Clock className="w-4 h-4" />
                            Watch Time
                          </div>
                          <div className="text-xl font-bold text-red-700">
                            {Math.floor(selectedPost.analytics.estimatedMinutesWatched)} min
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    {selectedPost.analytics?.averageViewDuration !== undefined && (
                      <Card className="bg-red-50">
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-2 text-red-600 text-sm mb-1">
                            <Clock className="w-4 h-4" />
                            Avg Duration
                          </div>
                          <div className="text-xl font-bold text-red-700">
                            {formatDuration(selectedPost.analytics.averageViewDuration)}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    {selectedPost.analytics?.averageViewPercentage !== undefined && (
                      <Card className="bg-red-50">
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-2 text-red-600 text-sm mb-1">
                            <TrendingUp className="w-4 h-4" />
                            Avg View %
                          </div>
                          <div className="text-xl font-bold text-red-700">
                            {selectedPost.analytics.averageViewPercentage.toFixed(1)}%
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    {selectedPost.analytics?.subscribersGained !== undefined && (
                      <Card className="bg-green-50">
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-2 text-green-600 text-sm mb-1">
                            <Users className="w-4 h-4" />
                            Subs Gained
                          </div>
                          <div className="text-xl font-bold text-green-700">
                            +{formatNumber(selectedPost.analytics.subscribersGained)}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    {selectedPost.analytics?.subscribersLost !== undefined && selectedPost.analytics.subscribersLost > 0 && (
                      <Card className="bg-orange-50">
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-2 text-orange-600 text-sm mb-1">
                            <Users className="w-4 h-4" />
                            Subs Lost
                          </div>
                          <div className="text-xl font-bold text-orange-700">
                            -{formatNumber(selectedPost.analytics.subscribersLost)}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              )}

              {selectedPost.platform === "FACEBOOK" && (
                <div>
                  <h4 className="font-semibold mb-3 text-slate-900">Facebook Metrics</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedPost.analytics?.reach && (
                      <Card className="bg-blue-50">
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-2 text-blue-600 text-sm mb-1">
                            <Users className="w-4 h-4" />
                            Reach
                          </div>
                          <div className="text-xl font-bold text-blue-700">
                            {formatNumber(selectedPost.analytics.reach)}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    {selectedPost.analytics?.impressions && (
                      <Card className="bg-blue-50">
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-2 text-blue-600 text-sm mb-1">
                            <Eye className="w-4 h-4" />
                            Impressions
                          </div>
                          <div className="text-xl font-bold text-blue-700">
                            {formatNumber(selectedPost.analytics.impressions)}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    {selectedPost.analytics?.engagedUsers && (
                      <Card className="bg-blue-50">
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-2 text-blue-600 text-sm mb-1">
                            <ThumbsUp className="w-4 h-4" />
                            Engaged Users
                          </div>
                          <div className="text-xl font-bold text-blue-700">
                            {formatNumber(selectedPost.analytics.engagedUsers)}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    {selectedPost.analytics?.clicks && (
                      <Card className="bg-blue-50">
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-2 text-blue-600 text-sm mb-1">
                            <MousePointer className="w-4 h-4" />
                            Clicks
                          </div>
                          <div className="text-xl font-bold text-blue-700">
                            {formatNumber(selectedPost.analytics.clicks)}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    {selectedPost.postType === "video" && selectedPost.analytics?.videoCompleteViews && (
                      <Card className="bg-green-50">
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-2 text-green-600 text-sm mb-1">
                            <Eye className="w-4 h-4" />
                            Complete Views
                          </div>
                          <div className="text-xl font-bold text-green-700">
                            {formatNumber(selectedPost.analytics.videoCompleteViews)}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    {selectedPost.postType === "video" && selectedPost.analytics?.averageWatchTime && (
                      <Card className="bg-green-50">
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-2 text-green-600 text-sm mb-1">
                            <Clock className="w-4 h-4" />
                            Avg Watch Time
                          </div>
                          <div className="text-xl font-bold text-green-700">
                            {formatDuration(selectedPost.analytics.averageWatchTime)}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              )}

              {/* Engagement Summary */}
              <div>
                <h4 className="font-semibold mb-3 text-slate-900">Engagement Summary</h4>
                <Card className="bg-gradient-to-r from-slate-50 to-slate-100">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-slate-600">Total Engagement</div>
                        <div className="text-2xl font-bold text-slate-900">
                          {formatNumber(
                            (selectedPost.analytics?.likes || 0) +
                              (selectedPost.analytics?.comments || 0) +
                              (selectedPost.analytics?.shares || 0) +
                              (selectedPost.analytics?.saves || 0)
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-slate-600">Engagement Rate</div>
                        <div className="text-2xl font-bold text-green-600">
                          {(
                            ((
                              (selectedPost.analytics?.likes || 0) +
                              (selectedPost.analytics?.comments || 0) +
                              (selectedPost.analytics?.shares || 0)
                            ) /
                              Math.max(
                                selectedPost.analytics?.views ||
                                  selectedPost.analytics?.plays ||
                                  1,
                                1
                              )) *
                            100
                          ).toFixed(2)}
                          %
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
