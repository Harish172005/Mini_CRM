import { createTheme } from "@mui/material/styles";

/**
 * Global MUI theme
 * ─────────────────
 * - Primary:   deep indigo  (#3f51b5) — professional CRM look
 * - Secondary: teal accent  (#00897b)
 * - Font:      Inter (loaded in index.html)
 * - Shape:     slightly rounded corners throughout
 */
const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main:        "#3f51b5",
      light:       "#757de8",
      dark:        "#002984",
      contrastText:"#ffffff",
    },
    secondary: {
      main:        "#00897b",
      light:       "#4ebaaa",
      dark:        "#005b4f",
      contrastText:"#ffffff",
    },
    background: {
      default: "#f4f6f8",
      paper:   "#ffffff",
    },
    success: { main: "#43a047" },
    warning: { main: "#fb8c00" },
    error:   { main: "#e53935" },
    info:    { main: "#1e88e5" },
  },

  typography: {
    fontFamily: "'Inter', sans-serif",
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    button: {
      textTransform: "none", // no ALL-CAPS buttons
      fontWeight: 600,
    },
  },

  shape: { borderRadius: 10 },

  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 8, padding: "8px 20px" },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          "& .MuiTableCell-head": {
            fontWeight: 700,
            backgroundColor: "#f4f6f8",
            color: "#374151",
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: 6 },
      },
    },
  },
});

export default theme;
