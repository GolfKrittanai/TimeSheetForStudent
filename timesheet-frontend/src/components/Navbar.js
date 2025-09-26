import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  ListAlt as TimesheetIcon,
  Logout as LogoutIcon,
  AccountCircle as ProfileIcon,
  Menu as MenuIcon,
  Assessment as ReportIcon,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [anchorEl, setAnchorEl] = useState(null);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  if (!user) return null;

  return (
    <AppBar
      position="sticky" // เลื่อนตามเวลาที่เลื่อนหน้าจอ
      elevation={0}
      sx={{
        backgroundColor: "#0b463f",
        borderBottom: "1px solid #4e4c4c",
        mb: 1,
        fontFamily: '"Didonesque", sans-serif', // เพิ่มฟอนต์ที่ต้องการ
        width:"100%"
      }}
    >
      <Toolbar
        sx={{
          display: "flex",
          justifyContent: "space-between",
          px: { xs: 2, sm: 4 },
          py: 1.5,
        }}
      >
        {/* ซ้าย: ชื่อระบบ + ผู้ใช้ */}
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: "#fff",
              fontFamily: '"Didonesque", sans-serif',
            }} // ใช้ฟอนต์ที่ต้องการ
          >
            TimeSheet System
          </Typography>
          {/* <Typography
            variant="body2"
            color="#fff"
            sx={{ fontFamily: '"Didonesque", sans-serif' }}
          >
            {user.fullName} ({user.role})
          </Typography> */}
        </Box>

        {/* ขวา: เมนู responsive */}
        {isMobile ? (
          <>
            <IconButton onClick={handleMenuOpen} color="primary" size="large">
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
              {user.role === "admin" && (
                <>
                  <MenuItem
                    onClick={() => {
                      navigate("/admin");
                      handleMenuClose();
                    }}
                    sx={{ gap: 1, fontFamily: '"Didonesque", sans-serif' }}
                  >
                    <DashboardIcon fontSize="small" />
                    Admin Dashboard
                  </MenuItem>

                  <MenuItem
                    onClick={() => {
                      navigate("/report");
                      handleMenuClose();
                    }}
                    sx={{ gap: 1, fontFamily: '"Didonesque", sans-serif' }}
                  >
                    <ReportIcon fontSize="small" />
                    Export Report
                  </MenuItem>
                </>
              )}
              {user.role === "student" && (
                <>
                  <MenuItem
                    onClick={() => {
                      navigate("/student");
                      handleMenuClose();
                    }}
                    sx={{ gap: 1, fontFamily: '"Didonesque", sans-serif' }}
                  >
                    <TimesheetIcon fontSize="small" />
                    My Timesheet
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      navigate("/student/export");
                      handleMenuClose();
                    }}
                    sx={{ gap: 1, fontFamily: '"Didonesque", sans-serif' }}
                  >
                    <ReportIcon fontSize="small" />
                    Export Timesheet
                  </MenuItem>
                </>
              )}
              <Divider />
              <MenuItem
                onClick={() => {
                  navigate("/profile");
                  handleMenuClose();
                }}
                sx={{ gap: 1, fontFamily: '"Didonesque", sans-serif' }} // ใช้ฟอนต์ที่ต้องการ
              >
                <ProfileIcon fontSize="small" />
                โปรไฟล์
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleLogout();
                  handleMenuClose();
                }}
                sx={{
                  gap: 1,
                  color: "error.main",
                  fontFamily: '"Didonesque", sans-serif',
                }} // ใช้ฟอนต์ที่ต้องการ
              >
                <LogoutIcon fontSize="small" />
                Logout
              </MenuItem>
            </Menu>
          </>
        ) : (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {user.role === "admin" && (
              <Button
                onClick={() => navigate("/admin")}
                startIcon={<DashboardIcon />}
                sx={{
                  textTransform: "none",
                  color: "#fff",
                  fontWeight: "bold",
                  fontFamily: '"Didonesque", sans-serif',
                }} // ใช้ฟอนต์ที่ต้องการ
              >
                Admin Dashboard
              </Button>
            )}
            <Divider orientation="vertical"/>
            {user.role === "admin" && (
              <>
                <Button
                  onClick={() => navigate("/report")}
                  startIcon={<ReportIcon />}
                  sx={{
                    textTransform: "none",
                    color: "#fff",
                    fontWeight: "bold",
                    fontFamily: '"Didonesque", sans-serif',
                  }}
                >
                  Export Report
                </Button>
              </>
            )}
            {user.role === "student" && (
              <>
                <Button
                  onClick={() => navigate("/student")}
                  startIcon={<TimesheetIcon />}
                  sx={{
                    textTransform: "none",
                    color: "#fff",
                    fontWeight: "bold",
                    fontFamily: '"Didonesque", sans-serif',
                  }}
                >
                  My Timesheet
                </Button>

                <Divider orientation="vertical"/>

                <Button
                  onClick={() => navigate("/student/export")}
                  startIcon={<ReportIcon />}
                  sx={{
                    textTransform: "none",
                    color: "#fff",
                    fontWeight: "bold",
                    fontFamily: '"Didonesque", sans-serif',
                  }}
                >
                  Export Timesheet
                </Button>
              </>
            )}
            <Divider orientation="vertical"/>
            {/* ปุ่ม Profile */}
            <Button
              onClick={() => navigate("/profile")}
              startIcon={<ProfileIcon sx={{ color: "#fff" }} />}
              sx={{
                textTransform: "none",
                color: "#fff",
                fontWeight: "bold",
                fontFamily: '"Didonesque", sans-serif',
              }} // ใช้ฟอนต์ที่ต้องการ
            >
              Profile
            </Button>

            <Divider orientation="vertical" />

            <Button
              onClick={handleLogout}
              startIcon={<LogoutIcon/>}
              sx={{
                textTransform: "none",
                color: "#fff",
                fontWeight: "bold", // ทำให้ข้อความตัวหนา
                fontFamily: '"Didonesque", sans-serif', // ใช้ฟอนต์ที่ต้องการ
              }}
            >
              Logout
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
