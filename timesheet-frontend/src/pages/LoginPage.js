import React from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { loginUser } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { motion } from 'framer-motion';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  // ตรวจสอบขนาดหน้าจอ (เช่น sm = 600px)
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const formik = useFormik({
    initialValues: {
      studentId: '',
      password: '',
    },
    validationSchema: Yup.object({
      studentId: Yup.string().required('กรุณากรอกรหัสนักศึกษา'),
      password: Yup.string().required('กรุณากรอกรหัสผ่าน'),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const res = await loginUser(values);
        login({ token: res.data.token, user: res.data.user });

        if (res.data.user.role === 'admin') {
          navigate('/admin');
        } else if (res.data.user.role === 'student') {
          navigate('/student');
        } else {
          navigate('/');
        }
      } catch (error) {
        if (error.response?.status === 401) {
          Swal.fire({
            icon: 'error',
            title: 'คุณกรอกข้อมูลไม่ถูกต้อง!!',
            text: 'กรุณาตรวจสอบรหัสนักศึกษาและรหัสผ่านอีกครั้ง',
            confirmButtonColor: '#007aff',
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: 'ไม่สามารถเข้าสู่ระบบได้ในขณะนี้',
            confirmButtonColor: '#007aff',
          });
        }
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        background: 'linear-gradient(135deg, #f0f0f5 0%, #d9e2ec 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box
          sx={{
            maxWidth: isSmallScreen ? '90vw' : 400,  // กำหนดกว้างอัตโนมัติตามหน้าจอ
            width: '100%',
            bgcolor: '#ffffff',
            p: isSmallScreen ? 3 : 5, // ลด padding บนมือถือ
            borderRadius: 3,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            textAlign: 'center',
          }}
        >
          <Typography variant={isSmallScreen ? "h5" : "h4"} sx={{ fontWeight: 700, color: '#111', mb: 1.5 }}>
            Timesheet
          </Typography>
          <Typography variant="subtitle1" sx={{ color: '#666', mb: 4 }}>
            ระบบสำหรับนักศึกษา
          </Typography>

          <form onSubmit={formik.handleSubmit} noValidate>
            <TextField
              label="รหัสนักศึกษา"
              name="studentId"
              fullWidth
              margin="normal"
              value={formik.values.studentId}
              onChange={formik.handleChange}
              error={formik.touched.studentId && Boolean(formik.errors.studentId)}
              helperText={formik.touched.studentId && formik.errors.studentId}
              autoFocus
              InputProps={{
                sx: {
                  borderRadius: 2,
                  bgcolor: '#fafafa',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#ccc' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#007aff' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#007aff',
                    boxShadow: '0 0 5px 0 #007aff',
                  },
                },
              }}
            />
            <TextField
              label="รหัสผ่าน"
              name="password"
              type="password"
              fullWidth
              margin="normal"
              value={formik.values.password}
              onChange={formik.handleChange}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
              InputProps={{
                sx: {
                  borderRadius: 2,
                  bgcolor: '#fafafa',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#ccc' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#007aff' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#007aff',
                    boxShadow: '0 0 5px 0 #007aff',
                  },
                },
              }}
            />

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{
                  mt: 4,
                  py: 1.5,
                  fontWeight: 700,
                  backgroundColor: '#007aff',
                  borderRadius: 3,
                  fontSize: isSmallScreen ? '1rem' : '1.1rem',
                  '&:hover': {
                    backgroundColor: '#005bb5',
                    boxShadow: '0 4px 12px rgba(0,91,181,0.4)',
                  },
                  textTransform: 'none',
                }}
                disabled={formik.isSubmitting}
              >
                เข้าสู่ระบบ
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              <Button
                fullWidth
                sx={{
                  mt: 2,
                  textTransform: 'none',
                  color: '#007aff',
                  fontWeight: 600,
                  fontSize: isSmallScreen ? '0.85rem' : '0.95rem',
                  '&:hover': {
                    textDecoration: 'underline',
                    backgroundColor: 'transparent',
                  },
                }}
                onClick={() => navigate('/register')}
              >
                ลงทะเบียน
              </Button>
            </motion.div>
          </form>
        </Box>
      </motion.div>
    </Box>
  );
};

export default LoginPage;
