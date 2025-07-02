import React from 'react';
import { Box, Typography, TextField, Button } from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { loginUser } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

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
    onSubmit: async (values, { setSubmitting, setErrors }) => {
      try {
        const res = await loginUser(values);

        // เรียก login ใน Context โดยส่ง object {token, user} ตามที่ Context กำหนด
        login({ token: res.data.token, user: res.data.user });

        // เปลี่ยนหน้าไปตาม role ที่ได้จาก API
        if (res.data.user.role === 'admin') {
          navigate('/admin');
        } else if (res.data.user.role === 'student') {
          navigate('/student');
        } else {
          navigate('/'); // กรณีอื่นๆ กลับหน้า login
        }
      } catch (error) {
        setErrors({ submit: 'รหัสนักศึกษาหรือรหัสผ่านไม่ถูกต้อง' });
      } finally {
        setSubmitting(false);
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
        {formik.errors.submit && (
          <Typography color="error" sx={{ mt: 1 }}>
            {formik.errors.submit}
          </Typography>
        )}
        <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }}>
          เข้าสู่ระบบ
        </Button>
        <Button fullWidth sx={{ mt: 1 }} onClick={() => navigate('/register')}>
          ลงทะเบียน
        </Button>
      </form>
    </Box>
  );
};

export default LoginPage;
