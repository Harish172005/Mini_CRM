import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "./LoadingSpinner";

/**
 * PrivateRoute
 * ────────────
 * Wraps any route that requires authentication.
 * - While auth is being verified on mount → shows a full-page spinner.
 * - If not authenticated → redirects to /login, preserving the attempted URL
 *   in `state.from` so we can send the user back after login.
 * - If authenticated → renders children normally.
 */
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner fullScreen />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default PrivateRoute;
