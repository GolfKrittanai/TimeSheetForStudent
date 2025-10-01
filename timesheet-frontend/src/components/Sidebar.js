// src/components/Sidebar.js
import React, { useMemo, useState, useEffect } from "react";
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
import { getUserProfile } from "../services/userService";

const drawerWidth = 240;
const BRAND = "#00423b";
const BRAND_HOVER = "#024f46";
const ACTIVE = "#FFC107";

// helper: คืน src ให้ถูกเสมอ (รองรับ Supabase URL และพาธเก่า /uploads/...)
const getAvatarSrc = (obj) => {
  const raw = obj?.profileImage;
  if (!raw) return undefined;
  if (/^https?:\/\//i.test(raw)) return raw; // URL เต็ม (Supabase/อื่น)
  const API = process.env.REACT_APP_API || "";
  const BASE = API.replace(/\/api$/, "");
  return `${BASE}${raw}`; // ต่อ host ให้พาธเก่า
};

function Sidebar() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [mobileOpen, setMobileOpen] = useState(false);
  const toggleMobile = () => setMobileOpen((v) => !v);
  const closeMobile = () => setMobileOpen(false);

  // ดึงโปรไฟล์เหมือนหน้า Profile (ให้ Sidebar ใช้เอง)
  const [sdProfile, setSdProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    if (!token) return;
    if (!sdProfile) {
      setLoadingProfile(true);
      getUserProfile(token)
        .then(({ data }) => setSdProfile(data))
        .catch((e) => console.warn("Sidebar: fetch /profile failed:", e?.message || e))
        .finally(() => setLoadingProfile(false));
    }
  }, [token, sdProfile]);

  // รวมข้อมูลแสดงผล (ให้ sdProfile มาก่อน แล้วค่อยตกมาใช้ user จาก context)
  const display = useMemo(() => {
    const role = sdProfile?.role ?? user?.role ?? "student";
    const avatarSrc = getAvatarSrc(sdProfile) || getAvatarSrc(user);
    return {
      fullName: sdProfile?.fullName ?? user?.fullName ?? "User",
      studentId: sdProfile?.studentId ?? user?.studentId ?? "-",
      role,
      avatarSrc, // แสดงรูปทุกบทบาท (student / teacher / admin)
    };
  }, [sdProfile, user]);

  const adminMenuItems = useMemo(
    () => [
      { text: "Management data", icon: <DashboardIcon />, path: "/admin" },
      { text: "Export Report", icon: <ReportIcon />, path: "/report" },
      { text: "My account", icon: <ProfileIcon />, path: "/profile" },
    ],
    []
  );

  const teacherMenuItems = useMemo(
    () => [
      { text: "Management data", icon: <DashboardIcon />, path: "/teacher" },
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

  const currentMenuItems =
    display.role === "admin"
      ? adminMenuItems
      : display.role === "teacher"
      ? teacherMenuItems
      : studentMenuItems;

  const handleLogout = () => {
    setSdProfile(null); // เคลียร์ cache เล็กน้อยฝั่ง Sidebar
    logout();
    navigate("/");
  };

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
          <ListItemButton onClick={handleLogout} sx={{ "&:hover": { bgcolor: BRAND_HOVER } }}>
            <ListItemIcon sx={{ color: "#fff" }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" sx={{ "& .MuiTypography-root": { color: "#fff" } }} />
          </ListItemButton>
        </ListItem>
      </List>
    </>
  );

  // ========== มือถือ: TopBar + Drawer ==========
  if (isMobile) {
    return (
      <>
        <AppBar position="fixed" elevation={3} sx={{ bgcolor: BRAND }}>
          <Toolbar sx={{ minHeight: 64, px: 1 }}>
            <IconButton
              aria-label="open menu"
              onClick={toggleMobile}
              edge="start"
              sx={{ color: "#fff", mr: 1, "&:hover": { bgcolor: BRAND_HOVER } }}
            >
              <MenuIcon />
            </IconButton>
            <Box sx={{ flex: 1 }} />
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
              <Tooltip title={display.fullName || "User"}>
                <Typography variant="subtitle2" noWrap sx={{ fontWeight: 500, maxWidth: "60vw" }}>
                  {display.fullName || "User"}
                </Typography>
              </Tooltip>
              <Avatar
                alt={display.fullName || "User"}
                src={display.avatarSrc}
                sx={{ width: 28, height: 28, bgcolor: "#fff", color: BRAND }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {display.fullName?.charAt(0)?.toUpperCase() || "U"}
                </Typography>
              </Avatar>
            </Box>
          </Toolbar>
        </AppBar>

        <Toolbar sx={{ minHeight: 64 }} />

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
          <Box sx={{ p: 2, pt: 2.5, textAlign: "center" }}>
            <Avatar
              alt={display.fullName || "User"}
              src={display.avatarSrc}
              sx={{
                width: 56,
                height: 56,
                bgcolor: "#fff",
                color: BRAND,
                m: "0 auto",
                mb: 1,
                border: "2px solid rgba(255,255,255,0.7)",
              }}
              onError={(e) => {
                console.warn("Sidebar avatar load failed:", display.avatarSrc);
                e.currentTarget.src = ""; // fallback เป็นอักษร
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {display.fullName?.charAt(0)?.toUpperCase() || "U"}
              </Typography>
            </Avatar>

            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {display.fullName}
            </Typography>

            <Typography variant="caption" sx={{ opacity: 0.85, display: "block" }}>
              ID : {display.studentId || "-"}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.85 }}>
              {display.role?.charAt(0).toUpperCase() + display.role?.slice(1)}
            </Typography>
          </Box>

          <Divider sx={{ bgcolor: "rgba(255,255,255,0.5)" }} />

          <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
            {MenuList}
          </Box>
        </Drawer>
      </>
    );
  }

  // ========== เดสก์ท็อป: Sidebar ถาวร ==========
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
        <Box sx={{ p: 2, textAlign: "center", pt: 4, pb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: "500", color: "#fff", mb: 1 }}>
            TIMESHEET SYSTEM
          </Typography>
          <Divider sx={{ bgcolor: "rgba(255,255,255,0.5)", mb: 2 }} />

          <Tooltip title={display.fullName}>
            <Avatar
              alt={display.fullName || "User"}
              src={display.avatarSrc}
              sx={{ width: 128, height: 128, bgcolor: "#fff", color: BRAND, m: "0 auto", mb: 1 }}
            >
              <Typography variant="h5" sx={{ fontWeight: "500" }}>
                {display.fullName?.charAt(0)?.toUpperCase() || "U"}
              </Typography>
            </Avatar>
          </Tooltip>

          <Typography variant="h6" sx={{ fontWeight: "500", color: "#fff" }}>
            {display.fullName}
          </Typography>

          <Typography
            variant="caption"
            sx={{ color: "#fff", opacity: 0.8, fontSize: "0.8rem", display: "block" }}
          >
            ID : {display.studentId || "-"}
          </Typography>

          <Typography
            variant="caption"
            sx={{ color: "#fff", opacity: 0.8, fontSize: "0.8rem", mb: 1 }}
          >
            {display.role?.charAt(0).toUpperCase() + display.role?.slice(1)}
          </Typography>
        </Box>

        <Divider sx={{ bgcolor: "rgba(255,255,255,0.5)" }} />
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
          {MenuList}
        </Box>
      </Drawer>
    </Box>
  );
}

export default Sidebar;
