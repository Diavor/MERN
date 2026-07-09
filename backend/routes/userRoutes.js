import express from "express";
import {
  authUser,
  registerUser,
  refreshSession,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  getUsers,
  deleteUser,
  updateUser,
  getUserById,
} from "../controllers/userController.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import { authLimiter } from "../middleware/rateLimit.js";
import validate from "../middleware/validate.js";
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  adminUpdateUserSchema,
} from "../validators/user.schema.js";

const router = express.Router();

router
  .route("/")
  .post(authLimiter, validate({ body: registerSchema }), registerUser)
  .get(protect, admin, getUsers);

router.post("/login", authLimiter, validate({ body: loginSchema }), authUser);
router.post("/refresh", refreshSession);
router.post("/logout", protect, logoutUser);

router
  .route("/profile")
  .get(protect, getUserProfile)
  .put(protect, validate({ body: updateProfileSchema }), updateUserProfile);

router
  .route("/:id")
  .delete(protect, admin, deleteUser)
  .get(protect, admin, getUserById)
  .put(protect, admin, validate({ body: adminUpdateUserSchema }), updateUser);

export default router;
