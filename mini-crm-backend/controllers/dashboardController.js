import Lead from "../models/Lead.js";
import Task from "../models/Task.js";
import Company from "../models/Company.js";

// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/dashboard/stats
//  Returns all four KPI cards in a single request.
//
//  All aggregations run in PARALLEL via Promise.all — total latency equals
//  the slowest single query, not the sum of all queries.
//
//  Metrics returned:
//    totalLeads      – all non-deleted leads
//    qualifiedLeads  – leads with status === "Qualified"
//    tasksDueToday   – non-completed tasks whose dueDate falls on today
//    completedTasks  – all tasks with status === "Completed"
//    totalCompanies  – total company count
//    recentLeads     – last 5 leads (for activity feed)
//    leadsByStatus   – breakdown of lead counts per status
//    tasksByPriority – breakdown of task counts per priority
// ─────────────────────────────────────────────────────────────────────────────
const getDashboardStats = async (req, res, next) => {
  try {
    // ── "Today" date range ────────────────────────────────────────────────────
    // We build a range [start of today, start of tomorrow) so that any dueDate
    // within the calendar day counts — regardless of the stored time component.
    const now             = new Date();
    const startOfToday    = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    // ── Run all aggregations in parallel ──────────────────────────────────────
    const [
      totalLeads,
      qualifiedLeads,
      tasksDueToday,
      completedTasks,
      totalCompanies,
      recentLeads,
      leadsByStatus,
      tasksByPriority,
    ] = await Promise.all([

      // 1. Total active (non-deleted) leads
      Lead.countDocuments({ isDeleted: false }),

      // 2. Qualified leads only
      Lead.countDocuments({ isDeleted: false, status: "Qualified" }),

      // 3. Tasks due today that are NOT yet completed
      Task.countDocuments({
        dueDate: { $gte: startOfToday, $lt: startOfTomorrow },
        status:  { $ne: "Completed" },
      }),

      // 4. All completed tasks
      Task.countDocuments({ status: "Completed" }),

      // 5. Total companies
      Company.countDocuments({}),

      // 6. 5 most recently created leads (activity feed)
      Lead.find({ isDeleted: false })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("assignedTo", "name email")
        .populate("company",    "name")
        .select("firstName lastName email status source createdAt"),

      // 7. Lead count grouped by status (for pie / bar chart)
      Lead.aggregate([
        { $match: { isDeleted: false } },
        {
          $group: {
            _id:   "$status",
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // 8. Task count grouped by priority (for chart)
      Task.aggregate([
        {
          $group: {
            _id:   "$priority",
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    // ── Shape aggregation arrays into clean key-value maps ────────────────────
    // e.g. [{ _id: "New", count: 5 }] → { New: 5, Contacted: 2, ... }
    const leadStatusMap = {};
    leadsByStatus.forEach(({ _id, count }) => {
      leadStatusMap[_id] = count;
    });

    const taskPriorityMap = {};
    tasksByPriority.forEach(({ _id, count }) => {
      taskPriorityMap[_id] = count;
    });

    res.status(200).json({
      success: true,
      data: {
        // ── KPI cards ─────────────────────────────────────────────────────────
        kpis: {
          totalLeads,
          qualifiedLeads,
          tasksDueToday,
          completedTasks,
          totalCompanies,
        },

        // ── Charts ────────────────────────────────────────────────────────────
        leadsByStatus:   leadStatusMap,   // { New: N, Contacted: N, ... }
        tasksByPriority: taskPriorityMap, // { Low: N, Medium: N, High: N }

        // ── Activity feed ─────────────────────────────────────────────────────
        recentLeads,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/dashboard/tasks-due-today
//  Returns the FULL list of tasks due today (not just the count).
//  Used when a user clicks the "Tasks Due Today" KPI card to drill down.
// ─────────────────────────────────────────────────────────────────────────────
const getTasksDueToday = async (req, res, next) => {
  try {
    const now             = new Date();
    const startOfToday    = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const tasks = await Task.find({
      dueDate: { $gte: startOfToday, $lt: startOfTomorrow },
      status:  { $ne: "Completed" },
    })
      .populate("lead",       "firstName lastName email")
      .populate("assignedTo", "name email")
      .sort({ priority: -1, createdAt: 1 }); // High priority first

    res.status(200).json({
      success: true,
      count:   tasks.length,
      data:    tasks,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/dashboard/lead-trend
//  Returns lead creation counts grouped by day for the last 30 days.
//  Used to render a trend line chart on the dashboard.
// ─────────────────────────────────────────────────────────────────────────────
const getLeadTrend = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trend = await Lead.aggregate([
      {
        // Only active leads created in the last 30 days
        $match: {
          isDeleted: false,
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        // Group by calendar date (year + month + day)
        $group: {
          _id: {
            year:  { $year:       "$createdAt" },
            month: { $month:      "$createdAt" },
            day:   { $dayOfMonth: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        // Sort chronologically
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
      },
      {
        // Shape into { date: "YYYY-MM-DD", count: N }
        $project: {
          _id: 0,
          date: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: {
                $dateFromParts: {
                  year:  "$_id.year",
                  month: "$_id.month",
                  day:   "$_id.day",
                },
              },
            },
          },
          count: 1,
        },
      },
    ]);

    res.status(200).json({ success: true, data: trend });
  } catch (err) {
    next(err);
  }
};

export { getDashboardStats, getTasksDueToday, getLeadTrend };
