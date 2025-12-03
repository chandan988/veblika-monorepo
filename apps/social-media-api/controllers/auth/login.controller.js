import bcrypt from "bcryptjs";
import UserModel from "../../models/user.model.js";
import getJsonToken from "../../utils/get-json-token.js";

const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("email", email);
    const userFinder = await UserModel.findOne({ email }).lean();
    if (!userFinder) {
      return res.status(400).json({ message: "Wrong credentials", status: false });
    }
    const isMatch = await bcrypt.compare(password, userFinder.password);

    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Wrong credentials", status: false });
    }
    
    // Use userId directly from user's _id
    const userId = String(userFinder._id);
    
    getJsonToken(userFinder._id, userId, res);

    let sendObj = {
      _id: userFinder._id,
      email: userFinder.email,
      fullname: userFinder.full_name,
      profilePic: userFinder.profile_pic,
    };
    return res
      .status(200)
      .json({ message: "User logged in", status: true, data: sendObj });
  } catch (error) {
    return res.status(500).json({ message: error.message, status: false });
  }
};

export default loginController;
