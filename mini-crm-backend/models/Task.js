import mongoose from "mongoose";

/**
 * TaskSchema
 * ──────────
 * Represents an action item linked to a Lead and assigned to a User.
 *
 * Design decisions:
 *  - `lead`       – required ref; every task must belong to a lead.
 *  - `assignedTo` – required ref; the user responsible for completing it.
 *  - `createdBy`  – audit trail: who originally created the task.
 *  - `dueDate`    – used by the dashboard "tasks due today" aggregation.
 *  - `status`     – lifecycle: Pending → In Progress → Completed.
 *  - `priority`   – Low / Medium / High for sorting / filtering.
 *  - Status updates are ONLY allowed by the assigned user (enforced in
 *    the controller, not here, to keep the model concern-free).
 */
const taskSchema = new mongoose.Schema(
  {
    // ── Title & description ───────────────────────────────────────────────────
    title: {
      type:     String,
      required: [true, "Task title is required"],
      trim:     true,
    },
    description: {
      type:    String,
      default: "",
      trim:    true,
    },

    // ── Status lifecycle ──────────────────────────────────────────────────────
    status: {
      type:    String,
      enum:    ["Pending", "In Progress", "Completed"],
      default: "Pending",
    },

    // ── Priority ──────────────────────────────────────────────────────────────
    priority: {
      type:    String,
      enum:    ["Low", "Medium", "High"],
      default: "Medium",
    },

    // ── Due date ──────────────────────────────────────────────────────────────
    dueDate: {
      type:     Date,
      required: [true, "Due date is required"],
    },

    // ── Associations ──────────────────────────────────────────────────────────
    lead: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "Lead",
      required: [true, "Task must be linked to a lead"],
    },
    assignedTo: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: [true, "Task must be assigned to a user"],
    },
    createdBy: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
    },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
// Speed up "tasks due today" dashboard query
taskSchema.index({ dueDate: 1, status: 1 });
// Speed up "tasks assigned to me" query
taskSchema.index({ assignedTo: 1, status: 1 });
// Speed up "tasks for this lead" query
taskSchema.index({ lead: 1 });

export default mongoose.model("Task", taskSchema);
