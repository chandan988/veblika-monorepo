import express from "express";
import {
  redirectToFB,
  instagramCallback,
  uploadInstagramMedia,
  getInstagramDetails,
} from "../../controllers/instagram/instagram.controller.js";
import { isAuth } from "../../middleware/isAuth.middleware.js";

const instagramRouter = express.Router();

instagramRouter.get("/auth", isAuth, redirectToFB);
instagramRouter.get("/callback", instagramCallback);
instagramRouter.get("/details", isAuth, getInstagramDetails);
instagramRouter.post("/upload", isAuth, uploadInstagramMedia);

export default instagramRouter;
