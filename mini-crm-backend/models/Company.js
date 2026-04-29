import mongoose from "mongoose";

/**
 * CompanySchema
 * ─────────────
 * Represents a business / organisation in the CRM.
 *
 * Design decisions:
 *  - Companies are never soft-deleted directly; instead, when a company is
 *    deleted its associated leads have their `company` ref set to null via
 *    a post-remove hook (cascade-nullify pattern).
 *  - `industry` uses an enum for consistent filtering/reporting.
 *  - `website` is optional but stored lowercase for deduplication checks.
 *  - `employeeCount` and `annualRevenue` are useful for lead scoring later.
 */
const companySchema = new mongoose.Schema(
  {
    // ── Core identity ─────────────────────────────────────────────────────────
    name: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      unique: true,
    },

    industry: {
      type: String,
      enum: [
        "Technology",
        "Finance",
        "Healthcare",
        "Education",
        "Retail",
        "Manufacturing",
        "Real Estate",
        "Other",
      ],
      default: "Other",
    },

    // ── Contact info ──────────────────────────────────────────────────────────
    website: {
      type: String,
      lowercase: true,
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: "",
    },

    // ── Address ───────────────────────────────────────────────────────────────
    address: {
      street: { type: String, default: "" },
      city:   { type: String, default: "" },
      state:  { type: String, default: "" },
      country:{ type: String, default: "" },
    },

    // ── Company size / revenue ────────────────────────────────────────────────
    employeeCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    annualRevenue: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ── Extra notes ───────────────────────────────────────────────────────────
    description: {
      type: String,
      default: "",
    },

    // ── Ownership ─────────────────────────────────────────────────────────────
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    // Include virtual fields when converting to JSON
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Virtual: leads associated with this company ───────────────────────────────
// This is a "virtual populate" — Mongoose resolves it on-demand when
// .populate("leads") is called; no extra field is stored in the document.
companySchema.virtual("leads", {
  ref:          "Lead",
  localField:   "_id",
  foreignField: "company",
  // Only return leads that have NOT been soft-deleted
  match: { isDeleted: false },
});

// ── Text index for search ─────────────────────────────────────────────────────
companySchema.index({ name: "text", industry: "text" });

export default mongoose.model("Company", companySchema);
