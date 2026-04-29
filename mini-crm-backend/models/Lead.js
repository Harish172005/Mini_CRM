import mongoose from "mongoose";

/**
 * LeadSchema
 * ──────────
 * Represents a sales lead in the CRM.
 *
 * Key design decisions:
 *  - `isDeleted` flag enables soft-delete: leads are never physically removed
 *    from the DB; they are just excluded from normal queries.
 *  - `company` is an optional ref to Company (populated on demand).
 *  - `assignedTo` links to the User who owns this lead.
 *  - `source` and `status` use strict enums for data integrity.
 */
const leadSchema = new mongoose.Schema(
  {
    // ── Core fields ───────────────────────────────────────────────────────────
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },

    // ── Status lifecycle ──────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["New", "Contacted", "Qualified", "Lost"],
      default: "New",
    },

    // ── Lead source (where did this lead come from?) ──────────────────────────
    source: {
      type: String,
      enum: ["Website", "Referral", "LinkedIn", "Cold Call", "Other"],
      default: "Other",
    },

    // ── Associations ──────────────────────────────────────────────────────────
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ── Free-text notes ───────────────────────────────────────────────────────
    notes: {
      type: String,
      default: "",
    },

    // ── Soft-delete flag ──────────────────────────────────────────────────────
    // When true, this lead is excluded from all normal list/search queries.
    // Hard deletes are never performed so audit history is preserved.
    isDeleted: {
      type: Boolean,
      default: false,
      index: true, // indexed because every query filters on this field
    },
  },
  {
    timestamps: true, // createdAt, updatedAt managed by Mongoose
  }
);

// ── Virtual: full name ────────────────────────────────────────────────────────
leadSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Expose virtuals when converting to JSON / plain object
leadSchema.set("toJSON",   { virtuals: true });
leadSchema.set("toObject", { virtuals: true });

// ── Compound index for common queries ─────────────────────────────────────────
// Speeds up list queries that filter by status + isDeleted
leadSchema.index({ status: 1, isDeleted: 1 });
// Speeds up text search on name/email
leadSchema.index({ firstName: "text", lastName: "text", email: "text" });

export default mongoose.model("Lead", leadSchema);
