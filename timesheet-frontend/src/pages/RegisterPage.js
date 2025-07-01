import React from 'react';
import { Box, Typography, TextField, Button } from '@mui/material'; // UI components จาก Material UI
import { useFormik } from 'formik'; // จัดการฟอร์ม
import * as Yup from 'yup'; // ตรวจสอบความถูกต้องของข้อมูลในฟอร์ม
import { registerUser } from '../services/authService'; // ฟังก์ชันเรียก API ลงทะเบียนผู้ใช้
import { useNavigate } from 'react-router-dom'; // สำหรับเปลี่ยนหน้า (navigation)

function RegisterPage() {
  const navigate = useNavigate(); // ฟังก์ชันเปลี่ยนหน้า

  // กำหนด formik สำหรับจัดการฟอร์มและตรวจสอบข้อมูล
  const formik = useFormik({
    initialValues: {
      studentId: '',       // รหัสนักศึกษา
      name: '',            // ชื่อ-นามสกุล
      password: '',        // รหัสผ่าน
      confirmPassword: '', // ยืนยันรหัสผ่าน
    },
    validationSchema: Yup.object({
      // กำหนดกฎตรวจสอบข้อมูลแต่ละฟิลด์
      studentId: Yup.string().required('กรุณากรอกรหัสนักศึกษา'),
      name: Yup.string().required('กรุณากรอกชื่อ-นามสกุล'),
      password: Yup.string()
        .min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัว')
        .required('กรุณากรอกรหัสผ่าน'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password'), null], 'รหัสผ่านไม่ตรงกัน') // ต้องตรงกับ password
        .required('กรุณายืนยันรหัสผ่าน'),
    }),
    onSubmit: async (values) => {
      try {
        // เรียก API ลงทะเบียนผู้ใช้
        await registerUser({
          studentId: values.studentId,
          name: values.name,
          password: values.password,
        });
        alert('สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ');
        navigate('/'); // กลับไปหน้าเข้าสู่ระบบ
      } catch (err) {
        alert('สมัครสมาชิกไม่สำเร็จ'); // แจ้งเตือนหากลงทะเบียนไม่สำเร็จ
      }
    },
  });

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 10 }}>
      {/* หัวข้อหน้าลงทะเบียน */}
      <Typography variant="h4" gutterBottom>
        ลงทะเบียน
      </Typography>

      {/* ฟอร์มลงทะเบียน */}
      <form onSubmit={formik.handleSubmit}>
        {/* ช่องกรอกรหัสนักศึกษา */}
        <TextField
          label="รหัสนักศึกษา"
          name="studentId"
          fullWidth
          margin="normal"
          value={formik.values.studentId}
          onChange={formik.handleChange}
          error={formik.touched.studentId && Boolean(formik.errors.studentId)} // แสดง error เมื่อข้อมูลไม่ถูกต้อง
          helperText={formik.touched.studentId && formik.errors.studentId}   // ข้อความแจ้งเตือน
        />

        {/* ช่องกรอกชื่อ-นามสกุล */}
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

        {/* ช่องกรอกรหัสผ่าน */}
        <TextField
          label="รหัสผ่าน"
          name="password"
          type="password" // ซ่อนรหัสผ่าน
          fullWidth
          margin="normal"
          value={formik.values.password}
          onChange={formik.handleChange}
          error={formik.touched.password && Boolean(formik.errors.password)}
          helperText={formik.touched.password && formik.errors.password}
        />

        {/* ช่องกรอกยืนยันรหัสผ่าน */}
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

        {/* ปุ่มลงทะเบียน */}
        <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }}>
          ลงทะเบียน
        </Button>

        {/* ปุ่มกลับไปหน้าเข้าสู่ระบบ */}
        <Button fullWidth onClick={() => navigate('/')} sx={{ mt: 1 }}>
          กลับไปหน้าเข้าสู่ระบบ
        </Button>
      </form>
    </Box>
  );
}

export default RegisterPage;
