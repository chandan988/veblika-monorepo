"use client";

import React from "react";

interface InstagramPost {
  _id: string;
  postId: string;
  postType: string;
  caption?: string;
  content?: string;
  mediaUrl?: string;
  accountId?: string;
  publishedAt: string;
  analytics: {
    // Instagram Post metrics (regular posts, not reels)
    likes: number;
    comments: number;
    saves?: number; // saved_count (optional)
    reach?: number; // optional
    impressions?: number; // optional
    engagement?: number; // Calculated: likes + comments + saves
    lastUpdated?: string;
  };
  analyticsStatus?: "pending" | "synced" | "failed";
  hashtags: string[];
}

interface InstagramPostAnalyticsCardProps {
  post: InstagramPost;
}

export function InstagramPostAnalyticsCard({ post }: InstagramPostAnalyticsCardProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const analytics = post.analytics || {};
  
  // Calculate engagement rate
  const engagementRate = (analytics.impressions || 0) > 0 
    ? ((analytics.engagement || 0) / (analytics.impressions || 1) * 100).toFixed(2)
    : "0.00";

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      {/* Post Header */}
      <div className="flex gap-4">
        {post.mediaUrl && (
          <img
            src={post.mediaUrl}
            alt={post.caption || "Post image"}
            className="w-48 h-48 object-cover rounded-lg"
          />
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white rounded-full text-sm font-medium">
              INSTAGRAM POST
            </span>
            {post.analyticsStatus && (
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
            )}
          </div>
          {post.caption && (
            <p className="text-gray-800 mb-2 line-clamp-3">{post.caption}</p>
          )}
          <div className="text-sm text-gray-500">
            Published: {new Date(post.publishedAt).toLocaleDateString()}
          </div>
          {analytics.lastUpdated && (
            <div className="text-xs text-gray-400 mt-1">
              Last updated: {new Date(analytics.lastUpdated).toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-gray-600 text-sm mb-1 flex items-center gap-1">
            <span>❤️</span> Likes
          </div>
          <div className="text-2xl font-bold">{formatNumber(analytics.likes || 0)}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-gray-600 text-sm mb-1 flex items-center gap-1">
            <span>💬</span> Comments
          </div>
          <div className="text-2xl font-bold">{formatNumber(analytics.comments || 0)}</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="text-gray-600 text-sm mb-1 flex items-center gap-1">
            <span>💾</span> Saves
          </div>
          <div className="text-2xl font-bold text-blue-700">{formatNumber(analytics.saves || 0)}</div>
          <div className="text-xs text-gray-500 mt-1">Saved by users</div>
        </div>
      </div>

      {/* Engagement & Reach Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="text-gray-600 text-sm mb-1">Total Engagement</div>
          <div className="text-2xl font-bold text-green-700">
            {formatNumber(analytics.engagement || 0)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Likes + Comments + Saves
          </div>
        </div>
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <div className="text-gray-600 text-sm mb-1">Reach</div>
          <div className="text-2xl font-bold text-orange-700">{formatNumber(analytics.reach || 0)}</div>
          <div className="text-xs text-gray-500 mt-1">Unique accounts</div>
        </div>
        <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
          <div className="text-gray-600 text-sm mb-1">Impressions</div>
          <div className="text-2xl font-bold text-indigo-700">{formatNumber(analytics.impressions || 0)}</div>
          <div className="text-xs text-gray-500 mt-1">Total times seen</div>
        </div>
      </div>

      {/* Engagement Rate */}
      <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-4 border border-purple-300">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-gray-700 text-sm mb-1 font-medium">Engagement Rate</div>
            <div className="text-3xl font-bold text-purple-700">{engagementRate}%</div>
            <div className="text-xs text-gray-600 mt-1">
              (Engagement / Impressions × 100)
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Engagement</div>
            <div className="text-xl font-semibold">{formatNumber(analytics.engagement || 0)}</div>
            <div className="text-sm text-gray-600 mt-1">Impressions</div>
            <div className="text-xl font-semibold">{formatNumber(analytics.impressions || 0)}</div>
          </div>
        </div>
      </div>

      {/* Hashtags */}
      {post.hashtags && post.hashtags.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold mb-3">Hashtags</h4>
          <div className="flex flex-wrap gap-2">
            {post.hashtags.map((hashtag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
              >
                #{hashtag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Performance Summary */}
      <div className="border-t pt-4">
        <h4 className="text-lg font-semibold mb-3">Performance Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-2">Average Engagement per Impression</div>
            <div className="text-xl font-bold">
              {(analytics.impressions || 0) > 0
                ? ((analytics.engagement || 0) / (analytics.impressions || 1)).toFixed(3)
                : "0.000"}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              How much engagement per impression
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-2">Save Rate</div>
            <div className="text-xl font-bold">
              {(analytics.impressions || 0) > 0
                ? ((analytics.saves || 0) / (analytics.impressions || 1) * 100).toFixed(2)
                : "0.00"}
              %
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Percentage of impressions saved
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-2">Comment Rate</div>
            <div className="text-xl font-bold">
              {(analytics.impressions || 0) > 0
                ? ((analytics.comments || 0) / (analytics.impressions || 1) * 100).toFixed(2)
                : "0.00"}
              %
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Percentage of impressions commented
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

