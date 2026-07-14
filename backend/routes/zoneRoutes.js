import express from "express";
import {
  getZones,
  getZoneById,
  createZone,
  updateZone,
  deleteZone,
} from "../controllers/zoneController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/").get(getZones).post(protect, admin, createZone);
router
  .route("/:id")
  .get(getZoneById)
  .put(protect, admin, updateZone)
  .delete(protect, admin, deleteZone);

export default router;
