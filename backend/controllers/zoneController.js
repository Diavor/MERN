import asyncHandler from "express-async-handler";
import Zone from "../models/zoneModel.js";

// @desc     Fetch all delivery zones (admin sees all; storefront could filter active)
// @route    GET /api/zones
// @access   Public
export const getZones = asyncHandler(async (req, res) => {
  const filter = req.query.activeOnly === "true" ? { active: true } : {};
  const zones = await Zone.find(filter).sort({ createdAt: 1 });
  res.json(zones);
});

// @desc     Fetch single zone
// @route    GET /api/zones/:id
// @access   Public
export const getZoneById = asyncHandler(async (req, res) => {
  const zone = await Zone.findById(req.params.id);
  if (zone) {
    res.json(zone);
  } else {
    res.status(404);
    throw new Error("Zone not found");
  }
});

// @desc     Create a delivery zone
// @route    POST /api/zones
// @access   Private/Admin
export const createZone = asyncHandler(async (req, res) => {
  const zone = new Zone(req.body);
  const created = await zone.save();
  res.status(201).json(created);
});

// @desc     Update a delivery zone
// @route    PUT /api/zones/:id
// @access   Private/Admin
export const updateZone = asyncHandler(async (req, res) => {
  const zone = await Zone.findById(req.params.id);
  if (!zone) {
    res.status(404);
    throw new Error("Zone not found");
  }
  // Whitelist assignable fields (never let a client set _id/timestamps).
  const fields = [
    "name", "desc", "active", "fee", "freeThreshold", "minOrder", "eta",
    "maxOrders", "useGlobalHours", "schedule", "holidays", "coverage", "radius",
    "postalCodes", "polygon", "restaurant", "payments", "restrictions", "notes",
  ];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) zone[f] = req.body[f];
  });
  const updated = await zone.save();
  res.json(updated);
});

// @desc     Delete a delivery zone
// @route    DELETE /api/zones/:id
// @access   Private/Admin
export const deleteZone = asyncHandler(async (req, res) => {
  const zone = await Zone.findById(req.params.id);
  if (!zone) {
    res.status(404);
    throw new Error("Zone not found");
  }
  await zone.deleteOne();
  res.json({ message: "Zone removed" });
});
