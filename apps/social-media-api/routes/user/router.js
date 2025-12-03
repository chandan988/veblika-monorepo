import express from 'express';
import signupController from '../../controllers/auth/signup.controller.js';
import loginController from '../../controllers/auth/login.controller.js';
import logoutController from '../../controllers/auth/logout.controller.js';
import getUserController from '../../controllers/auth/get-user.controller.js';
import { isAuth } from '../../middleware/isAuth.middleware.js';

const userRouter = express.Router();

userRouter.post("/signup", signupController);
userRouter.post("/login", loginController);
userRouter.post("/logout", logoutController);
userRouter.get("/profile", isAuth, getUserController);

// Debug route to verify router is working
userRouter.get("/test", (req, res) => {
  res.json({ message: "User router is working", path: req.path, originalUrl: req.originalUrl });
});

// Debug endpoint to check cookies
userRouter.get("/debug-cookies", (req, res) => {
    console.log("🔍 Debug cookies endpoint called");
    console.log("Headers:", req.headers);
    console.log("Cookies:", req.cookies);
    console.log("Signed cookies:", req.signedCookies);
    console.log("Origin:", req.headers.origin);
    console.log("User-Agent:", req.headers['user-agent']);
    
    res.json({
        success: true,
        data: {
            cookies: req.cookies,
            signedCookies: req.signedCookies,
            headers: req.headers,
            origin: req.headers.origin,
            timestamp: new Date().toISOString()
        }
    });
});

export default userRouter;