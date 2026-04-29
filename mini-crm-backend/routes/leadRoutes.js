import express from "express";
import {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  updateLeadStatus,
  deleteLead,
} from "../controllers/leadController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All lead routes require a valid JWT
router.use(protect);

// ── Collection routes ─────────────────────────────────────────────────────────
router.route("/")
  .get(getLeads)      // GET  /api/leads?page=1&limit=10&search=&status=
  .post(createLead);  // POST /api/leads

// ── Document routes ───────────────────────────────────────────────────────────
router.route("/:id")
  .get(getLeadById)    // GET    /api/leads/:id
  .put(updateLead)     // PUT    /api/leads/:id
  .delete(deleteLead); // DELETE /api/leads/:id  (soft delete)

// ── Status-only update ────────────────────────────────────────────────────────
router.patch("/:id/status", updateLeadStatus); // PATCH /api/leads/:id/status

export default router;
