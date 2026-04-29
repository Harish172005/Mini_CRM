import Lead from "../models/Lead.js";

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/leads
//  Create a new lead.
//  Body: { firstName, lastName, email, phone, status, source, company, notes }
// ─────────────────────────────────────────────────────────────────────────────
const createLead = async (req, res, next) => {
  try {
    const {
      firstName, lastName, email, phone,
      status, source, company, notes, assignedTo,
    } = req.body;

    // Prevent duplicate active leads with the same email
    const duplicate = await Lead.findOne({ email, isDeleted: false });
    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: "A lead with this email already exists",
      });
    }

    const lead = await Lead.create({
      firstName, lastName, email, phone,
      status, source, notes,
      company:    company    || null,
      assignedTo: assignedTo || req.user._id, // default: assigning user
    });

    // Populate references so the response is immediately usable by the frontend
    await lead.populate([
      { path: "assignedTo", select: "name email" },
      { path: "company",    select: "name" },
    ]);

    res.status(201).json({ success: true, data: lead });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/leads
//  List leads with pagination, search (name/email) and status filter.
//
//  Query params:
//    page     – page number (default: 1)
//    limit    – items per page (default: 10, max: 50)
//    search   – partial match on firstName, lastName, email
//    status   – exact match: New | Contacted | Qualified | Lost
//    source   – exact match: Website | Referral | …
//    sortBy   – field to sort on (default: createdAt)
//    order    – asc | desc (default: desc)
// ─────────────────────────────────────────────────────────────────────────────
const getLeads = async (req, res, next) => {
  try {
    const {
      page   = 1,
      limit  = 10,
      search = "",
      status,
      source,
      sortBy = "createdAt",
      order  = "desc",
    } = req.query;

    // ── Build filter ──────────────────────────────────────────────────────────
    const filter = { isDeleted: false }; // always exclude soft-deleted leads

    if (status) filter.status = status;
    if (source) filter.source = source;

    if (search.trim()) {
      // Case-insensitive partial match across name and email fields
      const regex = new RegExp(search.trim(), "i");
      filter.$or = [
        { firstName: regex },
        { lastName:  regex },
        { email:     regex },
      ];
    }

    // ── Pagination math ───────────────────────────────────────────────────────
    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit))); // cap at 50
    const skip     = (pageNum - 1) * limitNum;

    // ── Sort ──────────────────────────────────────────────────────────────────
    const sortOrder = order === "asc" ? 1 : -1;
    const sortObj   = { [sortBy]: sortOrder };

    // ── Execute count + data queries in parallel for performance ──────────────
    const [total, leads] = await Promise.all([
      Lead.countDocuments(filter),
      Lead.find(filter)
        .populate("assignedTo", "name email")
        .populate("company",    "name")
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum),
    ]);

    res.status(200).json({
      success: true,
      data:    leads,
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
//  GET /api/leads/:id
//  Get a single lead by ID (must not be soft-deleted).
// ─────────────────────────────────────────────────────────────────────────────
const getLeadById = async (req, res, next) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, isDeleted: false })
      .populate("assignedTo", "name email")
      .populate("company",    "name");

    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found" });
    }

    res.status(200).json({ success: true, data: lead });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  PUT /api/leads/:id
//  Update any lead field (including status).
//  Body: any subset of lead fields.
// ─────────────────────────────────────────────────────────────────────────────
const updateLead = async (req, res, next) => {
  try {
    // Whitelist updatable fields to prevent mass-assignment attacks
    const allowed = [
      "firstName", "lastName", "email", "phone",
      "status", "source", "notes", "company", "assignedTo",
    ];

    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const lead = await Lead.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { $set: updates },
      { new: true, runValidators: true } // return updated doc + run schema validators
    )
      .populate("assignedTo", "name email")
      .populate("company",    "name");

    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found" });
    }

    res.status(200).json({ success: true, data: lead });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  PATCH /api/leads/:id/status
//  Dedicated endpoint for status-only updates (used by kanban/quick actions).
//  Body: { status: "Contacted" }
// ─────────────────────────────────────────────────────────────────────────────
const updateLeadStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const validStatuses = ["New", "Contacted", "Qualified", "Lost"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const lead = await Lead.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { $set: { status } },
      { new: true }
    )
      .populate("assignedTo", "name email")
      .populate("company",    "name");

    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found" });
    }

    res.status(200).json({ success: true, data: lead });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  DELETE /api/leads/:id
//  Soft-delete: sets isDeleted = true instead of removing the document.
//  The lead disappears from all list/search queries but remains in the DB
//  for audit purposes and can be restored if needed.
// ─────────────────────────────────────────────────────────────────────────────
const deleteLead = async (req, res, next) => {
  try {
    const lead = await Lead.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { $set: { isDeleted: true } },
      { new: true }
    );

    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found" });
    }

    res.status(200).json({
      success: true,
      message: "Lead deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

export { createLead, getLeads, getLeadById, updateLead, updateLeadStatus, deleteLead };
