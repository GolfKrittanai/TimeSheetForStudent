import React, { useEffect, useState } from 'react';
import { getAllStudents, deleteStudent } from '../services/studentService';
import { useAuth } from '../context/AuthContext';
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

function AdminDashboard() {
  const { token } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStudents = async () => {
    try {
      const res = await getAllStudents(token);
      setStudents(res.data); // สมมติ backend ส่ง array มา
    } catch (err) {
      alert('ไม่สามารถโหลดข้อมูลนักศึกษาได้');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('ต้องการลบนักศึกษาคนนี้ใช่หรือไม่?')) return;

    try {
      await deleteStudent(id, token);
      setStudents((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      alert('ลบไม่สำเร็จ');
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  return (
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
              <TableCell>สถานะ</TableCell>
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
  );
}

export default AdminDashboard;
