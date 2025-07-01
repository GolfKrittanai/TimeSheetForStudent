import React from 'react';
import { AppBar, Toolbar, Typography, Button } from '@mui/material'; // UI components จาก Material UI
import { useAuth } from '../context/AuthContext'; // ดึงข้อมูลผู้ใช้และฟังก์ชัน logout
import { useNavigate } from 'react-router-dom'; // ใช้เปลี่ยนหน้า

function Navbar() {
  const { user, logout } = useAuth(); // ดึง user และ logout function จาก context
  const navigate = useNavigate(); // ใช้เปลี่ยนหน้า

  // ฟังก์ชัน logout แล้วพากลับไปหน้า login (หน้า '/')
  const handleLogout = () => {
    logout();       // ล้างข้อมูล user และ token
    navigate('/');  // ไปหน้า login
  };

  // ถ้าไม่มี user (ยังไม่ login) ให้ไม่แสดง Navbar เลย
  if (!user) return null;

  return (
    <AppBar position="static" sx={{ mb: 4 }}>
      <Toolbar>
        {/* แสดงชื่อระบบพร้อมชื่อผู้ใช้และบทบาท */}
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          TimeSheet System | {user.name} ({user.role})
        </Typography>

        {/* ถ้าเป็น admin ให้แสดงปุ่มไปหน้า admin dashboard */}
        {user.role === 'admin' && (
          <Button color="inherit" onClick={() => navigate('/admin')}>
            Admin Dashboard
          </Button>
        )}

        {/* ถ้าเป็น student ให้แสดงปุ่มไปหน้า student dashboard */}
        {user.role === 'student' && (
          <Button color="inherit" onClick={() => navigate('/student')}>
            My TimeSheet
          </Button>
        )}

        {/* ปุ่ม logout */}
        <Button color="inherit" onClick={handleLogout}>
          Logout
        </Button>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
