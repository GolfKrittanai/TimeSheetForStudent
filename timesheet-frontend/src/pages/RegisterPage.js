import React from 'react';
import { Box, Typography, TextField, Button } from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { registerUser } from '../services/authService';
import { useNavigate } from 'react-router-dom';

function RegisterPage() {
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      studentId: '',
      name: '',
      password: '',
      confirmPassword: '',
    },
    validationSchema: Yup.object({
      studentId: Yup.string().required('กรุณากรอกรหัสนักศึกษา'),
      name: Yup.string().required('กรุณากรอกชื่อ-นามสกุล'),
      password: Yup.string()
        .min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัว')
        .required('กรุณากรอกรหัสผ่าน'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password'), null], 'รหัสผ่านไม่ตรงกัน')
        .required('กรุณายืนยันรหัสผ่าน'),
    }),
    onSubmit: async (values) => {
      try {
        await registerUser({
          studentId: values.studentId,
          name: values.name,
          password: values.password,
        });
        alert('สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ');
        navigate('/');
      } catch (err) {
        alert('สมัครสมาชิกไม่สำเร็จ');
      }
    },
  });

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 10 }}>
      <Typography variant="h4" gutterBottom>
        ลงทะเบียน
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
          label="ชื่อ-นามสกุล"
          name="name"
          fullWidth
          margin="normal"
          value={formik.values.name}
          onChange={formik.handleChange}
          error={formik.touched.name && Boolean(formik.errors.name)}
          helperText={formik.touched.name && formik.errors.name}
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
        <TextField
          label="ยืนยันรหัสผ่าน"
          name="confirmPassword"
          type="password"
          fullWidth
          margin="normal"
          value={formik.values.confirmPassword}
          onChange={formik.handleChange}
          error={
            formik.touched.confirmPassword &&
            Boolean(formik.errors.confirmPassword)
          }
          helperText={
            formik.touched.confirmPassword && formik.errors.confirmPassword
          }
        />
        <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }}>
          ลงทะเบียน
        </Button>
        <Button fullWidth onClick={() => navigate('/')} sx={{ mt: 1 }}>
          กลับไปหน้าเข้าสู่ระบบ
        </Button>
      </form>
    </Box>
  );
}

export default RegisterPage;
