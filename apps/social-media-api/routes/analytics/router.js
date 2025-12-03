import express from "express";
import { getOverviewAnalytics, getPostAnalytics, getAllPosts, refreshPostAnalytics } from "../../controllers/analytics/analytics.controller.js";
import { isAuth } from "../../middleware/isAuth.middleware.js";

const analyticsRouter = express.Router();

analyticsRouter.get("/overview", isAuth, getOverviewAnalytics);
analyticsRouter.get("/posts", isAuth, getAllPosts);
analyticsRouter.get("/posts/:postId", isAuth, getPostAnalytics);
analyticsRouter.post("/posts/:postId/refresh", isAuth, refreshPostAnalytics);

export default analyticsRouter;

