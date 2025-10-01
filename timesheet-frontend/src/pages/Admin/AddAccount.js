import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  useMediaQuery,
  IconButton,
} from '@mui/material';
import {
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';

import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";
import { registerUser } from '../../services/authService'; 

function AddAccount() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [formData, setFormData] = useState({
    // Initial data structure based on the form fields
    role: 'student', // Default role
    studentId: '', // For Student/Teacher ID
    fullName: '',
    branch: '', 
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTogglePassword = (field) => {
    if (field === 'password') {
      setShowPassword((prev) => !prev);
    } else {
      setConfirmPassword((prev) => !prev);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      Swal.fire({
        title: 'รหัสผ่านไม่ตรงกัน',
        text: 'โปรดตรวจสอบรหัสผ่านและยืนยันรหัสผ่านอีกครั้ง',
        icon: 'warning',
        confirmButtonColor: '#00796b',
      });
      return;
    }
    
    try {
        // ตรวจสอบว่าฟิลด์ 'branch' ถูกส่งไปใน formData ด้วย
        await registerUser(formData, token); 

        Swal.fire({
            title: 'เพิ่มบัญชีสำเร็จ',
            text: 'ผู้ใช้ใหม่ถูกเพิ่มเข้าสู่ระบบแล้ว',
            icon: 'success',
            confirmButtonColor: '#00796b',
        });
        navigate('/admin/dashboard'); // Navigate back to the dashboard or user list
    } catch (error) {
         console.error("Registration error:", error);
         Swal.fire({
            title: 'เกิดข้อผิดพลาด',
            text: 'ไม่สามารถเพิ่มบัญชีได้: ' + (error.response?.data?.message || 'โปรดตรวจสอบข้อมูล'),
            icon: 'error',
            confirmButtonColor: '#00796b',
        });
    }
  };
  
  // Custom styles for text fields to match the image
  const inputStyle = {
    "& .MuiInputBase-root": {
      fontFamily: '"Didonesque", sans-serif',
      borderRadius: 2,
      bgcolor: "#fafafa",
      "& .MuiOutlinedInput-notchedOutline": {
        borderColor: "#ccc",
      },
      "&:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: "#00796b",
      },
      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
        borderColor: "#00796b",
        boxShadow: "0 0 5px 0 #00796b",
      },
    },
    "& .MuiInputLabel-root": {
      "&.Mui-focused": {
        color: "#00796b",
      },
    },
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: isSmallScreen ? 2 : 4,
          mt: isSmallScreen ? 5 : 0,
          minHeight: "100vh",
          backgroundColor: "#f4f6f8",
          fontFamily: '"Didonesque", sans-serif',
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 800 }}>
          <Typography
            variant={isSmallScreen ? "h5" : "h4"}
            gutterBottom
            sx={{
              fontWeight: "bold",
              color: "#00796b",
              mb: 3,
              textAlign: "center",
              fontFamily: '"Didonesque", sans-serif',
            }}
          >
            เพิ่มบัญชี
          </Typography>

          <Paper elevation={3} sx={{ p: isSmallScreen ? 2 : 4, borderRadius: 2 }}>
            <Box component="form" onSubmit={handleSubmit} noValidate>
              
              {/* Row 1: Role and User ID */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="role-select-label">สิทธิ์การใช้งาน*</InputLabel>
                    <Select
                      labelId="role-select-label"
                      id="role-select"
                      name="role"
                      value={formData.role}
                      label="สิทธิ์การใช้งาน"
                      onChange={handleChange}
                      sx={inputStyle}
                    >
                      <MenuItem value="teacher">Teacher</MenuItem>
                      <MenuItem value="admin">Admin</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="รหัสผู้ใช้/รหัสนักศึกษา"
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleChange}
                    fullWidth
                    required
                    size="small"
                    sx={inputStyle}
                  />
                </Grid>
              </Grid>

              {/* ✅ FIX: Row 2: Full Name และ Branch (สาขา) */}
              <Grid container spacing={2} sx={{ my: 1 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="ชื่อ-นามสกุล"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    fullWidth
                    required
                    size="small"
                    sx={inputStyle}
                    InputProps={{
                        startAdornment: (
                            <Box sx={{ mr: 1, color: '#555' }}>👤</Box> // Placeholder icon
                        ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="สาขา"
                    name="branch" // ใช้ 'branch' ตามที่กำหนด
                    value={formData.branch}
                    onChange={handleChange}
                    fullWidth
                    required
                    size="small"
                    sx={inputStyle}
                  />
                </Grid>
              </Grid>
              {/* ❌ REMOVED: Row 2 เดิมที่เป็น TextField ตัวเดียว (Full Name) */}
              
              {/* Row 3: Email and Phone */}
              <Grid container spacing={2} sx={{ my: 1 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="อีเมล"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    fullWidth
                    required
                    size="small"
                    sx={inputStyle}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="เบอร์โทรศัพท์*"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    fullWidth
                    required
                    size="small"
                    sx={inputStyle}
                  />
                </Grid>
              </Grid>

              {/* Row 4: Password Fields */}
              <Grid container spacing={2} sx={{ my: 1 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="รหัสผ่าน*"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    fullWidth
                    required
                    size="small"
                    sx={inputStyle}
                    InputProps={{
                      startAdornment: (
                        <LockIcon sx={{ mr: 1, color: '#555' }} />
                      ),
                      endAdornment: (
                        <IconButton
                          onClick={() => handleTogglePassword('password')}
                          edge="end"
                          size="small"
                        >
                          {showPassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
                        </IconButton>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="ยืนยันรหัสผ่าน*"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    fullWidth
                    required
                    size="small"
                    sx={inputStyle}
                    InputProps={{
                      startAdornment: (
                        <LockIcon sx={{ mr: 1, color: '#555' }} />
                      ),
                      endAdornment: (
                        <IconButton
                          onClick={() => handleTogglePassword('confirmPassword')}
                          edge="end"
                          size="small"
                        >
                          {showConfirmPassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
                        </IconButton>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
              
              {/* Password Requirements Text */}
              <Box sx={{ mt: 1, mb: 3, fontSize: '0.8rem', color: '#777' }}>
                <Typography variant="caption" display="block">
                    * รหัสผ่านควรมีความยาว 8-16 ตัวอักษร
                </Typography>
                <Typography variant="caption" display="block">
                    * ต้องประกอบด้วยตัวอักษรพิมพ์เล็ก, พิมพ์ใหญ่, ตัวเลข, หรืออักขระพิเศษอย่างน้อยหนึ่งตัว
                </Typography>
                <Typography variant="caption" display="block">
                    * รหัสผ่านและยืนยันรหัสผ่านต้องตรงกัน
                </Typography>
              </Box>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{
                  mt: 3,
                  py: 1.5,
                  backgroundColor: "#00796b",
                  '&:hover': { backgroundColor: "#005a4d" },
                  textTransform: "none",
                  fontWeight: "bold",
                  fontFamily: '"Didonesque", sans-serif',
                }}
              >
                ลงทะเบียน
              </Button>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}

export default AddAccount;