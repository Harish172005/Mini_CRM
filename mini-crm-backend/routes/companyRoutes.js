import express from "express";
import {
  createCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
} from "../controllers/companyController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All company routes require a valid JWT
router.use(protect);

// ── Collection routes ─────────────────────────────────────────────────────────
router.route("/")
  .get(getCompanies)     // GET  /api/companies
  .post(createCompany);  // POST /api/companies

// ── Document routes ───────────────────────────────────────────────────────────
router.route("/:id")
  .get(getCompanyById)    // GET    /api/companies/:id  (with leads)
  .put(updateCompany)     // PUT    /api/companies/:id
  .delete(deleteCompany); // DELETE /api/companies/:id

export default router;
