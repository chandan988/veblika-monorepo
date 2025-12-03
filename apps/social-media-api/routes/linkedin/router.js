import express from "express";
import {
  redirectToLinkedIn,
  linkedinCallback,
  getLinkedInProfile,
  postToLinkedIn,
} from "../../controllers/linkedin/linkedin.controller.js";
import { isAuth } from "../../middleware/isAuth.middleware.js";

const linkedinRouter = express.Router();

linkedinRouter.get("/auth", isAuth, redirectToLinkedIn);
linkedinRouter.get("/callback", linkedinCallback);
linkedinRouter.get("/profile", isAuth, getLinkedInProfile);
linkedinRouter.post("/post", isAuth, postToLinkedIn);

export default linkedinRouter;

