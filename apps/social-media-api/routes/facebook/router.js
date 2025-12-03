import express from "express";
import {
  redirectToFacebook,
  facebookCallback,
  getFacebookPages,
  postToFacebook,
} from "../../controllers/facebook/facebook.controller.js";
import { isAuth } from "../../middleware/isAuth.middleware.js";

const facebookRouter = express.Router();

facebookRouter.get("/auth", isAuth, redirectToFacebook);
facebookRouter.get("/callback", facebookCallback);
facebookRouter.get("/pages", getFacebookPages);
facebookRouter.post("/post", postToFacebook);

export default facebookRouter;

