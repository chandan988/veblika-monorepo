"use client";

import React, { useState } from "react";
import { useGetOverviewAnalytics } from "@/lib/queries/analytics/use-get-overview-analytics";
import { useGetPosts } from "@/lib/queries/analytics/use-get-posts";
import { useGetPostAnalytics } from "@/lib/queries/analytics/use-get-post-analytics";
import { Spinner } from "@/components/ui/spinner";
import { YouTubeAnalyticsCard } from "@/components/analytics/youtube-analytics-card";
import { InstagramReelAnalyticsCard } from "@/components/analytics/instagram-reel-analytics-card";
import { InstagramPostAnalyticsCard } from "@/components/analytics/instagram-post-analytics-card";
import { FacebookVideoAnalyticsCard } from "@/components/analytics/facebook-video-analytics-card";
import { FacebookPostAnalyticsCard } from "@/components/analytics/facebook-post-analytics-card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

function Analytics() {
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d">("30d");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");

  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    switch (dateRange) {
      case "7d":
        start.setDate(start.getDate() - 7);
        break;
      case "30d":
        start.setDate(start.getDate() - 30);
        break;
      case "90d":
        start.setDate(start.getDate() - 90);
        break;
    }
    // Set start to beginning of day and end to end of day to include all posts
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    
    return {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    };
  };

  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const { startDate, endDate } = getDateRange();
  const { data: overviewData, isLoading: overviewLoading } = useGetOverviewAnalytics(startDate, endDate);
  const { data: postsData, isLoading: postsLoading } = useGetPosts({
    platform: selectedPlatform || undefined,
    startDate,
    endDate,
    limit: 50,
  });
  const { data: postAnalyticsData, isLoading: postAnalyticsLoading } = useGetPostAnalytics(
    selectedPostId || ""
  );

  const overview = overviewData?.data?.overview;
  const bestPosts = overviewData?.data?.bestPosts || [];
  const platformStats = overviewData?.data?.platformStats || {};
  const growthData = overviewData?.data?.growthData || [];
  const allPosts = postsData?.data?.posts || [];

  // Debug: Log data to see what we're getting
  React.useEffect(() => {
    console.log("📊 Analytics Data:", {
      overview,
      bestPostsCount: bestPosts.length,
      bestPosts: bestPosts,
      allPostsCount: allPosts.length,
      allPosts: allPosts,
      selectedPlatform,
    });
  }, [overview, bestPosts, allPosts, selectedPlatform]);

  if (overviewLoading || postsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  // Format numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Platform comparison data for pie chart
  const platformComparison = Object.entries(platformStats).map(([platform, stats]) => ({
    name: platform,
    value: stats.engagement,
    posts: stats.posts,
    reach: stats.reach,
  }));

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Track your social media performance across all platforms</p>
        </div>

        {/* Date Range & Platform Filters */}
        <div className="mb-6 flex gap-4 items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setDateRange("7d")}
              className={`px-4 py-2 rounded-lg ${
                dateRange === "7d" ? "bg-blue-600 text-white" : "bg-white text-gray-700"
              }`}
            >
              Last 7 days
            </button>
            <button
              onClick={() => setDateRange("30d")}
              className={`px-4 py-2 rounded-lg ${
                dateRange === "30d" ? "bg-blue-600 text-white" : "bg-white text-gray-700"
              }`}
            >
              Last 30 days
            </button>
            <button
              onClick={() => setDateRange("90d")}
              className={`px-4 py-2 rounded-lg ${
                dateRange === "90d" ? "bg-blue-600 text-white" : "bg-white text-gray-700"
              }`}
            >
              Last 90 days
            </button>
          </div>
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white"
          >
            <option value="">All Platforms</option>
            <option value="FACEBOOK">Facebook</option>
            <option value="INSTAGRAM">Instagram</option>
            <option value="YOUTUBE">YouTube</option>
            <option value="LINKEDIN">LinkedIn</option>
          </select>
        </div>

        {/* Overview Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-600 text-sm mb-2">Total Reach</div>
            <div className="text-3xl font-bold text-gray-900">{formatNumber(overview?.totalReach || 0)}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-600 text-sm mb-2">Total Impressions</div>
            <div className="text-3xl font-bold text-gray-900">{formatNumber(overview?.totalImpressions || 0)}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-600 text-sm mb-2">Total Engagement</div>
            <div className="text-3xl font-bold text-gray-900">{formatNumber(overview?.totalEngagement || 0)}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-600 text-sm mb-2">Total Posts</div>
            <div className="text-3xl font-bold text-gray-900">{overview?.totalPosts || 0}</div>
          </div>
        </div>

        {/* Followers */}
        {overview?.followers && Object.keys(overview.followers).length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Followers</h2>
            <div className="grid grid-cols-3 gap-4">
              {overview.followers.instagram && (
                <div>
                  <div className="text-gray-600 text-sm">Instagram</div>
                  <div className="text-2xl font-bold">{formatNumber(overview.followers.instagram)}</div>
                </div>
              )}
              {overview.followers.facebook && (
                <div>
                  <div className="text-gray-600 text-sm">Facebook</div>
                  <div className="text-2xl font-bold">{formatNumber(overview.followers.facebook)}</div>
                </div>
              )}
              {overview.followers.youtube && (
                <div>
                  <div className="text-gray-600 text-sm">YouTube</div>
                  <div className="text-2xl font-bold">{formatNumber(overview.followers.youtube)}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Growth Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Engagement Growth</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="engagement" stroke="#8884d8" name="Engagement" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Reach & Impressions</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="reach" stroke="#82ca9d" name="Reach" />
                <Line type="monotone" dataKey="impressions" stroke="#ffc658" name="Impressions" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform Comparison */}
        {platformComparison.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Platform-by-Platform Comparison</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={platformComparison}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {platformComparison.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div>
                <h3 className="font-semibold mb-4">Platform Statistics</h3>
                <div className="space-y-3">
                  {platformComparison.map((platform, index) => (
                    <div key={platform.name} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium">{platform.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatNumber(platform.value)} engagement</div>
                        <div className="text-sm text-gray-600">{platform.posts} posts</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Debug Info - Remove in production */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-2">Debug Info:</h3>
          <div className="text-sm space-y-1">
            <div>Total Posts: {overview?.totalPosts || 0}</div>
            <div>Best Posts Count: {bestPosts.length}</div>
            <div>All Posts Count: {allPosts.length}</div>
            <div>Platforms: {Object.keys(platformStats).join(", ") || "None"}</div>
            {bestPosts.length > 0 && (
              <div className="mt-2">
                <div>First Post Platform: {bestPosts[0]?.platform}</div>
                <div>First Post Has Title: {bestPosts[0]?.title ? "Yes" : "No"}</div>
                <div>First Post Has Thumbnail: {bestPosts[0]?.thumbnailUrl ? "Yes" : "No"}</div>
              </div>
            )}
          </div>
        </div>

        {/* Best Performing Posts */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            Best Performing Posts {bestPosts.length > 0 && `(${bestPosts.length})`}
          </h2>
          <div className="space-y-4">
            {bestPosts.length > 0 ? (
              bestPosts.map((post) => {
                // Show YouTube-specific card for YouTube posts
                console.log("🎬 Rendering post:", { platform: post.platform, title: post.title, hasThumbnail: !!post.thumbnailUrl });
                if (post.platform === "YOUTUBE") {
                  return (
                    <div
                      key={post._id}
                      onClick={() => setSelectedPostId(post.postId)}
                      className="border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm font-medium">
                            YOUTUBE
                          </span>
                          <span className="text-sm text-gray-600">
                            {new Date(post.publishedAt || Date.now()).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex gap-4">
                          {post.thumbnailUrl && (
                            <img
                              src={post.thumbnailUrl}
                              alt={post.title || "Video thumbnail"}
                              className="w-32 h-20 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">{post.title || "Untitled Video"}</h3>
                            {post.description && (
                              <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                {post.description}
                              </p>
                            )}
                            <div className="flex gap-6 text-sm">
                              <div>
                                <span className="text-gray-600">Views: </span>
                                <span className="font-semibold">
                                  {post.analytics?.views?.toLocaleString() || 0}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">Likes: </span>
                                <span className="font-semibold">{post.analytics?.likes || 0}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Comments: </span>
                                <span className="font-semibold">{post.analytics?.comments || 0}</span>
                              </div>
                              {post.analytics?.estimatedMinutesWatched && (
                                <div>
                                  <span className="text-gray-600">Watch Time: </span>
                                  <span className="font-semibold">
                                    {Math.floor(post.analytics.estimatedMinutesWatched)} min
                                  </span>
                                </div>
                              )}
                              {post.analytics?.averageViewPercentage && (
                                <div>
                                  <span className="text-gray-600">Avg View: </span>
                                  <span className="font-semibold">
                                    {post.analytics.averageViewPercentage.toFixed(1)}%
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="mt-2 text-xs text-blue-600">Click to view detailed analytics →</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Instagram Reel card (clickable)
                const isInstagramReel = post.platform === "INSTAGRAM" && post.postType === "reel";
                if (isInstagramReel) {
                  return (
                    <div
                      key={post._id}
                      onClick={() => setSelectedPostId(post.postId)}
                      className="border border-purple-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-r from-purple-50 to-pink-50"
                    >
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded text-sm font-medium">
                            INSTAGRAM REEL
                          </span>
                          <span className="text-sm text-gray-600">
                            {new Date(post.publishedAt || Date.now()).toLocaleDateString()}
                          </span>
                        </div>
                        {post.mediaUrl && (
                          <img
                            src={post.mediaUrl}
                            alt={post.caption || "Reel"}
                            className="w-full h-48 object-cover rounded mb-3"
                          />
                        )}
                        <div className="flex-1">
                          <p className="text-gray-800 mb-3 line-clamp-2">
                            {post.caption || post.content || "No caption"}
                          </p>
                          <div className="flex gap-6 text-sm">
                            <div>
                              <span className="text-gray-600">▶️ Plays: </span>
                              <span className="font-semibold">{post.analytics?.plays?.toLocaleString() || 0}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">❤️ Likes: </span>
                              <span className="font-semibold">{post.analytics?.likes || 0}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">💬 Comments: </span>
                              <span className="font-semibold">{post.analytics?.comments || 0}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">📤 Shares: </span>
                              <span className="font-semibold">{post.analytics?.shares || 0}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">💾 Saves: </span>
                              <span className="font-semibold">{post.analytics?.saves || 0}</span>
                            </div>
                            {post.analytics?.engagement && (
                              <div>
                                <span className="text-gray-600">Total Engagement: </span>
                                <span className="font-semibold text-purple-600">{post.analytics.engagement}</span>
                              </div>
                            )}
                          </div>
                          <div className="mt-2 text-xs text-purple-600">Click to view detailed Instagram Reel analytics →</div>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Instagram Post card (clickable)
                const isInstagramPost = post.platform === "INSTAGRAM" && post.postType === "post";
                if (isInstagramPost) {
                  return (
                    <div
                      key={post._id}
                      onClick={() => setSelectedPostId(post.postId)}
                      className="border border-pink-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow bg-pink-50"
                    >
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-2 py-1 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white rounded text-sm font-medium">
                            INSTAGRAM POST
                          </span>
                          <span className="text-sm text-gray-600">
                            {new Date(post.publishedAt || Date.now()).toLocaleDateString()}
                          </span>
                        </div>
                        {post.mediaUrl && (
                          <img
                            src={post.mediaUrl}
                            alt={post.caption || "Post"}
                            className="w-full h-48 object-cover rounded mb-3"
                          />
                        )}
                        <div className="flex-1">
                          <p className="text-gray-800 mb-3 line-clamp-2">
                            {post.caption || post.content || "No caption"}
                          </p>
                          <div className="flex gap-6 text-sm">
                            <div>
                              <span className="text-gray-600">❤️ Likes: </span>
                              <span className="font-semibold">{post.analytics?.likes || 0}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">💬 Comments: </span>
                              <span className="font-semibold">{post.analytics?.comments || 0}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">💾 Saves: </span>
                              <span className="font-semibold">{post.analytics?.saves || 0}</span>
                            </div>
                            {post.analytics?.reach && (
                              <div>
                                <span className="text-gray-600">👁️ Reach: </span>
                                <span className="font-semibold">{post.analytics.reach.toLocaleString()}</span>
                              </div>
                            )}
                            {post.analytics?.impressions && (
                              <div>
                                <span className="text-gray-600">📊 Impressions: </span>
                                <span className="font-semibold">{post.analytics.impressions.toLocaleString()}</span>
                              </div>
                            )}
                            {post.analytics?.engagement && (
                              <div>
                                <span className="text-gray-600">Total Engagement: </span>
                                <span className="font-semibold text-pink-600">{post.analytics.engagement}</span>
                              </div>
                            )}
                          </div>
                          <div className="mt-2 text-xs text-pink-600">Click to view detailed Instagram Post analytics →</div>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Facebook Video card (clickable)
                const isFacebookVideo = post.platform === "FACEBOOK" && post.postType === "video";
                if (isFacebookVideo) {
                  return (
                    <div
                      key={post._id}
                      onClick={() => setSelectedPostId(post.postId)}
                      className="border border-blue-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow bg-blue-50"
                    >
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-2 py-1 bg-blue-600 text-white rounded text-sm font-medium">
                            FACEBOOK VIDEO
                          </span>
                          <span className="text-sm text-gray-600">
                            {new Date(post.publishedAt || Date.now()).toLocaleDateString()}
                          </span>
                        </div>
                        {post.mediaUrl && (
                          <img
                            src={post.mediaUrl}
                            alt={post.content || "Video"}
                            className="w-full h-48 object-cover rounded mb-3"
                          />
                        )}
                        <div className="flex-1">
                          <p className="text-gray-800 mb-3 line-clamp-2">
                            {post.content || post.caption || "No content"}
                          </p>
                          <div className="flex gap-6 text-sm">
                            <div>
                              <span className="text-gray-600">▶️ Views: </span>
                              <span className="font-semibold">{post.analytics?.views?.toLocaleString() || 0}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">❤️ Likes: </span>
                              <span className="font-semibold">{post.analytics?.likes || 0}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">💬 Comments: </span>
                              <span className="font-semibold">{post.analytics?.comments || 0}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">📤 Shares: </span>
                              <span className="font-semibold">{post.analytics?.shares || 0}</span>
                            </div>
                            {post.analytics?.videoCompleteViews && (
                              <div>
                                <span className="text-gray-600">✅ Complete: </span>
                                <span className="font-semibold">{post.analytics.videoCompleteViews.toLocaleString()}</span>
                              </div>
                            )}
                            {post.analytics?.engagement && (
                              <div>
                                <span className="text-gray-600">Total Engagement: </span>
                                <span className="font-semibold text-blue-600">{post.analytics.engagement}</span>
                              </div>
                            )}
                          </div>
                          <div className="mt-2 text-xs text-blue-600">Click to view detailed Facebook Video analytics →</div>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Facebook Post card (clickable) - for image/photo posts
                const isFacebookPost = post.platform === "FACEBOOK" && post.postType === "post";
                if (isFacebookPost) {
                  return (
                    <div
                      key={post._id}
                      onClick={() => setSelectedPostId(post.postId)}
                      className="border border-blue-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow bg-blue-50"
                    >
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-2 py-1 bg-blue-600 text-white rounded text-sm font-medium">
                            FACEBOOK POST
                          </span>
                          <span className="text-sm text-gray-600">
                            {new Date(post.publishedAt || Date.now()).toLocaleDateString()}
                          </span>
                        </div>
                        {post.mediaUrl && (
                          <img
                            src={post.mediaUrl}
                            alt={post.content || "Post"}
                            className="w-full h-48 object-cover rounded mb-3"
                          />
                        )}
                        <div className="flex-1">
                          <p className="text-gray-800 mb-3 line-clamp-2">
                            {post.content || post.caption || "No content"}
                          </p>
                          <div className="flex gap-6 text-sm">
                            <div>
                              <span className="text-gray-600">❤️ Likes: </span>
                              <span className="font-semibold">{post.analytics?.likes || 0}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">💬 Comments: </span>
                              <span className="font-semibold">{post.analytics?.comments || 0}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">📤 Shares: </span>
                              <span className="font-semibold">{post.analytics?.shares || 0}</span>
                            </div>
                            {post.analytics?.engagedUsers && (
                              <div>
                                <span className="text-gray-600">👥 Engaged: </span>
                                <span className="font-semibold">{post.analytics.engagedUsers.toLocaleString()}</span>
                              </div>
                            )}
                            {post.analytics?.reach && (
                              <div>
                                <span className="text-gray-600">👁️ Reach: </span>
                                <span className="font-semibold">{post.analytics.reach.toLocaleString()}</span>
                              </div>
                            )}
                            {post.analytics?.engagement && (
                              <div>
                                <span className="text-gray-600">Total Engagement: </span>
                                <span className="font-semibold text-blue-600">{post.analytics.engagement}</span>
                              </div>
                            )}
                          </div>
                          <div className="mt-2 text-xs text-blue-600">Click to view detailed Facebook Post analytics →</div>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Default card for other platforms
                return (
                  <div
                    key={post._id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                            {post.platform}
                          </span>
                          <span className="text-sm text-gray-600">
                            {new Date(post.publishedAt || Date.now()).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-800 mb-3 line-clamp-2">
                          {post.content || post.caption || post.title || "No content"}
                        </p>
                        <div className="flex gap-6 text-sm">
                          <div>
                            <span className="text-gray-600">Likes: </span>
                            <span className="font-semibold">{post.analytics?.likes || 0}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Comments: </span>
                            <span className="font-semibold">{post.analytics?.comments || 0}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Shares: </span>
                            <span className="font-semibold">{post.analytics?.shares || 0}</span>
                          </div>
                          {post.analytics?.views && (
                            <div>
                              <span className="text-gray-600">Views: </span>
                              <span className="font-semibold">{post.analytics.views}</span>
                            </div>
                          )}
                          {post.analytics?.engagement && (
                            <div>
                              <span className="text-gray-600">Total Engagement: </span>
                              <span className="font-semibold text-blue-600">{post.analytics.engagement}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">No posts found in this date range</div>
            )}
          </div>
        </div>

        {/* YouTube Post Details */}
        {selectedPostId && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Post Analytics Details</h2>
              <button
                onClick={() => setSelectedPostId(null)}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
            {postAnalyticsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner />
              </div>
            ) : postAnalyticsData?.data?.post ? (
              postAnalyticsData.data.post.platform === "YOUTUBE" ? (
                <YouTubeAnalyticsCard post={postAnalyticsData.data.post} />
              ) : postAnalyticsData.data.post.platform === "INSTAGRAM" && 
                   postAnalyticsData.data.post.postType === "reel" ? (
                <InstagramReelAnalyticsCard post={postAnalyticsData.data.post} />
              ) : postAnalyticsData.data.post.platform === "INSTAGRAM" && 
                   postAnalyticsData.data.post.postType === "post" ? (
                <InstagramPostAnalyticsCard post={postAnalyticsData.data.post} />
              ) : postAnalyticsData.data.post.platform === "FACEBOOK" && 
                   postAnalyticsData.data.post.postType === "video" ? (
                <FacebookVideoAnalyticsCard post={postAnalyticsData.data.post} />
              ) : postAnalyticsData.data.post.platform === "FACEBOOK" && 
                   postAnalyticsData.data.post.postType === "post" ? (
                <FacebookPostAnalyticsCard post={postAnalyticsData.data.post} />
              ) : (
                <div className="bg-white rounded-lg shadow p-6">
                  <p className="text-gray-600">Detailed analytics for this platform coming soon...</p>
                </div>
              )
            ) : null}
          </div>
        )}

        {/* All Posts List - Clickable */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">All Posts ({allPosts.length})</h2>
          {allPosts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No posts found. Post a video to YouTube to see analytics here!</p>
              <p className="text-sm mt-2">Go to Social Media → Post to create your first post.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {allPosts.map((post) => {
                const isYouTube = post.platform === "YOUTUBE";
                const isInstagramReel = post.platform === "INSTAGRAM" && post.postType === "reel";
                const isInstagramPost = post.platform === "INSTAGRAM" && post.postType === "post";
                const isFacebookVideo = post.platform === "FACEBOOK" && post.postType === "video";
                const isFacebookPost = post.platform === "FACEBOOK" && post.postType === "post";
                const isClickable = isYouTube || isInstagramReel || isInstagramPost || isFacebookVideo || isFacebookPost;
                
                return (
                  <div
                    key={post._id}
                    onClick={() => isClickable && setSelectedPostId(post.postId)}
                    className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                      isClickable ? "cursor-pointer" : ""
                    } ${
                      isYouTube 
                        ? "border-red-200 bg-red-50" 
                        : isInstagramReel
                        ? "border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50"
                        : isInstagramPost
                        ? "border-pink-200 bg-pink-50"
                        : isFacebookVideo
                        ? "border-blue-200 bg-blue-50"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isYouTube && post.thumbnailUrl && (
                        <img
                          src={post.thumbnailUrl}
                          alt={post.title || "Thumbnail"}
                          className="w-32 h-20 object-cover rounded"
                        />
                      )}
                      {(isInstagramReel || isInstagramPost || isFacebookVideo) && post.mediaUrl && (
                        <img
                          src={post.mediaUrl}
                          alt={post.caption || post.content || "Media"}
                          className="w-32 h-20 object-cover rounded"
                        />
                      )}
                      {!isYouTube && !isInstagramReel && !isInstagramPost && !isFacebookVideo && post.mediaUrl && (
                        <img
                          src={post.mediaUrl}
                          alt="Media"
                          className="w-32 h-20 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              isYouTube
                                ? "bg-red-100 text-red-800"
                                : isInstagramReel
                                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                                : isInstagramPost
                                ? "bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white"
                                : isFacebookVideo
                                ? "bg-blue-600 text-white"
                                : post.platform === "INSTAGRAM"
                                ? "bg-pink-100 text-pink-800"
                                : post.platform === "FACEBOOK"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {isInstagramReel ? "INSTAGRAM REEL" : isInstagramPost ? "INSTAGRAM POST" : isFacebookVideo ? "FACEBOOK VIDEO" : post.platform}
                          </span>
                          <span className="text-sm text-gray-600">
                            {new Date(post.publishedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="font-semibold mb-1 text-lg">
                          {isYouTube ? post.title : post.content || post.caption || "Untitled"}
                        </h3>
                        {isYouTube && post.description && (
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">{post.description}</p>
                        )}
                        <div className="flex gap-4 text-sm">
                          {/* Show plays for Instagram Reels, views for YouTube and Facebook Videos */}
                          {isInstagramReel ? (
                            <span className="font-medium">▶️ {post.analytics?.plays?.toLocaleString() || 0} plays</span>
                          ) : (
                            <span className="font-medium">👁️ {post.analytics?.views?.toLocaleString() || 0} views</span>
                          )}
                          <span>👍 {post.analytics?.likes || 0}</span>
                          <span>💬 {post.analytics?.comments || 0}</span>
                          {isInstagramReel && (
                            <span>📤 {post.analytics?.shares || 0}</span>
                          )}
                          {(isInstagramReel || isInstagramPost) && (
                            <span className="text-purple-600 font-medium">
                              💾 {post.analytics?.saves || 0} saves
                            </span>
                          )}
                          {!isInstagramReel && (
                            <span>📤 {post.analytics?.shares || 0}</span>
                          )}
                          {isFacebookVideo && post.analytics?.videoCompleteViews && (
                            <span className="text-green-600 font-medium">
                              ✅ {post.analytics.videoCompleteViews.toLocaleString()} complete
                            </span>
                          )}
                          {isYouTube && post.analytics?.estimatedMinutesWatched && (
                            <span className="text-blue-600 font-medium">
                              ⏱️ {Math.floor(post.analytics.estimatedMinutesWatched)} min
                            </span>
                          )}
                          {isYouTube && post.analytics?.averageViewPercentage && (
                            <span className="text-green-600 font-medium">
                              📊 {post.analytics.averageViewPercentage.toFixed(1)}% avg view
                            </span>
                          )}
                        </div>
                        {isClickable && (
                          <div className="mt-2 text-xs text-blue-600">
                            Click to view detailed {
                              isYouTube ? "YouTube" : 
                              isInstagramReel ? "Instagram Reel" : 
                              isInstagramPost ? "Instagram Post" : 
                              isFacebookVideo ? "Facebook Video" : 
                              isFacebookPost ? "Facebook Post" : 
                              ""
                            } analytics →
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Analytics;
