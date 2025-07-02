import React from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  InputAdornment,
} from '@mui/material';
import {
  AccountCircle,
  Badge,
  Lock,
  LockReset,
  ArrowBack,
} from '@mui/icons-material';
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
        setErrors({
          submit: error.response?.data?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่',
        });
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
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
      }}
    >
      <Box
        sx={{
          maxWidth: 420,
          width: '100%',
          bgcolor: '#fff',
          p: 5,
          borderRadius: 3,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          textAlign: 'center',
        }}
      >
        <Typography
          variant="h5"
          gutterBottom
          sx={{
            fontWeight: 600,
            color: '#111',
          }}
        >
          ลงทะเบียน TimeSheet
        </Typography>

        <Typography
          variant="subtitle2"
          sx={{ mb: 3, color: '#666' }}
        >
          สำหรับนักศึกษาใหม่
        </Typography>

        <form onSubmit={formik.handleSubmit} noValidate>
          <TextField
            label="ชื่อ-นามสกุล"
            name="fullName"
            fullWidth
            margin="normal"
            variant="outlined"
            value={formik.values.fullName}
            onChange={formik.handleChange}
            error={formik.touched.fullName && Boolean(formik.errors.fullName)}
            helperText={formik.touched.fullName && formik.errors.fullName}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AccountCircle sx={{ color: '#007aff' }} />
                </InputAdornment>
              ),
              sx: {
                borderRadius: 2,
                bgcolor: '#fafafa',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#ccc',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#007aff',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#007aff',
                  boxShadow: '0 0 5px 0 #007aff',
                },
              },
            }}
          />
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
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Badge sx={{ color: '#007aff' }} />
                </InputAdornment>
              ),
              sx: {
                borderRadius: 2,
                bgcolor: '#fafafa',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#ccc',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#007aff',
                },
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
            variant="outlined"
            value={formik.values.password}
            onChange={formik.handleChange}
            error={formik.touched.password && Boolean(formik.errors.password)}
            helperText={formik.touched.password && formik.errors.password}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock sx={{ color: '#007aff' }} />
                </InputAdornment>
              ),
              sx: {
                borderRadius: 2,
                bgcolor: '#fafafa',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#ccc',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#007aff',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#007aff',
                  boxShadow: '0 0 5px 0 #007aff',
                },
              },
            }}
          />
          <TextField
            label="ยืนยันรหัสผ่าน"
            name="confirmPassword"
            type="password"
            fullWidth
            margin="normal"
            variant="outlined"
            value={formik.values.confirmPassword}
            onChange={formik.handleChange}
            error={
              formik.touched.confirmPassword &&
              Boolean(formik.errors.confirmPassword)
            }
            helperText={
              formik.touched.confirmPassword && formik.errors.confirmPassword
            }
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockReset sx={{ color: '#007aff' }} />
                </InputAdornment>
              ),
              sx: {
                borderRadius: 2,
                bgcolor: '#fafafa',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#ccc',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#007aff',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#007aff',
                  boxShadow: '0 0 5px 0 #007aff',
                },
              },
            }}
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
              backgroundColor: '#007aff',
              borderRadius: 3,
              boxShadow: 'none',
              '&:hover': {
                backgroundColor: '#005bb5',
                boxShadow: '0 4px 12px rgba(0,91,181,0.4)',
              },
              textTransform: 'none',
            }}
            disabled={formik.isSubmitting}
          >
            ลงทะเบียน
          </Button>

          <Button
            fullWidth
            startIcon={<ArrowBack />}
            sx={{
              mt: 2,
              color: '#007aff',
              textTransform: 'none',
              fontWeight: 500,
              '&:hover': {
                textDecoration: 'underline',
                backgroundColor: 'transparent',
                cursor: 'pointer',
              },
            }}
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
