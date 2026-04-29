import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axiosInstance from "../api/axios";

/**
 * AuthContext
 * ───────────
 * Provides global authentication state to the entire component tree.
 *
 * State stored:
 *   user  – { id, name, email, role } or null
 *   token – JWT string or null
 *
 * Persistence: token + user are mirrored to localStorage so the session
 * survives page refreshes.  On mount, the stored token is re-validated
 * against GET /api/auth/me to catch expired tokens.
 */

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(null);
  const [loading, setLoading] = useState(true); // true while we validate on mount

  // ── On first load: restore session from localStorage ─────────────────────
  useEffect(() => {
    const savedToken = localStorage.getItem("crm_token");
    const savedUser  = localStorage.getItem("crm_user");

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      // Silently re-validate token with the backend
      axiosInstance
        .get("/auth/me")
        .then(({ data }) => setUser(data.user))
        .catch(() => {
          // Token is invalid/expired — clear everything
          localStorage.removeItem("crm_token");
          localStorage.removeItem("crm_user");
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // ── login: POST /api/auth/login ───────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const { data } = await axiosInstance.post("/auth/login", { email, password });
    const { token: jwt, user: userData } = data;

    // Persist to localStorage
    localStorage.setItem("crm_token", jwt);
    localStorage.setItem("crm_user",  JSON.stringify(userData));

    setToken(jwt);
    setUser(userData);
    return userData;
  }, []);

  // ── register: POST /api/auth/register ──────────────────────────────────────
  const register = useCallback(async (name, email, password, role = "agent") => {
    const { data } = await axiosInstance.post("/auth/register", { name, email, password, role });
    const { token: jwt, user: userData } = data;

    // Persist to localStorage
    localStorage.setItem("crm_token", jwt);
    localStorage.setItem("crm_user",  JSON.stringify(userData));

    setToken(jwt);
    setUser(userData);
    return userData;
  }, []);

  // ── logout: clear everything ──────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem("crm_token");
    localStorage.removeItem("crm_user");
    setToken(null);
    setUser(null);
  }, []);

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Convenience hook — components call useAuth() instead of useContext(AuthContext)
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};

export default AuthContext;
