import React from 'react';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
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
    <AppBar position="static" sx={{ mb: 4 }}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          TimeSheet System | {user.name} ({user.role})
        </Typography>
        {user.role === 'admin' && (
          <Button color="inherit" onClick={() => navigate('/admin')}>
            Admin Dashboard
          </Button>
        )}
        {user.role === 'student' && (
          <Button color="inherit" onClick={() => navigate('/student')}>
            My TimeSheet
          </Button>
        )}
        <Button color="inherit" onClick={handleLogout}>
          Logout
        </Button>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
