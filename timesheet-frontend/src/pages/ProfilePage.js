import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
} from '@mui/material';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import { getUserProfile, updateUserProfile, changePassword } from '../services/userService';

function ProfilePage() {
  const { token, user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // ฟอร์มแก้ไขข้อมูลส่วนตัว
  const [editData, setEditData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
  });
  const [editErrors, setEditErrors] = useState({});
  const [loadingEdit, setLoadingEdit] = useState(false);

  // ฟอร์มเปลี่ยนรหัสผ่าน
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [loadingPwd, setLoadingPwd] = useState(false);

  // Snackbar success
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await getUserProfile(token);
        setProfile(res.data);
        setEditData({
          fullName: res.data.fullName || '',
          email: res.data.email || '',
          phone: res.data.phone || '',
          address: res.data.address || '',
        });
      } catch (error) {
        Swal.fire('ผิดพลาด', 'ไม่สามารถโหลดข้อมูลโปรไฟล์ได้', 'error');
      }
      setLoading(false);
    };
    fetchProfile();
  }, [token]);

  // Validate ฟอร์มแก้ไขข้อมูล
  const validateEdit = () => {
    const errors = {};
    if (!editData.fullName.trim()) errors.fullName = 'กรุณากรอกชื่อ-นามสกุล';
    if (editData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editData.email))
      errors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    if (editData.phone && !/^[0-9()+-\s]{5,20}$/.test(editData.phone))
      errors.phone = 'รูปแบบเบอร์โทรไม่ถูกต้อง';
    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate ฟอร์มเปลี่ยนรหัสผ่าน
  const validatePassword = () => {
    const errors = {};
    if (!passwordData.currentPassword) errors.currentPassword = 'กรุณากรอกรหัสผ่านปัจจุบัน';
    if (!passwordData.newPassword) errors.newPassword = 'กรุณากรอกรหัสผ่านใหม่';
    else if (passwordData.newPassword.length < 6) errors.newPassword = 'รหัสผ่านใหม่ต้องอย่างน้อย 6 ตัวอักษร';
    if (passwordData.newPassword !== passwordData.confirmNewPassword)
      errors.confirmNewPassword = 'รหัสผ่านไม่ตรงกัน';
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateEdit()) return;
    setLoadingEdit(true);
    try {
      await updateUserProfile(editData, token);
      setSuccessMsg('อัปเดตข้อมูลสำเร็จ');
      // อัปเดตข้อมูล local user ถ้ามี context function สำหรับ update user info, สามารถเรียกได้ที่นี่
    } catch (error) {
      Swal.fire('ผิดพลาด', 'ไม่สามารถอัปเดตข้อมูลได้', 'error');
    }
    setLoadingEdit(false);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!validatePassword()) return;
    setLoadingPwd(true);
    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword, token);
      setSuccessMsg('เปลี่ยนรหัสผ่านสำเร็จ');
      setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (error) {
      Swal.fire('ผิดพลาด', error.response?.data?.message || 'เปลี่ยนรหัสผ่านไม่สำเร็จ', 'error');
    }
    setLoadingPwd(false);
  };

  return (
    <>
      <Navbar />
      <Box
        sx={{
          minHeight: '90vh',
          maxWidth: 700,
          mx: 'auto',
          px: 2,
          py: 6,
          backgroundColor: '#f5f7fa',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#0066cc', textAlign: 'center' }}>
          โปรไฟล์ของ {profile?.fullName || user?.fullName}
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Paper sx={{ p: 4, borderRadius: 3, backgroundColor: '#fff' }} elevation={4}>
              <Typography variant="h6" sx={{ mb: 2, color: '#004a99' }}>
                แก้ไขข้อมูลส่วนตัว
              </Typography>
              <Box component="form" onSubmit={handleEditSubmit} noValidate>
                <TextField
                  fullWidth
                  label="ชื่อ-นามสกุล"
                  name="fullName"
                  value={editData.fullName}
                  onChange={handleEditChange}
                  error={Boolean(editErrors.fullName)}
                  helperText={editErrors.fullName}
                  sx={{ mb: 3 }}
                />
                <TextField
                  fullWidth
                  label="อีเมล"
                  name="email"
                  type="email"
                  value={editData.email}
                  onChange={handleEditChange}
                  error={Boolean(editErrors.email)}
                  helperText={editErrors.email}
                  sx={{ mb: 3 }}
                />
                <TextField
                  fullWidth
                  label="เบอร์โทรศัพท์"
                  name="phone"
                  value={editData.phone}
                  onChange={handleEditChange}
                  error={Boolean(editErrors.phone)}
                  helperText={editErrors.phone}
                  sx={{ mb: 3 }}
                />
                <TextField
                  fullWidth
                  label="ที่อยู่"
                  name="address"
                  multiline
                  rows={3}
                  value={editData.address}
                  onChange={handleEditChange}
                  sx={{ mb: 3 }}
                />

                <Button
                  variant="contained"
                  type="submit"
                  disabled={loadingEdit}
                  sx={{
                    backgroundColor: '#0066cc',
                    '&:hover': { backgroundColor: '#004a99' },
                    textTransform: 'none',
                    fontWeight: 700,
                    py: 1.5,
                  }}
                >
                  {loadingEdit ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </Button>
              </Box>
            </Paper>

            <Paper sx={{ p: 4, borderRadius: 3, backgroundColor: '#fff' }} elevation={4}>
              <Typography variant="h6" sx={{ mb: 2, color: '#004a99' }}>
                เปลี่ยนรหัสผ่าน
              </Typography>
              <Box component="form" onSubmit={handlePasswordSubmit} noValidate>
                <TextField
                  fullWidth
                  label="รหัสผ่านปัจจุบัน"
                  name="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  error={Boolean(passwordErrors.currentPassword)}
                  helperText={passwordErrors.currentPassword}
                  sx={{ mb: 3 }}
                />
                <TextField
                  fullWidth
                  label="รหัสผ่านใหม่"
                  name="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  error={Boolean(passwordErrors.newPassword)}
                  helperText={passwordErrors.newPassword}
                  sx={{ mb: 3 }}
                />
                <TextField
                  fullWidth
                  label="ยืนยันรหัสผ่านใหม่"
                  name="confirmNewPassword"
                  type="password"
                  value={passwordData.confirmNewPassword}
                  onChange={handlePasswordChange}
                  error={Boolean(passwordErrors.confirmNewPassword)}
                  helperText={passwordErrors.confirmNewPassword}
                  sx={{ mb: 3 }}
                />

                <Button
                  variant="contained"
                  type="submit"
                  disabled={loadingPwd}
                  sx={{
                    backgroundColor: '#0066cc',
                    '&:hover': { backgroundColor: '#004a99' },
                    textTransform: 'none',
                    fontWeight: 700,
                    py: 1.5,
                  }}
                >
                  {loadingPwd ? 'กำลังเปลี่ยนรหัส...' : 'เปลี่ยนรหัสผ่าน'}
                </Button>
              </Box>
            </Paper>
          </>
        )}

        <Snackbar
          open={Boolean(successMsg)}
          autoHideDuration={3000}
          onClose={() => setSuccessMsg('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setSuccessMsg('')} severity="success" sx={{ width: '100%' }}>
            {successMsg}
          </Alert>
        </Snackbar>
      </Box>
    </>
  );
}

export default ProfilePage;
