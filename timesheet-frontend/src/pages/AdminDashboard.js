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

// ✅ import Sidebar component
import Sidebar from "../components/Sidebar";
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
  const drawerWidth = 240;

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
      Swal.fire({
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถโหลดข้อมูลนักศึกษาได้",
        icon: "error",
        confirmButtonColor: "#00796b",
      });
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
      Swal.fire({
        title: "บันทึกสำเร็จ",
        text: "ข้อมูลนักศึกษาอัปเดตแล้ว",
        icon: "success",
        confirmButtonColor: "#00796b",
      });
      setEditOpen(false);
      fetchStudents();
    } catch {
      Swal.fire({
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถแก้ไขข้อมูลได้",
        icon: "error",
        confirmButtonColor: "#00796b",
      });
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
      Swal.fire({
        title: "ลบสำเร็จ",
        text: "นักศึกษาถูกลบเรียบร้อยแล้ว",
        icon: "success",
        confirmButtonColor: "#00796b",
      });
    } catch {
      Swal.fire({
        title: "ลบไม่สำเร็จ",
        text: "เกิดข้อผิดพลาดขณะลบผู้ใช้",
        icon: "error",
        confirmButtonColor: "#00796b",
      });
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1, // ✅ เพิ่ม flex-grow เพื่อให้ Box ขยายเต็มพื้นที่ที่เหลือ
          p: isSmallScreen ? 2 : 4,
          mt: isSmallScreen ? 5 : 0,
          minHeight: "100vh",
          backgroundColor: "#f4f6f8",
          fontFamily: '"Didonesque", sans-serif',
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          // ❌ ลบ mx และ maxWidth ออก
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
                  whiteSpace: "nowrap",
                },
              }}
            >
              <Table>
                <TableHead sx={{ bgcolor: "#00796b" }}>
                  <TableRow>
                    <TableCell
                      sx={{
                        color: "white",
                        fontWeight: "bold",
                        fontFamily: '"Didonesque", sans-serif',
                      }}
                    >
                      รหัสนักศึกษา
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "white",
                        fontWeight: "bold",
                        fontFamily: '"Didonesque", sans-serif',
                      }}
                    >
                      ชื่อ-นามสกุล
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "white",
                        fontWeight: "bold",
                        fontFamily: '"Didonesque", sans-serif',
                      }}
                    >
                      บทบาท
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "white",
                        fontWeight: "bold",
                        fontFamily: '"Didonesque", sans-serif',
                      }}
                    >
                      จัดการ
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell sx={{ fontFamily: '"Didonesque", sans-serif' }}>
                        {student.studentId}
                      </TableCell>
                      <TableCell sx={{ fontFamily: '"Didonesque", sans-serif' }}>
                        {student.fullName}
                      </TableCell>
                      <TableCell sx={{ fontFamily: '"Didonesque", sans-serif' }}>
                        {student.role}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="ดู Timesheet">
                          <IconButton
                            onClick={() => handleViewTimesheet(student.id)}
                            sx={{ color: "#00796b" }}
                            size={isSmallScreen ? "small" : "medium"}
                          >
                            <DescriptionIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="แก้ไขข้อมูล">
                          <IconButton
                            onClick={() => handleEditOpen(student)}
                            color="primary"
                            size={isSmallScreen ? "small" : "medium"}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="ลบนักศึกษา">
                          <IconButton
                            onClick={() => handleDelete(student.id)}
                            color="error"
                            disabled={student.role === "admin"}
                            size={isSmallScreen ? "small" : "medium"}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          )}
          <Dialog
            open={editOpen}
            onClose={handleEditClose}
            aria-labelledby="form-dialog-title"
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle
              id="form-dialog-title"
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
                noValidate
                autoComplete="off"
                sx={{
                  "& .MuiTextField-root": {
                    my: 1,
                  },
                }}
              >
                <TextField
                  margin="normal"
                  label="ชื่อ-นามสกุล"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  fullWidth
                  sx={{
                    "& .MuiInputBase-root": {
                      fontFamily: '"Didonesque", sans-serif',
                      borderRadius: 2,
                      bgcolor: "#fafafa",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#ccc",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#00796b",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#00796b",
                        boxShadow: "0 0 5px 0 #00796b",
                      },
                    },
                    "& .MuiInputLabel-root": {
                      "&.Mui-focused": {
                        color: "#00796b",
                      },
                    },
                  }}
                />
                <TextField
                  margin="normal"
                  label="รหัสนักศึกษา"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleChange}
                  fullWidth
                  sx={{
                    "& .MuiInputBase-root": {
                      fontFamily: '"Didonesque", sans-serif',
                      borderRadius: 2,
                      bgcolor: "#fafafa",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#ccc",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#00796b",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#00796b",
                        boxShadow: "0 0 5px 0 #00796b",
                      },
                    },
                    "& .MuiInputLabel-root": {
                      "&.Mui-focused": {
                        color: "#00796b",
                      },
                    },
                  }}
                />
                <FormControl fullWidth margin="normal">
                  <InputLabel id="role-select-label">บทบาท</InputLabel>
                  <Select
                    labelId="role-select-label"
                    id="role-select"
                    name="role"
                    value={formData.role}
                    label="บทบาท"
                    onChange={handleChange}
                    sx={{
                      fontFamily: '"Didonesque", sans-serif',
                      borderRadius: 2,
                      bgcolor: "#fafafa",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#ccc",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#00796b",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#00796b", // สีกรอบเมื่อโฟกัส
                        boxShadow: "0 0 5px 0 #00796b", // เอฟเฟกต์สีเขียวเมื่อโฟกัส
                      },
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
                  fontFamily: '"Didonesque", sans-serif',
                }}
                size={isSmallScreen ? "small" : "medium"}
              >
                บันทึก
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Box>
    </Box>
  );
}

export default AdminDashboard;