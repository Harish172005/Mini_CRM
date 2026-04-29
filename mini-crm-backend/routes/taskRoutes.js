import express from "express";
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask,
} from "../controllers/taskController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All task routes require a valid JWT
router.use(protect);

// ── Collection routes ─────────────────────────────────────────────────────────
router.route("/")
  .get(getTasks)     // GET  /api/tasks?status=&priority=&assignedTo=me
  .post(createTask); // POST /api/tasks

// ── Document routes ───────────────────────────────────────────────────────────
router.route("/:id")
  .get(getTaskById)   // GET    /api/tasks/:id
  .put(updateTask)    // PUT    /api/tasks/:id  (creator / admin only)
  .delete(deleteTask);// DELETE /api/tasks/:id  (creator / admin only)

// ── Status-only update — ASSIGNEE / ADMIN ONLY ────────────────────────────────
router.patch("/:id/status", updateTaskStatus); // PATCH /api/tasks/:id/status

export default router;
