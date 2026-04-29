import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box, Drawer, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Typography, Avatar,
  Divider, Tooltip,
} from "@mui/material";
import DashboardIcon    from "@mui/icons-material/Dashboard";
import PeopleIcon       from "@mui/icons-material/People";
import BusinessIcon     from "@mui/icons-material/Business";
import AssignmentIcon   from "@mui/icons-material/Assignment";
import LogoutIcon       from "@mui/icons-material/Logout";
import { useAuth }      from "../../context/AuthContext";
import { getInitials }  from "../../utils/helpers";

const DRAWER_WIDTH = 240;

// Navigation items — icon, label, route
const NAV_ITEMS = [
  { label: "Dashboard",  icon: <DashboardIcon  />, path: "/dashboard"  },
  { label: "Leads",      icon: <PeopleIcon     />, path: "/leads"      },
  { label: "Companies",  icon: <BusinessIcon   />, path: "/companies"  },
  { label: "Tasks",      icon: <AssignmentIcon />, path: "/tasks"      },
];

/**
 * Sidebar
 * ───────
 * Persistent left navigation drawer.
 * Highlights the active route via useLocation().
 */
const Sidebar = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const drawerContent = (
    <Box
      display="flex"
      flexDirection="column"
      height="100%"
      sx={{ background: "linear-gradient(180deg, #3f51b5 0%, #002984 100%)" }}
    >
      {/* ── Brand ─────────────────────────────────────────────────────────── */}
      <Box px={3} py={3}>
        <Typography variant="h6" color="white" fontWeight={700} letterSpacing={1}>
          Mini CRM
        </Typography>
        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)" }}>
          Sales Management
        </Typography>
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.15)" }} />

      {/* ── Nav items ─────────────────────────────────────────────────────── */}
      <List sx={{ flex: 1, px: 1.5, pt: 2 }}>
        {NAV_ITEMS.map(({ label, icon, path }) => {
          const isActive = location.pathname.startsWith(path);
          return (
            <ListItem key={path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => navigate(path)}
                sx={{
                  borderRadius: 2,
                  color: isActive ? "#fff" : "rgba(255,255,255,0.7)",
                  backgroundColor: isActive
                    ? "rgba(255,255,255,0.18)"
                    : "transparent",
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.12)",
                    color: "#fff",
                  },
                  transition: "all 0.2s",
                }}
              >
                <ListItemIcon
                  sx={{
                    color: "inherit",
                    minWidth: 38,
                  }}
                >
                  {icon}
                </ListItemIcon>
                <ListItemText
                  primary={label}
                  primaryTypographyProps={{ fontWeight: isActive ? 700 : 400, fontSize: 14 }}
                />
                {isActive && (
                  <Box
                    sx={{
                      width: 4, height: 24, borderRadius: 2,
                      backgroundColor: "#fff",
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.15)" }} />

      {/* ── User info + logout ────────────────────────────────────────────── */}
      <Box px={2} py={2.5} display="flex" alignItems="center" gap={1.5}>
        <Avatar
          sx={{
            width: 36, height: 36,
            bgcolor: "rgba(255,255,255,0.25)",
            fontSize: 14, fontWeight: 700, color: "#fff",
          }}
        >
          {getInitials(user?.name)}
        </Avatar>
        <Box flex={1} minWidth={0}>
          <Typography
            variant="body2" color="white" fontWeight={600}
            noWrap sx={{ lineHeight: 1.2 }}
          >
            {user?.name}
          </Typography>
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.55)" }} noWrap>
            {user?.role}
          </Typography>
        </Box>
        <Tooltip title="Logout">
          <LogoutIcon
            onClick={handleLogout}
            sx={{
              color: "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: 20,
              "&:hover": { color: "#fff" },
            }}
          />
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: DRAWER_WIDTH,
          boxSizing: "border-box",
          border: "none",
          boxShadow: "4px 0 24px rgba(0,0,0,0.12)",
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export { DRAWER_WIDTH };
export default Sidebar;
