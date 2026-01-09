import jwt from "jsonwebtoken";
import UserModel from "../models/user.model.js";

export const isAuth = async (req, res, next) => {
  try {
    console.log("Available cookies:", Object.keys(req.cookies));
    console.log("Request path:", req.path);
    console.log("Request headers:", {
      authorization: req.headers.authorization ? "present" : "missing",
      "x-auth-token": req.headers["x-auth-token"] ? "present" : "missing",
      "x-user-id": req.headers["x-user-id"] ? req.headers["x-user-id"] : "missing",
    });
    
    // Check for token in Authorization header (Bearer token) or X-Auth-Token header
    const authHeader = req.headers.authorization;
    const authToken = req.headers["x-auth-token"];
    const betterAuthUserId = req.headers["x-user-id"];
    const userRole = req.headers["x-user-role"];
    const resellerId = req.headers["x-reseller-id"];
    
    // Extract token from Authorization header if present (format: "Bearer <token>")
    const bearerToken = authHeader?.startsWith("Bearer ") 
      ? authHeader.substring(7) 
      : null;
    
    const token = bearerToken || authToken;
    
    // If we have a token and userId from headers (better-auth), use it directly
    // Don't require MongoDB lookup - user might be in a different database
    if (token && betterAuthUserId) {
      console.log("Better-auth token found in headers, userId:", betterAuthUserId);
      
      // Use better-auth userId directly - this is the authenticated user ID
      // We don't need to look up in MongoDB since user might be in different database
      req.user = {
        _id: betterAuthUserId,
        userId: betterAuthUserId,
        role: userRole || null,
        resellerId: resellerId || null,
      };
      
      // Optionally try to find MongoDB user for additional info, but don't require it
      const userEmail = req.headers["x-user-email"];
      if (userEmail) {
        try {
          const mongoUser = await UserModel.findOne({ email: userEmail }).lean();
          if (mongoUser) {
            console.log("MongoDB user found by email, but using better-auth userId:", betterAuthUserId);
            // Keep using better-auth userId for consistency
          }
        } catch (userLookupError) {
          // Ignore MongoDB lookup errors - user might be in different database
          console.log("MongoDB lookup skipped (user may be in different database)");
        }
      }
      
      console.log("Using better-auth userId for authentication:", betterAuthUserId, "role:", userRole, "resellerId:", resellerId);
      return next();
    }
    
    // Check for old JWT token (automation cookie)
    const automation = req.cookies.automation;
    
    if (automation) {
      try {
        const decode = jwt.verify(automation, process.env.JWT_SECRET);
        console.log("Token decoded successfully:", decode);
        req.user = decode;
        return next();
      } catch (error) {
        console.log("JWT verification failed:", error.message);
        // Continue to check for better-auth cookies
      }
    }
    
    // Check for better-auth session cookies - check all possible cookie names
    const allCookies = req.cookies || {};
    const cookieNames = Object.keys(allCookies);
    console.log("All cookie names:", cookieNames);
    
    // Check for better-auth related cookies
    const betterAuthCookie = cookieNames.find(name => 
      name.includes('better-auth') || 
      name.includes('session') ||
      name.includes('auth')
    );
    
    if (betterAuthCookie) {
      console.log("Better-auth related cookie found:", betterAuthCookie);
      const cookieValue = req.cookies[betterAuthCookie];
      console.log("Cookie value (first 20 chars):", cookieValue?.substring(0, 20));
      
      // Try to get userId from headers first (for API requests with better-auth)
      let resolvedUserId = betterAuthUserId;
      const userEmail = req.headers["x-user-email"];
      const userRole = req.headers["x-user-role"];
      const resellerId = req.headers["x-reseller-id"];
      
      // If we have better-auth userId from headers, try to resolve to MongoDB user
      if (betterAuthUserId) {
        try {
          let mongoUser = await UserModel.findById(betterAuthUserId).lean();
          
          // If not found, try by email
          if (!mongoUser && userEmail) {
            console.log("MongoDB user not found by _id, trying by email:", userEmail);
            mongoUser = await UserModel.findOne({ email: userEmail }).lean();
          }
          
          if (mongoUser) {
            resolvedUserId = String(mongoUser._id);
            console.log("Resolved to MongoDB userId:", resolvedUserId);
          } else {
            console.log("MongoDB user not found, using better-auth userId as-is:", betterAuthUserId);
            resolvedUserId = betterAuthUserId;
          }
        } catch (error) {
          console.log("Error looking up user:", error.message);
          resolvedUserId = betterAuthUserId;
        }
      }
      
      // If we don't have userId from headers but have a better-auth cookie,
      // try to verify the session by calling better-auth API
      if (!resolvedUserId && cookieValue) {
        console.log("Better-auth cookie found but no userId in headers - attempting to verify session");
        
        // Try to verify session with better-auth API
        // Better-auth typically runs on the frontend URL
        const authUrl = process.env.BETTER_AUTH_URL || process.env.FRONTEND_URL || "http://localhost:3000";
        
        try {
          const axios = (await import("axios")).default;
          // Better-auth session endpoint
          const sessionResponse = await axios.get(`${authUrl}/api/auth/get-session`, {
            headers: {
              Cookie: `${betterAuthCookie}=${cookieValue}`,
            },
            validateStatus: () => true, // Don't throw on any status
            timeout: 2000, // 2 second timeout
          });
          
          if (sessionResponse.status === 200 && sessionResponse.data?.user?.id) {
            const betterAuthUserId = sessionResponse.data.user.id;
            const betterAuthUserEmail = sessionResponse.data.user.email;
            const betterAuthUserRole = sessionResponse.data.user.role;
            const betterAuthResellerId = sessionResponse.data.user.resellerId;
            console.log("Verified better-auth session, userId:", betterAuthUserId, "email:", betterAuthUserEmail, "role:", betterAuthUserRole, "resellerId:", betterAuthResellerId);
            
            // Try to find MongoDB user by better-auth userId
            let mongoUser = await UserModel.findById(betterAuthUserId).lean();
            
            // If not found, try by email from better-auth response
            if (!mongoUser && betterAuthUserEmail) {
              console.log("MongoDB user not found by _id, trying by email:", betterAuthUserEmail);
              mongoUser = await UserModel.findOne({ email: betterAuthUserEmail }).lean();
            }
            
            if (mongoUser) {
              resolvedUserId = String(mongoUser._id);
              console.log("Resolved to MongoDB userId from better-auth session:", resolvedUserId);
            } else {
              // Use better-auth userId as fallback
              resolvedUserId = betterAuthUserId;
              console.log("Using better-auth userId as-is:", resolvedUserId);
            }
            
            // Store role and resellerId for later use
            req.userRole = betterAuthUserRole;
            req.userResellerId = betterAuthResellerId;
          } else {
            console.log("Better-auth session verification failed, status:", sessionResponse.status);
          }
        } catch (error) {
          console.log("Could not verify better-auth session (API might not be available):", error.message);
          // Continue - we'll reject the request if we can't verify
        }
      }
      
      // For OAuth redirects (like /youtube/auth, /instagram/auth, etc.), allow if better-auth cookie exists
      // The OAuth callback will handle user association using the state parameter or session
      if (req.path && (req.path.includes('/auth') || req.path.includes('/callback'))) {
        console.log("OAuth flow detected - allowing request with better-auth session");
        
        // Try to resolve userId from query parameter or headers
        let resolvedUserId = null;
        
        // Priority 1: Query parameter (from frontend redirect)
        if (req.query.userId) {
          resolvedUserId = req.query.userId;
          console.log("OAuth: Found userId in query parameter:", resolvedUserId);
          
          // Try to resolve to MongoDB _id
          try {
            let mongoUser = await UserModel.findById(resolvedUserId).lean();
            
            // If not found, try by email
            if (!mongoUser) {
              const userEmail = req.headers["x-user-email"];
              if (userEmail) {
                console.log("OAuth: MongoDB user not found by _id, trying by email:", userEmail);
                mongoUser = await UserModel.findOne({ email: userEmail }).lean();
              }
            }
            
            if (mongoUser) {
              resolvedUserId = String(mongoUser._id);
              console.log("OAuth: Resolved to MongoDB userId:", resolvedUserId);
            }
          } catch (error) {
            console.log("OAuth: Error looking up user:", error.message);
          }
        }
        // Priority 2: Headers (better-auth userId)
        else if (betterAuthUserId) {
          resolvedUserId = betterAuthUserId;
          console.log("OAuth: Using userId from headers:", resolvedUserId);
          
          // Try to resolve to MongoDB _id
          try {
            let mongoUser = await UserModel.findById(betterAuthUserId).lean();
            
            if (!mongoUser) {
              const userEmail = req.headers["x-user-email"];
              if (userEmail) {
                console.log("OAuth: MongoDB user not found by _id, trying by email:", userEmail);
                mongoUser = await UserModel.findOne({ email: userEmail }).lean();
              }
            }
            
            if (mongoUser) {
              resolvedUserId = String(mongoUser._id);
              console.log("OAuth: Resolved to MongoDB userId:", resolvedUserId);
            }
          } catch (error) {
            console.log("OAuth: Error looking up user:", error.message);
          }
        }
        
        // Set user object with resolved userId (or null if not found)
        req.user = { 
          _id: resolvedUserId, 
          userId: resolvedUserId 
        };
        
        console.log("OAuth: Setting req.user with userId:", resolvedUserId);
        return next();
      }
      
      // For other protected routes, if we have a resolved userId, allow the request
      if (resolvedUserId) {
        console.log("Better-auth session found, using resolved userId:", resolvedUserId);
        req.user = {
          _id: resolvedUserId,
          userId: resolvedUserId,
          role: userRole || req.userRole || null,
          resellerId: resellerId || req.userResellerId || null,
        };
        return next();
      }
      
      // For other protected routes, we need headers with userId or the automation cookie
      // Note: Frontend should always send headers via useAuthSession hook in layout
      console.log("Better-auth session found but route requires full authentication with headers");
      return res.status(401).json({ 
        message: "Not Authorized, Please login. Better-auth session detected but backend requires token and userId in headers.", 
        status: false 
      });
    }
    
    // No valid authentication found
    console.log("No valid authentication found. Available cookies:", cookieNames);
    return res
      .status(401)
      .json({ message: "Not Authorized, Please login", status: false });
  } catch (error) {
    console.log("err from middleware:", error.message);
    return res.status(500).json({ message: error.message, status: false });
  }
};
