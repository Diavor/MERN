import asyncHandler from "express-async-handler";
import Setting from "../models/settingModel.js";

// The settings document is a singleton. This resolves it, creating the default
// on first access so both read and write paths always have a document to work on.
const getOrCreate = async () => {
  let settings = await Setting.findOne();
  if (!settings) settings = await Setting.create({});
  return settings;
};

// @desc     Fetch site settings (singleton)
// @route    GET /api/settings
// @access   Public
export const getSettings = asyncHandler(async (req, res) => {
  const settings = await getOrCreate();
  res.json(settings);
});

// @desc     Update one or more settings sections
// @route    PUT /api/settings
// @access   Private/Admin
export const updateSettings = asyncHandler(async (req, res) => {
  const settings = await getOrCreate();
  // Whitelist top-level sections; a request may patch any subset (e.g. only
  // `restaurant`) without clobbering the others.
  const sections = ["restaurant", "hours", "payments", "notifications"];
  sections.forEach((section) => {
    if (req.body[section] !== undefined) settings[section] = req.body[section];
  });
  const updated = await settings.save();
  res.json(updated);
});
