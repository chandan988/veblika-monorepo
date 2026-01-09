import express from "express";
import { isAuth } from "../../middleware/isAuth.middleware.js";
import {
  appSaveConfigController,
  getAppsArry,
} from "../../controllers/appconfig/app.controller.js";
import { getConnectedAccounts } from "../../controllers/appconfig/get-connected-accounts.controller.js";
import { disconnectAccount } from "../../controllers/appconfig/disconnect-account.controller.js";
const appConfigRouter = express.Router();

// appConfigRouter.use(isAuth);
appConfigRouter.post("/create", isAuth, appSaveConfigController);
appConfigRouter.get("/apps", isAuth, getAppsArry);
appConfigRouter.get("/connected-accounts", isAuth, getConnectedAccounts);
appConfigRouter.delete("/disconnect", isAuth, disconnectAccount);

export default appConfigRouter;
