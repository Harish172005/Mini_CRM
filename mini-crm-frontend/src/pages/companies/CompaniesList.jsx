import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Button, Card, CardContent, CardActionArea,
  Grid, TextField, MenuItem, Select, Typography,
  Alert, Skeleton, Chip, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TablePagination, Avatar,
} from "@mui/material";
import AddIcon       from "@mui/icons-material/Add";
import SearchIcon    from "@mui/icons-material/Search";
import BusinessIcon  from "@mui/icons-material/Business";
import PeopleIcon    from "@mui/icons-material/People";
import axiosInstance from "../../api/axios";
import PageHeader    from "../../components/shared/PageHeader";
import useDebounce   from "../../hooks/useDebounce";
import { getApiError, getInitials } from "../../utils/helpers";

const INDUSTRY_OPTIONS = [
  "Technology","Finance","Healthcare","Education",
  "Retail","Manufacturing","Real Estate","Other",
];

const EMPTY_FORM = {
  name: "", industry: "Other", website: "",
  phone: "", email: "", description: "",
  address: { city: "", country: "" },
};

// ── Inline Create/Edit Dialog ────────────────────────────────────────────────
const CompanyFormDialog = ({ open, onClose, onSuccess, company = null }) => {
  const isEdit = !!company;
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [errors,   setErrors]   = useState({});
  const [apiError, setApiError] = useState("");
  const [loading,  setLoading]  = useState(false);

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
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
    setApiError("");
  }, [company, open]);

  const handle = (e) => {
    const { name, value } = e.target;
    if (name === "city" || name === "country") {
      setForm((p) => ({ ...p, address: { ...p.address, [name]: value } }));
    } else {
      setForm((p) => ({ ...p, [name]: value }));
    }
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Company name is required";
    setErrors(errs);
    return !Object.keys(errs).length;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setApiError("");
    try {
      const { data } = isEdit
        ? await axiosInstance.put(`/companies/${company._id}`, form)
        : await axiosInstance.post("/companies", form);
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
      <DialogTitle fontWeight={700}>
        {isEdit ? "Edit Company" : "Add Company"}
      </DialogTitle>
      <DialogContent dividers>
        {apiError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setApiError("")}>
            {apiError}
          </Alert>
        )}
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth required label="Company Name" name="name"
              value={form.name} onChange={handle}
              error={!!errors.name} helperText={errors.name}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select fullWidth label="Industry" name="industry"
              value={form.industry} onChange={handle}
            >
              {INDUSTRY_OPTIONS.map((i) => (
                <MenuItem key={i} value={i}>{i}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth label="Website" name="website"
              value={form.website} onChange={handle}
              placeholder="https://example.com"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth label="Phone" name="phone"
              value={form.phone} onChange={handle}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth label="Email" name="email" type="email"
              value={form.email} onChange={handle}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth label="City" name="city"
              value={form.address.city} onChange={handle}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth label="Country" name="country"
              value={form.address.country} onChange={handle}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth multiline rows={2} label="Description" name="description"
              value={form.description} onChange={handle}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {isEdit ? "Save Changes" : "Create Company"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ── Company Card ─────────────────────────────────────────────────────────────
const CompanyCard = ({ company, onClick }) => (
  <Card sx={{ height: "100%" }}>
    <CardActionArea onClick={onClick} sx={{ height: "100%", p: 0 }}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Avatar sx={{ bgcolor: "primary.light", width: 46, height: 46, fontWeight: 700 }}>
            {getInitials(company.name)}
          </Avatar>
          <Box minWidth={0}>
            <Typography variant="subtitle1" fontWeight={700} noWrap>
              {company.name}
            </Typography>
            <Chip label={company.industry} size="small" variant="outlined" />
          </Box>
        </Box>

        <Box display="flex" gap={3}>
          <Box display="flex" alignItems="center" gap={0.5}>
            <PeopleIcon sx={{ fontSize: 16, color: "text.secondary" }} />
            <Typography variant="body2" color="text.secondary">
              {company.leadCount ?? 0} leads
            </Typography>
          </Box>
          {company.address?.city && (
            <Box display="flex" alignItems="center" gap={0.5}>
              <BusinessIcon sx={{ fontSize: 16, color: "text.secondary" }} />
              <Typography variant="body2" color="text.secondary" noWrap>
                {company.address.city}
              </Typography>
            </Box>
          )}
        </Box>

        {company.website && (
          <Typography
            variant="caption" color="primary"
            display="block" mt={1} noWrap
          >
            {company.website}
          </Typography>
        )}
      </CardContent>
    </CardActionArea>
  </Card>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
const CompaniesList = () => {
  const navigate = useNavigate();

  const [companies,   setCompanies]   = useState([]);
  const [total,       setTotal]       = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [search,      setSearch]      = useState("");
  const [industry,    setIndustry]    = useState("");
  const [page,        setPage]        = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);
  const [modalOpen,   setModalOpen]   = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axiosInstance.get("/companies", {
        params: {
          page:  page + 1,
          limit: rowsPerPage,
          search: debouncedSearch,
          ...(industry && { industry }),
        },
      });
      setCompanies(data.data);
      setTotal(data.pagination.total);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, debouncedSearch, industry]);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);
  useEffect(() => { setPage(0); }, [debouncedSearch, industry]);

  const handleSuccess = (saved) => {
    setCompanies((prev) => {
      const idx = prev.findIndex((c) => c._id === saved._id);
      if (idx >= 0) { const u = [...prev]; u[idx] = saved; return u; }
      return [saved, ...prev];
    });
    setTotal((t) => t + 1);
  };

  return (
    <Box>
      <PageHeader
        title="Companies"
        subtitle={`${total} companies`}
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setModalOpen(true)}>
            Add Company
          </Button>
        }
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Filters */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <TextField
          placeholder="Search companies…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small" sx={{ minWidth: 240 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <Select
          value={industry} onChange={(e) => setIndustry(e.target.value)}
          displayEmpty size="small" sx={{ minWidth: 170 }}
        >
          <MenuItem value="">All Industries</MenuItem>
          {INDUSTRY_OPTIONS.map((i) => (
            <MenuItem key={i} value={i}>{i}</MenuItem>
          ))}
        </Select>
      </Box>

      {/* Grid */}
      <Grid container spacing={3}>
        {loading
          ? Array.from({ length: rowsPerPage }).map((_, i) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
                <Card><CardContent>
                  <Skeleton variant="circular" width={46} height={46} sx={{ mb: 1 }} />
                  <Skeleton variant="text" width="70%" />
                  <Skeleton variant="text" width="40%" />
                </CardContent></Card>
              </Grid>
            ))
          : companies.length === 0
          ? (
            <Grid item xs={12}>
              <Box textAlign="center" py={8}>
                <BusinessIcon sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
                <Typography color="text.secondary">No companies found</Typography>
              </Box>
            </Grid>
          )
          : companies.map((company) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={company._id}>
                <CompanyCard
                  company={company}
                  onClick={() => navigate(`/companies/${company._id}`)}
                />
              </Grid>
            ))
        }
      </Grid>

      {/* Pagination */}
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

      <CompanyFormDialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </Box>
  );
};

export default CompaniesList;
