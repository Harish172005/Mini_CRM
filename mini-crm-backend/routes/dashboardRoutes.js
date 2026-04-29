import express from "express";
import {
  getDashboardStats,
  getTasksDueToday,
  getLeadTrend,
} from "../controllers/dashboardController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All dashboard routes require a valid JWT
router.use(protect);

// GET /api/dashboard/stats          – all KPIs + charts + activity feed
router.get("/stats",          getDashboardStats);

// GET /api/dashboard/tasks-due-today – drill-down list of today's tasks
router.get("/tasks-due-today", getTasksDueToday);

// GET /api/dashboard/lead-trend     – 30-day lead creation trend
router.get("/lead-trend",      getLeadTrend);

export default router;
