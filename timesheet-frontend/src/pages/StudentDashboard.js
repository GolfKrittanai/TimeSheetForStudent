import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar'; // นำเข้า Navbar
import {
  Box,
  Typography,
  TextField,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@mui/material'; // นำเข้า UI component จาก Material UI
import { useFormik } from 'formik'; // สำหรับจัดการฟอร์ม
import * as Yup from 'yup'; // สำหรับตรวจสอบความถูกต้องของข้อมูลฟอร์ม
import {
  getMyTimeSheets,
  createTimeSheet,
  deleteTimeSheet,
} from '../services/timesheetService'; // ฟังก์ชันเชื่อม API
import { useAuth } from '../context/AuthContext'; // ดึงข้อมูลผู้ใช้และ token จาก Context

function StudentDashboard() {
  const { token, user } = useAuth(); // ดึง token และข้อมูลผู้ใช้จาก context
  const [timeSheets, setTimeSheets] = useState([]); // เก็บข้อมูล TimeSheet ของผู้ใช้

  // ฟังก์ชันดึงข้อมูล TimeSheet ของผู้ใช้จาก API
  const fetchData = async () => {
    try {
      const res = await getMyTimeSheets(token); // เรียก API ด้วย token
      setTimeSheets(res.data); // เก็บข้อมูล TimeSheet ที่ได้ไว้ใน state
    } catch (err) {
      alert('โหลด TimeSheet ไม่สำเร็จ'); // แจ้งเตือนหากโหลดข้อมูลไม่สำเร็จ
    }
  };

  // ฟังก์ชันลบ TimeSheet
  const handleDelete = async (id) => {
    if (!window.confirm('ต้องการลบ TimeSheet นี้ใช่หรือไม่?')) return; // ยืนยันการลบ

    try {
      await deleteTimeSheet(id, token); // เรียก API ลบ TimeSheet
      setTimeSheets((prev) => prev.filter((t) => t.id !== id)); // ลบข้อมูลที่ลบออกจาก state
    } catch {
      alert('ลบไม่สำเร็จ'); // แจ้งเตือนหากลบไม่สำเร็จ
    }
  };

  // กำหนด Formik สำหรับจัดการฟอร์มบันทึก TimeSheet
  const formik = useFormik({
    initialValues: {
      date: '',          // วันที่
      checkInTime: '',   // เวลาเข้า (ตรงกับ backend)
      checkOutTime: '',  // เวลาออก (ตรงกับ backend)
      activity: '',      // กิจกรรม (เพิ่มฟิลด์นี้)
    },
    validationSchema: Yup.object({
      date: Yup.string().required('กรุณาเลือกวันที่'), // ตรวจสอบว่าต้องกรอกวันที่
      checkInTime: Yup.string().required('กรุณากรอกเวลาเข้า'), // เวลาเข้า ต้องกรอก
      checkOutTime: Yup.string().required('กรุณากรอกเวลาออก'), // เวลาออก ต้องกรอก
      activity: Yup.string().required('กรุณากรอกกิจกรรม'), // กิจกรรม ต้องกรอก
    }),
    onSubmit: async (values, { resetForm }) => {
      try {
        await createTimeSheet(values, token); // เรียก API บันทึก TimeSheet ใหม่ พร้อมส่ง activity
        fetchData(); // โหลดข้อมูล TimeSheet ใหม่เพื่ออัพเดตตาราง
        resetForm(); // ล้างฟอร์มหลังบันทึกเสร็จ
      } catch (error) {
  console.error('API Error:', error.response ? error.response.data : error.message);
  alert('บันทึกไม่สำเร็จ: ' + (error.response?.data?.message || error.message));
}

    },
  });

  // useEffect ทำงานตอน component แสดงผลครั้งแรก (mount)
  // เพื่อโหลดข้อมูล TimeSheet ของผู้ใช้
  useEffect(() => {
    fetchData();
  }, []);

  return (
    <>
      <Navbar /> {/* แถบนำทางด้านบน */}
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          TimeSheet ของ {user?.fullName} {/* แสดงชื่อผู้ใช้ */}
        </Typography>

        {/* ฟอร์มบันทึก TimeSheet */}
        <form onSubmit={formik.handleSubmit} style={{ marginBottom: '2rem' }}>
          {/* วันที่ */}
          <TextField
            label="วันที่"
            name="date"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }} // ให้ป้ายชื่อเล็กและอยู่บน input เมื่อเลือกแล้ว
            value={formik.values.date}
            onChange={formik.handleChange} // ฟังค์ชันจัดการการเปลี่ยนค่า input
            error={formik.touched.date && Boolean(formik.errors.date)} // แสดงสถานะ error
            helperText={formik.touched.date && formik.errors.date} // ข้อความช่วยเหลือเมื่อ error
            sx={{ mb: 2 }} // margin bottom 2 หน่วย
          />
          {/* เวลาเข้า */}
          <TextField
            label="เวลาเข้า"
            name="checkInTime"
            type="time"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={formik.values.checkInTime}
            onChange={formik.handleChange}
            error={formik.touched.checkInTime && Boolean(formik.errors.checkInTime)}
            helperText={formik.touched.checkInTime && formik.errors.checkInTime}
            sx={{ mb: 2 }}
          />
          {/* เวลาออก */}
          <TextField
            label="เวลาออก"
            name="checkOutTime"
            type="time"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={formik.values.checkOutTime}
            onChange={formik.handleChange}
            error={formik.touched.checkOutTime && Boolean(formik.errors.checkOutTime)}
            helperText={formik.touched.checkOutTime && formik.errors.checkOutTime}
            sx={{ mb: 2 }}
          />
          {/* กิจกรรม */}
          <TextField
            label="กิจกรรม"
            name="activity"
            fullWidth
            multiline
            rows={3}
            value={formik.values.activity}
            onChange={formik.handleChange}
            error={formik.touched.activity && Boolean(formik.errors.activity)}
            helperText={formik.touched.activity && formik.errors.activity}
            sx={{ mb: 2 }}
          />

          <Button variant="contained" type="submit" fullWidth>
            บันทึก TimeSheet {/* ปุ่มส่งข้อมูลฟอร์ม */}
          </Button>
        </form>

        {/* ตารางแสดงรายการ TimeSheet */}
        <Typography variant="h6">รายการ TimeSheet</Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>วันที่</TableCell>
              <TableCell>เวลาเข้า</TableCell>
              <TableCell>เวลาออก</TableCell>
              <TableCell>กิจกรรม</TableCell> {/* เพิ่มคอลัมน์กิจกรรม */}
              <TableCell>ลบ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {timeSheets.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{new Date(t.date).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(t.checkInTime).toLocaleTimeString()}</TableCell>
                <TableCell>{new Date(t.checkOutTime).toLocaleTimeString()}</TableCell>
                <TableCell>{t.activity}</TableCell> {/* แสดงกิจกรรม */}
                <TableCell>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => handleDelete(t.id)} // ลบแถวนี้
                  >
                    ลบ
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </>
  );
}

export default StudentDashboard;
