import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar'; // นำเข้า Navbar ด้านบนของหน้า
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  CircularProgress, // แสดงโหลดขณะรอข้อมูล
} from '@mui/material';
import { getAllStudents, deleteStudent } from '../services/studentService'; // ฟังก์ชันเรียก API ดึงและลบนักศึกษา
import { useAuth } from '../context/AuthContext'; // ดึง token จาก Context สำหรับยืนยันตัวตน

function AdminDashboard() {
  const { token } = useAuth(); // ดึง JWT token จาก context เพื่อใช้เรียก API
  const [students, setStudents] = useState([]); // เก็บรายชื่อนักศึกษา
  const [loading, setLoading] = useState(true); // สถานะโหลดข้อมูล

  // ฟังก์ชันโหลดรายชื่อนักศึกษาจาก API
  const fetchStudents = async () => {
    try {
      const res = await getAllStudents(token); // เรียก API พร้อมส่ง token
      setStudents(res.data); // เก็บข้อมูลลง state
    } catch (err) {
      alert('ไม่สามารถโหลดข้อมูลนักศึกษาได้'); // แจ้งเตือนเมื่อโหลดข้อมูลล้มเหลว
    } finally {
      setLoading(false); // ปิดสถานะโหลดไม่ว่าจะสำเร็จหรือไม่
    }
  };

  // ฟังก์ชันลบนักศึกษา โดยรับ id ของนักศึกษาที่จะลบ
  const handleDelete = async (id) => {
    const confirm = window.confirm('ต้องการลบนักศึกษาคนนี้ใช่หรือไม่?'); // ยืนยันการลบ
    if (!confirm) return; // ถ้าไม่ยืนยัน หยุดทำงาน

    try {
      await deleteStudent(id, token); // เรียก API ลบนักศึกษาโดยส่ง id และ token
      // อัพเดต state โดยลบนักศึกษาที่ถูกลบออกจากรายชื่อ
      setStudents((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      alert('ลบไม่สำเร็จ'); // แจ้งเตือนหากลบไม่สำเร็จ
    }
  };

  // โหลดข้อมูลนักศึกษาตอน component แสดงผลครั้งแรก
  useEffect(() => {
    fetchStudents();
  }, []);

  return (
    <>
      <Navbar /> {/* แถบนำทางด้านบน */}
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          รายชื่อนักศึกษาทั้งหมด
        </Typography>

        {/* แสดง loading ขณะรอข้อมูล */}
        {loading ? (
          <CircularProgress />
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                {/* หัวตาราง */}
                <TableCell>รหัสนักศึกษา</TableCell>
                <TableCell>ชื่อ-นามสกุล</TableCell>
                <TableCell>บทบาท</TableCell>
                <TableCell>ลบ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* วนลูปรายชื่อนักศึกษาแต่ละคน */}
              {students.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.studentId}</TableCell>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>{s.role}</TableCell>
                  <TableCell>
                    {/* ปุ่มลบ สำหรับลบนักศึกษาคนนี้ */}
                    <Button
                      color="error"
                      variant="outlined"
                      onClick={() => handleDelete(s.id)}
                    >
                      ลบ
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Box>
    </>
  );
}

export default AdminDashboard;
