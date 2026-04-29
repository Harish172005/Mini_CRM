import Task from "../models/Task.js";
import Lead from "../models/Lead.js";

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/tasks
//  Create a new task linked to a lead and assigned to a user.
//  Body: { title, description, dueDate, priority, lead, assignedTo }
// ─────────────────────────────────────────────────────────────────────────────
const createTask = async (req, res, next) => {
  try {
    const { title, description, dueDate, priority, lead, assignedTo } = req.body;

    // Guard: the referenced lead must exist and not be soft-deleted
    const leadExists = await Lead.findOne({ _id: lead, isDeleted: false });
    if (!leadExists) {
      return res.status(404).json({
        success: false,
        message: "Lead not found or has been deleted",
      });
    }

    const task = await Task.create({
      title,
      description,
      dueDate,
      priority,
      lead,
      assignedTo: assignedTo || req.user._id, // default: caller
      createdBy:  req.user._id,
    });

    // Populate immediately so the response is frontend-ready
    await task.populate([
      { path: "lead",       select: "firstName lastName email status" },
      { path: "assignedTo", select: "name email" },
      { path: "createdBy",  select: "name email" },
    ]);

    res.status(201).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/tasks
//  List tasks with optional filters + pagination.
//
//  Query params:
//    page       – default 1
//    limit      – default 10, max 50
//    status     – Pending | In Progress | Completed
//    priority   – Low | Medium | High
//    assignedTo – userId  (filter by assignee; "me" = req.user._id)
//    lead       – leadId  (filter tasks for a specific lead)
//    sortBy     – default: dueDate
//    order      – asc | desc (default: asc — soonest first)
// ─────────────────────────────────────────────────────────────────────────────
const getTasks = async (req, res, next) => {
  try {
    const {
      page       = 1,
      limit      = 10,
      status,
      priority,
      assignedTo,
      lead,
      sortBy     = "dueDate",
      order      = "asc",
    } = req.query;

    // ── Build filter ──────────────────────────────────────────────────────────
    const filter = {};

    if (status)   filter.status   = status;
    if (priority) filter.priority = priority;
    if (lead)     filter.lead     = lead;

    // "me" is a convenience alias for the logged-in user's own tasks
    if (assignedTo) {
      filter.assignedTo = assignedTo === "me" ? req.user._id : assignedTo;
    }

    // ── Pagination ────────────────────────────────────────────────────────────
    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip     = (pageNum - 1) * limitNum;

    const sortObj = { [sortBy]: order === "desc" ? -1 : 1 };

    const [total, tasks] = await Promise.all([
      Task.countDocuments(filter),
      Task.find(filter)
        .populate("lead",       "firstName lastName email status")
        .populate("assignedTo", "name email")
        .populate("createdBy",  "name email")
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum),
    ]);

    res.status(200).json({
      success: true,
      data:    tasks,
      pagination: {
        total,
        page:       pageNum,
        limit:      limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/tasks/:id
//  Get a single task by ID.
// ─────────────────────────────────────────────────────────────────────────────
const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("lead",       "firstName lastName email status")
      .populate("assignedTo", "name email")
      .populate("createdBy",  "name email");

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    res.status(200).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  PUT /api/tasks/:id
//  Full update — allowed by the task creator OR an admin.
//  The assignee restriction applies ONLY to status updates (see below).
//  Body: any subset of { title, description, dueDate, priority, assignedTo }
// ─────────────────────────────────────────────────────────────────────────────
const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    // Only the creator or an admin may perform a full update
    const isCreator = task.createdBy.toString() === req.user._id.toString();
    const isAdmin   = req.user.role === "admin";

    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only the task creator or an admin can edit this task",
      });
    }

    // Whitelist to prevent mass-assignment
    const allowed = ["title", "description", "dueDate", "priority", "assignedTo", "lead"];
    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    // If lead is being changed, verify the new lead exists
    if (updates.lead) {
      const leadExists = await Lead.findOne({ _id: updates.lead, isDeleted: false });
      if (!leadExists) {
        return res.status(404).json({
          success: false,
          message: "New lead not found or has been deleted",
        });
      }
    }

    const updated = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate("lead",       "firstName lastName email status")
      .populate("assignedTo", "name email")
      .populate("createdBy",  "name email");

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  PATCH /api/tasks/:id/status
//  ★ KEY BUSINESS RULE: Only the ASSIGNED USER can update the task status.
//    Admins are also allowed (for operational overrides).
//  Body: { status: "Completed" }
// ─────────────────────────────────────────────────────────────────────────────
const updateTaskStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    // Validate status value before hitting the DB
    const validStatuses = ["Pending", "In Progress", "Completed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    // ── CORE RESTRICTION ──────────────────────────────────────────────────────
    // Convert ObjectIds to strings before comparing (ObjectId !== ObjectId by ref)
    const isAssignee = task.assignedTo.toString() === req.user._id.toString();
    const isAdmin    = req.user.role === "admin";

    if (!isAssignee && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only the assigned user can update the status of this task",
      });
    }

    task.status = status;
    await task.save(); // triggers Mongoose validators

    await task.populate([
      { path: "lead",       select: "firstName lastName email status" },
      { path: "assignedTo", select: "name email" },
      { path: "createdBy",  select: "name email" },
    ]);

    res.status(200).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  DELETE /api/tasks/:id
//  Hard delete — only task creator or admin.
// ─────────────────────────────────────────────────────────────────────────────
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const isCreator = task.createdBy.toString() === req.user._id.toString();
    const isAdmin   = req.user.role === "admin";

    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only the task creator or an admin can delete this task",
      });
    }

    await task.deleteOne();

    res.status(200).json({ success: true, message: "Task deleted successfully" });
  } catch (err) {
    next(err);
  }
};

export { createTask, getTasks, getTaskById, updateTask, updateTaskStatus, deleteTask };
