import React, { useState } from 'react';
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
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  ListAlt as TimesheetIcon,
  Logout as LogoutIcon,
  AccountCircle as ProfileIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [anchorEl, setAnchorEl] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/');
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
      position="static"
      elevation={0}
      sx={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e0e0e0',
        mb: 3,
      }}
    >
      <Toolbar
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          px: { xs: 2, sm: 4 },
          py: 1.5,
        }}
      >
        {/* ซ้าย: ชื่อระบบ + ผู้ใช้ */}
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1976d2' }}>
            TimeSheet System
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user.fullName} ({user.role})
          </Typography>
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
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              {user.role === 'admin' && (
                <MenuItem
                  onClick={() => {
                    navigate('/admin');
                    handleMenuClose();
                  }}
                  sx={{ gap: 1 }}
                >
                  <DashboardIcon fontSize="small" />
                  Admin Dashboard
                </MenuItem>
              )}
              {user.role === 'student' && (
                <MenuItem
                  onClick={() => {
                    navigate('/student');
                    handleMenuClose();
                  }}
                  sx={{ gap: 1 }}
                >
                  <TimesheetIcon fontSize="small" />
                  My Timesheet
                </MenuItem>
              )}
              <Divider />
              <MenuItem
                onClick={() => {
                  navigate('/profile');
                  handleMenuClose();
                }}
                sx={{ gap: 1 }}
              >
                <ProfileIcon fontSize="small" />
                โปรไฟล์
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleLogout();
                  handleMenuClose();
                }}
                sx={{ gap: 1, color: 'error.main' }}
              >
                <LogoutIcon fontSize="small" />
                Logout
              </MenuItem>
            </Menu>
          </>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {user.role === 'admin' && (
              <Button
                onClick={() => navigate('/admin')}
                startIcon={<DashboardIcon />}
                sx={{ textTransform: 'none', color: '#1976d2', fontWeight: 500 }}
              >
                Admin Dashboard
              </Button>
            )}
            {user.role === 'student' && (
              <Button
                onClick={() => navigate('/student')}
                startIcon={<TimesheetIcon />}
                sx={{ textTransform: 'none', color: '#1976d2', fontWeight: 500 }}
              >
                My Timesheet
              </Button>
            )}

            {/* ปุ่ม Profile */}
            <Button
              onClick={() => navigate('/profile')}
              startIcon={<ProfileIcon />}
              sx={{ textTransform: 'none', color: '#1976d2', fontWeight: 500 }}
            >
              โปรไฟล์
            </Button>

            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

            <Button
              onClick={handleLogout}
              startIcon={<LogoutIcon />}
              sx={{ textTransform: 'none', color: 'error.main', fontWeight: 500 }}
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
