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
  Badge,
  Chip
} from "@mui/material";
import {
  Logout as LogoutIcon,
  Menu as MenuIcon,
  ExpandLess,
  ExpandMore,
  GridView as GridViewIcon,
  Description as DescriptionIcon,
  CropFree as ScanLogoIcon,
  PersonOutline as PersonOutlineIcon,
  FolderSharedOutlined as FolderSharedIcon
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const drawerWidth = 260;
const BRAND_BG = "#0b2b26"; // สีเขียวเข้มพื้นหลัง
const BRAND_ACTIVE = "#10b981"; // สีเขียวนีออนหลัก
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

  const isAdmin = user?.role === "admin";

  // 🟢 เช็กว่า Path ปัจจุบันอยู่ในกลุ่มขั้นตอนที่ 1 หรือไม่ (ครอบคลุมทุกหน้าย่อย)
  const isStep1Active = [
    "/student/scan",
    "/student/scan-upload",
    "/student/scan-summary",
    "/student/scan-history"
  ].includes(location.pathname);

  // 🟢 เช็กว่า Path ปัจจุบันอยู่ในกลุ่มขั้นตอนที่ 2 หรือไม่ (ครอบคลุมทุกหน้าย่อย)
  const isStep2Active = [
    "/student/step2-dashboard",
    "/student/step2-upload",
    "/student/step2-summary"
  ].includes(location.pathname);

  // 🟢 เช็กว่า Path ปัจจุบันอยู่ในกลุ่มขั้นตอนที่ 3 หรือไม่
  const isStep3Active = [
    "/student/step3-dashboard"
  ].includes(location.pathname);

  const renderSidebarContent = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", bgcolor: BRAND_BG, color: "#fff", p: 2 }}>
      
      {/* 🟢 ส่วนที่ 1: Header (COOP SCAN) */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, my: 1, px: 1 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: "12px",
            border: `1.5px solid ${BRAND_ACTIVE}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "rgba(16, 185, 129, 0.08)",
          }}
        >
          <ScanLogoIcon sx={{ color: BRAND_ACTIVE, fontSize: 26 }} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 900, fontSize: "1.2rem", letterSpacing: 0.5 }}>
          <span style={{ color: BRAND_ACTIVE }}>COOP </span>
          <span style={{ color: "#fff" }}>SCAN</span>
        </Typography>
      </Box>

      {/* 🟢 ส่วนที่ 2: Card Profile ของ Admin */}
      {isAdmin ? (
        <Box
          sx={{
            mt: 2,
            mb: 2,
            p: 2.5,
            bgcolor: "rgba(255, 255, 255, 0.03)",
            borderRadius: "16px",
            border: "1px solid rgba(16, 185, 129, 0.2)",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            variant="dot"
            sx={{
              "& .MuiBadge-badge": {
                backgroundColor: BRAND_ACTIVE,
                color: BRAND_ACTIVE,
                boxShadow: `0 0 0 2px ${BRAND_BG}`,
                width: 12,
                height: 12,
                borderRadius: "50%",
                right: 6,
                bottom: 6
              },
            }}
          >
            <Avatar
              src={user?.profileImage || ""}
              alt={user?.fullName || "Admin"}
              sx={{
                width: 72,
                height: 72,
                bgcolor: "transparent",
                border: `2px solid ${BRAND_ACTIVE}`,
                fontSize: "1.8rem",
                fontWeight: 800,
                color: "#fff",
                boxShadow: "0 0 15px rgba(16, 185, 129, 0.3)",
              }}
            >
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "A"}
            </Avatar>
          </Badge>

          <Typography variant="subtitle1" sx={{ fontWeight: 800, mt: 1.5, fontSize: "1.05rem", color: "#fff" }}>
            {user?.fullName || "adminPond"}
          </Typography>

          <Chip
            label="Admin"
            size="small"
            sx={{
              mt: 0.8,
              bgcolor: "rgba(16, 185, 129, 0.15)",
              color: BRAND_ACTIVE,
              border: `1px solid rgba(16, 185, 129, 0.4)`,
              fontWeight: 700,
              fontSize: "0.75rem",
              height: 24,
              px: 1,
              borderRadius: "12px",
            }}
          />
        </Box>
      ) : null}

      <Divider sx={{ bgcolor: "rgba(255,255,255,0.08)", my: 1 }} />

      {/* 🟢 ส่วนที่ 3: เมนูหลัก */}
      <List component="nav" sx={{ flexGrow: 1, px: 0, mt: 1 }}>
        {isAdmin ? (
          /* === เมนูสำหรับ ADMIN === */
          <>
            <ListItemButton
              selected={location.pathname === "/admin/document-review"}
              onClick={() => {
                navigate("/admin/document-review");
                if (isMobile) closeMobile();
              }}
              sx={{
                borderRadius: "10px",
                mb: 1,
                py: 1.2,
                bgcolor: location.pathname === "/admin/document-review" ? "rgba(16, 185, 129, 0.15)" : "transparent",
                color: location.pathname === "/admin/document-review" ? BRAND_ACTIVE : "rgba(255, 255, 255, 0.85)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
              }}
            >
              <ListItemIcon sx={{ color: "inherit", minWidth: 40 }}>
                <DescriptionIcon />
              </ListItemIcon>
              <ListItemText
                primary="Document Co-op"
                primaryTypographyProps={{ fontWeight: 700, fontSize: "0.95rem" }}
              />
            </ListItemButton>

            <ListItemButton
              selected={location.pathname === "/admin/document-management"}
              onClick={() => {
                navigate("/admin/document-management");
                if (isMobile) closeMobile();
              }}
              sx={{
                borderRadius: "10px",
                mb: 1,
                py: 1.2,
                bgcolor: location.pathname === "/admin/document-management" ? "rgba(16, 185, 129, 0.15)" : "transparent",
                color: location.pathname === "/admin/document-management" ? BRAND_ACTIVE : "rgba(255, 255, 255, 0.85)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
              }}
            >
              <ListItemIcon sx={{ color: "inherit", minWidth: 40 }}>
                <FolderSharedIcon />
              </ListItemIcon>
              <ListItemText
                primary="จัดการเอกสาร"
                primaryTypographyProps={{ fontWeight: 700, fontSize: "0.95rem" }}
              />
            </ListItemButton>
          </>
        ) : (
          /* === เมนูสำหรับ STUDENT === */
          <>
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
                {/* ขั้นตอนที่ 1 */}
                <ListItemButton
                  selected={isStep1Active}
                  onClick={() => {
                    navigate("/student/scan");
                    if (isMobile) closeMobile();
                  }}
                  sx={{
                    borderRadius: 1.5,
                    mb: 0.5,
                    bgcolor: isStep1Active ? ACTIVE_SUB_BG : "transparent",
                    borderLeft: isStep1Active ? `3px solid ${BRAND_ACTIVE}` : "3px solid transparent",
                    "&:hover": { bgcolor: ACTIVE_SUB_BG },
                  }}
                >
                  <ListItemText
                    primary="ขั้นตอนที่ 1 การแนบเอกสารสหกิจ"
                    primaryTypographyProps={{
                      fontSize: "0.82rem",
                      color: isStep1Active ? BRAND_ACTIVE : "rgba(255,255,255,0.8)",
                      fontWeight: isStep1Active ? 700 : 400
                    }}
                  />
                </ListItemButton>

                {/* ขั้นตอนที่ 2 */}
                <ListItemButton
                  selected={isStep2Active}
                  onClick={() => {
                    navigate("/student/step2-dashboard");
                    if (isMobile) closeMobile();
                  }}
                  sx={{
                    borderRadius: 1.5,
                    mb: 0.5,
                    bgcolor: isStep2Active ? ACTIVE_SUB_BG : "transparent",
                    borderLeft: isStep2Active ? `3px solid ${BRAND_ACTIVE}` : "3px solid transparent",
                    "&:hover": { bgcolor: ACTIVE_SUB_BG },
                  }}
                >
                  <ListItemText
                    primary="ขั้นตอนที่ 2 จัดเตรียมเอกสารให้สถานประกอบการ"
                    primaryTypographyProps={{
                      fontSize: "0.82rem",
                      color: isStep2Active ? BRAND_ACTIVE : "rgba(255,255,255,0.8)",
                      fontWeight: isStep2Active ? 700 : 400
                    }}
                  />
                </ListItemButton>

                {/* ขั้นตอนที่ 3 */}
                <ListItemButton
                  selected={isStep3Active}
                  onClick={() => {
                    navigate("/student/step3-dashboard");
                    if (isMobile) closeMobile();
                  }}
                  sx={{
                    borderRadius: 1.5,
                    mb: 0.5,
                    bgcolor: isStep3Active ? ACTIVE_SUB_BG : "transparent",
                    borderLeft: isStep3Active ? `3px solid ${BRAND_ACTIVE}` : "3px solid transparent",
                    "&:hover": { bgcolor: ACTIVE_SUB_BG },
                  }}
                >
                  <ListItemText
                    primary="ขั้นตอนที่ 3 หนังสือส่งตัวและแพลตฟอร์มการประเมิน"
                    primaryTypographyProps={{
                      fontSize: "0.82rem",
                      color: isStep3Active ? BRAND_ACTIVE : "rgba(255,255,255,0.8)",
                      fontWeight: isStep3Active ? 700 : 400
                    }}
                  />
                </ListItemButton>
              </List>
            </Collapse>
          </>
        )}
      </List>

      <Divider sx={{ bgcolor: "rgba(255,255,255,0.08)", my: 1 }} />

      {/* 🟢 ส่วนที่ 4: ด้านล่างสุด (My Account & Logout) */}
      <Box sx={{ pt: 1 }}>
        <ListItemButton
          onClick={() => {
            navigate("/profile");
            if (isMobile) closeMobile();
          }}
          sx={{
            borderRadius: "10px",
            mb: 0.5,
            color: "rgba(255, 255, 255, 0.85)",
            "&:hover": { bgcolor: "rgba(255,255,255,0.05)", color: "#fff" },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
            <PersonOutlineIcon />
          </ListItemIcon>
          <ListItemText
            primary="My account"
            primaryTypographyProps={{ fontSize: "0.95rem", fontWeight: 600 }}
          />
        </ListItemButton>

        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: "10px",
            color: "#f87171",
            "&:hover": { bgcolor: "rgba(248, 113, 113, 0.1)" },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: "#f87171" }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText
            primary="LOGOUT"
            primaryTypographyProps={{ fontSize: "0.95rem", fontWeight: 800, letterSpacing: 0.5 }}
          />
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
              {isAdmin ? "ADMIN SYSTEM" : "COOP SCAN"}
            </Typography>
          </Toolbar>
        </AppBar>
        <Toolbar />
        <Drawer
          anchor="left"
          open={mobileOpen}
          onClose={closeMobile}
          sx={{ "& .MuiDrawer-paper": { width: drawerWidth, bgcolor: BRAND_BG, borderRight: "none" } }}
        >
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
            bgcolor: BRAND_BG,
          },
        }}
      >
        {renderSidebarContent}
      </Drawer>
    </Box>
  );
}

export default Sidebar;