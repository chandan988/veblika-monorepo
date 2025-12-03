"use client";

import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface YouTubePost {
  _id: string;
  videoId?: string;
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  publishedAt: string;
  analytics: {
    views?: number;
    likes: number;
    comments: number;
    shares: number;
    estimatedMinutesWatched?: number;
    averageViewDuration?: number;
    averageViewPercentage?: number;
    subscribersGained?: number;
    subscribersLost?: number;
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
  };
  analyticsStatus?: "pending" | "synced" | "failed";
}

interface YouTubeAnalyticsCardProps {
  post: YouTubePost;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

export function YouTubeAnalyticsCard({ post }: YouTubeAnalyticsCardProps) {
  const formatDuration = (seconds: number) => {
    if (!seconds) return "0s";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const formatMinutes = (minutes: number) => {
    if (!minutes) return "0 min";
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = Math.floor(minutes % 60);
      return `${hours}h ${mins}m`;
    }
    return `${Math.floor(minutes)} min`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const analytics = post.analytics || {};

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      {/* Video Header */}
      <div className="flex gap-4">
        {post.thumbnailUrl && (
          <img
            src={post.thumbnailUrl}
            alt={post.title || "Video thumbnail"}
            className="w-48 h-32 object-cover rounded-lg"
          />
        )}
        <div className="flex-1">
          <h3 className="text-xl font-semibold mb-2">{post.title || "Untitled Video"}</h3>
          {post.description && (
            <p className="text-gray-600 text-sm line-clamp-2 mb-2">{post.description}</p>
          )}
          {post.videoUrl && (
            <a
              href={post.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm"
            >
              Watch on YouTube →
            </a>
          )}
          <div className="mt-2 text-sm text-gray-500">
            Published: {new Date(post.publishedAt).toLocaleDateString()}
          </div>
          {post.analyticsStatus && (
            <div className="mt-2">
              <span
                className={`px-2 py-1 rounded text-xs ${
                  post.analyticsStatus === "synced"
                    ? "bg-green-100 text-green-800"
                    : post.analyticsStatus === "failed"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {post.analyticsStatus.toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-gray-600 text-sm mb-1">Views</div>
          <div className="text-2xl font-bold">{formatNumber(analytics.views || 0)}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-gray-600 text-sm mb-1">Likes</div>
          <div className="text-2xl font-bold">{formatNumber(analytics.likes || 0)}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-gray-600 text-sm mb-1">Comments</div>
          <div className="text-2xl font-bold">{formatNumber(analytics.comments || 0)}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-gray-600 text-sm mb-1">Shares</div>
          <div className="text-2xl font-bold">{formatNumber(analytics.shares || 0)}</div>
        </div>
      </div>

      {/* YouTube-Specific Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {analytics.estimatedMinutesWatched !== undefined && (
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-gray-600 text-sm mb-1">Watch Time</div>
            <div className="text-xl font-bold">{formatMinutes(analytics.estimatedMinutesWatched)}</div>
          </div>
        )}
        {analytics.averageViewDuration !== undefined && (
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-gray-600 text-sm mb-1">Avg View Duration</div>
            <div className="text-xl font-bold">{formatDuration(analytics.averageViewDuration)}</div>
          </div>
        )}
        {analytics.averageViewPercentage !== undefined && (
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-gray-600 text-sm mb-1">Avg View %</div>
            <div className="text-xl font-bold">{analytics.averageViewPercentage.toFixed(1)}%</div>
          </div>
        )}
        {analytics.subscribersGained !== undefined && (
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-gray-600 text-sm mb-1">Subs Gained</div>
            <div className="text-xl font-bold text-green-600">
              +{formatNumber(analytics.subscribersGained)}
            </div>
          </div>
        )}
        {analytics.subscribersLost !== undefined && (
          <div className="bg-red-50 rounded-lg p-4">
            <div className="text-gray-600 text-sm mb-1">Subs Lost</div>
            <div className="text-xl font-bold text-red-600">
              -{formatNumber(Math.abs(analytics.subscribersLost))}
            </div>
          </div>
        )}
      </div>

      {/* Traffic Sources */}
      {analytics.trafficSources && analytics.trafficSources.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold mb-4">Traffic Sources</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.trafficSources}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="source" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="views" fill="#8884d8" name="Views" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Device Types */}
      {analytics.deviceTypes && analytics.deviceTypes.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold mb-4">Device Types</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={analytics.deviceTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.deviceType}: ${formatNumber(entry.views)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="views"
                >
                  {analytics.deviceTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {analytics.deviceTypes.map((device, index) => (
                <div key={device.deviceType} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="font-medium">{device.deviceType}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatNumber(device.views)} views</div>
                    <div className="text-sm text-gray-600">{formatMinutes(device.watchTime / 60)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Countries */}
      {analytics.countries && analytics.countries.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold mb-4">Top Countries</h4>
          <div className="space-y-2">
            {analytics.countries.slice(0, 10).map((country, index) => (
              <div key={country.country} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-400 w-6">{index + 1}</span>
                  <span className="font-medium">{country.country}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatNumber(country.views)} views</div>
                  <div className="text-sm text-gray-600">{formatMinutes(country.watchTime / 60)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


