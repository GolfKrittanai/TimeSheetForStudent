import React from 'react';
import { Box, Typography, TextField, Button, Alert } from '@mui/material';
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

        login({ token: res.data.token, user: res.data.user });

        if (res.data.user.role === 'admin') {
          navigate('/admin');
        } else if (res.data.user.role === 'student') {
          navigate('/student');
        } else {
          navigate('/');
        }
      } catch (error) {
        setErrors({ submit: 'รหัสนักศึกษาหรือรหัสผ่านไม่ถูกต้อง' });
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
          variant="h5"
          gutterBottom
          sx={{ fontWeight: 'bold', color: '#1976d2', textAlign: 'center', mb: 2 }}
        >
          ระบบ Timesheet สำหรับนักศึกษา
        </Typography>

        <Typography
          variant="h4"
          gutterBottom
          sx={{ fontWeight: 'bold', color: '#1976d2', textAlign: 'center', mb: 4 }}
        >
          เข้าสู่ระบบ
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
            เข้าสู่ระบบ
          </Button>
          <Button
            fullWidth
            sx={{ mt: 1, textTransform: 'none' }}
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
