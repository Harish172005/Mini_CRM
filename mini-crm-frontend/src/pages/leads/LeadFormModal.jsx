import React, { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Grid, MenuItem, Alert,
  CircularProgress, IconButton, Typography,
} from "@mui/material";
import CloseIcon    from "@mui/icons-material/Close";
import axiosInstance from "../../api/axios";
import { getApiError } from "../../utils/helpers";

const STATUS_OPTIONS = ["New", "Contacted", "Qualified", "Lost"];
const SOURCE_OPTIONS = ["Website", "Referral", "LinkedIn", "Cold Call", "Other"];

const EMPTY_FORM = {
  firstName: "", lastName: "",  email:  "",
  phone:     "", status:  "New", source: "Other",
  notes:     "", company: "",
};

/**
 * LeadFormModal
 * ─────────────
 * Used for both Add (lead = null) and Edit (lead = existing lead object).
 * Props:
 *   open       – boolean
 *   onClose    – () => void
 *   onSuccess  – (savedLead) => void  — called after successful save
 *   lead       – lead object to edit, or null for create
 *   companies  – array of { _id, name } for company dropdown
 */
const LeadFormModal = ({ open, onClose, onSuccess, lead = null, companies = [] }) => {
  const isEdit = !!lead;

  const [form,    setForm]    = useState(EMPTY_FORM);
  const [errors,  setErrors]  = useState({});
  const [apiError,setApiError]= useState("");
  const [loading, setLoading] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (lead) {
      setForm({
        firstName: lead.firstName || "",
        lastName:  lead.lastName  || "",
        email:     lead.email     || "",
        phone:     lead.phone     || "",
        status:    lead.status    || "New",
        source:    lead.source    || "Other",
        notes:     lead.notes     || "",
        company:   lead.company?._id || lead.company || "",
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
    setApiError("");
  }, [lead, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // ── Client-side validation ─────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = "First name required";
    if (!form.lastName.trim())  errs.lastName  = "Last name required";
    if (!form.email.trim())     errs.email     = "Email required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Invalid email";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setApiError("");

    // Exclude empty optional fields
    const payload = { ...form };
    if (!payload.company) delete payload.company;
    if (!payload.phone)   delete payload.phone;

    try {
      const { data } = isEdit
        ? await axiosInstance.put(`/leads/${lead._id}`, payload)
        : await axiosInstance.post("/leads", payload);

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
      <DialogTitle>
        <Typography fontWeight={700}>{isEdit ? "Edit Lead" : "Add New Lead"}</Typography>
        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", right: 12, top: 12 }}
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {apiError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setApiError("")}>
            {apiError}
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth label="First Name" name="firstName"
              value={form.firstName} onChange={handleChange}
              error={!!errors.firstName} helperText={errors.firstName}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth label="Last Name" name="lastName"
              value={form.lastName} onChange={handleChange}
              error={!!errors.lastName} helperText={errors.lastName}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth label="Email" name="email" type="email"
              value={form.email} onChange={handleChange}
              error={!!errors.email} helperText={errors.email}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth label="Phone" name="phone"
              value={form.phone} onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select fullWidth label="Status" name="status"
              value={form.status} onChange={handleChange}
            >
              {STATUS_OPTIONS.map((s) => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select fullWidth label="Source" name="source"
              value={form.source} onChange={handleChange}
            >
              {SOURCE_OPTIONS.map((s) => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField
              select fullWidth label="Company (optional)" name="company"
              value={form.company} onChange={handleChange}
            >
              <MenuItem value="">— None —</MenuItem>
              {companies.map((c) => (
                <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth label="Notes" name="notes"
              value={form.notes} onChange={handleChange}
              multiline rows={3}
              placeholder="Add any relevant notes..."
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {isEdit ? "Save Changes" : "Create Lead"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LeadFormModal;
