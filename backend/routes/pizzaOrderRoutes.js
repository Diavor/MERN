import express from "express";
import { createPizzaOrder } from "../controllers/slotController.js";

const router = express.Router();

router.post("/", createPizzaOrder);

export default router;
