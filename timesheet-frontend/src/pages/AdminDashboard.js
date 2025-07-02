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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  getAllStudents,
  deleteStudent,
  updateStudent,
  getAdminSummary,
} from '../services/studentService';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function AdminDashboard() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    studentId: '',
    role: 'student',
  });

  const fetchStudents = async () => {
    try {
      const [studentRes, summaryRes] = await Promise.all([
        getAllStudents(token),
        getAdminSummary(token),
      ]);
      // 🔁 เรียงตาม studentId
      const sorted = studentRes.data.sort((a, b) => a.studentId.localeCompare(b.studentId));
      setStudents(sorted);
      setSummary(summaryRes.data);
    } catch (err) {
      alert('ไม่สามารถโหลดข้อมูลนักศึกษาได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleEditOpen = (student) => {
    setSelectedStudent(student);
    setFormData({
      fullName: student.fullName,
      studentId: student.studentId,
      role: student.role,
    });
    setEditOpen(true);
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setSelectedStudent(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      await updateStudent(selectedStudent.id, formData, token);
      alert('แก้ไขข้อมูลสำเร็จ');
      setEditOpen(false);
      fetchStudents();
    } catch (err) {
      alert('แก้ไขข้อมูลไม่สำเร็จ');
    }
  };

  const handleViewTimesheet = (id) => {
    navigate(`/admin/student/${id}/timesheets`);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('ต้องการลบนักศึกษาคนนี้ใช่หรือไม่?')) return;

    try {
      await deleteStudent(id, token);
      setStudents((prev) => prev.filter((s) => s.id !== id));
    } catch {
      alert('ลบไม่สำเร็จ');
    }
  };

  return (
    <>
      <Navbar />
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          รายชื่อนักศึกษาทั้งหมด
        </Typography>

        {summary && (
          <Box sx={{ my: 3 }}>
            <Typography variant="h6" gutterBottom>
              ข้อมูลระบบ
            </Typography>
            <Box sx={{ display: 'flex', gap: 4 }}>
              <Box sx={{ p: 2, border: '1px solid #ccc', borderRadius: 2 }}>
                <Typography>จำนวนนักศึกษา</Typography>
                <Typography variant="h5">{summary.totalStudents}</Typography>
              </Box>
              <Box sx={{ p: 2, border: '1px solid #ccc', borderRadius: 2 }}>
                <Typography>จำนวน Timesheet</Typography>
                <Typography variant="h5">{summary.totalTimesheets}</Typography>
              </Box>
            </Box>
          </Box>
        )}

        {loading ? (
          <CircularProgress />
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>รหัสนักศึกษา</TableCell>
                <TableCell>ชื่อ-นามสกุล</TableCell>
                <TableCell>บทบาท</TableCell>
                <TableCell>จัดการ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {students.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.studentId}</TableCell>
                  <TableCell>{s.fullName}</TableCell>
                  <TableCell>{s.role}</TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      onClick={() => handleEditOpen(s)}
                      sx={{ mr: 1 }}
                    >
                      แก้ไข
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      sx={{ mr: 1 }}
                      onClick={() => handleViewTimesheet(s.id)}
                    >
                      ดู Timesheet
                    </Button>
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

        {/* Modal แก้ไข */}
        <Dialog open={editOpen} onClose={handleEditClose} maxWidth="sm" fullWidth>
          <DialogTitle>แก้ไขข้อมูลนักศึกษา</DialogTitle>
          <DialogContent>
            <TextField
              label="รหัสนักศึกษา"
              name="studentId"
              fullWidth
              margin="normal"
              value={formData.studentId}
              onChange={handleChange}
            />
            <TextField
              label="ชื่อ-นามสกุล"
              name="fullName"
              fullWidth
              margin="normal"
              value={formData.fullName}
              onChange={handleChange}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>บทบาท</InputLabel>
              <Select
                name="role"
                value={formData.role}
                label="บทบาท"
                onChange={handleChange}
              >
                <MenuItem value="student">Student</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleEditClose}>ยกเลิก</Button>
            <Button variant="contained" onClick={handleSave}>
              บันทึก
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  );
}

export default AdminDashboard;
