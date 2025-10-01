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
  // ✅ NEW: Import Tabs and Tab
  Tabs,
  Tab,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon,
  Groups as GroupsIcon,
  AccessTime as AccessTimeIcon,
  // ✅ NEW: Import VerifiedIcon for Admin tab
  Verified as VerifiedIcon,
} from "@mui/icons-material";

import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import {
  getAllStudents,
  deleteStudent,
  updateStudent,
  getAdminSummary,
} from "../services/studentService";

// ✅ Helper component for Tab content
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
    </div>
  );
}

// Helper function to get icon color based on selection
const getIconColor = (value, index) => {
  return value === index ? "white" : "#555";
};

function TeacherDashboard() {
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
  // ✅ State for tab control: 0 = Students, 1 = Admins
  const [value, setValue] = useState(0);

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const drawerWidth = 240;

  // ใน src/pages/TeacherDashboard.js

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const [studentRes, summaryRes] = await Promise.all([
        getAllStudents(token),
        getAdminSummary(token),
      ]);

      const sorted = studentRes.data.sort((a, b) => {
        // 1. เรียงตาม Role: Admin > Teacher > Student
        if (a.role === "admin" && b.role !== "admin") return -1;
        if (a.role !== "admin" && b.role === "admin") return 1;

        // 💡 แก้ไข: เพิ่มการเรียง teacher ก่อน student (ถ้ายังไม่มี)
        if (a.role === "teacher" && b.role === "student") return -1;
        if (a.role === "student" && b.role === "teacher") return 1;

        // 2. เรียงลำดับตาม studentId (ป้องกัน Error: ถ้า studentId เป็น null หรือ undefined)
        // 💡 แก้ไข: เปลี่ยนค่า null/undefined เป็น string ว่าง เพื่อป้องกัน .localeCompare() Crash
        const idA = a.studentId || "";
        const idB = b.studentId || "";

        return idA.localeCompare(idB);
      });

      setStudents(sorted);
      setSummary(summaryRes.data);
    } catch (error) {
      // 💡 ตรวจสอบ Error ใน Console Log ของ Browser และ Server
      console.error("Error fetching data:", error);
      Swal.fire({
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถโหลดข้อมูลผู้ใช้ได้",
        icon: "error",
        confirmButtonColor: "#00796b",
      });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleAddUser = () => {
    navigate("/admin/add-account");
  };

  // ✅ Handler for tab change
  const handleChangeTab = (event, newValue) => {
    setValue(newValue);
  };

  const handleEditOpen = (student) => {
    setSelectedStudent(student);
    setFormData({
      fullName: student.fullName,
      // Handle case where admin might not have studentId
      studentId: student.studentId || "",
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
      const dataToUpdate = {
        fullName: formData.fullName,
        studentId: formData.studentId,
        role: formData.role,
      };

      await updateStudent(selectedStudent.id, dataToUpdate, token);
      Swal.fire({
        title: "บันทึกสำเร็จ",
        text: "ข้อมูลผู้ใช้อัปเดตแล้ว",
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

  const handleDelete = async (id, role) => {
    // Logic to prevent deleting the last admin is added for safety
    if (
      role === "admin" &&
      students.filter((s) => s.role === "admin").length <= 1
    ) {
      Swal.fire({
        title: "ลบไม่สำเร็จ",
        text: "ต้องมีผู้ดูแลระบบเหลืออย่างน้อยหนึ่งคน",
        icon: "warning",
        confirmButtonColor: "#00796b",
      });
      return;
    }

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
        text: "ผู้ใช้ถูกลบเรียบร้อยแล้ว",
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

  const studentCount = students.filter((s) => s.role === "student").length;
  const adminCount = students.filter((s) => s.role === "admin").length;
  // Summary is now based on student role data
  const totalStudents = summary?.totalStudents || 0;
  const totalTimesheets = summary?.totalTimesheets || 0;
  const totalAdmins = adminCount;
  // You might need a specific API endpoint to get totalReviewedTimesheets
  // but for now, we'll use a placeholder or assumed field.
  const reviewedTimesheets = summary?.totalReviewedTimesheets || "N/A";

  return (
    <Box sx={{ display: "flex" }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: isSmallScreen ? 2 : 4,
          mt: isSmallScreen ? 5 : 0,
          minHeight: "100vh",
          backgroundColor: "#f4f6f8",
          fontFamily: '"Kanit", sans-serif',
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
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
              fontFamily: '"Kanit", sans-serif',
            }}
          >
            ระบบจัดการผู้ใช้ (Teacher Dashboard)
          </Typography>

          {/* ------------------ ✅ UPDATED Tabs for Full-width Split Navigation with correct colors and icons ------------------ */}
          <Paper
            elevation={0}
            sx={{
              mb: 3,
              bgcolor: "#fff",
              borderRadius: 2,
              overflow: "hidden",
              border: "1px solid #c0c0c0",
            }}
          >
            <Tabs
              value={value}
              onChange={handleChangeTab}
              aria-label="management tabs"
              variant="fullWidth"
              TabIndicatorProps={{ style: { display: "none" } }}
              // ❌ ลบ 'textColor' ออก หรือใช้ 'textColor="inherit"'
              // เพื่อป้องกันการใช้สี Primary (ฟ้า)
              sx={{
                minHeight: "48px",
                "& .MuiTabs-flexContainer": {
                  display: "flex",
                  height: "48px",
                },
              }}
            >
              <Tab
                iconPosition="start"
                icon={<GroupsIcon sx={{ color: getIconColor(value, 0) }} />}
                label="จัดการข้อมูลนักศึกษา"
                sx={{
                  fontWeight: "bold",
                  fontFamily: '"Didonesque", sans-serif',
                  // ✅ FIX: กำหนดสีตัวอักษรโดยตรง
                  color: value === 0 ? "white !important" : "#555 !important",
                  backgroundColor: value === 0 ? "#00796b" : "#e0e0e0",
                  borderRight: "none",
                  minHeight: "48px",
                  p: 2,
                  "&:hover": {
                    backgroundColor: value === 0 ? "#00796b" : "#d0d0d0",
                  },
                  "& .MuiTab-wrapper": {
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: "8px",
                  },
                }}
              />
              <Tab
                iconPosition="start"
                icon={<VerifiedIcon sx={{ color: getIconColor(value, 1) }} />}
                label="ข้อมูลผู้ดูแลระบบ"
                sx={{
                  fontWeight: "bold",
                  fontFamily: '"Didonesque", sans-serif',
                  // ✅ FIX: กำหนดสีตัวอักษรโดยตรง
                  color: value === 1 ? "white !important" : "#555 !important",
                  backgroundColor: value === 1 ? "#00796b" : "#e0e0e0",
                  borderLeft: "none",
                  minHeight: "48px",
                  p: 2,
                  "&:hover": {
                    backgroundColor: value === 1 ? "#00796b" : "#d0d0d0",
                  },
                  "& .MuiTab-wrapper": {
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: "8px",
                  },
                }}
              />
            </Tabs>
          </Paper>
          {/* ------------------ END UPDATED Tabs ------------------ */}

          {/* ---------------- Tab Panel 1: Student Data ---------------- */}
          <TabPanel value={value} index={0}>
            {/* Summary Cards for Students (matching image_0cd366.png) */}
            {summary && (
              <Grid
                container
                spacing={2}
                justifyContent="flex-start"
                sx={{ mb: 4 }}
              >
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
                    <Typography
                      variant="subtitle2"
                      color="textSecondary"
                      mt={1}
                    >
                      จำนวนนักศึกษา
                    </Typography>
                    <Typography
                      variant={isSmallScreen ? "h6" : "h5"}
                      sx={{
                        fontWeight: "bold",
                        color: "#333",
                        fontFamily: '"Kanit", sans-serif',
                      }}
                    >
                      {totalStudents}
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
                    <Typography
                      variant="subtitle2"
                      color="textSecondary"
                      mt={1}
                    >
                      Timesheets ทั้งหมด
                    </Typography>
                    <Typography
                      variant={isSmallScreen ? "h6" : "h5"}
                      sx={{
                        fontWeight: "bold",
                        color: "#333",
                        fontFamily: '"Kanit", sans-serif',
                      }}
                    >
                      {totalTimesheets}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            )}

            {/* Student Search and Table */}
            <Typography
              variant={isSmallScreen ? "h6" : "h5"}
              gutterBottom
              sx={{
                fontWeight: "bold",
                color: "#333",
                mb: 2,
                fontFamily: '"Kanit", sans-serif',
              }}
            >
              รายชื่อนักศึกษา
            </Typography>
            {/* ... (Search/Filter UI for Students goes here) ... */}
            <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
              <TextField
                label="ค้นหา"
                variant="outlined"
                size="small"
                fullWidth
                placeholder="รหัสประจำตัว, ชื่อ-นามสกุล, ภาคเรียน, ปีการศึกษา, ฯลฯ"
              />
              <Button
                variant="contained"
                sx={{ bgcolor: "#00796b", color: "white" }}
              >
                ค้นหา
              </Button>
              <Button variant="outlined" sx={{ color: "#555" }}>
                ล้าง
              </Button>
            </Box>

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
                          fontFamily: '"Kanit", sans-serif',
                        }}
                      >
                        รหัสประจำตัว
                      </TableCell>
                      <TableCell
                        sx={{
                          color: "white",
                          fontWeight: "bold",
                          fontFamily: '"Kanit", sans-serif',
                        }}
                      >
                        ชื่อ-นามสกุล
                      </TableCell>
                      <TableCell
                        sx={{
                          color: "white",
                          fontWeight: "bold",
                          fontFamily: '"Kanit", sans-serif',
                        }}
                      >
                        บทบาท
                      </TableCell>
                      <TableCell
                        sx={{
                          color: "white",
                          fontWeight: "bold",
                          fontFamily: '"Kanit", sans-serif',
                        }}
                      >
                        จัดการ
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {/* Filter to show only Students */}
                    {students
                      .filter((s) => s.role === "student")
                      .map((student) => (
                        <TableRow key={student.id}>
                          <TableCell sx={{ fontFamily: '"Kanit", sans-serif' }}>
                            {student.studentId}
                          </TableCell>
                          <TableCell sx={{ fontFamily: '"Kanit", sans-serif' }}>
                            {student.fullName}
                          </TableCell>
                          <TableCell sx={{ fontFamily: '"Kanit", sans-serif' }}>
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
                                onClick={() =>
                                  handleDelete(student.id, student.role)
                                }
                                color="error"
                                size={isSmallScreen ? "small" : "medium"}
                                disabled={student.role === "admin"}
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
          </TabPanel>

          {/* ---------------- Tab Panel 2: System User/Admin Data ---------------- */}
          <TabPanel value={value} index={1}>
            {/* Summary Cards for Admins (matching image_0cd709.png) */}
            {summary && (
              <Grid
                container
                spacing={2}
                justifyContent="flex-start"
                sx={{ mb: 4 }}
              >
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
                    <Typography
                      variant="subtitle2"
                      color="textSecondary"
                      mt={1}
                    >
                      จำนวนอาจารย์
                    </Typography>
                    <Typography
                      variant={isSmallScreen ? "h6" : "h5"}
                      sx={{
                        fontWeight: "bold",
                        color: "#333",
                        fontFamily: '"Kanit", sans-serif',
                      }}
                    >
                      {/* Assuming "อาจารย์" means all non-student roles for simplicity, otherwise filter by a specific 'teacher' role */}
                      {students.filter((s) => s.role !== "student").length -
                        adminCount}
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
                    <VerifiedIcon
                      fontSize={isSmallScreen ? "medium" : "large"}
                      sx={{ color: "#00796b" }}
                    />
                    <Typography
                      variant="subtitle2"
                      color="textSecondary"
                      mt={1}
                    >
                      จำนวน Admin
                    </Typography>
                    <Typography
                      variant={isSmallScreen ? "h6" : "h5"}
                      sx={{
                        fontWeight: "bold",
                        color: "#333",
                        fontFamily: '"Kanit", sans-serif',
                      }}
                    >
                      {totalAdmins}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            )}

            {/* Admin/System User Search and Table */}
            <Typography
              variant={isSmallScreen ? "h6" : "h5"}
              gutterBottom
              sx={{
                fontWeight: "bold",
                color: "#333",
                mb: 2,
                fontFamily: '"Kanit", sans-serif',
              }}
            >
              รายชื่อผู้ใช้และระบบ
            </Typography>
            {/* ... (Search/Filter UI for Admins goes here) ... */}
            <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
              <TextField
                label="รหัสประจำตัว"
                variant="outlined"
                size="small"
                sx={{ maxWidth: "200px" }}
              />
              <Button
                variant="contained"
                sx={{ bgcolor: "#00796b", color: "white" }}
              >
                ค้นหา
              </Button>
              <Button variant="outlined" sx={{ color: "#555" }}>
                ล้าง
              </Button>
              {/* ❌ Assuming "เพิ่มภาพ" is a typo for "เพิ่มผู้ใช้" or "เพิ่ม Admin" - Placeholder */}
              <Button
                variant="contained"
                onClick={handleAddUser} // 👈 ตรงนี้คือตัวเชื่อม
                color="success"
                sx={{
                  bgcolor: "#00c853",
                  ml: "auto",
                  textTransform: "none",
                  fontWeight: "bold",
                }}
              >
                + เพิ่มผู้ใช้
              </Button>
            </Box>

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
                          fontFamily: '"Kanit", sans-serif',
                        }}
                      >
                        รหัสประจำตัว
                      </TableCell>
                      <TableCell
                        sx={{
                          color: "white",
                          fontWeight: "bold",
                          fontFamily: '"Kanit", sans-serif',
                        }}
                      >
                        ชื่อ-นามสกุล
                      </TableCell>
                      <TableCell
                        sx={{
                          color: "white",
                          fontWeight: "bold",
                          fontFamily: '"Kanit", sans-serif',
                        }}
                      >
                        บทบาท
                      </TableCell>
                      <TableCell
                        sx={{
                          color: "white",
                          fontWeight: "bold",
                          fontFamily: '"Kanit", sans-serif',
                        }}
                      >
                        จัดการ
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {/* Filter to show only Admins/System Users (non-students) */}
                    {students
                      .filter((s) => s.role !== "student")
                      .map((user) => (
                        <TableRow key={user.id}>
                          <TableCell sx={{ fontFamily: '"Kanit", sans-serif' }}>
                            {user.studentId || "N/A"}
                          </TableCell>
                          <TableCell sx={{ fontFamily: '"Kanit", sans-serif' }}>
                            {user.fullName}
                          </TableCell>
                          <TableCell sx={{ fontFamily: '"Kanit", sans-serif' }}>
                            {user.role}
                          </TableCell>
                          <TableCell>
                            <Tooltip title="แก้ไขข้อมูล">
                              <IconButton
                                onClick={() => handleEditOpen(user)}
                                color="primary"
                                size={isSmallScreen ? "small" : "medium"}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="ลบผู้ใช้">
                              <IconButton
                                onClick={() => handleDelete(user.id, user.role)}
                                color="error"
                                size={isSmallScreen ? "small" : "medium"}
                                disabled={
                                  user.role === "admin" && totalAdmins <= 1
                                } // Prevent deleting the last admin
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
          </TabPanel>

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
                fontFamily: '"Kanit", sans-serif',
              }}
            >
              แก้ไขข้อมูลผู้ใช้
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
                      fontFamily: '"Kanit", sans-serif',
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
                  label="รหัสนักศึกษา/รหัสผู้ใช้"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleChange}
                  fullWidth
                  sx={{
                    "& .MuiInputBase-root": {
                      fontFamily: '"Kanit", sans-serif',
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
                      fontFamily: '"Kanit", sans-serif',
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
                    }}
                  >
                    <MenuItem value="student">Student</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="teacher">Teacher</MenuItem>
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
                  fontFamily: '"Kanit", sans-serif',
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
                  fontFamily: '"Kanit", sans-serif',
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

export default TeacherDashboard;
