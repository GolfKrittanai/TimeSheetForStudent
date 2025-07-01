import React from 'react';
import { Box, Typography, TextField, Button } from '@mui/material'; // UI Components จาก Material UI
import { useFormik } from 'formik'; // สำหรับจัดการฟอร์ม
import * as Yup from 'yup'; // ตรวจสอบความถูกต้องของข้อมูลในฟอร์ม
import { loginUser } from '../services/authService'; // ฟังก์ชันเรียก API เข้าสู่ระบบ
import { useAuth } from '../context/AuthContext'; // ดึงฟังก์ชัน login จาก Context เพื่อบันทึก token และ user
import { useNavigate } from 'react-router-dom'; // สำหรับเปลี่ยนหน้า

function LoginPage() {
  const { login } = useAuth(); // ดึงฟังก์ชัน login มาใช้
  const navigate = useNavigate(); // ฟังก์ชันเปลี่ยนหน้า

  // กำหนด formik สำหรับจัดการฟอร์ม login
  const formik = useFormik({
    initialValues: { studentId: '', password: '' }, // ค่าตั้งต้นของฟอร์ม
    validationSchema: Yup.object({
      // ตรวจสอบข้อมูลว่าต้องกรอกให้ครบ
      studentId: Yup.string().required('กรุณากรอกรหัสนักศึกษา'),
      password: Yup.string().required('กรุณากรอกรหัสผ่าน'),
    }),
    onSubmit: async (values) => {
      try {
        // เรียก API login ส่งข้อมูลรหัสนักศึกษาและรหัสผ่าน
        const res = await loginUser(values);

        // บันทึก token และข้อมูลผู้ใช้ลง Context เพื่อใช้ในแอป
        login(res.data.token, res.data.user);

        // เปลี่ยนหน้าไปตามบทบาทผู้ใช้ (admin หรือ student)
        navigate(res.data.user.role === 'admin' ? '/admin' : '/student');
      } catch (err) {
        // หากเข้าสู่ระบบไม่สำเร็จ แจ้งเตือน
        alert('เข้าสู่ระบบไม่สำเร็จ');
      }
    },
  });

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 10 }}>
      {/* หัวข้อหน้าล็อกอิน */}
      <Typography variant="h4" gutterBottom>
        เข้าสู่ระบบ
      </Typography>

      {/* ฟอร์มล็อกอิน */}
      <form onSubmit={formik.handleSubmit}>
        {/* ช่องกรอกรหัสนักศึกษา */}
        <TextField
          label="รหัสนักศึกษา"
          name="studentId"
          fullWidth
          margin="normal"
          value={formik.values.studentId} // เชื่อมค่าในฟอร์มกับ Formik
          onChange={formik.handleChange} // อัพเดตค่าฟอร์มเมื่อผู้ใช้พิมพ์
          error={formik.touched.studentId && Boolean(formik.errors.studentId)} // แสดง error ถ้าข้อมูลไม่ถูกต้อง
          helperText={formik.touched.studentId && formik.errors.studentId}   // ข้อความแจ้งเตือน
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

        {/* ปุ่มล็อกอิน */}
        <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }}>
          Login
        </Button>

        {/* ปุ่มไปหน้าลงทะเบียน */}
        <Button fullWidth onClick={() => navigate('/register')} sx={{ mt: 1 }}>
          ลงทะเบียน
        </Button>
      </form>
    </Box>
  );
}

export default LoginPage;
