import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  ListAlt as TimesheetIcon,
  Logout as LogoutIcon,
  AccountCircle as ProfileIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
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

        {/* ขวา: ปุ่มเมนู */}
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
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
