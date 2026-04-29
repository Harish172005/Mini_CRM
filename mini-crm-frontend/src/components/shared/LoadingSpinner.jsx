import React from "react";
import { Box, CircularProgress } from "@mui/material";

/**
 * LoadingSpinner
 * ──────────────
 * Reusable spinner.
 * Props:
 *   fullScreen – if true, centres the spinner in the entire viewport.
 *   size       – CircularProgress size (default: 40)
 */
const LoadingSpinner = ({ fullScreen = false, size = 40 }) => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    height={fullScreen ? "100vh" : "100%"}
    width="100%"
  >
    <CircularProgress size={size} />
  </Box>
);

export default LoadingSpinner;
