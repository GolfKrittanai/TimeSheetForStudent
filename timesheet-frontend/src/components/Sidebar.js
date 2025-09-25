import React from "react";
import {
  Drawer,
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Tooltip,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  ListAlt as TimesheetIcon,
  History as HistoryIcon,
  Assessment as ReportIcon,
  AccountCircle as ProfileIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const drawerWidth = 240;

function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const adminMenuItems = [
    {
      text: "Management data",
      icon: <DashboardIcon />,
      path: "/admin",
    },
    {
      text: "Export Report",
      icon: <ReportIcon />,
      path: "/report",
    },
    {
      text: "My account",
      icon: <ProfileIcon />,
      path: "/profile",
    },
  ];

  const studentMenuItems = [
    {
      text: "Timesheet",
      icon: <TimesheetIcon />,
      path: "/student",
    },
    {
      text: "Timesheet History",
      icon: <HistoryIcon />,
      path: "/student/timesheet-history",
    },
    {
      text: "Profile",
      icon: <ProfileIcon />,
      path: "/profile",
    },
  ];

  const currentMenuItems = user?.role === "admin" ? adminMenuItems : studentMenuItems;

  return (
    <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", sm: "block" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: drawerWidth,
            bgcolor: "#00423b",
            boxShadow: "0 6px 20px rgba(0,74,153,0.3)",
          },
        }}
        open
      >
        {user?.role === "admin" ? (
          <Box sx={{ p: 2, textAlign: "center", pt: 5, pb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", color: "#fff", mb: 1 }}>
              TIMESHEET SYSTEM
            </Typography>
            <Divider sx={{ bgcolor: "rgba(255,255,255,0.5)", mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: "bold", color: "#fff" }}>
              {user?.fullName}
            </Typography>
            <Typography variant="caption" sx={{ color: "#fff", opacity: 0.8, fontSize: "0.8rem", mb: 1 }}>
              {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || "User"}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ p: 2, textAlign: "center", pt: 4, pb: 2 }}>
            <Tooltip title={user?.fullName}>
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: "#fff",
                  color: "#00423b",
                  m: "0 auto",
                  mb: 1,
                }}
              >
                <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                  {user?.fullName?.charAt(0).toUpperCase() || "U"}
                </Typography>
              </Avatar>
            </Tooltip>
            <Typography variant="h6" sx={{ fontWeight: "bold", color: "#fff" }}>
              {user?.fullName}
            </Typography>
            <Typography variant="caption" sx={{ color: "#fff", opacity: 0.8, fontSize: "0.8rem", mb: 1 }}>
              {user?.studentId}
            </Typography>
          </Box>
        )}
        <Divider sx={{ bgcolor: "rgba(255,255,255,0.5)" }} />

        <List sx={{ pt: 2, pb: 2 }}>
          {currentMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  sx={{
                    "&:hover": {
                      bgcolor: "#024f46",
                    },
                    ...(isActive && {
                      bgcolor: "#00423b",
                    }),
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isActive ? "#FFC107" : "#fff",
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    sx={{
                      "& .MuiTypography-root": {
                        color: isActive ? "#FFC107" : "#fff",
                      },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
        <Divider sx={{ bgcolor: "rgba(255,255,255,0.5)" }} />

        <List sx={{ mt: "auto", mb: 2 }}>
          <ListItem disablePadding>
            <ListItemButton
              onClick={handleLogout}
              sx={{
                "&:hover": {
                  bgcolor: "#024f46",
                },
              }}
            >
              <ListItemIcon sx={{ color: "#fff" }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText
                primary="Logout"
                sx={{ "& .MuiTypography-root": { color: "#fff" } }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>
    </Box>
  );
}

export default Sidebar;