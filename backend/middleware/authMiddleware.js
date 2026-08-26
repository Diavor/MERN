import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/userModel.js";

export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select("-password");

      return next();
    } catch (error) {
      res.status(401);
      throw new Error("Not authorized, token failed", { cause: error });
    }
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }
});

export const optionalAuth = asyncHandler(async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      const token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
    } catch {
      // Invalid token — continue as guest
    }
  }
  next();
});

// Browser-page admin auth (bull-board queue dashboard). The first hit carries
// the access token as ?token= (same pattern as the SSE stream — a plain page
// load can't set an Authorization header); we then stash it in a short-lived
// httpOnly cookie so the dashboard's own asset/XHR requests authenticate too.
export const adminPage = asyncHandler(async (req, res, next) => {
  const token = req.query.token || req.cookies?.qdash_token || "";
  let user = null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    user = await User.findById(decoded.id).select("-password");
  } catch {
    /* fall through to 401 */
  }
  if (!user?.isAdmin) {
    res.status(401);
    throw new Error("Not authorized as an admin");
  }
  if (req.query.token) {
    res.cookie("qdash_token", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 15 * 60 * 1000, // matches the access-token TTL
    });
  }
  req.user = user;
  next();
});

export const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401);
    throw new Error("Not authorized as an admin");
  }
};
