import React from 'react';
import { Box, Typography, TextField, Button } from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { loginUser } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: { studentId: '', password: '' },
    validationSchema: Yup.object({
      studentId: Yup.string().required('กรุณากรอกรหัสนักศึกษา'),
      password: Yup.string().required('กรุณากรอกรหัสผ่าน'),
    }),
    onSubmit: async (values) => {
      try {
        const res = await loginUser(values);
        login(res.data.token, res.data.user);
        navigate(res.data.user.role === 'admin' ? '/admin' : '/student');
      } catch (err) {
        alert('เข้าสู่ระบบไม่สำเร็จ');
      }
    },
  });

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 10 }}>
      <Typography variant="h4" gutterBottom>
        เข้าสู่ระบบ
      </Typography>
      <form onSubmit={formik.handleSubmit}>
        <TextField
          label="รหัสนักศึกษา"
          name="studentId"
          fullWidth
          margin="normal"
          value={formik.values.studentId}
          onChange={formik.handleChange}
          error={formik.touched.studentId && Boolean(formik.errors.studentId)}
          helperText={formik.touched.studentId && formik.errors.studentId}
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
        />
        <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }}>
          Login
        </Button>
        <Button fullWidth onClick={() => navigate('/register')} sx={{ mt: 1 }}>
          ลงทะเบียน
        </Button>
      </form>
    </Box>
  );
}

export default LoginPage;
