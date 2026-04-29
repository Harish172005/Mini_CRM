import Company from "../models/Company.js";
import Lead from "../models/Lead.js";

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/companies
//  Create a new company.
//  Body: { name, industry, website, phone, email, address, employeeCount,
//          annualRevenue, description }
// ─────────────────────────────────────────────────────────────────────────────
const createCompany = async (req, res, next) => {
  try {
    const {
      name, industry, website, phone, email,
      address, employeeCount, annualRevenue, description,
    } = req.body;

    // Guard: duplicate company name (case-insensitive)
    const duplicate = await Company.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });
    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: "A company with this name already exists",
      });
    }

    const company = await Company.create({
      name, industry, website, phone, email,
      address, employeeCount, annualRevenue, description,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, data: company });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/companies
//  List all companies with optional search + industry filter + pagination.
//
//  Query params:
//    page     – default 1
//    limit    – default 10, max 50
//    search   – partial match on name
//    industry – exact match
//    sortBy   – default: createdAt
//    order    – asc | desc (default: desc)
// ─────────────────────────────────────────────────────────────────────────────
const getCompanies = async (req, res, next) => {
  try {
    const {
      page     = 1,
      limit    = 10,
      search   = "",
      industry,
      sortBy   = "createdAt",
      order    = "desc",
    } = req.query;

    // ── Build filter ──────────────────────────────────────────────────────────
    const filter = {};

    if (industry) filter.industry = industry;

    if (search.trim()) {
      filter.name = new RegExp(search.trim(), "i");
    }

    // ── Pagination ────────────────────────────────────────────────────────────
    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip     = (pageNum - 1) * limitNum;

    const sortObj = { [sortBy]: order === "asc" ? 1 : -1 };

    // ── Run count + data queries in parallel ──────────────────────────────────
    const [total, companies] = await Promise.all([
      Company.countDocuments(filter),
      Company.find(filter)
        .populate("createdBy", "name email")
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum),
    ]);

    // ── Attach lead count to each company without full populate ───────────────
    // Uses a single aggregation instead of N separate queries (efficient).
    const companyIds = companies.map((c) => c._id);

    const leadCounts = await Lead.aggregate([
      {
        $match: {
          company:   { $in: companyIds },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id:   "$company",
          count: { $sum: 1 },
        },
      },
    ]);

    // Build a map: companyId → count
    const countMap = {};
    leadCounts.forEach(({ _id, count }) => {
      countMap[_id.toString()] = count;
    });

    // Merge count into each company object
    const companiesWithCount = companies.map((company) => ({
      ...company.toObject(),
      leadCount: countMap[company._id.toString()] || 0,
    }));

    res.status(200).json({
      success: true,
      data: companiesWithCount,
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
//  GET /api/companies/:id
//  Get a single company with ALL associated (non-deleted) leads populated.
//  This is the "detail" view used on the Company detail page.
// ─────────────────────────────────────────────────────────────────────────────
const getCompanyById = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id)
      .populate("createdBy", "name email")
      // Virtual populate: resolves the `leads` virtual defined in the schema.
      // Only returns leads where isDeleted === false (enforced by `match`).
      .populate({
        path:    "leads",
        select:  "firstName lastName email status source createdAt assignedTo",
        populate: {
          path:   "assignedTo",
          select: "name email",
        },
      });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    res.status(200).json({ success: true, data: company });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  PUT /api/companies/:id
//  Update company details.  Whitelists allowed fields.
// ─────────────────────────────────────────────────────────────────────────────
const updateCompany = async (req, res, next) => {
  try {
    const allowed = [
      "name", "industry", "website", "phone", "email",
      "address", "employeeCount", "annualRevenue", "description",
    ];

    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    // If name is being changed, check for duplicate
    if (updates.name) {
      const duplicate = await Company.findOne({
        name: { $regex: new RegExp(`^${updates.name}$`, "i") },
        _id:  { $ne: req.params.id }, // exclude current doc
      });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: "Another company with this name already exists",
        });
      }
    }

    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate("createdBy", "name email");

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    res.status(200).json({ success: true, data: company });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  DELETE /api/companies/:id
//  Hard-delete the company.
//  All leads linked to it have their `company` ref set to null (cascade-nullify)
//  so they are not orphaned — they remain visible but unlinked.
// ─────────────────────────────────────────────────────────────────────────────
const deleteCompany = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    // Cascade: unlink associated leads before removing the company
    await Lead.updateMany(
      { company: req.params.id },
      { $set: { company: null } }
    );

    await company.deleteOne();

    res.status(200).json({
      success: true,
      message: "Company deleted and associated leads unlinked",
    });
  } catch (err) {
    next(err);
  }
};

export { createCompany, getCompanies, getCompanyById, updateCompany, deleteCompany };
