import { getAppConfig } from "../../utils/getAppConfig.js";
import axios from "axios";

export const handleInstagramConnect = async (req, res, code, appCredFinder) => {
  try {
    const userId = String(req.user._id);
    
    // Get Instagram app config from database (with fallback to env)
    let instagramConfig;
    try {
      instagramConfig = await getAppConfig(userId, "app/instagram");
    } catch (error) {
      console.error("[handleInstagramConnect] Error getting app config:", error.message);
      return res.status(500).json({ error: "Instagram app credentials not configured" });
    }

    if (!instagramConfig.appClientId || !instagramConfig.appClientSecret || !instagramConfig.redirectUrl) {
      return res.status(500).json({ error: "Instagram app credentials not configured" });
    }

    const tokenRes = await axios.post(
      "https://api.instagram.com/oauth/access_token",
      new URLSearchParams({
        client_id: instagramConfig.appClientId,
        client_secret: instagramConfig.appClientSecret,
        grant_type: "authorization_code",
        redirect_uri: instagramConfig.redirectUrl,
        code: code,
      })
    ); 

    const accessToken = tokenRes.data.access_token;

    let longAccessToken = await axios.get(
      "https://graph.instagram.com/access_token",
      {
        params: {
          grant_type: "ig_exchange_token",
          client_secret: instagramConfig.appClientSecret,
          access_token: accessToken,
        },
      }
    );
    const createDoc = await Instagram.create({
      accessToken: longAccessToken.data.access_token,
      insta_user_id: tokenRes.data.user_id,
      expiresIn: longAccessToken.data.expires_in,
    });
    console.log("Access Token:", accessToken);
    console.log("Token Response:", tokenRes.data);
    res.send(`Access Token: ${accessToken}`);
  } catch (err) {
    console.error("Error getting token:", err);
    res.status(500).send("Error getting token");
  }
};
