import express from "express";
import { register, login, getMe } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/register", register); // POST /api/auth/register
router.post("/login",    login);    // POST /api/auth/login

// Protected route – requires valid JWT
router.get("/me", protect, getMe);  // GET  /api/auth/me

export default router;
