import jwt from "jsonwebtoken";

const getJsonToken = (id, userId, res) => {
  console.log("id, userId", id, userId);
  const token = jwt.sign({ _id: id, userId }, process.env.JWT_SECRET, {
    expiresIn: "2d",
  });

  const cookieOptions = {
    httpOnly: true,
    maxAge: 2 * 24 * 60 * 60 * 1000,
    sameSite: "none",
    secure: true,
    path: "/",
    // Remove domain to let the cookie default to the origin that set it
  };

  console.log("Setting cookie with options:", cookieOptions);
  res.cookie("automation", token, cookieOptions);
  return token;
};

export default getJsonToken;
