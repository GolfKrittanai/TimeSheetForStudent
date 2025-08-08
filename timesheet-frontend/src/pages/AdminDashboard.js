import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
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
  IconButton,
  Button,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon,
  Groups as GroupsIcon,
  AccessTime as AccessTimeIcon,
} from "@mui/icons-material";

import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import {
  getAllStudents,
  deleteStudent,
  updateStudent,
  getAdminSummary,
} from "../services/studentService";

function AdminDashboard() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    studentId: "",
    role: "student",
  });

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  // ใช้ useCallback เพื่อ memoize ฟังก์ชัน fetchStudents
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const [studentRes, summaryRes] = await Promise.all([
        getAllStudents(token),
        getAdminSummary(token),
      ]);
      const sorted = studentRes.data.sort((a, b) => {
        if (a.role === "admin" && b.role !== "admin") return -1;
        if (a.role !== "admin" && b.role === "admin") return 1;
        return a.studentId.localeCompare(b.studentId);
      });
      setStudents(sorted);
      setSummary(summaryRes.data);
    } catch {
      Swal.fire("เกิดข้อผิดพลาด", "ไม่สามารถโหลดข้อมูลนักศึกษาได้", "error");
    } finally {
      setLoading(false);
    }
  }, [token]); // เพิ่ม dependency ที่เป็น token

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]); // ใช้ fetchStudents ที่ memoized ใน dependency array

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
      Swal.fire("บันทึกสำเร็จ", "ข้อมูลนักศึกษาอัปเดตแล้ว", "success");
      setEditOpen(false);
      fetchStudents();
    } catch {
      Swal.fire("เกิดข้อผิดพลาด", "ไม่สามารถแก้ไขข้อมูลได้", "error");
    }
  };

  const handleViewTimesheet = (id) => {
    navigate(`/admin/student/${id}/timesheets`);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "คุณแน่ใจหรือไม่?",
      text: "หากลบแล้วจะไม่สามารถกู้คืนได้!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#00796b",
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
    });

    if (!result.isConfirmed) return;

    try {
      await deleteStudent(id, token);
      setStudents((prev) => prev.filter((s) => s.id !== id));
      Swal.fire("ลบสำเร็จ", "นักศึกษาถูกลบเรียบร้อยแล้ว", "success");
    } catch {
      Swal.fire("ลบไม่สำเร็จ", "เกิดข้อผิดพลาดขณะลบผู้ใช้", "error");
    }
  };

  return (
    <>
      <Navbar />
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "start",
          backgroundColor: "#f4f6f8",
          py: 4,
          px: isSmallScreen ? 1 : 4,
          fontFamily: '"Didonesque", sans-serif', // เพิ่มฟอนต์ที่ต้องการที่นี่
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 1100 }}>
          <Typography
            variant={isSmallScreen ? "h5" : "h4"}
            gutterBottom
            sx={{
              fontWeight: "bold",
              color: "#00796b",
              mb: 3,
              textAlign: "center",
              fontFamily: '"Didonesque", sans-serif', // ฟอนต์ที่ต้องการ
            }}
          >
            ระบบจัดการนักศึกษา (Admin Dashboard)
          </Typography>

          {summary && (
            <Grid container spacing={2} justifyContent="center" sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    textAlign: "center",
                    bgcolor: "#fff",
                    borderRadius: 2,
                    border: "1px solid #ddd",
                  }}
                >
                  <GroupsIcon
                    fontSize={isSmallScreen ? "medium" : "large"}
                    sx={{ color: "#00796b" }}
                  />
                  <Typography variant="subtitle2" color="textSecondary" mt={1}>
                    จำนวนนักศึกษา
                  </Typography>
                  <Typography
                    variant={isSmallScreen ? "h6" : "h5"}
                    sx={{
                      fontWeight: "bold",
                      color: "#333",
                      fontFamily: '"Didonesque", sans-serif',
                    }} // ฟอนต์ที่ต้องการ
                  >
                    {summary.totalStudents}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    textAlign: "center",
                    bgcolor: "#fff",
                    borderRadius: 2,
                    border: "1px solid #ddd",
                  }}
                >
                  <AccessTimeIcon
                    fontSize={isSmallScreen ? "medium" : "large"}
                    sx={{ color: "#00796b" }}
                  />
                  <Typography variant="subtitle2" color="textSecondary" mt={1}>
                    Timesheets ทั้งหมด
                  </Typography>
                  <Typography
                    variant={isSmallScreen ? "h6" : "h5"}
                    sx={{
                      fontWeight: "bold",
                      color: "#333",
                      fontFamily: '"Didonesque", sans-serif',
                    }} // ฟอนต์ที่ต้องการ
                  >
                    {summary.totalTimesheets}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          )}

          {loading ? (
            <Box sx={{ textAlign: "center", mt: 6 }}>
              <CircularProgress size={48} color="primary" />
            </Box>
          ) : (
            <Paper
              elevation={1}
              sx={{
                overflowX: "auto",
                borderRadius: 2,
                border: "1px solid #e0e0e0",
                "& td, & th": {
                  fontSize: isSmallScreen ? "0.75rem" : "1rem",
                  padding: isSmallScreen ? "6px 8px" : "12px 16px",
                  fontFamily: '"Didonesque", sans-serif', // ฟอนต์ที่ต้องการ
                },
              }}
            >
              <Table sx={{ minWidth: 700 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#00796b" }}>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        color: "#ffffff",
                        fontFamily: '"Didonesque", sans-serif',
                      }}
                    >
                      รหัสนักศึกษา
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        color: "#ffffff",
                        fontFamily: '"Didonesque", sans-serif',
                      }}
                    >
                      ชื่อ-นามสกุล
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        color: "#ffffff",
                        fontFamily: '"Didonesque", sans-serif',
                      }}
                    >
                      บทบาท
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        color: "#ffffff",
                        fontFamily: '"Didonesque", sans-serif',
                      }}
                    >
                      จัดการ
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.map((s) => (
                    <TableRow key={s.id} hover>
                      <TableCell
                        sx={{ fontFamily: '"Didonesque", sans-serif' }}
                      >
                        {s.studentId}
                      </TableCell>
                      <TableCell
                        sx={{ fontFamily: '"Didonesque", sans-serif' }}
                      >
                        {s.fullName}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontFamily: '"Didonesque", sans-serif"',
                          color: "#555",
                        }}
                      >
                        {s.role}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="แก้ไข">
                          <IconButton
                            sx={{ color: "#00796b" }}
                            onClick={() => handleEditOpen(s)}
                            size={isSmallScreen ? "small" : "medium"}
                          >
                            <EditIcon
                              fontSize={isSmallScreen ? "small" : "medium"}
                            />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="ดู Timesheet">
                          <IconButton
                            color="default"
                            onClick={() => handleViewTimesheet(s.id)}
                            size={isSmallScreen ? "small" : "medium"}
                          >
                            <DescriptionIcon
                              fontSize={isSmallScreen ? "small" : "medium"}
                            />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="ลบผู้ใช้">
                          <IconButton
                            color="error"
                            onClick={() => handleDelete(s.id)}
                            size={isSmallScreen ? "small" : "medium"}
                          >
                            <DeleteIcon
                              fontSize={isSmallScreen ? "small" : "medium"}
                            />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          )}

          {/* Dialog แก้ไข */}
          <Dialog
            open={editOpen}
            onClose={handleEditClose}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle
              sx={{
                fontWeight: "bold",
                color: "#00796b",
                fontFamily: '"Didonesque", sans-serif',
              }}
            >
              แก้ไขข้อมูลนักศึกษา
            </DialogTitle>
            <DialogContent dividers>
              <Box
                component="form"
                sx={{
                  "& .MuiTextField-root": { my: 1 },
                  "& .MuiFormControl-root": { my: 1 },
                  fontFamily: '"Didonesque", sans-serif', // ฟอนต์ที่ต้องการ
                  fontSize: isSmallScreen ? "0.9rem" : "1rem",
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
                  size={isSmallScreen ? "small" : "medium"}
                  sx={{
                    fontFamily: '"Didonesque", sans-serif', // ฟอนต์ที่ต้องการ
                  }}
                />
                <TextField
                  label="ชื่อ-นามสกุล"
                  name="fullName"
                  fullWidth
                  value={formData.fullName}
                  onChange={handleChange}
                  size={isSmallScreen ? "small" : "medium"}
                  sx={{
                    fontFamily: '"Didonesque", sans-serif', // ฟอนต์ที่ต้องการ
                  }}
                />
                <FormControl
                  fullWidth
                  size={isSmallScreen ? "small" : "medium"}
                >
                  <InputLabel id="role-label">บทบาท</InputLabel>
                  <Select
                    labelId="role-label"
                    name="role"
                    value={formData.role}
                    label="บทบาท"
                    onChange={handleChange}
                    sx={{
                      fontFamily: '"Didonesque", sans-serif', // ฟอนต์ที่ต้องการ
                    }}
                  >
                    <MenuItem value="student">Student</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </DialogContent>
            <DialogActions sx={{ pr: 3, pb: 2 }}>
              <Button
                onClick={handleEditClose}
                color="success"
                sx={{
                  textTransform: "none",
                  fontFamily: '"Didonesque", sans-serif',
                }}
                size={isSmallScreen ? "small" : "medium"}
              >
                ยกเลิก
              </Button>
              <Button
                variant="contained"
                onClick={handleSave}
                sx={{
                  textTransform: "none",
                  backgroundColor: "#00796b",
                  fontFamily: '"Didonesque", sans-serif', // ฟอนต์ที่ต้องการ
                }}
                size={isSmallScreen ? "small" : "medium"}
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
