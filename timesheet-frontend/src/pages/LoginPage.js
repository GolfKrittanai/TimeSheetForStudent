import React from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { loginUser } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

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
      })
      }
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0f0f5 0%, #d9e2ec 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Box
        sx={{
          maxWidth: 400,
          width: '100%',
          bgcolor: '#ffffff',
          p: 5,
          borderRadius: 3,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          textAlign: 'center',
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#111', mb: 1.5 }}>
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
              '&:hover': {
                backgroundColor: '#005bb5',
                boxShadow: '0 4px 12px rgba(0,91,181,0.4)',
              },
              textTransform: 'none',
              fontSize: '1.1rem',
            }}
            disabled={formik.isSubmitting}
          >
            เข้าสู่ระบบ
          </Button>

          <Button
            fullWidth
            sx={{
              mt: 2,
              textTransform: 'none',
              color: '#007aff',
              fontWeight: 600,
              fontSize: '0.95rem',
              '&:hover': {
                textDecoration: 'underline',
                backgroundColor: 'transparent',
              },
            }}
            onClick={() => navigate('/register')}
          >
            ลงทะเบียน
          </Button>
        </form>
      </Box>
    </Box>
  );
};

export default LoginPage;