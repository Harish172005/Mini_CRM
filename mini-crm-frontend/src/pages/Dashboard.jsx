import React, { useEffect, useState } from "react";
import {
  Grid, Card, CardContent, Typography, Box,
  Chip, Avatar, Divider, Alert, Skeleton,
} from "@mui/material";
import PeopleIcon      from "@mui/icons-material/People";
import StarIcon        from "@mui/icons-material/Star";
import TodayIcon       from "@mui/icons-material/Today";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import BusinessIcon    from "@mui/icons-material/Business";
import axiosInstance   from "../api/axios";
import PageHeader      from "../components/shared/PageHeader";
import {
  getLeadStatusColor, formatDate, getInitials, getApiError,
} from "../utils/helpers";
import { useAuth } from "../context/AuthContext";

// ── KPI card configuration ────────────────────────────────────────────────────
const KPI_CONFIG = [
  {
    key:     "totalLeads",
    label:   "Total Leads",
    icon:    <PeopleIcon sx={{ fontSize: 32 }} />,
    color:   "#3f51b5",
    bg:      "#e8eaf6",
  },
  {
    key:     "qualifiedLeads",
    label:   "Qualified Leads",
    icon:    <StarIcon sx={{ fontSize: 32 }} />,
    color:   "#43a047",
    bg:      "#e8f5e9",
  },
  {
    key:     "tasksDueToday",
    label:   "Tasks Due Today",
    icon:    <TodayIcon sx={{ fontSize: 32 }} />,
    color:   "#fb8c00",
    bg:      "#fff3e0",
  },
  {
    key:     "completedTasks",
    label:   "Completed Tasks",
    icon:    <CheckCircleIcon sx={{ fontSize: 32 }} />,
    color:   "#00897b",
    bg:      "#e0f2f1",
  },
  {
    key:     "totalCompanies",
    label:   "Companies",
    icon:    <BusinessIcon sx={{ fontSize: 32 }} />,
    color:   "#8e24aa",
    bg:      "#f3e5f5",
  },
];

// ── KPI Card component ────────────────────────────────────────────────────────
const KpiCard = ({ label, value, icon, color, bg, loading }) => (
  <Card sx={{ height: "100%" }}>
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="body2" color="text.secondary" fontWeight={500} gutterBottom>
            {label}
          </Typography>
          {loading ? (
            <Skeleton variant="text" width={60} height={48} />
          ) : (
            <Typography variant="h4" fontWeight={800} color={color}>
              {value ?? 0}
            </Typography>
          )}
        </Box>
        <Avatar sx={{ bgcolor: bg, width: 52, height: 52 }}>
          <Box color={color}>{icon}</Box>
        </Avatar>
      </Box>
    </CardContent>
  </Card>
);

// ── Lead status breakdown bar ─────────────────────────────────────────────────
const StatusBreakdown = ({ data, total, loading }) => {
  const statuses = ["New", "Contacted", "Qualified", "Lost"];
  const colors   = { New: "#3f51b5", Contacted: "#1e88e5", Qualified: "#43a047", Lost: "#e53935" };

  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="h6" fontWeight={700} mb={2}>
          Leads by Status
        </Typography>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={32} sx={{ mb: 1, borderRadius: 1 }} />
          ))
        ) : (
          statuses.map((s) => {
            const count = data[s] || 0;
            const pct   = total ? Math.round((count / total) * 100) : 0;
            return (
              <Box key={s} mb={1.5}>
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography variant="body2" fontWeight={500}>{s}</Typography>
                  <Typography variant="body2" color="text.secondary">{count} ({pct}%)</Typography>
                </Box>
                <Box
                  sx={{
                    height: 8, borderRadius: 4,
                    bgcolor: "grey.100", overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      height: "100%", width: `${pct}%`,
                      bgcolor: colors[s],
                      borderRadius: 4,
                      transition: "width 0.8s ease",
                    }}
                  />
                </Box>
              </Box>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};

// ── Recent leads activity feed ────────────────────────────────────────────────
const RecentLeads = ({ leads, loading }) => (
  <Card sx={{ height: "100%" }}>
    <CardContent>
      <Typography variant="h6" fontWeight={700} mb={2}>
        Recent Leads
      </Typography>
      {loading ? (
        Array.from({ length: 5 }).map((_, i) => (
          <Box key={i} display="flex" gap={2} mb={2}>
            <Skeleton variant="circular" width={40} height={40} />
            <Box flex={1}>
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="40%" />
            </Box>
          </Box>
        ))
      ) : leads.length === 0 ? (
        <Typography color="text.secondary" variant="body2">No leads yet</Typography>
      ) : (
        leads.map((lead, idx) => (
          <React.Fragment key={lead._id}>
            <Box display="flex" alignItems="center" gap={2} py={1}>
              <Avatar sx={{ width: 38, height: 38, bgcolor: "primary.light", fontSize: 14 }}>
                {getInitials(`${lead.firstName} ${lead.lastName}`)}
              </Avatar>
              <Box flex={1} minWidth={0}>
                <Typography variant="body2" fontWeight={600} noWrap>
                  {lead.firstName} {lead.lastName}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {lead.email}
                </Typography>
              </Box>
              <Box textAlign="right">
                <Chip
                  label={lead.status}
                  color={getLeadStatusColor(lead.status)}
                  size="small"
                  sx={{ mb: 0.5 }}
                />
                <Typography variant="caption" color="text.secondary" display="block">
                  {formatDate(lead.createdAt)}
                </Typography>
              </Box>
            </Box>
            {idx < leads.length - 1 && <Divider />}
          </React.Fragment>
        ))
      )}
    </CardContent>
  </Card>
);

// ── Main Dashboard component ──────────────────────────────────────────────────
const Dashboard = () => {
  const { user } = useAuth();
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    axiosInstance
      .get("/dashboard/stats")
      .then(({ data }) => setStats(data.data))
      .catch((err)   => setError(getApiError(err)))
      .finally(()    => setLoading(false));
  }, []);

  const kpis        = stats?.kpis         || {};
  const recentLeads = stats?.recentLeads  || [];
  const leadStatus  = stats?.leadsByStatus || {};
  const totalLeads  = kpis.totalLeads || 0;

  return (
    <Box>
      <PageHeader
        title={`Welcome back, ${user?.name?.split(" ")[0]} 👋`}
        subtitle="Here's what's happening with your sales pipeline today."
      />

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
      <Grid container spacing={3} mb={4}>
        {KPI_CONFIG.map(({ key, label, icon, color, bg }) => (
          <Grid item xs={12} sm={6} md={4} lg={2.4} key={key}>
            <KpiCard
              label={label}
              value={kpis[key]}
              icon={icon}
              color={color}
              bg={bg}
              loading={loading}
            />
          </Grid>
        ))}
      </Grid>

      {/* ── Charts + Activity ─────────────────────────────────────────────── */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <StatusBreakdown
            data={leadStatus}
            total={totalLeads}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} md={7}>
          <RecentLeads leads={recentLeads} loading={loading} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
