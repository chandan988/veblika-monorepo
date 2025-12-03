import UserModel from "../../models/user.model.js";
import bcrypt from "bcryptjs";
import getJsonToken from "../../utils/get-json-token.js";
let avatarapi = `https://avatar.iran.liara.run/public/`;

const signupController = async (req, res) => {
  try {
    const { full_name, email, password, gender } = req.body;

    const userFinder = await UserModel.findOne({ email });
    if (userFinder) {
      return res
        .status(400)
        .json({ message: "User already exists", status: false });
    }
    let boy = `${avatarapi}boy?email=${email}`;
    let girl = `${avatarapi}girl?email=${email}`;

    console.log("boy", boy);
    const hashPass = await bcrypt.hash(password, 10);
    const createUser = new UserModel({
      full_name,
      email,
      gender,
      profile_pic: gender === "male" ? boy : girl,
      password: hashPass,
    });
    await createUser.save();
    
    // Set userId to user's _id for multi-tenant support
    // Each user gets their own organization
    const userId = String(createUser._id);
    
    getJsonToken(createUser._id, userId, res);
    return res.status(201).json({
      message: "User created",
      data: {
        full_name,
        email,
        profile: createUser.profile_pic,
      },
      status: true,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message, status: false });
  }
};

export default signupController;
