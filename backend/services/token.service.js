import jwt from "jsonwebtoken";
import crypto from "crypto";
import env from "../config/env.js";
import User from "../models/userModel.js";

const REFRESH_COOKIE = "refreshToken";
const REFRESH_TTL_MS = env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;

const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");

// Short-lived access token. Kept minimal: identity + admin flag.
export const signAccessToken = (user) =>
  jwt.sign({ id: user._id, isAdmin: user.isAdmin }, env.JWT_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL,
  });

// Long-lived refresh token (opaque JWT). Its sha256 is persisted on the user so
// it can be rotated and revoked; the raw token lives only in the httpOnly cookie.
const signRefreshToken = (user, tokenId) =>
  jwt.sign({ id: user._id, jti: tokenId }, env.refreshSecret, {
    expiresIn: `${env.REFRESH_TOKEN_TTL_DAYS}d`,
  });

// Issue a fresh access+refresh pair and store the refresh hash on the user.
export const issueTokens = async (user) => {
  const tokenId = crypto.randomUUID();
  const refreshToken = signRefreshToken(user, tokenId);
  user.refreshTokenHash = sha256(refreshToken);
  await user.save();
  return { accessToken: signAccessToken(user), refreshToken };
};

export const setRefreshCookie = (res, refreshToken) => {
  res.cookie(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: "lax",
    path: "/api/users",
    maxAge: REFRESH_TTL_MS,
  });
};

export const clearRefreshCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE, { path: "/api/users" });
};

// Verify the inbound refresh cookie, confirm it matches the stored hash, then
// rotate it (single-use). A mismatch means a stolen/replayed token → reject.
export const rotateRefreshToken = async (req) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) {
    const err = new Error("No refresh token");
    err.statusCode = 401;
    throw err;
  }

  let decoded;
  try {
    decoded = jwt.verify(token, env.refreshSecret);
  } catch {
    const err = new Error("Invalid refresh token");
    err.statusCode = 401;
    throw err;
  }

  // refreshTokenHash is select:false — pull it in explicitly for comparison.
  const user = await User.findById(decoded.id).select("+refreshTokenHash");
  if (!user || user.refreshTokenHash !== sha256(token)) {
    const err = new Error("Refresh token no longer valid");
    err.statusCode = 401;
    throw err;
  }

  const { accessToken, refreshToken } = await issueTokens(user);
  return { user, accessToken, refreshToken };
};
