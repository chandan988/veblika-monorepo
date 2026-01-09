import AppCredentials from "../../models/appcredentials.model.js";

export const disconnectAccount = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: "Unauthorized", status: false });
    }

    const userId = String(req.user._id);
    const { platform } = req.body;

    if (!platform) {
      return res.status(400).json({ message: "Platform is required", status: false });
    }

    // Map frontend platform keys to backend platform names
    const platformMap = {
      "app/instagram": "INSTAGRAM",
      "app/facebook": "FACEBOOK",
      "app/linkedin": "LINKEDIN",
      "app/youtube": "YOUTUBE",
    };

    const platformName = platformMap[platform] || platform.toUpperCase();

    // Delete the credentials for this platform
    const result = await AppCredentials.findOneAndDelete({
      userId,
      platform: platformName,
    });

    if (!result) {
      return res.status(404).json({
        message: "Account not found or already disconnected",
        status: false,
      });
    }

    return res.status(200).json({
      message: "Account disconnected successfully",
      status: true,
      data: { platform: platformName },
    });
  } catch (error) {
    console.log("Error disconnecting account:", error);
    return res.status(500).json({ message: error.message, status: false });
  }
};


