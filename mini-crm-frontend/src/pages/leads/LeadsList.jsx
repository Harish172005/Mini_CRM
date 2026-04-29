import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Button, Chip, IconButton, MenuItem, Paper,
  Select, Table, TableBody, TableCell, TableContainer,
  TableHead, TablePagination, TableRow, TextField,
  Tooltip, Typography, Alert, Skeleton, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from "@mui/material";
import AddIcon        from "@mui/icons-material/Add";
import EditIcon       from "@mui/icons-material/Edit";
import DeleteIcon     from "@mui/icons-material/Delete";
import SearchIcon     from "@mui/icons-material/Search";
import axiosInstance  from "../../api/axios";
import PageHeader     from "../../components/shared/PageHeader";
import LeadFormModal  from "./LeadFormModal";
import useDebounce    from "../../hooks/useDebounce";
import { getLeadStatusColor, formatDate, getApiError } from "../../utils/helpers";

const STATUS_OPTIONS = ["", "New", "Contacted", "Qualified", "Lost"];
const ROWS_PER_PAGE  = [5, 10, 25];

/**
 * LeadsList
 * ─────────
 * Full leads management page.
 * Features: paginated table, debounced search, status filter,
 *           add/edit modal, soft-delete with confirmation dialog.
 */
const LeadsList = () => {
  // ── Data state ─────────────────────────────────────────────────────────────
  const [leads,      setLeads]      = useState([]);
  const [companies,  setCompanies]  = useState([]);
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");

  // ── Filters & pagination ───────────────────────────────────────────────────
  const [search,     setSearch]     = useState("");
  const [status,     setStatus]     = useState("");
  const [page,       setPage]       = useState(0);   // MUI table is 0-indexed
  const [rowsPerPage,setRowsPerPage]= useState(10);

  const debouncedSearch = useDebounce(search, 400);

  // ── Modal state ────────────────────────────────────────────────────────────
  const [modalOpen,  setModalOpen]  = useState(false);
  const [editLead,   setEditLead]   = useState(null);

  // ── Delete confirm ─────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,     setDeleting]     = useState(false);

  // ── Fetch leads ────────────────────────────────────────────────────────────
  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        page:   page + 1,       // API is 1-indexed
        limit:  rowsPerPage,
        search: debouncedSearch,
        ...(status && { status }),
      };
      const { data } = await axiosInstance.get("/leads", { params });
      setLeads(data.data);
      setTotal(data.pagination.total);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, debouncedSearch, status]);

  // Fetch companies for the form dropdown (once)
  useEffect(() => {
    axiosInstance
      .get("/companies", { params: { limit: 100 } })
      .then(({ data }) => setCompanies(data.data))
      .catch(() => {});
  }, []);

  // Re-fetch whenever filters / page change
  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  // Reset to page 0 when search or filter changes
  useEffect(() => { setPage(0); }, [debouncedSearch, status]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const openAdd  = ()     => { setEditLead(null); setModalOpen(true); };
  const openEdit = (lead) => { setEditLead(lead); setModalOpen(true); };

  const handleModalSuccess = (saved) => {
    // Update row in-place or prepend new
    setLeads((prev) => {
      const idx = prev.findIndex((l) => l._id === saved._id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = saved;
        return updated;
      }
      return [saved, ...prev];
    });
    setTotal((t) => t + (editLead ? 0 : 1));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axiosInstance.delete(`/leads/${deleteTarget._id}`);
      setLeads((prev) => prev.filter((l) => l._id !== deleteTarget._id));
      setTotal((t) => t - 1);
      setDeleteTarget(null);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setDeleting(false);
    }
  };

  // ── Skeleton rows while loading ────────────────────────────────────────────
  const skeletonRows = Array.from({ length: rowsPerPage }).map((_, i) => (
    <TableRow key={i}>
      {Array.from({ length: 6 }).map((__, j) => (
        <TableCell key={j}><Skeleton variant="text" /></TableCell>
      ))}
    </TableRow>
  ));

  return (
    <Box>
      <PageHeader
        title="Leads"
        subtitle={`${total} total leads`}
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>
            Add Lead
          </Button>
        }
      />

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <TextField
          placeholder="Search name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ minWidth: 240 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          displayEmpty
          size="small"
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">All Statuses</MenuItem>
          {STATUS_OPTIONS.filter(Boolean).map((s) => (
            <MenuItem key={s} value={s}>{s}</MenuItem>
          ))}
        </Select>
      </Box>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Source</TableCell>
              <TableCell>Company</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading
              ? skeletonRows
              : leads.length === 0
              ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No leads found</Typography>
                  </TableCell>
                </TableRow>
              )
              : leads.map((lead) => (
                <TableRow
                  key={lead._id}
                  hover
                  sx={{ "&:last-child td": { border: 0 } }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {lead.firstName} {lead.lastName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {lead.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={lead.status}
                      color={getLeadStatusColor(lead.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{lead.source}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {lead.company?.name || "—"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(lead.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => openEdit(lead)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setDeleteTarget(lead)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>

        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={ROWS_PER_PAGE}
        />
      </TableContainer>

      {/* ── Add/Edit Modal ───────────────────────────────────────────────────── */}
      <LeadFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleModalSuccess}
        lead={editLead}
        companies={companies}
      />

      {/* ── Delete Confirm Dialog ────────────────────────────────────────────── */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs">
        <DialogTitle>Delete Lead?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete{" "}
            <strong>{deleteTarget?.firstName} {deleteTarget?.lastName}</strong>?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LeadsList;
