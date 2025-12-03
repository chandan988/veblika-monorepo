import express from "express";
import {
  redirectToGoogle,
  youtubeCallback,
  getMyYouTubeChannel,
  uploadYouTubeVideo,
} from "../../controllers/youtube/youtube.controller.js";
import upload from "../../middleware/upload.js";
import { isAuth } from "../../middleware/isAuth.middleware.js";

const youtubeRouter = express.Router();

youtubeRouter.get("/auth", isAuth, redirectToGoogle);
youtubeRouter.get("/callback", youtubeCallback);
youtubeRouter.get("/me", isAuth, getMyYouTubeChannel);
youtubeRouter.post("/upload", isAuth, upload.single("video"), uploadYouTubeVideo);

export default youtubeRouter;



