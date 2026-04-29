import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Button, Card, CardContent, Chip, Grid,
  IconButton, MenuItem, Select, Typography, Alert,
  Skeleton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, TablePagination,
  Tooltip, Divider, InputAdornment,
} from "@mui/material";
import AddIcon       from "@mui/icons-material/Add";
import EditIcon      from "@mui/icons-material/Edit";
import DeleteIcon    from "@mui/icons-material/Delete";
import CheckIcon     from "@mui/icons-material/CheckCircle";
import SearchIcon    from "@mui/icons-material/Search";
import axiosInstance from "../../api/axios";
import PageHeader    from "../../components/shared/PageHeader";
import useDebounce   from "../../hooks/useDebounce";
import { useAuth }   from "../../context/AuthContext";
import {
  getTaskStatusColor, getTaskPriorityColor,
  formatDate, isOverdue, getApiError,
} from "../../utils/helpers";

const STATUS_OPTIONS   = ["Pending", "In Progress", "Completed"];
const PRIORITY_OPTIONS = ["Low", "Medium", "High"];

const EMPTY_FORM = {
  title: "", description: "", dueDate: "",
  priority: "Medium", lead: "", assignedTo: "",
};

// ── Task Form Dialog (Create / Edit) ─────────────────────────────────────────
const TaskFormDialog = ({ open, onClose, onSuccess, task = null, leads = [], users = [] }) => {
  const isEdit = !!task;
  const { user } = useAuth();

  const [form,     setForm]     = useState(EMPTY_FORM);
  const [errors,   setErrors]   = useState({});
  const [apiError, setApiError] = useState("");
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    if (task) {
      setForm({
        title:       task.title             || "",
        description: task.description       || "",
        dueDate:     task.dueDate
          ? new Date(task.dueDate).toISOString().split("T")[0]
          : "",
        priority:    task.priority          || "Medium",
        lead:        task.lead?._id         || task.lead    || "",
        assignedTo:  task.assignedTo?._id   || task.assignedTo || "",
      });
    } else {
      setForm({ ...EMPTY_FORM, assignedTo: user?._id || "" });
    }
    setErrors({});
    setApiError("");
  }, [task, open, user]);

  const handle = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title   = "Title is required";
    if (!form.dueDate)      errs.dueDate = "Due date is required";
    if (!form.lead)         errs.lead    = "Lead is required";
    setErrors(errs);
    return !Object.keys(errs).length;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setApiError("");
    try {
      const payload = { ...form };
      if (!payload.assignedTo) delete payload.assignedTo;
      const { data } = isEdit
        ? await axiosInstance.put(`/tasks/${task._id}`, payload)
        : await axiosInstance.post("/tasks", payload);
      onSuccess(data.data);
      onClose();
    } catch (err) {
      setApiError(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle fontWeight={700}>{isEdit ? "Edit Task" : "Create Task"}</DialogTitle>
      <DialogContent dividers>
        {apiError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setApiError("")}>
            {apiError}
          </Alert>
        )}
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth required label="Task Title" name="title"
              value={form.title} onChange={handle}
              error={!!errors.title} helperText={errors.title}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth multiline rows={2} label="Description" name="description"
              value={form.description} onChange={handle}
              placeholder="Describe the task..."
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth required label="Due Date" name="dueDate"
              type="date" value={form.dueDate} onChange={handle}
              error={!!errors.dueDate} helperText={errors.dueDate}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select fullWidth label="Priority" name="priority"
              value={form.priority} onChange={handle}
            >
              {PRIORITY_OPTIONS.map((p) => (
                <MenuItem key={p} value={p}>{p}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField
              select fullWidth required label="Linked Lead" name="lead"
              value={form.lead} onChange={handle}
              error={!!errors.lead} helperText={errors.lead}
            >
              <MenuItem value="">— Select a lead —</MenuItem>
              {leads.map((l) => (
                <MenuItem key={l._id} value={l._id}>
                  {l.firstName} {l.lastName} ({l.email})
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField
              select fullWidth label="Assign To" name="assignedTo"
              value={form.assignedTo} onChange={handle}
            >
              {users.map((u) => (
                <MenuItem key={u._id} value={u._id}>{u.name} ({u.email})</MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {isEdit ? "Save Changes" : "Create Task"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ── Status Update Dialog ──────────────────────────────────────────────────────
const StatusDialog = ({ open, onClose, task, onSuccess }) => {
  const [status,  setStatus]  = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (task) { setStatus(task.status); setError(""); }
  }, [task, open]);

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axiosInstance.patch(`/tasks/${task._id}/status`, { status });
      onSuccess(data.data);
      onClose();
    } catch (err) {
      // 403 = not the assignee — show clearly
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle fontWeight={700}>Update Task Status</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Typography variant="body2" color="text.secondary" mb={2}>
          Only the assigned user can update task status.
        </Typography>
        <TextField
          select fullWidth label="New Status"
          value={status} onChange={(e) => setStatus(e.target.value)}
        >
          {STATUS_OPTIONS.map((s) => (
            <MenuItem key={s} value={s}>{s}</MenuItem>
          ))}
        </TextField>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          Update
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ── Task Card ─────────────────────────────────────────────────────────────────
const TaskCard = ({ task, currentUserId, onEdit, onDelete, onStatusClick }) => {
  const overdue     = isOverdue(task.dueDate) && task.status !== "Completed";
  const isAssignee  = task.assignedTo?._id === currentUserId;

  return (
    <Card
      sx={{
        height: "100%",
        borderLeft: `4px solid`,
        borderLeftColor:
          task.priority === "High"   ? "error.main"   :
          task.priority === "Medium" ? "warning.main"  : "success.main",
        opacity: task.status === "Completed" ? 0.75 : 1,
      }}
    >
      <CardContent>
        {/* Title + actions */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Typography
            variant="subtitle2" fontWeight={700} sx={{ flex: 1, mr: 1 }}
            style={{ textDecoration: task.status === "Completed" ? "line-through" : "none" }}
          >
            {task.title}
          </Typography>
          <Box display="flex" gap={0.5} flexShrink={0}>
            <Tooltip title={isAssignee ? "Update Status" : "Only assignee can update status"}>
              <span>
                <IconButton
                  size="small" color="success"
                  onClick={() => onStatusClick(task)}
                >
                  <CheckIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <IconButton size="small" onClick={() => onEdit(task)}>
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" color="error" onClick={() => onDelete(task)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {task.description && (
          <Typography variant="body2" color="text.secondary" mb={1.5} noWrap>
            {task.description}
          </Typography>
        )}

        <Box display="flex" gap={1} flexWrap="wrap" mb={1.5}>
          <Chip
            label={task.status}
            color={getTaskStatusColor(task.status)}
            size="small"
          />
          <Chip
            label={task.priority}
            color={getTaskPriorityColor(task.priority)}
            size="small"
            variant="outlined"
          />
        </Box>

        <Divider sx={{ mb: 1.5 }} />

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Lead: <strong>{task.lead?.firstName} {task.lead?.lastName}</strong>
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Assigned: <strong>{task.assignedTo?.name || "—"}</strong>
            </Typography>
          </Box>
          <Typography
            variant="caption"
            fontWeight={600}
            color={overdue ? "error.main" : "text.secondary"}
          >
            {overdue ? "⚠ " : ""}{formatDate(task.dueDate)}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const TasksPage = () => {
  const { user } = useAuth();

  const [tasks,       setTasks]       = useState([]);
  const [leads,       setLeads]       = useState([]);
  const [users,       setUsers]       = useState([]);
  const [total,       setTotal]       = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");

  // Filters
  const [search,      setSearch]      = useState("");
  const [status,      setStatus]      = useState("");
  const [priority,    setPriority]    = useState("");
  const [myTasks,     setMyTasks]     = useState(false);
  const [page,        setPage]        = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);

  const debouncedSearch = useDebounce(search, 400);

  // Modal state
  const [formOpen,     setFormOpen]     = useState(false);
  const [editTask,     setEditTask]     = useState(null);
  const [statusTask,   setStatusTask]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,     setDeleting]     = useState(false);

  // Fetch support data once
  useEffect(() => {
    axiosInstance.get("/leads",   { params: { limit: 200 } })
      .then(({ data }) => setLeads(data.data)).catch(() => {});

    // We re-use /auth/me to get current user + fetch all via a workaround:
    // In a real app you'd have GET /api/users; here we seed from leads' assignedTo
  }, []);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axiosInstance.get("/tasks", {
        params: {
          page:  page + 1,
          limit: rowsPerPage,
          ...(status   && { status }),
          ...(priority && { priority }),
          ...(myTasks  && { assignedTo: "me" }),
        },
      });
      setTasks(data.data);
      setTotal(data.pagination.total);

      // Extract unique users from tasks for the assignee dropdown
      const usersMap = {};
      data.data.forEach((t) => {
        if (t.assignedTo?._id) usersMap[t.assignedTo._id] = t.assignedTo;
        if (t.createdBy?._id)  usersMap[t.createdBy._id]  = t.createdBy;
      });
      setUsers(Object.values(usersMap));
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, status, priority, myTasks]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);
  useEffect(() => { setPage(0); }, [status, priority, myTasks, debouncedSearch]);

  // Handlers
  const openCreate = ()     => { setEditTask(null); setFormOpen(true); };
  const openEdit   = (task) => { setEditTask(task); setFormOpen(true); };

  const handleFormSuccess = (saved) => {
    setTasks((prev) => {
      const idx = prev.findIndex((t) => t._id === saved._id);
      if (idx >= 0) { const u = [...prev]; u[idx] = saved; return u; }
      return [saved, ...prev];
    });
    if (!editTask) setTotal((t) => t + 1);
  };

  const handleStatusSuccess = (updated) => {
    setTasks((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await axiosInstance.delete(`/tasks/${deleteTarget._id}`);
      setTasks((prev) => prev.filter((t) => t._id !== deleteTarget._id));
      setTotal((t) => t - 1);
      setDeleteTarget(null);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setDeleting(false);
    }
  };

  // Client-side search filter (lightweight — API doesn't support task search)
  const displayed = debouncedSearch
    ? tasks.filter((t) =>
        t.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        `${t.lead?.firstName} ${t.lead?.lastName}`
          .toLowerCase().includes(debouncedSearch.toLowerCase())
      )
    : tasks;

  return (
    <Box>
      <PageHeader
        title="Tasks"
        subtitle={`${total} total tasks`}
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Create Task
          </Button>
        }
      />

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

      {/* Filters */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap" alignItems="center">
        <TextField
          placeholder="Search tasks or leads…"
          value={search} onChange={(e) => setSearch(e.target.value)}
          size="small" sx={{ minWidth: 220 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <Select
          value={status} onChange={(e) => setStatus(e.target.value)}
          displayEmpty size="small" sx={{ minWidth: 150 }}
        >
          <MenuItem value="">All Statuses</MenuItem>
          {STATUS_OPTIONS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </Select>
        <Select
          value={priority} onChange={(e) => setPriority(e.target.value)}
          displayEmpty size="small" sx={{ minWidth: 140 }}
        >
          <MenuItem value="">All Priorities</MenuItem>
          {PRIORITY_OPTIONS.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
        </Select>
        <Button
          variant={myTasks ? "contained" : "outlined"}
          size="small"
          onClick={() => setMyTasks((v) => !v)}
        >
          My Tasks
        </Button>
      </Box>

      {/* Task Cards Grid */}
      <Grid container spacing={3}>
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Card><CardContent>
                  <Skeleton variant="text" width="80%" height={28} />
                  <Skeleton variant="text" width="50%" />
                  <Skeleton variant="rectangular" height={60} sx={{ mt: 1 }} />
                </CardContent></Card>
              </Grid>
            ))
          : displayed.length === 0
          ? (
            <Grid item xs={12}>
              <Box textAlign="center" py={8}>
                <Typography color="text.secondary" variant="h6">No tasks found</Typography>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  Try adjusting your filters or create a new task
                </Typography>
              </Box>
            </Grid>
          )
          : displayed.map((task) => (
              <Grid item xs={12} sm={6} md={4} key={task._id}>
                <TaskCard
                  task={task}
                  currentUserId={user?._id || user?.id}
                  onEdit={openEdit}
                  onDelete={setDeleteTarget}
                  onStatusClick={setStatusTask}
                />
              </Grid>
            ))
        }
      </Grid>

      {total > 0 && (
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[12, 24, 48]}
          sx={{ mt: 2 }}
        />
      )}

      {/* Dialogs */}
      <TaskFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={handleFormSuccess}
        task={editTask}
        leads={leads}
        users={users}
      />

      <StatusDialog
        open={!!statusTask}
        onClose={() => setStatusTask(null)}
        task={statusTask}
        onSuccess={handleStatusSuccess}
      />

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs">
        <DialogTitle>Delete Task?</DialogTitle>
        <DialogContent>
          <Typography>
            Delete <strong>"{deleteTarget?.title}"</strong>? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TasksPage;
