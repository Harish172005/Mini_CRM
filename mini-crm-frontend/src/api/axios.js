import axios from "axios";

/**
 * axiosInstance
 * ─────────────
 * Pre-configured Axios client used by every API call in the app.
 *
 * Features:
 *  1. baseURL  – reads from the Vite env variable (falls back to /api for
 *                Vite's dev-proxy so no CORS errors locally).
 *  2. Request interceptor – automatically attaches the JWT stored in
 *                localStorage to every outgoing request.
 *  3. Response interceptor – on 401, clears local storage and redirects
 *                to /login so expired sessions are handled globally.
 */
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor: inject Bearer token ──────────────────────────────────
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("crm_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 globally ─────────────────────────────────
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clean up and force re-login
      localStorage.removeItem("crm_token");
      localStorage.removeItem("crm_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
