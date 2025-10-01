import React, { useMemo, useState } from "react";
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
  AppBar,
  Toolbar,
  IconButton,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  ListAlt as TimesheetIcon,
  History as HistoryIcon,
  Assessment as ReportIcon,
  AccountCircle as ProfileIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const drawerWidth = 240;
const BRAND = "#00423b";
const BRAND_HOVER = "#024f46";
const ACTIVE = "#FFC107";

function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [mobileOpen, setMobileOpen] = useState(false);
  const toggleMobile = () => setMobileOpen((v) => !v);
  const closeMobile = () => setMobileOpen(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const adminMenuItems = useMemo(
    () => [
      { text: "Management data", icon: <DashboardIcon />, path: "/admin" },
      { text: "Export Report", icon: <ReportIcon />, path: "/report" },
      { text: "My account", icon: <ProfileIcon />, path: "/profile" },
    ],
    []
  );

  const studentMenuItems = useMemo(
    () => [
      { text: "Timesheet", icon: <TimesheetIcon />, path: "/student" },
      { text: "Timesheet History", icon: <HistoryIcon />, path: "/student/timesheet-history" },
      { text: "My account", icon: <ProfileIcon />, path: "/profile" },
    ],
    []
  );

  const currentMenuItems = user?.role === "admin" ? adminMenuItems : studentMenuItems;

  const MenuList = (
    <>
      <List sx={{ pt: 1, pb: 1 }}>
        {currentMenuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) closeMobile();
                }}
                sx={{
                  "&:hover": { bgcolor: BRAND_HOVER },
                  ...(isActive && { bgcolor: BRAND }),
                }}
              >
                <ListItemIcon sx={{ color: isActive ? ACTIVE : "#fff" }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  sx={{ "& .MuiTypography-root": { color: isActive ? ACTIVE : "#fff" } }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ bgcolor: "rgba(255,255,255,0.5)" }} />

      <List sx={{ mt: "auto", mb: 1 }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => {
              handleLogout();
              if (isMobile) closeMobile();
            }}
            sx={{ "&:hover": { bgcolor: BRAND_HOVER } }}
          >
            <ListItemIcon sx={{ color: "#fff" }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" sx={{ "& .MuiTypography-root": { color: "#fff" } }} />
          </ListItemButton>
        </ListItem>
      </List>
    </>
  );

  // ===== มือถือ: TopBar (ซ้ายเมนู / ขวาชื่อ) + Drawer โผล่ซ้าย =====
  if (isMobile) {
    return (
      <>
        <AppBar position="fixed" elevation={3} sx={{ bgcolor: BRAND }}>
          <Toolbar sx={{ minHeight: 64, px: 1 }}>
            {/* ซ้าย: ปุ่มแฮมเบอร์เกอร์ */}
            <IconButton
              aria-label="open menu"
              onClick={toggleMobile}
              edge="start"
              sx={{
                color: "#fff",
                mr: 1,
                "&:hover": { bgcolor: BRAND_HOVER },
              }}
            >
              <MenuIcon />
            </IconButton>

            {/* ตัวดันกลางให้ชื่อไปชิดขวา */}
            <Box sx={{ flex: 1 }} />

            {/* ขวา: ชื่อ/อวาตาร์ */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
              {user?.role === "admin" ? (
                <>
                  <Typography
                    variant="subtitle1"
                    noWrap
                    sx={{ fontWeight: 500, letterSpacing: 0.3 }}
                  >
                    TIMESHEET
                  </Typography>
                  <Avatar
                    alt={user?.fullName || "User"}
                    src={user?.profileImage || undefined}
                    sx={{ width: 28, height: 28, bgcolor: "#fff", color: BRAND }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
                    </Typography>
                  </Avatar>
                </>
              ) : (
                <>
                  <Tooltip title={user?.fullName || "User"}>
                    <Typography
                      variant="subtitle2"
                      noWrap
                      sx={{ fontWeight: 500, maxWidth: "60vw" }}
                    >
                      {user?.fullName || "User"}
                    </Typography>
                  </Tooltip>
                  <Avatar
                    alt={user?.fullName || "User"}
                    src={user?.profileImage || undefined}
                    sx={{ width: 28, height: 28, bgcolor: "#fff", color: BRAND }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
                    </Typography>
                  </Avatar>

                </>
              )}
            </Box>

          </Toolbar>
        </AppBar>

        {/* กันพื้นที่ไม่ให้ content ถูก AppBar ทับ */}
        <Toolbar sx={{ minHeight: 64 }} />

        {/* Drawer แบบ temporary โผล่จากซ้าย */}
        <Drawer
          anchor="left"
          variant="temporary"
          open={mobileOpen}
          onClose={closeMobile}
          ModalProps={{ keepMounted: true }}
          sx={{
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: Math.min(300, typeof window !== "undefined" ? window.innerWidth * 0.85 : 300),
              bgcolor: BRAND,
              color: "#fff",
            },
          }}
        >
          {/* Header ใน Drawer */}
          <Box sx={{ p: 2, pt: 2.5, textAlign: "center" }}>
            <Avatar
              alt={user?.fullName || "User"}
              src={user?.profileImage || undefined}
              sx={{
                width: 56,
                height: 56,
                bgcolor: "#fff",
                color: BRAND,
                m: "0 auto",
                mb: 1,
                border: "2px solid rgba(255,255,255,0.7)",
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
              </Typography>
            </Avatar>

            <Typography variant="h6" sx={{ fontWeight: 500 }}>
              {user?.fullName || (user?.role === "admin" ? "Admin" : "User")}
            </Typography>

            {user?.role === "admin" ? (
              <Typography variant="caption" sx={{ opacity: 0.85 }}>
                Role: {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || "User"}
              </Typography>
            ) : (
              <Typography variant="caption" sx={{ opacity: 0.85 }}>
                Student ID: {user?.studentId || "-"}
              </Typography>
            )}
          </Box>

          <Divider sx={{ bgcolor: "rgba(255,255,255,0.5)" }} />

          <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
            {MenuList}
          </Box>
        </Drawer>
      </>
    );
  }

  // ===== เดสก์ท็อป: Sidebar ถาวร =====
  return (
    <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: "none", sm: "block" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: drawerWidth,
            bgcolor: BRAND,
            boxShadow: "0 6px 20px rgba(0,74,153,0.3)",
          },
        }}
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
                  alt: user?.fullName,
                  src: user?.profileImage || "",
                  width: 64,
                  height: 64,
                  bgcolor: "#fff",
                  color: BRAND,
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
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
          {MenuList}
        </Box>
      </Drawer>
    </Box>
  );
}

export default Sidebar;
