import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Box, Card, CardContent, TextField, Button,
  Typography, Alert, InputAdornment, IconButton, CircularProgress,
} from "@mui/material";
import PersonIcon      from "@mui/icons-material/Person";
import EmailIcon       from "@mui/icons-material/Email";
import LockIcon        from "@mui/icons-material/Lock";
import VisibilityIcon  from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useAuth }     from "../context/AuthContext";
import { getApiError } from "../utils/helpers";

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Enter a valid email";
    if (!form.password) errs.password = "Password is required";
    else if (form.password.length < 6) errs.password = "Minimum 6 characters";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setApiError("");

    try {
      await register(form.name, form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setApiError(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      minHeight="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      sx={{ background: "linear-gradient(135deg, #3f51b5 0%, #002984 100%)", px: 2 }}
    >
      <Card sx={{ width: "100%", maxWidth: 420, borderRadius: 3 }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Box textAlign="center" mb={4}>
            <Typography variant="h4" fontWeight={800} color="primary">Mini CRM</Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>Create your account</Typography>
          </Box>

          {apiError && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setApiError("")}>
              {apiError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              fullWidth
              label="Full Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name}
              sx={{ mb: 2.5 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="action" fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Email address"
              name="email"
              value={form.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
              sx={{ mb: 2.5 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="action" fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={handleChange}
              error={!!errors.password}
              helperText={errors.password}
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword((v) => !v)} edge="end" size="small">
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              sx={{ py: 1.5, fontSize: 16 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Sign Up"}
            </Button>
          </Box>

          <Box mt={3} textAlign="center">
            <Typography variant="body2" color="text.secondary">
              Already have an account? <Link to="/login" style={{ textDecoration: 'none', color: '#3f51b5', fontWeight: 600 }}>Sign In</Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Register;