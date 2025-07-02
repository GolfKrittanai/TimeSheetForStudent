import React from 'react';
import { Box, Typography, TextField, Button, Alert } from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { registerUser } from '../services/authService';
import { useNavigate } from 'react-router-dom';

function RegisterPage() {
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      fullName: '',
      studentId: '',
      password: '',
      confirmPassword: '',
      role: 'student',
    },
    validationSchema: Yup.object({
      fullName: Yup.string().required('กรุณากรอกชื่อ'),
      studentId: Yup.string().required('กรุณากรอกรหัสนักศึกษา'),
      password: Yup.string()
        .min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
        .required('กรุณากรอกรหัสผ่าน'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password'), null], 'รหัสผ่านไม่ตรงกัน')
        .required('กรุณายืนยันรหัสผ่าน'),
    }),
    onSubmit: async (values, { setSubmitting, setErrors }) => {
      try {
        await registerUser({
          studentId: values.studentId,
          fullName: values.fullName,
          password: values.password,
          role: values.role,
        });
        navigate('/', { state: { registered: true } });
      } catch (error) {
        if (error.response?.data?.message) {
          setErrors({ submit: error.response.data.message });
        } else {
          setErrors({ submit: 'เกิดข้อผิดพลาด กรุณาลองใหม่' });
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
        background: 'linear-gradient(135deg, #2196f3 0%, #21cbf3 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
      }}
    >
      <Box
        sx={{
          maxWidth: 400,
          width: '100%',
          bgcolor: 'background.paper',
          p: 4,
          borderRadius: 3,
          boxShadow: 6,
        }}
      >
        <Typography
          variant="h4"
          gutterBottom
          sx={{ fontWeight: 'bold', color: '#1976d2', textAlign: 'center', mb: 3 }}
        >
          ลงทะเบียน
        </Typography>

        <form onSubmit={formik.handleSubmit} noValidate>
          <TextField
            label="ชื่อ-นามสกุล"
            name="fullName"
            fullWidth
            margin="normal"
            value={formik.values.fullName}
            onChange={formik.handleChange}
            error={formik.touched.fullName && Boolean(formik.errors.fullName)}
            helperText={formik.touched.fullName && formik.errors.fullName}
            autoFocus
          />
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
            helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
          />

          {formik.errors.submit && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {formik.errors.submit}
            </Alert>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, py: 1.5, fontWeight: 'bold' }}
            disabled={formik.isSubmitting}
          >
            ลงทะเบียน
          </Button>
          <Button
            fullWidth
            sx={{ mt: 1, textTransform: 'none' }}
            onClick={() => navigate('/')}
          >
            กลับไปหน้าเข้าสู่ระบบ
          </Button>
        </form>
      </Box>
    </Box>
  );
}

export default RegisterPage;
