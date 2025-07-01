import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Box, TextField, Button, Typography } from '@mui/material';
import { register } from '../services/authService';
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
        .min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
        .required('กรุณากรอกรหัสผ่าน'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password'), null], 'รหัสผ่านไม่ตรงกัน')
        .required('กรุณายืนยันรหัสผ่าน'),
    }),
    onSubmit: async (values) => {
      try {
        await register(values);
        alert('ลงทะเบียนสำเร็จ กรุณาเข้าสู่ระบบ');
        navigate('/');
      } catch (err) {
        alert(err.response?.data?.message || 'เกิดข้อผิดพลาด');
      }
    },
  });

  return (
    <Box sx={{ maxWidth: 500, mx: 'auto', mt: 8 }}>
      <Typography variant="h5" gutterBottom>
        ลงทะเบียน
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
          label="ชื่อ-นามสกุล"
          name="name"
          value={formik.values.name}
          onChange={formik.handleChange}
          error={formik.touched.name && Boolean(formik.errors.name)}
          helperText={formik.touched.name && formik.errors.name}
          margin="normal"
        />
        <TextField
          fullWidth
          label="รหัสผ่าน"
          name="password"
          type="password"
          value={formik.values.password}
          onChange={formik.handleChange}
          error={formik.touched.password && Boolean(formik.errors.password)}
          helperText={formik.touched.password && formik.errors.password}
          margin="normal"
        />
        <TextField
          fullWidth
          label="ยืนยันรหัสผ่าน"
          name="confirmPassword"
          type="password"
          value={formik.values.confirmPassword}
          onChange={formik.handleChange}
          error={
            formik.touched.confirmPassword &&
            Boolean(formik.errors.confirmPassword)
          }
          helperText={
            formik.touched.confirmPassword && formik.errors.confirmPassword
          }
          margin="normal"
        />
        <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
          ลงทะเบียน
        </Button>
      </form>
    </Box>
  );
}

export default RegisterPage;
