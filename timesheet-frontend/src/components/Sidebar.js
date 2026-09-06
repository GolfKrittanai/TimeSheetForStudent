// src/components/Sidebar.js
import React, { useState } from "react";
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
  AppBar,
  Toolbar,
  IconButton,
  useTheme,
  useMediaQuery,
  Collapse,
} from "@mui/material";
import {
  AccountCircle as ProfileIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  ExpandLess,
  ExpandMore,
  GridView as GridViewIcon,
  DocumentScannerOutlined as CoopScanIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const drawerWidth = 260;
const BRAND_BG = "#0f3833";
const BRAND_ACTIVE = "#10b981";
const ACTIVE_SUB_BG = "rgba(255, 255, 255, 0.08)";

function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [scanMenuOpen, setScanMenuOpen] = useState(true);

  const toggleMobile = () => setMobileOpen((v) => !v);
  const closeMobile = () => setMobileOpen(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const renderSidebarContent = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", bgcolor: BRAND_BG }}>
      {/* โลโก้ COOP SCAN */}
      <Box sx={{ p: 3, display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: 2,
            bgcolor: BRAND_ACTIVE,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
          }}
        >
          <CoopScanIcon sx={{ fontSize: 28 }} />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: BRAND_ACTIVE, lineHeight: 1.1, letterSpacing: 0.5 }}>
            COOP
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#fff", lineHeight: 1, letterSpacing: 1 }}>
            SCAN
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ bgcolor: "rgba(255,255,255,0.1)", mx: 2, mb: 2 }} />

      {/* เมนูหลัก */}
      <List component="nav" sx={{ px: 1, flexGrow: 1 }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => setScanMenuOpen(!scanMenuOpen)}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              color: "#fff",
              "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
            }}
          >
            <ListItemIcon sx={{ color: "#fff", minWidth: 36 }}>
              <GridViewIcon />
            </ListItemIcon>
            <ListItemText primary="ระบบสแกนเอกสาร" primaryTypographyProps={{ fontWeight: 600, fontSize: "0.95rem" }} />
            {scanMenuOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>

        <Collapse in={scanMenuOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding sx={{ pl: 2 }}>
            <ListItemButton
              selected={location.pathname === "/student/scan"}
              onClick={() => {
                navigate("/student/scan");
                if (isMobile) closeMobile();
              }}
              sx={{
                borderRadius: 1.5,
                mb: 0.5,
                bgcolor: location.pathname === "/student/scan" ? ACTIVE_SUB_BG : "transparent",
                borderLeft: location.pathname === "/student/scan" ? `3px solid ${BRAND_ACTIVE}` : "3px solid transparent",
                "&:hover": { bgcolor: ACTIVE_SUB_BG },
              }}
            >
              <ListItemText
                primary="ขั้นตอนที่ 1 การแนบเอกสารสหกิจ"
                primaryTypographyProps={{
                  fontSize: "0.82rem",
                  color: location.pathname === "/student/scan" ? BRAND_ACTIVE : "rgba(255,255,255,0.8)",
                }}
              />
            </ListItemButton>

            <ListItemButton
              onClick={() => {
                navigate("/student/scan-upload");
                if (isMobile) closeMobile();
              }}
              sx={{
                borderRadius: 1.5,
                mb: 0.5,
                "&:hover": { bgcolor: ACTIVE_SUB_BG },
              }}
            >
              <ListItemText
                primary="ขั้นตอนที่ 2 จัดเตรียมเอกสารให้สถานประกอบการ"
                primaryTypographyProps={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.6)" }}
              />
            </ListItemButton>

            <ListItemButton
              sx={{
                borderRadius: 1.5,
                mb: 0.5,
                "&:hover": { bgcolor: ACTIVE_SUB_BG },
              }}
            >
              <ListItemText
                primary="ขั้นตอนที่ 3 หนังสือส่งตัวและแพลตฟอร์มการประเมิน"
                primaryTypographyProps={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.6)" }}
              />
            </ListItemButton>
          </List>
        </Collapse>
      </List>

      <Divider sx={{ bgcolor: "rgba(255,255,255,0.1)", mx: 2 }} />

      {/* ด้านล่างสุด: Profile & Logout */}
      <Box sx={{ p: 2 }}>
        <ListItemButton
          onClick={() => {
            navigate("/profile");
            if (isMobile) closeMobile();
          }}
          sx={{
            borderRadius: 2,
            mb: 1,
            color: "#fff",
            "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
          }}
        >
          <ListItemIcon sx={{ minWidth: 36, color: "#fff" }}>
            <Avatar sx={{ width: 24, height: 24, bgcolor: "rgba(255,255,255,0.2)" }}>
              <ProfileIcon sx={{ fontSize: 18 }} />
            </Avatar>
          </ListItemIcon>
          <ListItemText primary={user?.fullName || "My account"} primaryTypographyProps={{ fontSize: "0.9rem", fontWeight: 500 }} />
        </ListItemButton>

        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: 2,
            color: "#ef4444",
            "&:hover": { bgcolor: "rgba(239, 68, 68, 0.1)" },
          }}
        >
          <ListItemIcon sx={{ minWidth: 36, color: "#ef4444" }}>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: "0.9rem", fontWeight: 500 }} />
        </ListItemButton>
      </Box>
    </Box>
  );

  if (isMobile) {
    return (
      <>
        <AppBar position="fixed" elevation={0} sx={{ bgcolor: BRAND_BG }}>
          <Toolbar sx={{ justifyContent: "space-between" }}>
            <IconButton onClick={toggleMobile} sx={{ color: "#fff" }}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ color: BRAND_ACTIVE, fontWeight: 700 }}>
              COOP SCAN
            </Typography>
          </Toolbar>
        </AppBar>
        <Toolbar />
        <Drawer anchor="left" open={mobileOpen} onClose={closeMobile} sx={{ "& .MuiDrawer-paper": { width: drawerWidth } }}>
          {renderSidebarContent}
        </Drawer>
      </>
    );
  }

  return (
    <Box component="nav" sx={{ width: drawerWidth, flexShrink: 0 }}>
      <Drawer
        variant="permanent"
        open
        sx={{
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            borderRight: "none",
          },
        }}
      >
        {renderSidebarContent}
      </Drawer>
    </Box>
  );
}

export default Sidebar;