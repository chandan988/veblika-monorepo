"use client";
import React, { useState } from "react";
import {
  Image as ImageIcon,
  Video,
  Info,
  X,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import api from "@/utils/api";
import { toast } from "sonner";
import useGetConnectedAccounts from "@/lib/queries/appconfig/use-get-connected-accounts";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageApi } from "@/utils/api";

export default function PostsPage() {
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");
  const [postType, setPostType] = useState<string>("");
  const [caption, setCaption] = useState("");
  const [selectedPageId, setSelectedPageId] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [videoPreview, setVideoPreview] = useState<string>("");
  const [isPosting, setIsPosting] = useState(false);
  const { data: connectedAccountsData, isLoading: isLoadingAccounts } = useGetConnectedAccounts();
  const connectedAccounts = connectedAccountsData?.data || {};

  const platforms = [
    { id: "app/instagram", name: "Instagram", icon: "/icons/instagram.png", postTypes: ["post", "reel"] },
    { id: "app/facebook", name: "Facebook", icon: "/icons/facebook.svg", postTypes: ["post", "video"] },
    { id: "app/youtube", name: "YouTube", icon: "https://upload.wikimedia.org/wikipedia/commons/4/42/YouTube_icon_%282013-2017%29.png", postTypes: ["video"] },
    { id: "app/linkedin", name: "LinkedIn", icon: "https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png", postTypes: ["post"] },
  ];

  const selectedPlatformData = platforms.find((p) => p.id === selectedPlatform);
  const account = selectedPlatform ? connectedAccounts[selectedPlatform] : null;

  // Reset post type when platform changes
  React.useEffect(() => {
    if (selectedPlatform && selectedPlatformData) {
      setPostType(selectedPlatformData.postTypes[0]);
      setImageFile(null);
      setVideoFile(null);
      setImagePreview("");
      setVideoPreview("");
    }
  }, [selectedPlatform]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePost = async () => {
    if (!selectedPlatform) {
      toast.error("Please select a platform");
      return;
    }

    if (!postType) {
      toast.error("Please select a post type");
      return;
    }

    if (!caption.trim()) {
      toast.error("Please enter a caption");
      return;
    }

    // Validate media requirements
    if (postType === "video" && !videoFile && selectedPlatform !== "app/youtube") {
      toast.error("Please upload a video file");
      return;
    }

    if (postType === "reel" && !videoFile) {
      toast.error("Please upload a video file for reel");
      return;
    }

    if (postType === "post" && !imageFile && selectedPlatform === "app/instagram") {
      toast.error("Please upload an image for Instagram post");
      return;
    }

    if (selectedPlatform === "app/youtube" && !videoFile) {
      toast.error("Please upload a video file for YouTube");
      return;
    }

    setIsPosting(true);

    try {
      const platformMap: Record<string, string> = {
        "app/instagram": "INSTAGRAM",
        "app/facebook": "FACEBOOK",
        "app/youtube": "YOUTUBE",
        "app/linkedin": "LINKEDIN",
      };

      const formData = new FormData();
      formData.append("platform", platformMap[selectedPlatform]);
      formData.append("postType", postType);
      formData.append("content", caption);
      formData.append("pageId", selectedPageId || account?.pages?.[0]?.pageId || account?.pages?.[0]?.id || account?.accountId || "default");

      if (imageFile) {
        formData.append("image", imageFile);
      }

      if (videoFile) {
        formData.append("video", videoFile);
      }

      const response = await ImageApi.post("/social-media/post", formData);

      if (response.data.success) {
        toast.success("Post published successfully!");
        // Reset form
        setCaption("");
        setImageFile(null);
        setVideoFile(null);
        setImagePreview("");
        setVideoPreview("");
        setSelectedPlatform("");
        setPostType("");
        setSelectedPageId("");
      } else {
        toast.error(response.data.message || "Failed to post");
      }
    } catch (error: any) {
      console.error("Error posting:", error);
      toast.error(error?.response?.data?.message || "Failed to post");
    } finally {
      setIsPosting(false);
    }
  };

  if (isLoadingAccounts) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="w-full bg-gray-100/80 border-b border-gray-200">
        <div className="mx-auto max-w-6xl px-4 py-6 md:py-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">
            Create Post
          </h1>
          <p className="text-gray-600 mt-1">Create and publish posts to your social media platforms</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6 md:py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Create Post Form */}
          <Card className="p-6">
            <div className="space-y-6">
              {/* Platform Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Select Platform</label>
                <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {platforms.map((platform) => {
                      const isConnected = connectedAccounts[platform.id]?.connected;
                      return (
                        <SelectItem
                          key={platform.id}
                          value={platform.id}
                          disabled={!isConnected}
                        >
                          <div className="flex items-center gap-2">
                            <img src={platform.icon} alt={platform.name} className="w-5 h-5" />
                            <span>{platform.name}</span>
                            {!isConnected && (
                              <span className="text-xs text-gray-400 ml-auto">(Not connected)</span>
                            )}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {selectedPlatform && account?.accountName && (
                  <p className="text-xs text-gray-500 mt-1">
                    Account: {account.accountName}
                  </p>
                )}
              </div>

              {/* Post Type Selection */}
              {selectedPlatform && selectedPlatformData && (
                <div>
                  <label className="block text-sm font-medium mb-2">Post Type</label>
                  <Select value={postType} onValueChange={setPostType}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose post type" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedPlatformData.postTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Page Selection (if multiple pages) */}
              {selectedPlatform && account?.pages && account.pages.length > 1 && (
                <div>
                  <label className="block text-sm font-medium mb-2">Select Page/Account</label>
                  <Select value={selectedPageId} onValueChange={setSelectedPageId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a page" />
                    </SelectTrigger>
                    <SelectContent>
                      {account.pages.map((page: any) => (
                        <SelectItem
                          key={page.pageId || page.id}
                          value={page.pageId || page.id}
                        >
                          {page.pageName || page.instagram_username || page.title || "Default"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Caption */}
              <div>
                <label className="block text-sm font-medium mb-2">Caption</label>
                <Textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="What would you like to share?"
                  className="w-full min-h-[120px]"
                />
              </div>

              {/* Media Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">Media</label>
                {postType === "video" || postType === "reel" || selectedPlatform === "app/youtube" ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer relative">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {videoPreview ? (
                      <div className="relative">
                        <video src={videoPreview} controls className="max-h-64 mx-auto rounded-lg" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setVideoFile(null);
                            setVideoPreview("");
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Video className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          Click to upload video
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {imagePreview ? (
                      <div className="relative">
                        <img src={imagePreview} alt="Preview" className="max-h-64 mx-auto rounded-lg" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setImageFile(null);
                            setImagePreview("");
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          Click to upload image
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Post Button */}
              <Button
                onClick={handlePost}
                disabled={isPosting || !selectedPlatform || !postType || !caption.trim()}
                className="w-full"
              >
                {isPosting ? (
                  <>
                    <Spinner />
                    Posting...
                  </>
                ) : (
                  "Publish Post"
                )}
              </Button>
            </div>
          </Card>

          {/* Preview */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Preview</h2>
              <Info className="w-4 h-4 text-gray-400" />
            </div>

            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-full max-w-sm bg-gray-50 rounded-lg p-12 mb-4">
                {imagePreview && (
                  <div className="mb-4">
                    <img src={imagePreview} alt="Preview" className="w-full rounded-lg" />
                  </div>
                )}
                {videoPreview && (
                  <div className="mb-4">
                    <video src={videoPreview} controls className="w-full rounded-lg" />
                  </div>
                )}
                {caption && (
                  <div className="space-y-3 mb-6">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{caption}</p>
                  </div>
                )}
                {!imagePreview && !videoPreview && !caption && (
                  <div className="w-full aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                    <p className="text-gray-400 text-sm">Preview will appear here</p>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600">
                {selectedPlatform && postType
                  ? `${selectedPlatformData?.name} ${postType} preview`
                  : "Post preview"}
              </p>
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}
