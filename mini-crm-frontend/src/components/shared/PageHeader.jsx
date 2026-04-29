import React from "react";
import { Box, Typography, Divider } from "@mui/material";

/**
 * PageHeader
 * ──────────
 * Consistent page title + optional subtitle + optional action button area.
 * Props:
 *   title    – page heading (required)
 *   subtitle – optional grey subheading
 *   action   – optional JSX rendered on the right (e.g. an Add button)
 */
const PageHeader = ({ title, subtitle, action }) => (
  <Box mb={3}>
    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
      <Box>
        <Typography variant="h5" fontWeight={700} color="text.primary">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {action && <Box>{action}</Box>}
    </Box>
    <Divider sx={{ mt: 2 }} />
  </Box>
);

export default PageHeader;
