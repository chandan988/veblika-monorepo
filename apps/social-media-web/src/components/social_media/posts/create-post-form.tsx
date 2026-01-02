"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"

import { Calendar, ChevronDown, ImageIcon, Plus, X, Video, Sparkles, Film, Image } from "lucide-react"
import useGetUser from "@/lib/queries/auth/use-get-user"
import { ImageApi } from "@/utils/api"
import { toast } from "sonner"
import { Spinner } from "@/components/ui/spinner"

interface ConnectedAccounts {
  [key: string]: {
    connected: boolean
    accountName?: string
    accountId?: string
    pages?: any[]
    thumbnail?: string
    profilePicture?: string
    profile_picture?: string
  }
}

interface CreatePostFormProps {
  connectedAccounts?: ConnectedAccounts
}

const PLATFORM_INFO: Record<string, { name: string; icon: string; badge: string }> = {
  "app/instagram": { name: "Instagram", icon: "/icons/instagram.png", badge: "ig" },
  "app/facebook": { name: "Facebook", icon: "/icons/facebook.png", badge: "fb" },
  "app/linkedin": { name: "LinkedIn", icon: "/icons/linkedin.png", badge: "in" },
  "app/youtube": { name: "YouTube", icon: "/icons/youtube.png", badge: "yt" },
}

// Define which platforms support each post type
const POST_TYPE_PLATFORMS = {
  post: ["app/instagram", "app/facebook", "app/linkedin"], // Image posts - YouTube doesn't support
  video: ["app/youtube", "app/facebook", "app/linkedin"], // Long-form video
  reel: ["app/youtube", "app/instagram"], // Short-form video (YouTube Shorts, Instagram Reels)
}

const POST_TYPE_INFO = {
  post: {
    label: "Post",
    description: "Image post",
    icon: Image,
    accept: "image/*",
    platforms: ["Instagram", "Facebook", "LinkedIn"],
    fileType: "image",
  },
  video: {
    label: "Video",
    description: "Long-form video",
    icon: Video,
    accept: "video/*",
    platforms: ["YouTube", "Facebook", "LinkedIn"],
    fileType: "video",
  },
  reel: {
    label: "Reel",
    description: "Short-form video",
    icon: Film,
    accept: "video/*",
    platforms: ["YouTube Shorts", "Instagram Reels"],
    fileType: "video",
  },
}

type PostType = "post" | "video" | "reel"

export function CreatePostForm({ connectedAccounts = {} }: CreatePostFormProps) {
  const MAX = 2200
  const [postType, setPostType] = React.useState<PostType>("post")
  const [text, setText] = React.useState("")
  const [selectedAccounts, setSelectedAccounts] = React.useState<string[]>([])
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [filePreview, setFilePreview] = React.useState<string>("")
  const [isDragging, setIsDragging] = React.useState(false)
  const [isPosting, setIsPosting] = React.useState(false)
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [aiPrompt, setAiPrompt] = React.useState("")
  const [aiIncludeImage, setAiIncludeImage] = React.useState<"with" | "without">("without")
  const [showAiSection, setShowAiSection] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const remaining = Math.max(0, MAX - text.length)
  const { data: userData } = useGetUser()
  const userProfilePic = userData?.data?.profile_pic

  // Get available platforms based on post type
  const availablePlatforms = POST_TYPE_PLATFORMS[postType]

  // Get available accounts (connected and supported for current post type)
  const availableAccounts = React.useMemo(() => {
    return Object.entries(connectedAccounts)
      .filter(([key, account]) => 
        account.connected && 
        availablePlatforms.includes(key) &&
        !selectedAccounts.includes(key)
      )
      .map(([key]) => key)
  }, [connectedAccounts, selectedAccounts, availablePlatforms])

  // Get all selectable accounts (for initial selection)
  const selectableAccounts = React.useMemo(() => {
    return Object.entries(connectedAccounts)
      .filter(([key, account]) => account.connected && availablePlatforms.includes(key))
      .map(([key]) => key)
  }, [connectedAccounts, availablePlatforms])

  // Get selected accounts data
  const selectedAccountsData = React.useMemo(() => {
    return selectedAccounts
      .filter(key => availablePlatforms.includes(key)) // Only show accounts valid for current post type
      .map((key) => {
        const account = connectedAccounts[key]
        if (!account?.connected) return null
        const accountProfilePic = 
          account.profilePicture ||
          account.profile_picture ||
          account.thumbnail ||
          (account.pages && account.pages[0]?.picture) ||
          null
        return { key, ...account, accountProfilePic, platform: PLATFORM_INFO[key] }
      })
      .filter(Boolean) as Array<{
        key: string
        accountName?: string
        thumbnail?: string
        profilePicture?: string
        profile_picture?: string
        pages?: any[]
        accountProfilePic?: string | null
        platform: { name: string; icon: string; badge: string }
      }>
  }, [selectedAccounts, connectedAccounts, availablePlatforms])

  const handleAddAccount = (accountKey: string) => {
    if (!selectedAccounts.includes(accountKey) && availablePlatforms.includes(accountKey)) {
      setSelectedAccounts([...selectedAccounts, accountKey])
    }
  }

  const handleRemoveAccount = (accountKey: string) => {
    setSelectedAccounts(selectedAccounts.filter((key) => key !== accountKey))
  }

  // Handle post type change - reset selected accounts to only valid ones
  const handlePostTypeChange = (newType: PostType) => {
    setPostType(newType)
    // Clear file when changing post type
    setSelectedFile(null)
    setFilePreview("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    // Reset selected accounts to only include valid platforms for the new type
    const validPlatforms = POST_TYPE_PLATFORMS[newType]
    setSelectedAccounts(prev => prev.filter(key => validPlatforms.includes(key)))
  }

  // Auto-select first connected account if none selected (for current post type)
  React.useEffect(() => {
    if (selectedAccountsData.length === 0 && selectableAccounts.length > 0) {
      setSelectedAccounts([selectableAccounts[0]])
    }
  }, [selectableAccounts, selectedAccountsData.length])

  // Handle file selection
  const handleFileSelect = (file: File) => {
    const isImage = file.type.startsWith("image/")
    const isVideo = file.type.startsWith("video/")
    const typeInfo = POST_TYPE_INFO[postType]
    
    // Validate file type based on post type
    if (postType === "post" && !isImage) {
      toast.error("Please select an image file for image posts")
      return
    }
    
    if ((postType === "video" || postType === "reel") && !isVideo) {
      toast.error("Please select a video file")
      return
    }

    setSelectedFile(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setFilePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  // Handle click on upload area
  const handleUploadAreaClick = () => {
    fileInputRef.current?.click()
  }

  // Clear file
  const handleClearFile = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedFile(null)
    setFilePreview("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Handle AI content generation
  const handleGenerateWithAI = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Please enter a prompt for AI generation")
      return
    }

    setIsGenerating(true)

    try {
      const response = await ImageApi.post("/ai/generate-post", {
        prompt: aiPrompt,
        generateImage: aiIncludeImage === "with" && postType === "post", // Only generate image for image posts
      })

      if (response.data.status && response.data.data?.content) {
        setText(response.data.data.content)
        
        if (response.data.data.imageBase64 && postType === "post") {
          const base64Data = response.data.data.imageBase64.replace(/^data:image\/\w+;base64,/, "")
          const byteCharacters = atob(base64Data)
          const byteNumbers = new Array(byteCharacters.length)
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i)
          }
          const byteArray = new Uint8Array(byteNumbers)
          const blob = new Blob([byteArray], { type: "image/png" })
          const file = new File([blob], "ai-generated-image.png", { type: "image/png" })
          
          setSelectedFile(file)
          setFilePreview(response.data.data.imageBase64)
        }

        if (response.data.data.imageGenerationFailed) {
          toast.warning("Text generated, but image generation failed.")
        } else {
          toast.success(aiIncludeImage === "with" ? "Content and image generated!" : "Content generated!")
        }
        
        setShowAiSection(false)
        setAiPrompt("")
      } else {
        toast.error(response.data.message || "Failed to generate content")
      }
    } catch (error: any) {
      console.error("Error generating content:", error)
      toast.error(error?.response?.data?.message || "Failed to generate content")
    } finally {
      setIsGenerating(false)
    }
  }

  // Map platform keys to API platform names
  const getPlatformName = (key: string): string => {
    const platformMap: Record<string, string> = {
      "app/instagram": "INSTAGRAM",
      "app/facebook": "FACEBOOK",
      "app/linkedin": "LINKEDIN",
      "app/youtube": "YOUTUBE",
    }
    return platformMap[key] || key.toUpperCase()
  }

  // Handle posting to all selected platforms
  const handlePost = async () => {
    if (!text.trim()) {
      toast.error("Please enter some content for your post")
      return
    }

    if (selectedAccountsData.length === 0) {
      toast.error("Please select at least one platform")
      return
    }

    // Validate file requirements
    if (!selectedFile) {
      if (postType === "post") {
        toast.error("Please upload an image for your post")
        return
      }
      if (postType === "video" || postType === "reel") {
        toast.error("Please upload a video file")
        return
      }
    }

    setIsPosting(true)

    try {
      const results = {
        success: [] as string[],
        failed: [] as { platform: string; error: string }[],
      }

      // Post to each selected platform
      for (const account of selectedAccountsData) {
        const platformName = getPlatformName(account.key)
        const pageId = connectedAccounts[account.key]?.accountId || 
                       connectedAccounts[account.key]?.pages?.[0]?.pageId || 
                       connectedAccounts[account.key]?.pages?.[0]?.id || null

        try {
          const formData = new FormData()
          formData.append("platform", platformName)
          
          // Determine API post type based on post type and platform
          let apiPostType = postType
          
          if (postType === "reel") {
            // For reels: YouTube uses "short", Instagram uses "reel"
            if (platformName === "YOUTUBE") {
              apiPostType = "short" as PostType
            } else if (platformName === "INSTAGRAM") {
              apiPostType = "reel"
            }
          } else if (postType === "video") {
            // For long-form videos
            if (platformName === "YOUTUBE") {
              apiPostType = "video" as PostType
            } else if (platformName === "FACEBOOK") {
              apiPostType = "video" as PostType
            } else if (platformName === "LINKEDIN") {
              apiPostType = "video" as PostType
            }
          }
          
          formData.append("postType", apiPostType)
          formData.append("content", text)
          if (pageId) {
            formData.append("pageId", pageId)
          }

          // Add file
          if (selectedFile) {
            if (selectedFile.type.startsWith("image/")) {
              formData.append("image", selectedFile, selectedFile.name)
            } else if (selectedFile.type.startsWith("video/")) {
              formData.append("video", selectedFile, selectedFile.name)
            }
          }

          console.log(`[Post] Posting to ${account.platform.name}:`, {
            platform: platformName,
            postType: apiPostType,
            hasFile: !!selectedFile,
            fileType: selectedFile?.type,
          })

          const response = await ImageApi.post("/social-media/post", formData)

          if (response.data.success || response.data.postId) {
            results.success.push(account.platform.name)
          } else {
            results.failed.push({
              platform: account.platform.name,
              error: response.data.message || "Posting failed",
            })
          }
        } catch (error: any) {
          console.error(`Error posting to ${account.platform.name}:`, error)
          results.failed.push({
            platform: account.platform.name,
            error: error?.response?.data?.message || error.message || "Posting failed",
          })
        }
      }

      // Show results
      if (results.success.length > 0) {
        toast.success(`Successfully posted to: ${results.success.join(", ")}`)
      }

      if (results.failed.length > 0) {
        results.failed.forEach((failure) => {
          toast.error(`${failure.platform}: ${failure.error}`)
        })
      }

      // Reset form if all posts succeeded
      if (results.failed.length === 0) {
        setText("")
        setSelectedFile(null)
        setFilePreview("")
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      }
    } catch (error: any) {
      console.error("Error posting:", error)
      toast.error(error?.response?.data?.message || "Failed to post")
    } finally {
      setIsPosting(false)
    }
  }

  const typeInfo = POST_TYPE_INFO[postType]

  return (
    <Card className="rounded-xl shadow-lg border-0 bg-white">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Create Content</h2>
            <p className="text-sm text-slate-500 mt-1">Share across your social platforms</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Post Type Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-slate-700">Content Type</Label>
          <RadioGroup 
            value={postType} 
            onValueChange={(v) => handlePostTypeChange(v as PostType)} 
            className="grid grid-cols-3 gap-3"
          >
            {(Object.entries(POST_TYPE_INFO) as [PostType, typeof POST_TYPE_INFO.post][]).map(([type, info]) => {
              const Icon = info.icon
              const isSelected = postType === type
              return (
                <label
                  key={type}
                  className={cn(
                    "relative flex flex-col items-center p-4 rounded-xl border-2 cursor-pointer transition-all",
                    isSelected 
                      ? "border-primary bg-primary/5 shadow-sm" 
                      : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                  )}
                >
                  <RadioGroupItem value={type} id={`type-${type}`} className="sr-only" />
                  <Icon className={cn("h-6 w-6 mb-2", isSelected ? "text-primary" : "text-slate-500")} />
                  <span className={cn("font-medium text-sm", isSelected ? "text-primary" : "text-slate-700")}>
                    {info.label}
                  </span>
                  <span className="text-xs text-slate-500 mt-0.5">{info.description}</span>
                </label>
              )
            })}
          </RadioGroup>

          {/* Supported Platforms for selected type */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-500">Supported:</span>
            {typeInfo.platforms.map((platform) => (
              <Badge key={platform} variant="secondary" className="text-xs">
                {platform}
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        {/* Selected Accounts */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-slate-700">Post To</Label>
          <div className="flex items-center gap-2 flex-wrap">
            {selectedAccountsData.map((account) => (
              <TooltipProvider key={account.key}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative group">
                      <Avatar className="h-12 w-12 border-2 border-white shadow-md cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                        <AvatarImage 
                          alt={`${account.platform.name} avatar`} 
                          src={account.accountProfilePic || userProfilePic || "/diverse-profile-avatars.png"} 
                        />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {account.accountName?.charAt(0).toUpperCase() || account.platform.badge.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-white border-2 border-white flex items-center justify-center shadow-sm">
                        <img 
                          src={account.platform.icon} 
                          alt={account.platform.name} 
                          className="h-3.5 w-3.5"
                        />
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveAccount(account.key)
                        }}
                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                        aria-label={`Remove ${account.platform.name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">{account.platform.name}</p>
                    {account.accountName && <p className="text-xs opacity-75">{account.accountName}</p>}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
            
            {/* Add account button */}
            {availableAccounts.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative">
                    <Avatar className="h-12 w-12 border-2 border-dashed border-slate-300 hover:border-primary cursor-pointer transition-colors bg-slate-50">
                      <AvatarFallback className="text-slate-400">
                        <Plus className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <div className="px-2 py-1.5 text-xs text-slate-500 font-medium">
                    Add Platform
                  </div>
                  {availableAccounts.map((accountKey) => {
                    const account = connectedAccounts[accountKey]
                    const platform = PLATFORM_INFO[accountKey]
                    if (!account?.connected || !platform) return null
                    return (
                      <DropdownMenuItem
                        key={accountKey}
                        onClick={() => handleAddAccount(accountKey)}
                        className="flex items-center gap-3 py-2"
                      >
                        <img src={platform.icon} alt={platform.name} className="w-5 h-5" />
                        <span className="font-medium">{platform.name}</span>
                        {account.accountName && (
                          <span className="text-xs text-slate-500 ml-auto truncate max-w-[100px]">
                            {account.accountName}
                          </span>
                        )}
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {selectedAccountsData.length === 0 && availableAccounts.length === 0 && (
              <div className="text-sm text-slate-500 py-2">
                No connected accounts support this content type.
                <br />
                <span className="text-xs">Connect more accounts in Integrations.</span>
              </div>
            )}
          </div>
        </div>

        {/* Content Editor */}
        <div className="space-y-3">
          <div className="relative rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                postType === "post" 
                  ? "What would you like to share?" 
                  : postType === "video"
                  ? "Add a description for your video..."
                  : "Add a caption for your reel..."
              }
              className="min-h-36 resize-none border-0 bg-transparent focus-visible:ring-0 text-slate-800 placeholder:text-slate-400"
            />
            
            {/* Character count */}
            <div className="absolute bottom-3 right-3">
              <span className={cn(
                "text-xs px-2 py-1 rounded-full",
                remaining < 100 ? "bg-orange-100 text-orange-700" : "bg-slate-200 text-slate-600"
              )}>
                {remaining}
              </span>
            </div>
          </div>

          {/* File upload area */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">
              {postType === "post" ? "Image" : "Video"} 
              <span className="text-red-500 ml-1">*</span>
            </Label>
            
            {!filePreview ? (
              <div
                onClick={handleUploadAreaClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 cursor-pointer transition-all",
                  isDragging 
                    ? "border-primary bg-primary/5" 
                    : "border-slate-300 hover:border-primary hover:bg-slate-50 bg-slate-50/50"
                )}
              >
                {postType === "post" ? (
                  <ImageIcon className="h-10 w-10 text-slate-400 mb-3" />
                ) : (
                  <Video className="h-10 w-10 text-slate-400 mb-3" />
                )}
                <p className="text-sm text-slate-600 text-center">
                  <span className="font-medium text-primary">Click to upload</span>
                  {" "}or drag and drop
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {postType === "post" ? "PNG, JPG, GIF up to 10MB" : "MP4, MOV up to 100MB"}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={typeInfo.accept}
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="relative group rounded-xl overflow-hidden border border-slate-200">
                {selectedFile?.type.startsWith("image/") ? (
                  <img
                    src={filePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover"
                  />
                ) : selectedFile?.type.startsWith("video/") ? (
                  <video
                    src={filePreview}
                    className="w-full h-48 object-cover"
                    controls
                  />
                ) : null}
                <button
                  onClick={handleClearFile}
                  className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                  aria-label="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="absolute bottom-3 left-3 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  {selectedFile?.name}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Generation Section - Only for image posts */}
        {postType === "post" && (
          <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-violet-50 to-purple-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-violet-500 to-purple-500 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-800">Generate with AI</span>
                  <p className="text-xs text-slate-500">Create content and images automatically</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAiSection(!showAiSection)}
                className="h-8"
              >
                {showAiSection ? "Hide" : "Show"}
              </Button>
            </div>

            {showAiSection && (
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label className="text-xs text-slate-600">What would you like to post about?</Label>
                  <Input
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="E.g., A beautiful sunset at the beach..."
                    className="bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-slate-600">Include AI-generated image?</Label>
                  <RadioGroup
                    value={aiIncludeImage}
                    onValueChange={(value) => setAiIncludeImage(value as "with" | "without")}
                    className="flex gap-4"
                  >
                    <label className="flex items-center gap-2 cursor-pointer">
                      <RadioGroupItem value="without" id="ai-without" />
                      <span className="text-sm">Text only</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <RadioGroupItem value="with" id="ai-with" />
                      <span className="text-sm">With AI image</span>
                    </label>
                  </RadioGroup>
                </div>

                <Button
                  onClick={handleGenerateWithAI}
                  disabled={isGenerating || !aiPrompt.trim()}
                  className="w-full bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
                >
                  {isGenerating ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Content
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-4 border-t">
        {/* Schedule */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto gap-2">
              <Calendar className="h-4 w-4" />
              When to Post
              <ChevronDown className="h-4 w-4 ml-1 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-52">
            <DropdownMenuItem>Post Now</DropdownMenuItem>
            <DropdownMenuItem>Schedule for Later</DropdownMenuItem>
            <DropdownMenuItem>Best Time Today</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Actions */}
        <div className="flex w-full sm:w-auto gap-2">
          <Button variant="outline" className="flex-1 sm:flex-none">
            Save Draft
          </Button>
          <Button 
            onClick={handlePost}
            disabled={isPosting || selectedAccountsData.length === 0 || !text.trim() || !selectedFile}
            className="flex-1 sm:flex-none bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
          >
            {isPosting ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Posting...
              </>
            ) : (
              `Post to ${selectedAccountsData.length} Platform${selectedAccountsData.length !== 1 ? 's' : ''}`
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
