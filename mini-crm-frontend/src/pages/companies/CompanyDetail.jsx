import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Button, Card, CardContent, Chip, Divider,
  Grid, IconButton, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Typography,
  Alert, Skeleton, Paper, Tooltip, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem,
} from "@mui/material";
import ArrowBackIcon  from "@mui/icons-material/ArrowBack";
import EditIcon       from "@mui/icons-material/Edit";
import DeleteIcon     from "@mui/icons-material/Delete";
import BusinessIcon   from "@mui/icons-material/Business";
import EmailIcon      from "@mui/icons-material/Email";
import PhoneIcon      from "@mui/icons-material/Phone";
import LanguageIcon   from "@mui/icons-material/Language";
import LocationIcon   from "@mui/icons-material/LocationOn";
import axiosInstance  from "../../api/axios";
import { getLeadStatusColor, formatDate, getInitials, getApiError } from "../../utils/helpers";

const INDUSTRY_OPTIONS = [
  "Technology","Finance","Healthcare","Education",
  "Retail","Manufacturing","Real Estate","Other",
];

// ── Info row helper ───────────────────────────────────────────────────────────
const InfoRow = ({ icon, label, value }) => (
  value ? (
    <Box display="flex" alignItems="center" gap={1.5} py={0.75}>
      <Box color="text.secondary" display="flex">{icon}</Box>
      <Box>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography variant="body2" fontWeight={500}>{value}</Typography>
      </Box>
    </Box>
  ) : null
);

// ── Edit Dialog ───────────────────────────────────────────────────────────────
const EditDialog = ({ open, onClose, company, onSuccess }) => {
  const [form,    setForm]    = useState({});
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (company) {
      setForm({
        name:        company.name        || "",
        industry:    company.industry    || "Other",
        website:     company.website     || "",
        phone:       company.phone       || "",
        email:       company.email       || "",
        description: company.description || "",
        address: {
          city:    company.address?.city    || "",
          country: company.address?.country || "",
        },
      });
    }
    setError("");
  }, [company, open]);

  const handle = (e) => {
    const { name, value } = e.target;
    if (name === "city" || name === "country") {
      setForm((p) => ({ ...p, address: { ...p.address, [name]: value } }));
    } else {
      setForm((p) => ({ ...p, [name]: value }));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axiosInstance.put(`/companies/${company._id}`, form);
      onSuccess(data.data);
      onClose();
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle fontWeight={700}>Edit Company</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField fullWidth required label="Company Name" name="name"
              value={form.name || ""} onChange={handle} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select fullWidth label="Industry" name="industry"
              value={form.industry || "Other"} onChange={handle}>
              {INDUSTRY_OPTIONS.map((i) => <MenuItem key={i} value={i}>{i}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Website" name="website"
              value={form.website || ""} onChange={handle} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Phone" name="phone"
              value={form.phone || ""} onChange={handle} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Email" name="email"
              value={form.email || ""} onChange={handle} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="City" name="city"
              value={form.address?.city || ""} onChange={handle} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Country" name="country"
              value={form.address?.country || ""} onChange={handle} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth multiline rows={2} label="Description" name="description"
              value={form.description || ""} onChange={handle} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const CompanyDetail = () => {
  const { id }     = useParams();
  const navigate   = useNavigate();

  const [company,     setCompany]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [editOpen,    setEditOpen]    = useState(false);
  const [deleteOpen,  setDeleteOpen]  = useState(false);
  const [deleting,    setDeleting]    = useState(false);

  const fetchCompany = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axiosInstance.get(`/companies/${id}`);
      setCompany(data.data);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCompany(); }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await axiosInstance.delete(`/companies/${id}`);
      navigate("/companies");
    } catch (err) {
      setError(getApiError(err));
      setDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading) return (
    <Box>
      <Skeleton variant="text" width={200} height={40} sx={{ mb: 2 }} />
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card><CardContent>
            <Skeleton variant="circular" width={64} height={64} sx={{ mb: 2 }} />
            <Skeleton variant="text" width="80%" />
            <Skeleton variant="text" width="50%" />
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Card><CardContent>
            <Skeleton variant="rectangular" height={200} />
          </CardContent></Card>
        </Grid>
      </Grid>
    </Box>
  );

  if (error) return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
        Back
      </Button>
      <Alert severity="error">{error}</Alert>
    </Box>
  );

  const leads = company?.leads || [];

  return (
    <Box>
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/companies")}
          color="inherit"
        >
          Back to Companies
        </Button>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined" startIcon={<EditIcon />}
            onClick={() => setEditOpen(true)}
          >
            Edit
          </Button>
          <Button
            variant="outlined" color="error" startIcon={<DeleteIcon />}
            onClick={() => setDeleteOpen(true)}
          >
            Delete
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* ── Company info card ───────────────────────────────────────────── */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={3}>
                <Avatar
                  sx={{
                    width: 64, height: 64,
                    bgcolor: "primary.main",
                    fontSize: 24, fontWeight: 700,
                  }}
                >
                  {getInitials(company.name)}
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    {company.name}
                  </Typography>
                  <Chip label={company.industry} size="small" color="primary" variant="outlined" />
                </Box>
              </Box>

              <Divider sx={{ mb: 2 }} />

              <InfoRow
                icon={<EmailIcon fontSize="small" />}
                label="Email"
                value={company.email}
              />
              <InfoRow
                icon={<PhoneIcon fontSize="small" />}
                label="Phone"
                value={company.phone}
              />
              <InfoRow
                icon={<LanguageIcon fontSize="small" />}
                label="Website"
                value={company.website}
              />
              <InfoRow
                icon={<LocationIcon fontSize="small" />}
                label="Location"
                value={[company.address?.city, company.address?.country]
                  .filter(Boolean).join(", ")}
              />

              {(company.employeeCount > 0 || company.annualRevenue > 0) && (
                <>
                  <Divider sx={{ my: 2 }} />
                  {company.employeeCount > 0 && (
                    <Box display="flex" justifyContent="space-between" py={0.5}>
                      <Typography variant="body2" color="text.secondary">Employees</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {company.employeeCount.toLocaleString()}
                      </Typography>
                    </Box>
                  )}
                  {company.annualRevenue > 0 && (
                    <Box display="flex" justifyContent="space-between" py={0.5}>
                      <Typography variant="body2" color="text.secondary">Revenue</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        ${company.annualRevenue.toLocaleString()}
                      </Typography>
                    </Box>
                  )}
                </>
              )}

              {company.description && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    {company.description}
                  </Typography>
                </>
              )}

              <Divider sx={{ my: 2 }} />
              <Typography variant="caption" color="text.secondary">
                Added by {company.createdBy?.name} · {formatDate(company.createdAt)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* ── Associated leads table ───────────────────────────────────────── */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={700}>
                  Associated Leads
                </Typography>
                <Chip
                  label={`${leads.length} lead${leads.length !== 1 ? "s" : ""}`}
                  color="primary" size="small"
                />
              </Box>

              {leads.length === 0 ? (
                <Box textAlign="center" py={6}>
                  <BusinessIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
                  <Typography color="text.secondary">No leads linked to this company</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Assign leads to this company from the Leads page
                  </Typography>
                </Box>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Assigned To</TableCell>
                        <TableCell>Created</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {leads.map((lead) => (
                        <TableRow key={lead._id} hover>
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
                            <Typography variant="body2">
                              {lead.assignedTo?.name || "—"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {formatDate(lead.createdAt)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Dialogs ──────────────────────────────────────────────────────────── */}
      <EditDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        company={company}
        onSuccess={(updated) => setCompany((prev) => ({ ...prev, ...updated }))}
      />

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs">
        <DialogTitle>Delete Company?</DialogTitle>
        <DialogContent>
          <Typography>
            Deleting <strong>{company?.name}</strong> will unlink all associated leads.
            This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)} disabled={deleting}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CompanyDetail;
