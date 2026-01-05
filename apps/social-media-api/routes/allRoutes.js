import express from "express";
import userRouter from "./user/router.js";
import appConfigRouter from "./appconfig/router.js";
import youtubeRouter from "./youtube/router.js";
import instagramRouter from "./instagram/router.js";
import facebookRouter from "./facebook/router.js";
import linkedinRouter from "./linkedin/router.js";
import socialMediaRouter from "./social-media/router.js";
import analyticsRouter from "./analytics/router.js";
import aiRouter from "./ai/router.js";
import engageRouter from "./engage/router.js";

const allRouter = express.Router();

allRouter.use("/user", userRouter);
allRouter.use("/youtube", youtubeRouter);
allRouter.use("/appconfig", appConfigRouter);
allRouter.use("/instagram", instagramRouter);
allRouter.use("/facebook", facebookRouter);
allRouter.use("/linkedin", linkedinRouter);
allRouter.use("/social-media", socialMediaRouter);
allRouter.use("/analytics", analyticsRouter);
allRouter.use("/ai", aiRouter);
allRouter.use("/engage", engageRouter);

export default allRouter;
