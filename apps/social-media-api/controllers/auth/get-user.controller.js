import UserModel from "../../models/user.model.js";

const getUserController = async (req, res) => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized", status: false });
    }

    const user = await UserModel.findById(userId).select("-password").lean();
    
    if (!user) {
      return res.status(404).json({ message: "User not found", status: false });
    }

    return res.status(200).json({
      message: "User fetched successfully",
      status: true,
      data: {
        _id: user._id,
        full_name: user.full_name,
        email: user.email,
        gender: user.gender,
        profile_pic: user.profile_pic,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message, status: false });
  }
};

export default getUserController;

