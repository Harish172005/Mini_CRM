import React from "react";
import { Box } from "@mui/material";
import Sidebar, { DRAWER_WIDTH } from "./Sidebar";

/**
 * AppLayout
 * ─────────
 * Shell that places the persistent Sidebar on the left and renders
 * the current page content on the right.
 *
 * All authenticated pages are wrapped in this component via App.jsx.
 */
const AppLayout = ({ children }) => (
  <Box display="flex" minHeight="100vh" bgcolor="background.default">
    <Sidebar />
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        ml: `${DRAWER_WIDTH}px`, // offset content by sidebar width
        p: { xs: 2, sm: 3, md: 4 },
        maxWidth: `calc(100vw - ${DRAWER_WIDTH}px)`,
        overflowX: "hidden",
      }}
    >
      {children}
    </Box>
  </Box>
);

export default AppLayout;
