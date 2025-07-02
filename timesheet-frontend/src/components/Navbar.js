import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  ListAlt as TimesheetIcon,
  Logout as LogoutIcon,
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
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        {/* ซ้าย: ชื่อระบบ + ผู้ใช้ */}
        <Box>
          <Typography variant="h6" color="text.primary" sx={{ fontWeight: 600 }}>
            TimeSheet System
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user.name} ({user.role})
          </Typography>
        </Box>

        {/* ขวา: เมนูปุ่มต่าง ๆ */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {user.role === 'admin' && (
            <Button
              startIcon={<DashboardIcon />}
              onClick={() => navigate('/admin')}
              sx={{ textTransform: 'none', color: '#4caf50' }}
            >
              Admin Dashboard
            </Button>
          )}
          {user.role === 'student' && (
            <Button
              startIcon={<TimesheetIcon />}
              onClick={() => navigate('/student')}
              sx={{ textTransform: 'none', color: '#4caf50' }}
            >
              My Timesheet
            </Button>
          )}
          <Divider orientation="vertical" flexItem />
          <Button
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{ textTransform: 'none', color: 'error.main' }}
          >
            Logout
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
