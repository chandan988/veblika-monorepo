export const handleInstagramConnect = async (req, res, code, appCredFinder) => {
  try {
    // Use Instagram app ID and secret (or fallback to META_APP_ID if not set)
    const instagramAppId = process.env.INSTAGRAM_APP_ID || process.env.META_APP_ID;
    const instagramAppSecret = process.env.INSTAGRAM_APP_SECRET || process.env.META_APP_SECRET;

    if (!instagramAppId || !instagramAppSecret) {
      return res.status(500).json({ error: "Instagram app credentials not configured" });
    }

    const tokenRes = await axios.post(
      "https://api.instagram.com/oauth/access_token",
      new URLSearchParams({
        client_id: instagramAppId,
        client_secret: instagramAppSecret,
        grant_type: "authorization_code",
        redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
        code: code,
      })
    ); 

    const accessToken = tokenRes.data.access_token;

    let longAccessToken = await axios.get(
      "https://graph.instagram.com/access_token",
      {
        params: {
          grant_type: "ig_exchange_token",
          client_secret: instagramAppSecret,
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
