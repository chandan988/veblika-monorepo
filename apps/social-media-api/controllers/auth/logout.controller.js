const logoutController = async (req, res) => {
  try {
    res.cookie("automation", "", {
      httpOnly: true,
      secure: true, // 👈 match this with login cookie
      sameSite: "none", // 👈 same here
      path: "/", // 👈 must match the original cookie path
      expires: new Date(0), // 👈 ensures instant expiry
    });

    return res.status(200).json({ message: "User logged out", status: true });
  } catch (error) {
    return res.status(500).json({ message: error.message, status: false });
  }
};

export default logoutController;
