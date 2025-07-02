import React from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
} from '@mui/material';
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
        backgroundColor: '#f4f6f8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Box
        sx={{
          maxWidth: 420,
          width: '100%',
          bgcolor: '#ffffff',
          p: 4,
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            color: '#333',
            textAlign: 'center',
            mb: 1,
          }}
        >
          ระบบ Timesheet สำหรับนักศึกษา
        </Typography>

        <Typography
          variant="h6"
          sx={{
            fontWeight: 500,
            color: '#555',
            textAlign: 'center',
            mb: 3,
          }}
        >
          เข้าสู่ระบบ
        </Typography>

        <form onSubmit={formik.handleSubmit} noValidate>
          <TextField
            label="รหัสนักศึกษา"
            name="studentId"
            fullWidth
            margin="normal"
            variant="outlined"
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
            variant="outlined"
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
            sx={{
              mt: 3,
              py: 1.3,
              fontWeight: 600,
              backgroundColor: '#4caf50',
              '&:hover': { backgroundColor: '#43a047' },
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
              color: '#4caf50',
              fontWeight: 500,
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
