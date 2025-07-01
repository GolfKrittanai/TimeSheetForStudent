import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  CircularProgress,
} from '@mui/material';
import { getAllStudents, deleteStudent } from '../services/studentService';
import { useAuth } from '../context/AuthContext';

function AdminDashboard() {
  const { token } = useAuth(); // ดึง JWT token จาก context
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // โหลดรายชื่อนักศึกษา
  const fetchStudents = async () => {
    try {
      const res = await getAllStudents(token); // เรียก API ดึงนักศึกษา
      setStudents(res.data); // บันทึกไว้ใน state
    } catch (err) {
      alert('ไม่สามารถโหลดข้อมูลนักศึกษาได้');
    } finally {
      setLoading(false);
    }
  };

  // ลบนักศึกษา
  const handleDelete = async (id) => {
    const confirm = window.confirm('ต้องการลบนักศึกษาคนนี้ใช่หรือไม่?');
    if (!confirm) return;

    try {
      await deleteStudent(id, token); // ส่งคำสั่งลบ
      setStudents((prev) => prev.filter((s) => s.id !== id)); // ลบจาก state
    } catch (err) {
      alert('ลบไม่สำเร็จ');
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  return (
    <>
      <Navbar /> {/* Navbar ด้านบน */}
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          รายชื่อนักศึกษาทั้งหมด
        </Typography>

        {loading ? (
          <CircularProgress />
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>รหัสนักศึกษา</TableCell>
                <TableCell>ชื่อ-นามสกุล</TableCell>
                <TableCell>บทบาท</TableCell>
                <TableCell>ลบ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {students.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.studentId}</TableCell>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>{s.role}</TableCell>
                  <TableCell>
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
