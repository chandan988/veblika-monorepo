import express from "express";
import {
  getAllPosts,
  getPostComments,
  postComment,
  syncPosts,
  getCommentReplies,
} from "../../controllers/engage/engage.controller.js";
import { isAuth } from "../../middleware/isAuth.middleware.js";

const engageRouter = express.Router();

// Get all posts for the user (optionally filtered by platform)
engageRouter.get("/posts", isAuth, getAllPosts);

// Sync posts from platform APIs
engageRouter.post("/sync", isAuth, syncPosts);

// Get comments for a specific post
engageRouter.get("/comments/:platform/:postId", isAuth, getPostComments);

// Get replies for a specific comment
engageRouter.get("/replies/:platform/:commentId", isAuth, getCommentReplies);

// Post a comment or reply
engageRouter.post("/comment", isAuth, postComment);

export default engageRouter;



