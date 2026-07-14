import crypto from "crypto";
import asyncHandler from "express-async-handler";
import User from "../models/userModel.js";
import {
  issueTokens,
  signAccessToken,
  setRefreshCookie,
  clearRefreshCookie,
  rotateRefreshToken,
} from "../services/token.service.js";
import { verifyGoogleToken, verifyAppleToken } from "../services/oauth.service.js";

// Shape returned to the client for a user identity.
const publicUser = (user, token) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  isAdmin: user.isAdmin,
  token,
});

// @desc     Auth user & get token
// @route    POST /api/users/login
// @access   Public
export const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user && (await user.matchPassword(password))) {
    const { accessToken, refreshToken } = await issueTokens(user);
    setRefreshCookie(res, refreshToken);
    res.json(publicUser(user, accessToken));
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

// @desc     Register a new user
// @route    POST /api/users
// @access   Public
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }
  const user = await User.create({ name, email, password });
  const { accessToken, refreshToken } = await issueTokens(user);
  setRefreshCookie(res, refreshToken);
  res.status(201).json(publicUser(user, accessToken));
});

// Find an existing user by email (linking social login to an existing account)
// or create a new one. OAuth users get a random, unusable password so the
// password-required schema + hashing hook stay unchanged.
const findOrCreateOAuthUser = async ({ email, name, provider }) => {
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name,
      email,
      password: crypto.randomBytes(32).toString("hex"),
      authProvider: provider,
    });
  }
  return user;
};

const completeOAuthLogin = async (res, identity) => {
  const user = await findOrCreateOAuthUser(identity);
  const { accessToken, refreshToken } = await issueTokens(user);
  setRefreshCookie(res, refreshToken);
  res.json(publicUser(user, accessToken));
};

// @desc     Sign in with Google (verifies the GSI id token)
// @route    POST /api/users/google
// @access   Public
export const googleAuth = asyncHandler(async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    res.status(400);
    throw new Error("Credenziale Google mancante");
  }
  const identity = await verifyGoogleToken(credential);
  await completeOAuthLogin(res, identity);
});

// @desc     Sign in with Apple (verifies the identity token)
// @route    POST /api/users/apple
// @access   Public
export const appleAuth = asyncHandler(async (req, res) => {
  const { identityToken, name } = req.body;
  if (!identityToken) {
    res.status(400);
    throw new Error("Token Apple mancante");
  }
  const identity = await verifyAppleToken(identityToken, name);
  await completeOAuthLogin(res, identity);
});

// @desc     Rotate refresh token → new access token
// @route    POST /api/users/refresh
// @access   Public (via httpOnly refresh cookie)
export const refreshSession = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await rotateRefreshToken(req);
  setRefreshCookie(res, refreshToken);
  res.json(publicUser(user, accessToken));
});

// @desc     Log out (invalidate refresh token)
// @route    POST /api/users/logout
// @access   Private
export const logoutUser = asyncHandler(async (req, res) => {
  if (req.user) {
    req.user.refreshTokenHash = undefined;
    await req.user.save();
  }
  clearRefreshCookie(res);
  res.json({ message: "Logged out" });
});

// @desc     GET user profile
// @route    GET /api/users/profile
// @access   Private
export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// @desc     Update user profile
// @route    PUT /api/users/profile
// @access   Private
export const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    if (req.body.password) {
      user.password = req.body.password;
    }
    const updatedUser = await user.save();
    // Re-issue only the access token; leave the refresh token (and its cookie)
    // untouched so the existing session stays valid.
    res.json(publicUser(updatedUser, signAccessToken(updatedUser)));
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// @desc     GET all users
// @route    GET /api/users
// @access   Private/Admin
export const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select("-password -refreshTokenHash");
  res.json(users);
});

// @desc     Delete user
// @route    DELETE /api/users/:id
// @access   Private/Admin
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (user) {
    // Mongoose 7+ removed Document.prototype.remove().
    await user.deleteOne();
    res.json({ message: "User removed" });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// @desc     GET user by id
// @route    GET /api/users/:id
// @access   Private/Admin
export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password -refreshTokenHash");
  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// @desc     Update user
// @route    PUT /api/users/:id
// @access   Private/Admin
export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.isAdmin = req.body.isAdmin ?? user.isAdmin;
    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});
