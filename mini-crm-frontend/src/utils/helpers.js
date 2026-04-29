/**
 * helpers.js
 * ──────────
 * Pure utility functions shared across the app.
 */

// ── Status colour maps ────────────────────────────────────────────────────────

/** Returns a MUI Chip color for a lead status string */
export const getLeadStatusColor = (status) => {
  const map = {
    New:        "default",
    Contacted:  "info",
    Qualified:  "success",
    Lost:       "error",
  };
  return map[status] || "default";
};

/** Returns a MUI Chip color for a task status string */
export const getTaskStatusColor = (status) => {
  const map = {
    Pending:      "warning",
    "In Progress":"info",
    Completed:    "success",
  };
  return map[status] || "default";
};

/** Returns a MUI Chip color for a task priority */
export const getTaskPriorityColor = (priority) => {
  const map = {
    Low:    "default",
    Medium: "warning",
    High:   "error",
  };
  return map[priority] || "default";
};

// ── Date helpers ──────────────────────────────────────────────────────────────

/** Format an ISO date string to "12 Jan 2025" */
export const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day:   "2-digit",
    month: "short",
    year:  "numeric",
  });
};

/** Returns true if the given date is today or in the past */
export const isOverdue = (dateStr) => {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
};

// ── String helpers ────────────────────────────────────────────────────────────

/** "harish kumar" → "Harish Kumar" */
export const toTitleCase = (str = "") =>
  str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());

/** Get initials from a full name: "Harish Kumar" → "HK" */
export const getInitials = (name = "") =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

// ── API error extractor ───────────────────────────────────────────────────────

/** Safely pull the error message from an Axios error response */
export const getApiError = (err) =>
  err?.response?.data?.message || err?.message || "Something went wrong";
