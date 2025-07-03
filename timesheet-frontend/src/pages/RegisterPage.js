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
  Email,
  Phone,
  Home,
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
      email: '',
      phone: '',
      address: '',
      password: '',
      confirmPassword: '',
      role: 'student',
    },
    validationSchema: Yup.object({
      fullName: Yup.string().required('กรุณากรอกชื่อ'),
      studentId: Yup.string().required('กรุณากรอกรหัสนักศึกษา'),
      email: Yup.string().email('อีเมลไม่ถูกต้อง').required('กรุณากรอกอีเมล'),
      phone: Yup.string().matches(/^[0-9]{9,10}$/, 'เบอร์โทรไม่ถูกต้อง').required('กรุณากรอกเบอร์โทร'),
      address: Yup.string().required('กรุณากรอกที่อยู่'),
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
          email: values.email,
          phone: values.phone,
          address: values.address,
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
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: '#111' }}>
          ลงทะเบียน TimeSheet
        </Typography>
        <Typography variant="subtitle2" sx={{ mb: 3, color: '#666' }}>
          สำหรับนักศึกษาใหม่
        </Typography>

        <form onSubmit={formik.handleSubmit} noValidate>
          <CustomField
            icon={<AccountCircle sx={{ color: '#007aff' }} />}
            label="ชื่อ-นามสกุล"
            name="fullName"
            formik={formik}
          />
          <CustomField
            icon={<Badge sx={{ color: '#007aff' }} />}
            label="รหัสนักศึกษา"
            name="studentId"
            formik={formik}
          />
          <CustomField
            icon={<Email sx={{ color: '#007aff' }} />}
            label="อีเมล"
            name="email"
            formik={formik}
          />
          <CustomField
            icon={<Phone sx={{ color: '#007aff' }} />}
            label="เบอร์โทร"
            name="phone"
            formik={formik}
          />
          <CustomField
            icon={<Home sx={{ color: '#007aff' }} />}
            label="ที่อยู่"
            name="address"
            multiline
            rows={2}
            formik={formik}
          />
          <CustomField
            icon={<Lock sx={{ color: '#007aff' }} />}
            label="รหัสผ่าน"
            name="password"
            type="password"
            formik={formik}
          />
          <CustomField
            icon={<LockReset sx={{ color: '#007aff' }} />}
            label="ยืนยันรหัสผ่าน"
            name="confirmPassword"
            type="password"
            formik={formik}
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
            sx={submitButtonStyle}
            disabled={formik.isSubmitting}
          >
            ลงทะเบียน
          </Button>

          <Button
            fullWidth
            startIcon={<ArrowBack />}
            sx={backButtonStyle}
            onClick={() => navigate('/')}
          >
            กลับไปหน้าเข้าสู่ระบบ
          </Button>
        </form>
      </Box>
    </Box>
  );
}

// ✅ ฟังก์ชันย่อยสำหรับลดซ้ำของ TextField + Icon
function CustomField({ label, name, icon, formik, type = 'text', multiline = false, rows = 1 }) {
  return (
    <TextField
      label={label}
      name={name}
      type={type}
      fullWidth
      multiline={multiline}
      rows={rows}
      margin="normal"
      variant="outlined"
      value={formik.values[name]}
      onChange={formik.handleChange}
      error={formik.touched[name] && Boolean(formik.errors[name])}
      helperText={formik.touched[name] && formik.errors[name]}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            {icon}
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
  );
}

const submitButtonStyle = {
  mt: 3,
  py: 1.3,
  fontWeight: 600,
  backgroundColor: '#007aff',
  borderRadius: 3,
  boxShadow: 'none',
  textTransform: 'none',
  '&:hover': {
    backgroundColor: '#005bb5',
    boxShadow: '0 4px 12px rgba(0,91,181,0.4)',
  },
};

const backButtonStyle = {
  mt: 2,
  color: '#007aff',
  textTransform: 'none',
  fontWeight: 500,
  '&:hover': {
    textDecoration: 'underline',
    backgroundColor: 'transparent',
    cursor: 'pointer',
  },
};

export default RegisterPage;
