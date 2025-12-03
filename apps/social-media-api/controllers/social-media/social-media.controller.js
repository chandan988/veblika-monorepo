import AppCredentials from "../../models/appcredentials.model.js";
import Post from "../../models/post.model.js";
import { postToFacebook } from "../facebook/facebook.controller.js";
import { uploadInstagramMedia } from "../instagram/instagram.controller.js";
import { postToLinkedIn } from "../linkedin/linkedin.controller.js";
import { uploadYouTubeVideo } from "../youtube/youtube.controller.js";
import { uploadBase64Image } from "./upload-image.controller.js";
import { uploadMulterFileToS3 } from "../../utils/s3-upload.js";
import axios from "axios";
import FormData from "form-data";

// Helper function to extract hashtags from text
function extractHashtags(text) {
  if (!text) return [];
  const hashtagRegex = /#[\w]+/g;
  const matches = text.match(hashtagRegex);
  return matches ? matches.map(tag => tag.substring(1)) : [];
}

// Get all connected platforms
export const getConnectedPlatforms = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = String(req.user._id);

    const platforms = await AppCredentials.find({
      userId,
      platform: { $in: ["FACEBOOK", "INSTAGRAM", "LINKEDIN", "YOUTUBE"] },
    }).lean();

    const connectedPlatforms = platforms.map((p) => ({
      platform: p.platform,
      connected: true,
      pages: p.credentials.pages || [],
      channel: p.credentials.channel || null,
    }));

    return res.json({
      platforms: connectedPlatforms,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Failed to fetch platforms" });
  }
};

// Post to multiple platforms at once
export const postToAllPlatforms = async (req, res) => {
  try {
    const { platforms, content, imageUrl, videoFile } = req.body;
    if (!req.user?._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = String(req.user._id);

    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return res.status(400).json({ message: "No platforms selected" });
    }

    const results = {
      success: [],
      failed: [],
    };

    // Convert base64 image to public URL if needed
    let processedImageUrl = imageUrl;
    if (imageUrl && imageUrl.startsWith("data:image")) {
      try {
        processedImageUrl = await uploadBase64Image(imageUrl);
        console.log("[postToAllPlatforms] Converted base64 to URL:", processedImageUrl);
      } catch (err) {
        console.error("[postToAllPlatforms] Failed to process image:", err);
        // Continue without image
        processedImageUrl = null;
      }
    }

    // Post to each platform
    for (const platformConfig of platforms) {
      const { platform, pageId, ...platformSpecific } = platformConfig;

      try {
        let result;

        switch (platform.toUpperCase()) {
          case "FACEBOOK":
            result = await postToFacebookPlatform(
              userId,
              pageId,
              content,
              processedImageUrl
            );
            results.success.push({ platform: "FACEBOOK", result });
            break;

          case "INSTAGRAM":
            if (processedImageUrl) {
              result = await postToInstagramPlatform(
                userId,
                pageId,
                content,
                processedImageUrl
              );
              results.success.push({ platform: "INSTAGRAM", result });
            } else {
              results.failed.push({
                platform: "INSTAGRAM",
                error: "Instagram requires an image",
              });
            }
            break;

          case "LINKEDIN":
            result = await postToLinkedInPlatform(
              userId,
              pageId,
              content,
              processedImageUrl
            );
            results.success.push({ platform: "LINKEDIN", result });
            break;

          case "YOUTUBE":
            if (videoFile) {
              result = await postToYouTubePlatform(
                userId,
                content,
                videoFile,
                platformSpecific
              );
              results.success.push({ platform: "YOUTUBE", result });
            } else {
              results.failed.push({
                platform: "YOUTUBE",
                error: "YouTube requires a video file",
              });
            }
            break;

          default:
            results.failed.push({
              platform,
              error: "Unsupported platform",
            });
        }
      } catch (err) {
        console.log(`Error posting to ${platform}:`, err);
        const errorMessage = err.response?.data?.error?.message || err.message || "Posting failed";
        results.failed.push({
          platform,
          error: errorMessage,
        });
      }
    }

    return res.json({
      message: "Posting completed",
      results,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Failed to post", error: err.message });
  }
};

// Helper functions for each platform
async function postToFacebookPlatform(userId, pageId, message, imageUrl) {
  const appCredential = await AppCredentials.findOne({
    userId,
    platform: "FACEBOOK",
  });

  if (!appCredential) {
    throw new Error("Facebook not connected");
  }

  const page = appCredential.credentials.pages.find(
    (p) => p.pageId === pageId
  );

  if (!page) {
    throw new Error("Page not found");
  }

  const pageToken = page.page_access_token;

  // If image is provided, use photos endpoint, otherwise use feed
  if (imageUrl) {
    // Upload photo first
    const photoRes = await axios.post(
      `https://graph.facebook.com/v20.0/${pageId}/photos`,
      null,
      {
        params: {
          url: imageUrl,
          caption: message,
          access_token: pageToken,
        },
      }
    );

    return { postId: photoRes.data.id, post_id: photoRes.data.post_id };
  } else {
    // Text-only post
    const postRes = await axios.post(
      `https://graph.facebook.com/v20.0/${pageId}/feed`,
      null,
      {
        params: {
          message,
          access_token: pageToken,
        },
      }
    );

    return { postId: postRes.data.id };
  }
}

async function postToInstagramPlatform(userId, pageId, caption, imageUrl) {
  const appCredential = await AppCredentials.findOne({
    userId,
    platform: "INSTAGRAM",
  });

  if (!appCredential) {
    throw new Error("Instagram not connected");
  }

  if (!imageUrl) {
    throw new Error("Instagram requires an image");
  }

  // Check for new Instagram Business Login structure
  let igAccountId, instagramToken;
  
  if (appCredential.credentials.instagram_account_id && appCredential.credentials.instagram_user_access_token) {
    // New structure: Instagram Business Login
    igAccountId = appCredential.credentials.instagram_account_id;
    // Use Instagram User access token for posting (Instagram Business Login)
    instagramToken = appCredential.credentials.instagram_user_access_token;
  } else {
    // Fallback: Old structure with pages
    const page = appCredential.credentials.pages?.find(
      (p) => p.pageId === pageId || !pageId
    );

    if (!page || !page.instagram_account_id) {
      throw new Error("Instagram account not found");
    }

    igAccountId = page.instagram_account_id;
    instagramToken = page.page_access_token;
  }

  try {
    // Instagram Business Login uses graph.instagram.com endpoints
    console.log("[postToInstagramPlatform] Creating media container with Instagram Graph API");
    const containerRes = await axios.post(
      `https://graph.instagram.com/v24.0/${igAccountId}/media`,
      null,
      {
        params: {
          image_url: imageUrl,
          caption: caption || "",
          access_token: instagramToken,
        },
      }
    );

    if (!containerRes.data || !containerRes.data.id) {
      throw new Error(`Failed to create media container: ${JSON.stringify(containerRes.data)}`);
    }

    const containerId = containerRes.data.id;

    // Publish the media using Instagram Graph API
    console.log("[postToInstagramPlatform] Publishing media with Instagram Graph API");
    const publishRes = await axios.post(
      `https://graph.instagram.com/v24.0/${igAccountId}/media_publish`,
      null,
      {
        params: {
          creation_id: containerId,
          access_token: instagramToken,
        },
      }
    );

    return { postId: publishRes.data.id };
  } catch (err) {
    const errorMessage = err.response?.data?.error?.message || err.message || "Instagram post failed";
    console.error("[postToInstagramPlatform] Error:", errorMessage, err.response?.data);
    throw new Error(errorMessage);
  }
}

async function postToLinkedInPlatform(userId, pageId, text, imageUrl) {
  const appCredential = await AppCredentials.findOne({
    userId,
    platform: "LINKEDIN",
  });

  if (!appCredential) {
    throw new Error("LinkedIn not connected");
  }

  const accessToken = appCredential.credentials.user_access_token;
  
  if (!accessToken) {
    throw new Error("LinkedIn access token not found");
  }

  // Use provided pageId or default to user's LinkedIn ID
  const linkedInUserId = pageId || appCredential.credentials.user_id;
  
  if (!linkedInUserId) {
    throw new Error("LinkedIn user ID not found. Please reconnect your LinkedIn account.");
  }

  console.log("[postToLinkedInPlatform] Posting to LinkedIn:", {
    userId,
    linkedInUserId: linkedInUserId,
    hasImage: !!imageUrl,
    textLength: text?.length || 0,
  });

  const postData = {
    author: `urn:li:person:${linkedInUserId}`,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: {
          text: text || "",
        },
        shareMediaCategory: imageUrl ? "IMAGE" : "NONE",
      },
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC", // Options: PUBLIC, CONNECTIONS, LOGGED_IN
    },
  };

  if (imageUrl) {
    try {
      console.log("[postToLinkedInPlatform] Uploading image to LinkedIn...");
      // Upload image to LinkedIn
      const imageUploadRes = await axios.post(
        "https://api.linkedin.com/v2/assets?action=registerUpload",
        {
          registerUploadRequest: {
            recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
            owner: `urn:li:person:${linkedInUserId}`,
            serviceRelationships: [
              {
                relationshipType: "OWNER",
                identifier: "urn:li:userGeneratedContent",
              },
            ],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const uploadUrl = imageUploadRes.data.value.uploadMechanism[
        "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
      ].uploadUrl;
      const asset = imageUploadRes.data.value.asset;

      console.log("[postToLinkedInPlatform] Fetching image from URL...");
      const imageRes = await axios.get(imageUrl, {
        responseType: "arraybuffer",
      });
      
      console.log("[postToLinkedInPlatform] Uploading image to LinkedIn storage...");
      await axios.put(uploadUrl, imageRes.data, {
        headers: {
          "Content-Type": "image/jpeg",
        },
      });

      postData.specificContent["com.linkedin.ugc.ShareContent"].media = [
        {
          status: "READY",
          description: {
            text: text || "",
          },
          media: asset,
          title: {
            text: "Shared Image",
          },
        },
      ];
      console.log("[postToLinkedInPlatform] Image uploaded successfully");
    } catch (imageError) {
      console.error("[postToLinkedInPlatform] Image upload failed:", imageError.response?.data || imageError.message);
      throw new Error(`Failed to upload image to LinkedIn: ${imageError.response?.data?.message || imageError.message}`);
    }
  }

  try {
    console.log("[postToLinkedInPlatform] Publishing post to LinkedIn...");
    const postRes = await axios.post(
      "https://api.linkedin.com/v2/ugcPosts",
      postData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
        },
      }
    );

    console.log("[postToLinkedInPlatform] ✅ Post published successfully:", postRes.data.id);
    return { postId: postRes.data.id };
  } catch (postError) {
    console.error("[postToLinkedInPlatform] ❌ Post failed:", postError.response?.data || postError.message);
    const errorMessage = postError.response?.data?.message || postError.message || "LinkedIn post failed";
    throw new Error(`LinkedIn post failed: ${errorMessage}`);
  }
}

async function postToYouTubePlatform(userId, content, videoFile, options = {}) {
  const appCredential = await AppCredentials.findOne({
    userId,
    platform: "YOUTUBE",
  });

  if (!appCredential) {
    throw new Error("YouTube not connected");
  }

  // This would need to be handled differently as YouTube requires file upload
  // For now, we'll return an error suggesting to use the dedicated YouTube endpoint
  throw new Error(
    "YouTube video upload requires file upload. Please use the dedicated YouTube upload endpoint."
  );
}

// Post to single platform with file upload support
export const postToSinglePlatform = async (req, res) => {
  try {
    const { platform, postType, content, pageId } = req.body;
    if (!req.user?._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = String(req.user._id);

    if (!platform) {
      return res.status(400).json({ message: "Platform is required" });
    }

    if (!postType) {
      return res.status(400).json({ message: "Post type is required" });
    }

    if (!content) {
      return res.status(400).json({ message: "Content is required" });
    }

    // Get uploaded files
    const imageFile = req.files?.image?.[0];
    const videoFile = req.files?.video?.[0];

    let result;

    switch (platform.toUpperCase()) {
      case "FACEBOOK":
        if (postType === "video" && videoFile) {
          result = await postToFacebookVideo(userId, pageId, content, videoFile);
        } else if (postType === "post") {
          if (imageFile) {
            result = await postToFacebookImage(userId, pageId, content, imageFile);
          } else {
            result = await postToFacebookPlatform(userId, pageId, content, null);
          }
        } else {
          return res.status(400).json({ message: "Invalid post type for Facebook" });
        }
        break;

      case "INSTAGRAM":
        if (postType === "reel" && videoFile) {
          result = await postToInstagramReel(userId, pageId, content, videoFile);
        } else if (postType === "post" && imageFile) {
          result = await postToInstagramImage(userId, pageId, content, imageFile);
        } else {
          return res.status(400).json({ message: "Instagram requires media (image for post, video for reel)" });
        }
        break;

      case "YOUTUBE":
        if (postType === "video" && videoFile) {
          result = await uploadYouTubeVideoFile(userId, content, videoFile);
        } else {
          return res.status(400).json({ message: "YouTube requires a video file" });
        }
        break;

      case "LINKEDIN":
        if (postType === "post") {
          // Upload image to S3 if provided
          let imageUrl = null;
          if (imageFile) {
            imageUrl = await uploadMulterFileToS3(imageFile, "images");
            console.log("[PostToSinglePlatform] LinkedIn image uploaded to S3:", imageUrl);
          }
          result = await postToLinkedInPlatform(userId, pageId, content, imageUrl);
        } else {
          return res.status(400).json({ message: "LinkedIn currently supports 'post' type only" });
        }
        break;

      default:
        return res.status(400).json({ message: "Unsupported platform" });
    }

    // Save post to database for analytics tracking
    try {
      console.log("[PostToSinglePlatform] Saving post to database...");
      
      // Get account info for the platform
      const appCredential = await AppCredentials.findOne({
        userId,
        platform: platform.toUpperCase(),
      });

      const hashtags = extractHashtags(content);
      
      // Build post object based on platform
      let postData;

      if (platform.toUpperCase() === "YOUTUBE") {
        // YouTube-specific post data (all required fields from uploadYouTubeVideoFile)
        if (!result.videoId || !result.channelId || !result.title || !result.description) {
          throw new Error("Missing required YouTube fields in result. Expected: videoId, channelId, title, description");
        }

        postData = {
          userId,
          platform: "YOUTUBE",
          postId: result.videoId, // Use videoId as postId
          videoId: result.videoId,
          channelId: result.channelId,
          title: result.title,
          description: result.description,
          thumbnailUrl: result.thumbnailUrl || "",
          videoUrl: result.videoUrl || `https://www.youtube.com/watch?v=${result.videoId}`,
          postType: postType.toLowerCase() === "video" ? "upload" : postType.toLowerCase(), // Map "video" to "upload"
          publishedAt: new Date(),
          createdBy: req.user._id,
          hashtags,
          analyticsStatus: "pending",
        };

        console.log("[PostToSinglePlatform] Built YouTube post data with all required fields");
      } else {
        // Other platforms (Facebook, Instagram, LinkedIn)
        const postId = result.postId || result.id || `temp_${Date.now()}`;
        
        if (!postId) {
          throw new Error("Failed to extract post ID from platform response");
        }

        // Upload files to S3 and get public URLs
        let mediaUrl = null;
        if (imageFile) {
          mediaUrl = await uploadMulterFileToS3(imageFile, "images");
          console.log("[PostToSinglePlatform] Image uploaded to S3:", mediaUrl);
        } else if (videoFile) {
          mediaUrl = await uploadMulterFileToS3(videoFile, "videos");
          console.log("[PostToSinglePlatform] Video uploaded to S3:", mediaUrl);
        }

        const accountId = appCredential?.credentials?.instagram_account_id 
          || appCredential?.credentials?.user_id // LinkedIn user ID
          || appCredential?.credentials?.pages?.[0]?.pageId 
          || appCredential?.credentials?.channel?.id
          || null;

        // For Instagram, accountId and pageId are the same, so we only store accountId
        // For Facebook, we need both pageId and accountId
        const isInstagram = platform.toUpperCase() === "INSTAGRAM";
        
        postData = {
          userId,
          platform: platform.toUpperCase(),
          postId: String(postId),
          postType: postType.toLowerCase(),
          content,
          caption: content,
          mediaUrl,
          // Only set pageId for non-Instagram platforms (Facebook, LinkedIn)
          pageId: isInstagram ? null : (pageId || null),
          accountId,
          publishedAt: new Date(),
          createdBy: req.user._id,
          hashtags,
          analyticsStatus: "pending",
        };
      }

      // Save post to database
      const savedPost = await Post.create(postData);

      console.log("[PostToSinglePlatform] ✅ Post saved to database for analytics:", {
        _id: savedPost._id,
        postId: savedPost.postId,
        platform: savedPost.platform,
        videoId: savedPost.videoId || "N/A",
        channelId: savedPost.channelId || "N/A",
      });
    } catch (saveError) {
      console.error("[PostToSinglePlatform] ❌ Failed to save post to database:", saveError);
      console.error("[PostToSinglePlatform] Error details:", {
        message: saveError.message,
        stack: saveError.stack,
        result: result,
        platform: platform.toUpperCase(),
      });
      // Don't fail the request if saving to DB fails, but log the error
    }

    return res.json({
      success: true,
      message: "Post published successfully",
      result,
    });
  } catch (err) {
    console.error("Error posting:", err);
    const errorMessage = err.response?.data?.error?.message || err.message || "Posting failed";
    return res.status(500).json({
      success: false,
      message: errorMessage,
      error: err.response?.data || err.message,
    });
  }
};

// Helper function to post Facebook video
async function postToFacebookVideo(userId, pageId, message, videoFile) {
  const appCredential = await AppCredentials.findOne({
    userId,
    platform: "FACEBOOK",
  });

  if (!appCredential) {
    throw new Error("Facebook not connected");
  }

  const page = appCredential.credentials.pages.find(
    (p) => p.pageId === pageId
  );

  if (!page) {
    throw new Error("Page not found");
  }

  const pageToken = page.page_access_token;

  // Upload video file directly to Facebook using buffer (memory storage)
  const form = new FormData();
  form.append("file", videoFile.buffer, {
    filename: videoFile.originalname,
    contentType: videoFile.mimetype,
  });
  form.append("description", message || "");
  form.append("access_token", pageToken);

  const videoRes = await axios.post(
    `https://graph-video.facebook.com/v20.0/${pageId}/videos`,
    form,
    {
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    }
  );

  return { postId: videoRes.data.id };
}

// Helper function to post Facebook image
async function postToFacebookImage(userId, pageId, message, imageFile) {
  const appCredential = await AppCredentials.findOne({
    userId,
    platform: "FACEBOOK",
  });

  if (!appCredential) {
    throw new Error("Facebook not connected");
  }

  const page = appCredential.credentials.pages.find(
    (p) => p.pageId === pageId
  );

  if (!page) {
    throw new Error("Page not found");
  }

  const pageToken = page.page_access_token;

  // Upload image file directly to Facebook using buffer (memory storage)
  const form = new FormData();
  form.append("file", imageFile.buffer, {
    filename: imageFile.originalname,
    contentType: imageFile.mimetype,
  });
  form.append("message", message || "");
  form.append("access_token", pageToken);

  const photoRes = await axios.post(
    `https://graph.facebook.com/v20.0/${pageId}/photos`,
    form,
    {
      headers: form.getHeaders(),
    }
  );

  return { postId: photoRes.data.id, post_id: photoRes.data.post_id };
}

// Helper function to post Instagram Reel
async function postToInstagramReel(userId, pageId, caption, videoFile) {
  const appCredential = await AppCredentials.findOne({
    userId,
    platform: "INSTAGRAM",
  });

  if (!appCredential) {
    throw new Error("Instagram not connected");
  }

  // Check for new Instagram Business Login structure
  let igAccountId, instagramToken;
  
  if (appCredential.credentials.instagram_account_id && appCredential.credentials.instagram_user_access_token) {
    // New structure: Instagram Business Login
    igAccountId = appCredential.credentials.instagram_account_id;
    // Use Instagram User access token for posting (Instagram Business Login)
    instagramToken = appCredential.credentials.instagram_user_access_token;
  } else {
    // Fallback: Old structure with pages
    const page = appCredential.credentials.pages?.find(
      (p) => p.pageId === pageId || !pageId
    );

    if (!page || !page.instagram_account_id) {
      throw new Error("Instagram account not found");
    }

    igAccountId = page.instagram_account_id;
    instagramToken = page.page_access_token;
  }

  try {
    // Upload video to S3 first - Instagram requires publicly accessible HTTPS URL
    console.log("[postToInstagramReel] Uploading video to S3...");
    const videoUrl = await uploadMulterFileToS3(videoFile, "videos");
    console.log("[postToInstagramReel] Video uploaded to S3:", videoUrl);
    console.log("[postToInstagramReel] Video file size:", videoFile.size);

    // Verify the video URL is accessible (optional check)
    try {
      const headRes = await axios.head(videoUrl, { timeout: 5000, validateStatus: () => true });
      console.log("[postToInstagramReel] Video URL accessibility check:", headRes.status);
      if (headRes.status !== 200) {
        console.warn("[postToInstagramReel] Warning: Video URL may not be accessible. Status:", headRes.status);
      }
    } catch (urlCheckErr) {
      console.warn("[postToInstagramReel] Could not verify video URL accessibility:", urlCheckErr.message);
    }

    // Create reel container - Instagram Reels API uses Instagram Graph API
    // Note: For Reels, we need to use 'REELS' media_type and the video must be publicly accessible
    console.log("[postToInstagramReel] Creating reel container with Instagram Graph API");
    const containerRes = await axios.post(
      `https://graph.instagram.com/v24.0/${igAccountId}/media`,
      null,
      {
        params: {
          media_type: "REELS",
          video_url: videoUrl,
          caption: caption || "",
          access_token: instagramToken,
        },
      }
    ).catch(err => {
      console.error("[postToInstagramReel] Container creation error:", err.response?.data || err.message);
      throw err;
    });

    console.log("[postToInstagramReel] Container response:", containerRes.data);

    if (!containerRes.data || !containerRes.data.id) {
      const errorMsg = containerRes.data?.error?.message || JSON.stringify(containerRes.data);
      throw new Error(`Failed to create reel container: ${errorMsg}`);
    }

    const containerId = containerRes.data.id;

    // Wait for the container to be ready (Instagram requires processing time)
    let status = "IN_PROGRESS";
    let attempts = 0;
    const maxAttempts = 30; // Wait up to 5 minutes
    let statusDetails = null;

    while (status === "IN_PROGRESS" && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      
      try {
        // Use Instagram Graph API for status check
        const statusRes = await axios.get(
          `https://graph.instagram.com/v24.0/${containerId}`,
          {
            params: {
              fields: "status_code,status",
              access_token: instagramToken,
            },
          }
        );

        status = statusRes.data.status_code;
        statusDetails = statusRes.data;
        attempts++;
        console.log(`[postToInstagramReel] Status check ${attempts}: ${status}`, JSON.stringify(statusRes.data, null, 2));

        // If status is ERROR, break immediately
        if (status === "ERROR") {
          // Get more error details using Instagram Graph API
          const errorRes = await axios.get(
            `https://graph.instagram.com/v24.0/${containerId}`,
            {
              params: {
                fields: "status_code,status",
                access_token: instagramToken,
              },
            }
          );
          statusDetails = errorRes.data;
          break;
        }
      } catch (statusErr) {
        console.error("[postToInstagramReel] Status check error:", statusErr.response?.data || statusErr.message);
        throw new Error(`Failed to check container status: ${statusErr.response?.data?.error?.message || statusErr.message}`);
      }
    }

    if (status !== "FINISHED") {
      const errorMessage = statusDetails?.error?.message || statusDetails?.status || `Status: ${status}`;
      console.error("[postToInstagramReel] Container error details:", JSON.stringify(statusDetails, null, 2));
      throw new Error(`Reel container failed. ${errorMessage}`);
    }

    // Publish the reel using Instagram Graph API
    console.log("[postToInstagramReel] Publishing reel with Instagram Graph API");
    const publishRes = await axios.post(
      `https://graph.instagram.com/v24.0/${igAccountId}/media_publish`,
      null,
      {
        params: {
          creation_id: containerId,
          access_token: instagramToken,
        },
      }
    );

    console.log("[postToInstagramReel] Publish response:", publishRes.data);

    // No cleanup needed - file is in S3 now
    return { postId: publishRes.data.id };
  } catch (err) {
    const errorMessage = err.response?.data?.error?.message || err.message || "Instagram reel post failed";
    console.error("[postToInstagramReel] Error:", errorMessage, err.response?.data);
    throw new Error(errorMessage);
  }
}

// Helper function to post Instagram image
async function postToInstagramImage(userId, pageId, caption, imageFile) {
  const appCredential = await AppCredentials.findOne({
    userId,
    platform: "INSTAGRAM",
  });

  if (!appCredential) {
    throw new Error("Instagram not connected");
  }

  // Check for new Instagram Business Login structure
  let igAccountId, instagramToken;
  
  if (appCredential.credentials.instagram_account_id && appCredential.credentials.instagram_user_access_token) {
    // New structure: Instagram Business Login
    igAccountId = appCredential.credentials.instagram_account_id;
    // Use Instagram User access token for posting (Instagram Business Login)
    instagramToken = appCredential.credentials.instagram_user_access_token;
  } else {
    // Fallback: Old structure with pages
    const page = appCredential.credentials.pages?.find(
      (p) => p.pageId === pageId || !pageId
    );

    if (!page || !page.instagram_account_id) {
      throw new Error("Instagram account not found");
    }

    igAccountId = page.instagram_account_id;
    instagramToken = page.page_access_token;
  }

  try {
    // Upload image to S3 first - Instagram requires publicly accessible HTTPS URL
    console.log("[postToInstagramImage] Uploading image to S3...");
    const imageUrl = await uploadMulterFileToS3(imageFile, "images");
    console.log("[postToInstagramImage] Image uploaded to S3:", imageUrl);
    console.log("[postToInstagramImage] Image file size:", imageFile.size);

    // Verify the image URL is accessible (optional check)
    try {
      const headRes = await axios.head(imageUrl, { 
        timeout: 5000, 
        validateStatus: () => true,
        maxRedirects: 5
      });
      console.log("[postToInstagramImage] Image URL accessibility check:", headRes.status);
      if (headRes.status !== 200) {
        console.warn("[postToInstagramImage] Warning: Image URL may not be accessible. Status:", headRes.status);
      }
    } catch (urlCheckErr) {
      console.warn("[postToInstagramImage] Could not verify image URL accessibility:", urlCheckErr.message);
      // Don't fail here, let Instagram API handle it
    }

    // Create media container using Instagram Graph API
    console.log("[postToInstagramImage] Creating media container with Instagram Graph API");
    const containerRes = await axios.post(
      `https://graph.instagram.com/v24.0/${igAccountId}/media`,
      null,
      {
        params: {
          image_url: imageUrl,
          caption: caption || "",
          access_token: instagramToken,
        },
      }
    );

    if (!containerRes.data || !containerRes.data.id) {
      throw new Error(`Failed to create media container: ${JSON.stringify(containerRes.data)}`);
    }

    const containerId = containerRes.data.id;
    console.log("[postToInstagramImage] Container created with ID:", containerId);

    // Wait for the container to be ready (Instagram requires processing time)
    let status = "IN_PROGRESS";
    let attempts = 0;
    const maxAttempts = 30; // Wait up to 5 minutes (30 * 10 seconds)
    let statusDetails = null;

    console.log("[postToInstagramImage] Waiting for container to be ready...");
    while (status === "IN_PROGRESS" && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      
      try {
        // Check container status using Instagram Graph API
        const statusRes = await axios.get(
          `https://graph.instagram.com/v24.0/${containerId}`,
          {
            params: {
              fields: "status_code,status",
              access_token: instagramToken,
            },
          }
        );

        status = statusRes.data.status_code;
        statusDetails = statusRes.data;
        attempts++;
        console.log(`[postToInstagramImage] Status check ${attempts}: ${status}`, JSON.stringify(statusRes.data, null, 2));

        // If status is ERROR, break immediately
        if (status === "ERROR") {
          // Get more error details
          const errorRes = await axios.get(
            `https://graph.instagram.com/v24.0/${containerId}`,
            {
              params: {
                fields: "status_code,status",
                access_token: instagramToken,
              },
            }
          );
          statusDetails = errorRes.data;
          break;
        }
      } catch (statusErr) {
        console.error("[postToInstagramImage] Status check error:", statusErr.response?.data || statusErr.message);
        throw new Error(`Failed to check container status: ${statusErr.response?.data?.error?.message || statusErr.message}`);
      }
    }

    if (status !== "FINISHED") {
      const errorMessage = statusDetails?.error?.message || statusDetails?.status || `Status: ${status}`;
      console.error("[postToInstagramImage] Container error details:", JSON.stringify(statusDetails, null, 2));
      throw new Error(`Media container failed. ${errorMessage}`);
    }

    console.log("[postToInstagramImage] Container is ready, publishing...");

    // Publish the media using Instagram Graph API
    console.log("[postToInstagramImage] Publishing media with Instagram Graph API");
    const publishRes = await axios.post(
      `https://graph.instagram.com/v24.0/${igAccountId}/media_publish`,
      null,
      {
        params: {
          creation_id: containerId,
          access_token: instagramToken,
        },
      }
    );

    // No cleanup needed - file is in S3 now
    return { postId: publishRes.data.id };
  } catch (err) {
    const errorMessage = err.response?.data?.error?.message || err.message || "Instagram post failed";
    console.error("[postToInstagramImage] Error:", errorMessage, err.response?.data);
    throw new Error(errorMessage);
  }
}

// Helper function to upload YouTube video and fetch all required details
async function uploadYouTubeVideoFile(userId, content, videoFile) {
  // Get valid access token
  const appCredential = await AppCredentials.findOne({
    userId,
    platform: "YOUTUBE",
  });

  if (!appCredential || !appCredential.credentials.refresh_token) {
    throw new Error("YouTube not connected or no refresh token found");
  }

  const tokens = appCredential.credentials;
  const now = Date.now();

  let accessToken = tokens.access_token;

  // Check if token is still valid (with 1 minute buffer)
  if (!tokens.expiry || now >= tokens.expiry - 60000) {
    // Refresh token
    const refreshRes = await axios.post("https://oauth2.googleapis.com/token", {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: tokens.refresh_token,
      grant_type: "refresh_token",
    });

    accessToken = refreshRes.data.access_token;
    const newExpiry = Date.now() + refreshRes.data.expires_in * 1000;

    // Update in database
    await AppCredentials.findOneAndUpdate(
      { userId, platform: "YOUTUBE" },
      {
        $set: {
          "credentials.access_token": accessToken,
          "credentials.expires_in": refreshRes.data.expires_in,
          "credentials.expiry": newExpiry,
        },
      }
    );
  }

  try {
    // Step 1: Upload video to YouTube
    console.log("[uploadYouTubeVideoFile] Step 1: Creating YouTube resumable upload session");
    const createRes = await axios.post(
      "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
      {
        snippet: {
          title: content.split("\n")[0] || "Untitled Video",
          description: content || "",
        },
        status: {
          privacyStatus: "public",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json; charset=UTF-8",
          "X-Upload-Content-Length": videoFile.size,
          "X-Upload-Content-Type": videoFile.mimetype,
        },
      }
    );

    const uploadUrl = createRes.headers.location;

    // Step 2: Upload the actual file bytes using buffer (memory storage)
    console.log("[uploadYouTubeVideoFile] Step 2: Uploading video file");
    const uploadRes = await axios.put(uploadUrl, videoFile.buffer, {
      headers: {
        "Content-Length": videoFile.size,
        "Content-Type": videoFile.mimetype,
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    // Step 3: Get videoId from upload response
    const videoId = uploadRes.data.id;
    if (!videoId) {
      throw new Error("Failed to get video ID from YouTube upload response");
    }
    console.log("[uploadYouTubeVideoFile] Step 3: Video uploaded successfully, videoId:", videoId);

    // Step 4: Fetch video details using YouTube Data API
    console.log("[uploadYouTubeVideoFile] Step 4: Fetching video details from YouTube Data API");
    const videoDetailsRes = await axios.get(
      "https://www.googleapis.com/youtube/v3/videos",
      {
        params: {
          part: "snippet,contentDetails,status",
          id: videoId,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const videoDetails = videoDetailsRes.data.items?.[0];
    if (!videoDetails) {
      throw new Error("Failed to fetch video details from YouTube");
    }

    // Step 5: Extract required fields
    const channelId = videoDetails.snippet.channelId;
    const title = videoDetails.snippet.title;
    const description = videoDetails.snippet.description || "";
    
    // Get thumbnail URL (highest quality available)
    const thumbnails = videoDetails.snippet.thumbnails;
    const thumbnailUrl = thumbnails.maxres?.url || thumbnails.high?.url || thumbnails.medium?.url || thumbnails.default?.url || "";
    
    // Build YouTube video URL
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    console.log("[uploadYouTubeVideoFile] Step 5: Extracted video details:", {
      videoId,
      channelId,
      title: title.substring(0, 50) + "...",
      hasDescription: !!description,
      hasThumbnail: !!thumbnailUrl,
    });

    // No cleanup needed - file is in memory (buffer), not on disk

    // Step 7: Return complete YouTube post data
    return {
      postId: videoId,
      videoId,
      channelId,
      title,
      description,
      thumbnailUrl,
      videoUrl,
      // Include access token for potential future use
      accessToken,
    };
  } catch (err) {
    console.error("[uploadYouTubeVideoFile] Error:", err.response?.data || err);
    throw new Error(err.response?.data?.error?.message || err.message || "YouTube upload failed");
  }
}

