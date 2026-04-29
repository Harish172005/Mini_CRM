import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import PrivateRoute   from "./components/shared/PrivateRoute";
import AppLayout      from "./components/layout/AppLayout";

// ── Pages ─────────────────────────────────────────────────────────────────────
import Login          from "./pages/Login";
import Register       from "./pages/Register";
import Dashboard      from "./pages/Dashboard";
import LeadsList      from "./pages/leads/LeadsList";
import CompaniesList  from "./pages/companies/CompaniesList";
import CompanyDetail  from "./pages/companies/CompanyDetail";
import TasksPage      from "./pages/tasks/TasksPage";

/**
 * App
 * ───
 * Defines all routes.
 *
 * Pattern:
 *  - Public  routes: /login  (accessible without auth)
 *  - Private routes: everything else, wrapped in <PrivateRoute> + <AppLayout>
 */
const App = () => (
  <Routes>
    {/* ── Public ──────────────────────────────────────────────────────────── */}
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />

    {/* ── Private: wrap each page in PrivateRoute + AppLayout ─────────────── */}
    <Route
      path="/dashboard"
      element={
        <PrivateRoute>
          <AppLayout><Dashboard /></AppLayout>
        </PrivateRoute>
      }
    />
    <Route
      path="/leads"
      element={
        <PrivateRoute>
          <AppLayout><LeadsList /></AppLayout>
        </PrivateRoute>
      }
    />
    <Route
      path="/companies"
      element={
        <PrivateRoute>
          <AppLayout><CompaniesList /></AppLayout>
        </PrivateRoute>
      }
    />
    <Route
      path="/companies/:id"
      element={
        <PrivateRoute>
          <AppLayout><CompanyDetail /></AppLayout>
        </PrivateRoute>
      }
    />
    <Route
      path="/tasks"
      element={
        <PrivateRoute>
          <AppLayout><TasksPage /></AppLayout>
        </PrivateRoute>
      }
    />

    {/* ── Fallback: redirect root and unknown paths ────────────────────────── */}
    <Route path="/"  element={<Navigate to="/dashboard" replace />} />
    <Route path="*"  element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

export default App;
