import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { TextField, Button, Box, Typography } from '@mui/material';
import { login as loginAPI } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const formik = useFormik({
    initialValues: {
      studentId: '',
      password: '',
    },
    validationSchema: Yup.object({
      studentId: Yup.string().required('กรุณากรอกรหัสนักศึกษา'),
      password: Yup.string().required('กรุณากรอกรหัสผ่าน'),
    }),
    onSubmit: async (values) => {
      try {
        const res = await loginAPI(values);
        const { token, user } = res.data;
        login(user, token);

        if (user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/student');
        }
      } catch (err) {
        alert(err.response?.data?.message || 'เข้าสู่ระบบไม่สำเร็จ');
      }
    },
  });

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 8 }}>
      <Typography variant="h5" align="center" gutterBottom>
        เข้าสู่ระบบ
      </Typography>
      <form onSubmit={formik.handleSubmit}>
        <TextField
          fullWidth
          label="รหัสนักศึกษา"
          name="studentId"
          value={formik.values.studentId}
          onChange={formik.handleChange}
          error={formik.touched.studentId && Boolean(formik.errors.studentId)}
          helperText={formik.touched.studentId && formik.errors.studentId}
          margin="normal"
        />
        <TextField
          fullWidth
          label="รหัสผ่าน"
          type="password"
          name="password"
          value={formik.values.password}
          onChange={formik.handleChange}
          error={formik.touched.password && Boolean(formik.errors.password)}
          helperText={formik.touched.password && formik.errors.password}
          margin="normal"
        />
        <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
          เข้าสู่ระบบ
        </Button>
      </form>
    </Box>
  );
}

export default LoginPage;
