import { Router } from "express"
import { google } from "googleapis"
import isAuth from "../../middleware/authenticate"
import { config } from "../../config/index"
import { User } from "../models/previous-user-model"
import { Integration } from "../models/integration-model"

const router = Router()

const resolveOrgId = (req: any) =>
  req.user?.organizationId ||
  req.user?.orgId ||
  req.user?.organization?.id ||
  req.user?.organization?.organizationId ||
  req.user?.org?.id

router.get("/google-gmail/status", isAuth, async (req, res) => {
  console.log("[google-gmail] Status check for user", req.user?.id)
  const sessionEmail = req.user?.email?.toLowerCase()
  const user =
    (await User.findOne({ authUserId: req.user?.id })) ||
    (sessionEmail ? await User.findOne({ email: sessionEmail }) : null)
  const watchExpiration = user?.gmailWatchExpiration
  const connectedEmail = user?.gmailConnectedEmail || user?.email
  const watchActive = Boolean(
    watchExpiration && watchExpiration.getTime() > Date.now()
  )
  console.log("[google-gmail] Status result", {
    hasAccess: Boolean(user?.gmailAccessToken),
    hasRefresh: Boolean(user?.gmailRefreshToken),
    historyId: user?.gmailHistoryId,
    watchExpiration,
    connectedEmail,
    watchActive,
  })
  return res.json({
    connected: Boolean(user?.gmailAccessToken && user?.gmailRefreshToken),
    historyId: user?.gmailHistoryId,
    watchExpiration,
    connectedEmail,
    watchActive,
  })
})

router.post("/google-gmail", isAuth, async (req, res) => {
  try {
    console.log("[google-gmail] Connect attempt for user", req.user?.id)
    const { code } = req.body
    if (!code) {
      console.warn("[google-gmail] Missing auth code")
      return res.status(400).json({ message: "Missing auth code" })
    }

    if (!config.google.clientId || !config.google.clientSecret) {
      console.error("[google-gmail] Google OAuth not configured")
      return res.status(500).json({ message: "Google OAuth not configured" })
    }

    const oauth2Client = new google.auth.OAuth2(config.google.clientId, config.google.clientSecret)
    const { tokens } = await oauth2Client.getToken({ code, redirect_uri: "postmessage" })
    const { access_token, refresh_token, expiry_date } = tokens

    oauth2Client.setCredentials({
      access_token: access_token || undefined,
      refresh_token: refresh_token || undefined,
    })

    let gmailAddress = req.user?.email?.toLowerCase()
    try {
      const gmail = google.gmail({ version: "v1", auth: oauth2Client })
      const profile = await gmail.users.getProfile({ userId: "me" })
      if (profile.data?.emailAddress) {
        gmailAddress = profile.data.emailAddress.toLowerCase()
      }
      console.log("[google-gmail] Gmail profile fetched", {
        gmailAddress,
        hasRefresh: Boolean(refresh_token),
      })
    } catch (profileError) {
      console.warn("[google-gmail] Failed to fetch Gmail profile", profileError)
    }

    const sessionEmail = req.user?.email?.toLowerCase()
    const updateFilter =
      req.user?.id && sessionEmail
        ? { $or: [{ authUserId: req.user.id }, { email: sessionEmail }] }
        : req.user?.id
          ? { authUserId: req.user.id }
          : { email: sessionEmail }

    const user = await User.findOneAndUpdate(
      updateFilter,
      {
        authUserId: req.user?.id,
        email: req.user?.email,
        gmailConnectedEmail: gmailAddress,
        name: req.user?.name,
        $setOnInsert: { role: "admin" },
        gmailAccessToken: access_token,
        gmailRefreshToken: refresh_token,
        gmailTokenExpiry: expiry_date ? new Date(expiry_date) : undefined,
      },
      { upsert: true, new: true }
    )

    await user.save()

    const orgId = resolveOrgId(req)
    const channelEmail = gmailAddress || sessionEmail

    if (orgId && channelEmail) {
      await Integration.findOneAndUpdate(
        { orgId, channel: "gmail", channelEmail },
        {
          orgId,
          channel: "gmail",
          provider: "gmail",
          name: `Gmail - ${channelEmail}`,
          channelEmail,
          credentials: {
            accessToken: access_token,
            refreshToken: refresh_token,
            expiryDate: expiry_date ? new Date(expiry_date) : undefined,
          },
          status: "connected",
        },
        { upsert: true, new: true }
      )
    }

    console.log("[google-gmail] Connect success", {
      userId: user.authUserId,
      gmailAddress,
      expiresAt: expiry_date ? new Date(expiry_date).toISOString() : null,
      hasRefresh: Boolean(refresh_token),
    })

    return res.json({
      message: "Gmail linked successfully",
      gmailAddress,
    })
  } catch (err) {
    console.error("Gmail OAuth error:", err)
    return res.status(500).json({ message: "Gmail connect failed" })
  }
})

router.delete("/google-gmail", isAuth, async (req, res) => {
  try {
    console.log("[google-gmail] Disconnect attempt for user", req.user?.id)
    const sessionEmail = req.user?.email?.toLowerCase()
    const user =
      (await User.findOne({ authUserId: req.user?.id })) ||
      (sessionEmail ? await User.findOne({ email: sessionEmail }) : null)
    if (!user) {
      console.warn("[google-gmail] User not found, treating as already disconnected")
      return res.status(200).json({ message: "Gmail already disconnected" })
    }

    if (!user.gmailAccessToken && !user.gmailRefreshToken) {
      user.gmailHistoryId = undefined
      user.gmailWatchExpiration = undefined
      await user.save()
      console.log("[google-gmail] Already disconnected (no tokens)")
      return res.json({ message: "Gmail already disconnected" })
    }

    if (config.google.clientId && config.google.clientSecret) {
      try {
        const oauth2Client = new google.auth.OAuth2(config.google.clientId, config.google.clientSecret)
        oauth2Client.setCredentials({
          access_token: user.gmailAccessToken || undefined,
          refresh_token: user.gmailRefreshToken || undefined,
        })
        const gmail = google.gmail({ version: "v1", auth: oauth2Client })
        await gmail.users.stop({ userId: "me" })
        console.log("[google-gmail] Gmail watch stopped for user", user.authUserId)
      } catch (err) {
        console.warn("Failed to stop Gmail watch", err)
      }
    }

    const orgId = resolveOrgId(req)
    const channelEmail = user.gmailConnectedEmail || req.user?.email?.toLowerCase()

    user.gmailAccessToken = undefined
    user.gmailRefreshToken = undefined
    user.gmailTokenExpiry = undefined
    user.gmailHistoryId = undefined
    user.gmailWatchExpiration = undefined
    user.gmailConnectedEmail = undefined
    await user.save()

    if (orgId && channelEmail) {
      await Integration.findOneAndUpdate(
        { orgId, channel: "gmail", channelEmail },
        {
          status: "disconnected",
          credentials: {},
        }
      )
    }

    console.log("[google-gmail] Disconnect success", { userId: user.authUserId })
    return res.json({ message: "Gmail disconnected successfully" })
  } catch (err) {
    console.error("Gmail disconnect error:", err)
    return res.status(500).json({ message: "Failed to disconnect Gmail" })
  }
})

export default router
