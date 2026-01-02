import express from "express";
import { isAuth } from "../../middleware/isAuth.middleware.js";
import { generatePostContent } from "../../controllers/ai/gemini.controller.js";

const aiRouter = express.Router();

aiRouter.post("/generate-post", isAuth, generatePostContent);

export default aiRouter;


