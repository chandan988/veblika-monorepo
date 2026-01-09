"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/utils/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  Heart,
  MessageCircle,
  Share2,
  Eye,
  RefreshCw,
  Send,
  ChevronDown,
  ChevronUp,
  Reply,
  Clock,
  Image as ImageIcon,
  Video,
  CornerDownRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// Platform configuration
const PLATFORMS = [
  { id: "all", name: "All Platforms", icon: null, color: "bg-gray-500" },
  { id: "instagram", name: "Instagram", icon: "/icons/instagram.png", color: "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500" },
  { id: "facebook", name: "Facebook", icon: "/icons/facebook.png", color: "bg-blue-600" },
  { id: "youtube", name: "YouTube", icon: "/icons/youtube.png", color: "bg-red-600" },
  { id: "linkedin", name: "LinkedIn", icon: "/icons/linkedin.png", color: "bg-blue-700" },
];

interface Post {
  id: string;
  postId: string;
  platform: string;
  content: string;
  title?: string;
  mediaUrl?: string;
  postType: string;
  publishedAt: string;
  analytics: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
}

interface Comment {
  id: string;
  message: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  likeCount: number;
  replyCount: number;
  hasReplies: boolean;
  replies?: Comment[];
}

export default function EngagePage() {
  const queryClient = useQueryClient();
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

  // Fetch posts
  const {
    data: postsData,
    isLoading: isLoadingPosts,
    refetch: refetchPosts,
  } = useQuery({
    queryKey: ["engage-posts", selectedPlatform],
    queryFn: async () => {
      const res = await api.get("/engage/posts", {
        params: { platform: selectedPlatform, limit: 50 },
      });
      return res.data;
    },
    refetchOnWindowFocus: false,
  });

  // Fetch comments for selected post
  const {
    data: commentsData,
    isLoading: isLoadingComments,
    refetch: refetchComments,
  } = useQuery({
    queryKey: ["post-comments", selectedPost?.postId, selectedPost?.platform],
    queryFn: async () => {
      if (!selectedPost) return { data: [] };
      const res = await api.get(
        `/engage/comments/${selectedPost.platform.toLowerCase()}/${selectedPost.postId}`
      );
      return res.data;
    },
    enabled: !!selectedPost,
    refetchOnWindowFocus: false,
  });

  // Sync posts mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/engage/sync", null, {
        params: { platform: selectedPlatform },
      });
      return res.data;
    },
    onSuccess: (data) => {
      const { synced, deleted, errors } = data.data || {};
      if (errors?.length > 0) {
        // Show detailed error messages for each platform
        const errorMessages = errors.map((err: any) => `${err.platform}: ${err.error}`).join(", ");
        toast.warning(
          `Synced ${synced} posts, removed ${deleted} deleted posts. Errors: ${errorMessages}`,
          { duration: 6000 }
        );
      } else {
        toast.success(data.message || `Synced ${synced} posts, removed ${deleted} deleted posts`);
      }
      refetchPosts();
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || "Failed to sync posts";
      toast.error(errorMessage, { duration: 6000 });
    },
  });

  // Post comment mutation
  const commentMutation = useMutation({
    mutationFn: async ({ message, parentId }: { message: string; parentId?: string }) => {
      const res = await api.post("/engage/comment", {
        postId: selectedPost?.postId,
        platform: selectedPost?.platform,
        message,
        parentId,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Comment posted successfully");
      setNewComment("");
      setReplyingTo(null);
      refetchComments();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to post comment");
    },
  });

  const posts: Post[] = postsData?.data || [];
  const comments: Comment[] = commentsData?.data || [];

  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
    setSheetOpen(true);
    setReplyingTo(null);
    setNewComment("");
  };

  const handleSendComment = () => {
    if (!newComment.trim()) return;
    commentMutation.mutate({
      message: newComment,
      parentId: replyingTo?.id,
    });
  };

  const toggleReplies = (commentId: string) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedComments(newExpanded);
  };

  const getPlatformIcon = (platform: string) => {
    const plat = PLATFORMS.find((p) => p.id === platform.toLowerCase());
    return plat?.icon || "/icons/image.png";
  };

  const getPlatformColor = (platform: string) => {
    const plat = PLATFORMS.find((p) => p.id === platform.toLowerCase());
    return plat?.color || "bg-gray-500";
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "Unknown";
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100">
      {/* Header Section */}
      <section className="w-full bg-white border-b border-gray-200 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 md:py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                Engage
              </h1>
              <p className="text-gray-600 mt-1 text-base">
                View and respond to comments across all your social media
              </p>
            </div>
            <Button
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              variant="outline"
              className="gap-2 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300"
            >
              <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
              {syncMutation.isPending ? "Syncing..." : "Sync Posts"}
            </Button>
          </div>
        </div>
      </section>

      {/* Platform Filters */}
      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex flex-wrap gap-2 mb-6">
          {PLATFORMS.map((platform) => (
            <Button
              key={platform.id}
              variant={selectedPlatform === platform.id ? "default" : "outline"}
              onClick={() => setSelectedPlatform(platform.id)}
              className={`gap-2 transition-all duration-200 ${
                selectedPlatform === platform.id
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
                  : "bg-white hover:bg-gray-50 border-gray-200"
              }`}
            >
              {platform.icon && (
                <img src={platform.icon} alt={platform.name} className="h-4 w-4" />
              )}
              <span>{platform.name}</span>
              {selectedPlatform === platform.id && posts.length > 0 && (
                <Badge variant="secondary" className="ml-1 bg-white/20 text-white">
                  {posts.length}
                </Badge>
              )}
            </Button>
          ))}
        </div>

        {/* Posts List */}
        {isLoadingPosts ? (
          <div className="flex items-center justify-center py-20">
            <Spinner />
          </div>
        ) : posts.length === 0 ? (
          <Card className="border-dashed border-2 border-gray-300">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <MessageCircle className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Posts Found</h3>
              <p className="text-gray-500 text-center max-w-md">
                {selectedPlatform === "all"
                  ? "You don't have any posts yet. Create a post to start engaging with your audience."
                  : `No posts found for ${PLATFORMS.find((p) => p.id === selectedPlatform)?.name}. Try syncing or switch to another platform.`}
              </p>
              <Button
                onClick={() => syncMutation.mutate()}
                className="mt-6 gap-2"
                disabled={syncMutation.isPending}
              >
                <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
                Sync Posts from Platforms
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {posts.map((post) => (
              <Card
                key={post.id}
                className="cursor-pointer hover:shadow-lg transition-all duration-200 border-gray-200 hover:border-indigo-300 bg-white overflow-hidden group"
                onClick={() => handlePostClick(post)}
              >
                <CardContent className="p-0">
                  <div className="flex">
                    {/* Media Preview */}
                    {post.mediaUrl && (
                      <div className="relative w-32 h-32 md:w-40 md:h-40 flex-shrink-0 bg-gray-100">
                        {post.postType === "video" || post.postType === "reel" ? (
                          <div className="relative w-full h-full">
                            <img
                              src={post.mediaUrl}
                              alt="Post thumbnail"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <Video className="h-8 w-8 text-white" />
                            </div>
                          </div>
                        ) : (
                          <img
                            src={post.mediaUrl}
                            alt="Post media"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/placeholder-image.png";
                            }}
                          />
                        )}
                      </div>
                    )}

                    {/* Post Content */}
                    <div className="flex-1 p-4 md:p-5 flex flex-col justify-between min-w-0">
                      <div>
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`p-1.5 rounded-lg ${getPlatformColor(post.platform)}`}>
                            <img
                              src={getPlatformIcon(post.platform)}
                              alt={post.platform}
                              className="h-4 w-4 brightness-0 invert"
                            />
                          </div>
                          <Badge variant="secondary" className="text-xs font-medium capitalize">
                            {post.platform.toLowerCase()}
                          </Badge>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(post.publishedAt)}
                          </span>
                        </div>

                        {/* Title (for YouTube) */}
                        {post.title && (
                          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                            {post.title}
                          </h3>
                        )}

                        {/* Content */}
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {post.content || "No caption"}
                        </p>
                      </div>

                      {/* Analytics */}
                      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1.5 text-gray-500 hover:text-red-500 transition-colors">
                                <Heart className="h-4 w-4" />
                                <span className="text-sm font-medium">
                                  {post.analytics.likes.toLocaleString()}
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>Likes</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1.5 text-gray-500 hover:text-blue-500 transition-colors">
                                <MessageCircle className="h-4 w-4" />
                                <span className="text-sm font-medium">
                                  {post.analytics.comments.toLocaleString()}
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>Comments</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        {post.analytics.shares > 0 && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1.5 text-gray-500 hover:text-green-500 transition-colors">
                                  <Share2 className="h-4 w-4" />
                                  <span className="text-sm font-medium">
                                    {post.analytics.shares.toLocaleString()}
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>Shares</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}

                        {post.analytics.views > 0 && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1.5 text-gray-500 hover:text-purple-500 transition-colors">
                                  <Eye className="h-4 w-4" />
                                  <span className="text-sm font-medium">
                                    {post.analytics.views.toLocaleString()}
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>Views</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}

                        <div className="ml-auto">
                          <Badge
                            variant="outline"
                            className="text-xs group-hover:bg-indigo-50 group-hover:border-indigo-200 group-hover:text-indigo-700 transition-colors"
                          >
                            View Comments
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Comments Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
          <SheetHeader className="p-6 pb-4 border-b bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="flex items-center gap-3">
              {selectedPost && (
                <div className={`p-2 rounded-xl ${getPlatformColor(selectedPost.platform)}`}>
                  <img
                    src={getPlatformIcon(selectedPost.platform)}
                    alt={selectedPost.platform}
                    className="h-5 w-5 brightness-0 invert"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-lg">Comments</SheetTitle>
                <SheetDescription className="line-clamp-1">
                  {selectedPost?.title || selectedPost?.content?.slice(0, 50) || "Post"}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          {/* Post Preview */}
          {selectedPost && (
            <div className="px-6 py-4 bg-gray-50 border-b">
              <div className="flex gap-3">
                {selectedPost.mediaUrl && (
                  <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
                    <img
                      src={selectedPost.mediaUrl}
                      alt="Post"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 line-clamp-3">
                    {selectedPost.content || "No caption"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(selectedPost.publishedAt)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Comments List */}
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-4">
              {isLoadingComments ? (
                <div className="flex items-center justify-center py-10">
                  <Spinner />
                </div>
              ) : comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <MessageCircle className="h-12 w-12 text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium">No comments yet</p>
                  <p className="text-gray-400 text-sm">Be the first to comment!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="space-y-3">
                    {/* Main Comment */}
                    <div className="flex gap-3 group">
                      <Avatar className="h-9 w-9 flex-shrink-0">
                        <AvatarImage src={comment.author.avatar || ""} />
                        <AvatarFallback className="bg-indigo-100 text-indigo-700 text-sm font-medium">
                          {comment.author.name?.charAt(0)?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 border border-gray-100 shadow-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm text-gray-900">
                              {comment.author.name}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatDate(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {comment.message}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 px-2">
                          {comment.likeCount > 0 && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Heart className="h-3 w-3" />
                              {comment.likeCount}
                            </span>
                          )}
                          <button
                            onClick={() =>
                              setReplyingTo({ id: comment.id, name: comment.author.name })
                            }
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                          >
                            <Reply className="h-3 w-3" />
                            Reply
                          </button>
                          {comment.hasReplies && (
                            <button
                              onClick={() => toggleReplies(comment.id)}
                              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                            >
                              {expandedComments.has(comment.id) ? (
                                <>
                                  <ChevronUp className="h-3 w-3" />
                                  Hide replies
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-3 w-3" />
                                  {comment.replyCount} replies
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Replies */}
                    {expandedComments.has(comment.id) && comment.replies && (
                      <div className="ml-12 space-y-3 pl-4 border-l-2 border-indigo-100">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="flex gap-3">
                            <Avatar className="h-7 w-7 flex-shrink-0">
                              <AvatarImage src={reply.author.avatar || ""} />
                              <AvatarFallback className="bg-purple-100 text-purple-700 text-xs font-medium">
                                {reply.author.name?.charAt(0)?.toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="bg-gray-50 rounded-2xl rounded-tl-md px-3 py-2 border border-gray-100">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="font-semibold text-xs text-gray-900">
                                    {reply.author.name}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {formatDate(reply.createdAt)}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-700 whitespace-pre-wrap">
                                  {reply.message}
                                </p>
                              </div>
                              {reply.likeCount > 0 && (
                                <span className="text-xs text-gray-500 flex items-center gap-1 mt-1 px-2">
                                  <Heart className="h-3 w-3" />
                                  {reply.likeCount}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Comment Input */}
          <SheetFooter className="p-4 border-t bg-white">
            <div className="w-full space-y-2">
              {replyingTo && (
                <div className="flex items-center justify-between bg-indigo-50 rounded-lg px-3 py-2 text-sm">
                  <span className="text-indigo-700 flex items-center gap-2">
                    <CornerDownRight className="h-4 w-4" />
                    Replying to <strong>{replyingTo.name}</strong>
                  </span>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="text-indigo-500 hover:text-indigo-700 text-xs font-medium"
                  >
                    Cancel
                  </button>
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={replyingTo ? "Write a reply..." : "Write a comment..."}
                  className="flex-1 border-gray-200 focus:border-indigo-300 focus:ring-indigo-200"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendComment();
                    }
                  }}
                />
                <Button
                  onClick={handleSendComment}
                  disabled={!newComment.trim() || commentMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 px-4"
                >
                  {commentMutation.isPending ? (
                    <Spinner />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </main>
  );
}
