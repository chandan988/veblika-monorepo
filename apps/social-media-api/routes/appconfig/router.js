import express from "express";
import { isAuth } from "../../middleware/isAuth.middleware.js";
import {
  appSaveConfigController,
  getAppsArry,
} from "../../controllers/appconfig/app.controller.js";
import { getConnectedAccounts } from "../../controllers/appconfig/get-connected-accounts.controller.js";
const appConfigRouter = express.Router();

// appConfigRouter.use(isAuth);
appConfigRouter.post("/create", appSaveConfigController);
appConfigRouter.get("/apps", isAuth, getAppsArry);
appConfigRouter.get("/connected-accounts", isAuth, getConnectedAccounts);

export default appConfigRouter;
