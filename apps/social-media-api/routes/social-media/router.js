import express from "express";
import {
  getConnectedPlatforms,
  postToAllPlatforms,
  postToSinglePlatform,
} from "../../controllers/social-media/social-media.controller.js";
import upload from "../../middleware/upload.js";
import { isAuth } from "../../middleware/isAuth.middleware.js";

const socialMediaRouter = express.Router();

socialMediaRouter.get("/platforms", getConnectedPlatforms);
socialMediaRouter.post("/post", isAuth, upload.fields([{ name: "image", maxCount: 1 }, { name: "video", maxCount: 1 }]), postToSinglePlatform);
socialMediaRouter.post("/post-multiple", postToAllPlatforms);

export default socialMediaRouter;

