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
  Paper,
  Tooltip,
  Grid,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon,
  Groups as GroupsIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';

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
    setLoading(true);
    try {
      const [studentRes, summaryRes] = await Promise.all([
        getAllStudents(token),
        getAdminSummary(token),
      ]);
      const sorted = studentRes.data.sort((a, b) =>
        a.studentId.localeCompare(b.studentId)
      );
      setStudents(sorted);
      setSummary(summaryRes.data);
    } catch {
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
    } catch {
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
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'start',
          backgroundColor: '#f4f6f8',
          py: 4,
          px: 2,
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 1100 }}>
          <Typography
            variant="h4"
            gutterBottom
            sx={{ fontWeight: 'bold', color: '#333', mb: 3, textAlign: 'center' }}
          >
            ระบบจัดการนักศึกษา (Admin Dashboard)
          </Typography>

          {/* Summary Section */}
          {summary && (
            <Grid container spacing={3} justifyContent="center" sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    bgcolor: '#fff',
                    borderRadius: 2,
                    border: '1px solid #ddd',
                  }}
                >
                  <GroupsIcon fontSize="large" sx={{ color: '#666' }} />
                  <Typography variant="subtitle1" color="textSecondary" mt={1}>
                    จำนวนนักศึกษา
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333' }}>
                    {summary.totalStudents}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    bgcolor: '#fff',
                    borderRadius: 2,
                    border: '1px solid #ddd',
                  }}
                >
                  <AccessTimeIcon fontSize="large" sx={{ color: '#666' }} />
                  <Typography variant="subtitle1" color="textSecondary" mt={1}>
                    Timesheets ทั้งหมด
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333' }}>
                    {summary.totalTimesheets}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* Table */}
          {loading ? (
            <Box sx={{ textAlign: 'center', mt: 6 }}>
              <CircularProgress size={48} color="primary" />
            </Box>
          ) : (
            <Paper
              elevation={1}
              sx={{ overflowX: 'auto', borderRadius: 2, border: '1px solid #e0e0e0' }}
            >
              <Table sx={{ minWidth: 700 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>รหัสนักศึกษา</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>ชื่อ-นามสกุล</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>บทบาท</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>จัดการ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.map((s) => (
                    <TableRow key={s.id} hover>
                      <TableCell>{s.studentId}</TableCell>
                      <TableCell>{s.fullName}</TableCell>
                      <TableCell sx={{ textTransform: 'capitalize', color: '#555' }}>
                        {s.role}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="แก้ไข">
                          <Button
                            variant="outlined"
                            color="primary"
                            onClick={() => handleEditOpen(s)}
                            sx={{ mr: 1, textTransform: 'none' }}
                            startIcon={<EditIcon />}
                            size="small"
                          >
                            แก้ไข
                          </Button>
                        </Tooltip>
                        <Tooltip title="ดู Timesheet">
                          <Button
                            variant="contained"
                            size="small"
                            color="inherit"
                            sx={{ mr: 1, textTransform: 'none' }}
                            onClick={() => handleViewTimesheet(s.id)}
                            startIcon={<DescriptionIcon />}
                          >
                            Timesheet
                          </Button>
                        </Tooltip>
                        <Tooltip title="ลบผู้ใช้">
                          <Button
                            variant="outlined"
                            color="error"
                            onClick={() => handleDelete(s.id)}
                            sx={{ textTransform: 'none' }}
                            startIcon={<DeleteIcon />}
                            size="small"
                          >
                            ลบ
                          </Button>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          )}

          {/* Dialog แก้ไข */}
          <Dialog open={editOpen} onClose={handleEditClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 'bold', color: '#333' }}>
              แก้ไขข้อมูลนักศึกษา
            </DialogTitle>
            <DialogContent dividers>
              <Box
                component="form"
                sx={{
                  '& .MuiTextField-root': { my: 1 },
                  '& .MuiFormControl-root': { my: 1 },
                }}
                noValidate
                autoComplete="off"
              >
                <TextField
                  label="รหัสนักศึกษา"
                  name="studentId"
                  fullWidth
                  value={formData.studentId}
                  onChange={handleChange}
                />
                <TextField
                  label="ชื่อ-นามสกุล"
                  name="fullName"
                  fullWidth
                  value={formData.fullName}
                  onChange={handleChange}
                />
                <FormControl fullWidth>
                  <InputLabel id="role-label">บทบาท</InputLabel>
                  <Select
                    labelId="role-label"
                    name="role"
                    value={formData.role}
                    label="บทบาท"
                    onChange={handleChange}
                  >
                    <MenuItem value="student">Student</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </DialogContent>
            <DialogActions sx={{ pr: 3, pb: 2 }}>
              <Button onClick={handleEditClose} sx={{ textTransform: 'none' }}>
                ยกเลิก
              </Button>
              <Button
                variant="contained"
                onClick={handleSave}
                sx={{ textTransform: 'none', backgroundColor: '#1976d2' }}
              >
                บันทึก
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Box>
    </>
  );
}

export default AdminDashboard;
