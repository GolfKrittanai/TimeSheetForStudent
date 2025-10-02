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
  Tabs,
  Tab,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon,
  Groups as GroupsIcon,
  AccessTime as AccessTimeIcon,
  Verified as VerifiedIcon,
  EditNote as EditNoteIcon,
} from "@mui/icons-material";

import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import {
  getAllStudents,
  deleteStudent,
  updateStudent,
  getAdminSummary,
} from "../services/studentService";

// Helper component for Tab content
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

const inputStyle = {
  "& .MuiInputBase-root": {
    fontFamily: '"Kanit", sans-serif',
    borderRadius: 2,
    bgcolor: "#fafafa",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
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
    "&.Mui-disabled": {
      bgcolor: "#e0e0e0",
    },
  },
  "& .MuiInputLabel-root": {
    "&.Mui-focused": {
      color: "#00796b",
    },
  },
};

// =================================================================
// ✅ NEW: Academic Year and Semester Options
// =================================================================

const getCurrentYear = () => {
  // ดึงปีปัจจุบัน (ค.ศ.)
  const currentChristianYear = new Date().getFullYear();
  const currentBuddhistYear = currentChristianYear + 543;
  const currentMonth = new Date().getMonth() + 1; // Month is 0-indexed

  return currentBuddhistYear;
};

const generateAcademicYearOptions = () => {
  const currentYear = getCurrentYear();
  const years = [];

  // 1. ปีปัจจุบัน
  years.push({
    value: currentYear.toString(),
    label: `ปีปัจจุบัน`,
  });

  // 2. ย้อนหลัง 1 ปี
  const yearBack1 = currentYear - 1;
  years.push({
    value: yearBack1.toString(),
    label: yearBack1,
  });

  // 3. ย้อนหลัง 2 ปี
  const yearBack2 = currentYear - 2;
  years.push({
    value: yearBack2.toString(),
    label: yearBack2,
  });

  return years;
};

const academicYearOptions = generateAcademicYearOptions();
const semesterOptions = [
  { value: "1", label: " 1" },
  { value: "2", label: " 2" },
  { value: "3", label: " 3 (ภาคฤดูร้อน)" },
];

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
    course: "",
    branch: "",
    email: "",
    phone: "",
    companyName: "",
    internPosition: "",
    semester: "",
    academicYear: "",
  });
  const [value, setValue] = useState(0);

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const drawerWidth = 240;

  const mainTitle = value === 0 ? "Management data" : "User list information";
  const subTitle = value === 0 ? "จัดการข้อมูล" : "ข้อมูลรายชื่อผู้ใช้";

  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState(""); // 🎯 เก็บค่าที่พิมพ์ในช่องกรอก
  const [submittedSearchTerm, setSubmittedSearchTerm] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [academicYearFilter, setAcademicYearFilter] = useState("");

  const [filterType, setFilterType] = useState("");
  // 🎯 NEW STATE: สำหรับเก็บค่าที่เลือกจาก Dropdown ตัวที่สอง (e.g., '1' หรือ '2568')
  const [filterValue, setFilterValue] = useState("");

  // 🔴 FIX: ลบ fontWeight: "bold" ออกจาก headerCellStyle
  const headerCellStyle = {
    color: "white",
    fontFamily: '"Kanit", sans-serif',
    whiteSpace: "nowrap",
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [studentRes, summaryRes] = await Promise.all([
        getAllStudents(token),
        getAdminSummary(token),
      ]);
      const sorted = studentRes.data.sort((a, b) => {
        if (a.role === "teacher" && b.role !== "teacher") return -1;
        if (a.role !== "teacher" && b.role === "teacher") return 1;
        // 🔴 FIX: ปรับการเปรียบเทียบ studentId ให้รองรับค่าว่าง/null
        const idA = a.studentId || "";
        const idB = b.studentId || "";
        return idA.localeCompare(idB);
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
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleChangeTab = (event, newValue) => {
    setValue(newValue);
    setSearchInput("");
    setSearchTerm("");
    setSemesterFilter("");
    setAcademicYearFilter("");
  };

  const handleEditOpen = (student) => {
    setSelectedStudent(student);
    setFormData({
      fullName: student.fullName,
      studentId: student.studentId || "",
      role: student.role,
      course: student.course || "",
      branch: student.branch || "",
      email: student.email || "",
      phone: student.phone || "",
      companyName: student.companyName || "",
      internPosition: student.internPosition || "",
      semester: student.semester || "",
      academicYear: student.academicYear || "",
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
        course: formData.course,
        branch: formData.branch,
        email: formData.email,
        phone: formData.phone,
        companyName: formData.companyName,
        internPosition: formData.internPosition,
        semester: formData.semester,
        academicYear: formData.academicYear,
      };

      await updateStudent(selectedStudent.id, dataToUpdate, token);
      Swal.fire({
        title: "บันทึกสำเร็จ",
        text: "ข้อมูลผู้ใช้อัปเดตแล้ว",
        icon: "success",
        confirmButtonColor: "#00796b",
      });
      setEditOpen(false);
      fetchData();
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
    navigate(`/teacher/student/${id}/timesheets`);
  };

  const handleDelete = async (id, role) => {
    // Logic to prevent deleting the last admin is added for safety
    const isDeletingAdmin = role === "admin";
    const adminCount = students.filter((s) => s.role === "admin").length;

    if (isDeletingAdmin && adminCount <= 1) {
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
      // โหลดข้อมูลใหม่เพื่ออัปเดต Summary Card หลังจากลบ Admin
      fetchData();
    } catch {
      Swal.fire({
        title: "ลบไม่สำเร็จ",
        text: "เกิดข้อผิดพลาดขณะลบผู้ใช้",
        icon: "error",
        confirmButtonColor: "#00796b",
      });
    }
  };

  // 🔴 FIX: คำนวณ Admin และ Teacher/Other Roles
  const totalStudents = summary?.totalStudents || 0;
  const totalTimesheets = summary?.totalTimesheets || 0;
  const totalAdmins = students.filter((s) => s.role === "admin").length;
  // นับจำนวน 'teacher' โดยตรง
  const totalTeachers = students.filter((s) => s.role === "teacher").length;

  // =================================================================
  // ✅ NEW: Filtering Logic for Student Tab (Index 0)
  // =================================================================
  const filteredStudents = React.useMemo(() => {
    const getSafeLowerString = (value) => (value ?? "").toLowerCase();

    return students
      .filter((s) => s.role === "student")
      .filter((student) => {
        // 🎯 ใช้ searchTerm ในการกรอง
        const searchLower = searchTerm.toLowerCase();

        const matchesSearch =
          getSafeLowerString(student.studentId).includes(searchLower) ||
          getSafeLowerString(student.fullName).includes(searchLower) ||
          getSafeLowerString(student.companyName).includes(searchLower) ||
          getSafeLowerString(student.internPosition).includes(searchLower);

        const matchesSemester =
          semesterFilter === "" || student.semester === semesterFilter;
        const matchesAcademicYear =
          academicYearFilter === "" ||
          student.academicYear === academicYearFilter.toString();

        return matchesSearch && matchesSemester && matchesAcademicYear;
      });
    // 🎯 ต้องเพิ่ม searchTerm เข้าไปใน Dependency Array ด้วย
  }, [students, searchTerm, semesterFilter, academicYearFilter]);

  // =================================================================
  // ✅ NEW: Filtering Logic for System User Tab (Index 1)
  // =================================================================
  const filteredSystemUsers = React.useMemo(() => {
    return students
      .filter((s) => s.role !== "student") // Only Admin/Teacher in this tab
      .filter((user) => {
        const searchLower = searchTerm.toLowerCase();
        // Search only by studentId (or equivalent ID for system users)
        // Note: studentId can be used for system users like 'adminpond'
        const matchesSearch =
          searchTerm === "" ||
          (user.studentId &&
            user.studentId.toLowerCase().includes(searchLower));

        return matchesSearch;
      });
  }, [students, searchTerm]);

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
        <Box sx={{ width: "100%", maxWidth: 1200 }}>
          <Typography
            variant={isSmallScreen ? "h6" : "h5"}
            sx={{ fontWeight: "bold", mb: 0, color: "#00796b" }}
          >
            {mainTitle}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {subTitle}
          </Typography>
          {/* ------------------ Tabs (ปรับ Icon/Text ให้อยู่แถวเดียวกัน) ------------------ */}
          <Paper
            // 🎯 CHANGE: เพิ่มเงา (elevation) เป็น 2 และลบ border
            elevation={2}
            sx={{
              mb: 3,
              bgcolor: "#fff",
              borderRadius: 2,
              overflow: "hidden",
              // border: "1px solid #c0c0c0", // <--- REMOVED
            }}
          >
            <Tabs
              value={value}
              onChange={handleChangeTab}
              aria-label="management tabs"
              variant="fullWidth"
              TabIndicatorProps={{ style: { display: "none" } }}
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
                icon={<EditNoteIcon sx={{ color: getIconColor(value, 0) }} />}
                label="จัดการข้อมูลนักศึกษา"
                sx={{
                  fontWeight: value === 0 ? "bold" : "normal",
                  fontFamily: '"Kanit", sans-serif',
                  color: value === 0 ? "white !important" : "#555 !important",
                  backgroundColor: value === 0 ? "#00796b" : "#e2e2e2",
                  borderRight: "none",
                  minHeight: "48px",
                  p: 2,
                  "&:hover": {
                    backgroundColor: value === 0 ? "#00796b" : "#e2e2e2",
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
                icon={<EditNoteIcon sx={{ color: getIconColor(value, 1) }} />}
                // 🔴 FIX: เปลี่ยน Label เป็น "ข้อมูลผู้ใช้และระบบ"
                label="ข้อมูลผู้ดูแลระบบ"
                sx={{
                  fontWeight: value === 1 ? "bold" : "normal",
                  fontFamily: '"Kanit", sans-serif',
                  color: value === 1 ? "white !important" : "#555 !important",
                  backgroundColor: value === 1 ? "#00796b" : "#e2e2e2",
                  borderLeft: "none",
                  minHeight: "48px",
                  p: 2,
                  "&:hover": {
                    backgroundColor: value === 1 ? "#00796b" : "#e2e2e2",
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
          {/* ---------------- Tab Panel 1: Student Data (Summary) ---------------- */}
          <TabPanel value={value} index={0}>
            {summary && (
              <Grid
                container
                spacing={2}
                justifyContent="space-between"
                sx={{ mb: 4 }}
              >
                {/* Summary Card 1: จำนวนนักศึกษา */}
                <Grid item xs={12} sm={6}>
                  <Paper
                    // 🎯 CHANGE: เพิ่มเงา (elevation) เป็น 2 และลบ border
                    elevation={2}
                    sx={{
                      p: 3, // เพิ่ม Padding ให้การ์ดดูใหญ่ขึ้น
                      bgcolor: "#fff",
                      borderRadius: 2,
                      // border: "1px solid #ddd", // <--- REMOVED
                      // ✅ FIX: เปลี่ยนเป็น Flex Row เพื่อจัดไอคอนซ้าย, ข้อความขวา
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center", // จัดให้อยู่ตรงกลางการ์ด
                      gap: 2, // ระยะห่างระหว่างไอคอนกับข้อความ
                    }}
                  >
                    {/* ✅ 1. ไอคอนขนาดใหญ่ */}
                    <GroupsIcon
                      sx={{
                        color: "#00796b",
                        fontSize: "4rem", // ปรับขนาดไอคอน
                      }}
                    />
                    {/* ✅ 2. Box สำหรับหัวข้อ (บน) และตัวเลข (ล่าง) */}
                    <Box sx={{ textAlign: "left" }}>
                      <Typography
                        variant="subtitle1"
                        color="textSecondary"
                        sx={{
                          mb: 0.5,
                          fontWeight: "bold",
                          fontFamily: '"Kanit", sans-serif',
                          lineHeight: 1, // ปรับให้ชิด
                        }}
                      >
                        จำนวนนักศึกษา
                      </Typography>
                      <Typography
                        variant="h4" // ทำให้ตัวเลขใหญ่ขึ้น
                        sx={{
                          color: "#333",
                          fontWeight: "bold",
                          fontFamily: '"Kanit", sans-serif',
                          lineHeight: 1,
                          textAlign: "center",
                        }}
                      >
                        {totalStudents}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
                {/* Summary Card 2: Timesheets ทั้งหมด */}
                <Grid item xs={12} sm={6}>
                  <Paper
                    // 🎯 CHANGE: เพิ่มเงา (elevation) เป็น 2 และลบ border
                    elevation={2}
                    sx={{
                      p: 3, // เพิ่ม Padding ให้การ์ดดูใหญ่ขึ้น
                      bgcolor: "#fff",
                      borderRadius: 2,
                      // border: "1px solid #ddd", // <--- REMOVED
                      // ✅ FIX: เปลี่ยนเป็น Flex Row เพื่อจัดไอคอนซ้าย, ข้อความขวา
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 2,
                    }}
                  >
                    {/* ✅ 1. ไอคอนขนาดใหญ่ */}
                    <AccessTimeIcon
                      sx={{
                        color: "#00796b",
                        fontSize: "4rem", // ปรับขนาดไอคอน
                      }}
                    />
                    {/* ✅ 2. Box สำหรับหัวข้อ (บน) และตัวเลข (ล่าง) */}
                    <Box sx={{ textAlign: "left" }}>
                      <Typography
                        variant="subtitle1"
                        color="textSecondary"
                        sx={{
                          mb: 0.5,
                          fontWeight: "bold",
                          fontFamily: '"Kanit", sans-serif',
                          lineHeight: 1,
                        }}
                      >
                        Timesheets ทั้งหมด
                      </Typography>
                      <Typography
                        variant="h4" // ทำให้ตัวเลขใหญ่ขึ้น
                        sx={{
                          fontWeight: "bold",
                          color: "#333",
                          fontFamily: '"Kanit", sans-serif',
                          lineHeight: 1,
                          textAlign: "center",
                        }}
                      >
                        {totalTimesheets}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            )}

            {/* =================================================================
            // ✅ NEW: Combined Search/Filter UI for Students
            // 🎯 CHANGE: เปลี่ยน Box เป็น Paper และเพิ่ม elevation
            // ================================================================= */}
            <Paper
              elevation={1}
              sx={{
                mb: 2,
                // border: "1px solid #ccc", // <--- REMOVED
                p: 2,
                borderRadius: 2,
                bgcolor: "#fff",
              }}
            >
              <Typography
                variant={isSmallScreen ? "h6" : "h5"}
                gutterBottom
                sx={{
                  fontWeight: "bold",
                  color: "#575757",
                  mb: 2,
                  fontFamily: '"Kanit", sans-serif',
                }}
              >
                รายชื่อนักศึกษา
              </Typography>
              {/* Row 1: Search Term (รหัสประจำตัว, ชื่อ-นามสกุล, สถานที่ประกอบการ) */}
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  alignItems: "center",
                  // ลบ mb: 1.5 ออกเพื่อให้คำอธิบายอยู่ติดกัน
                  mb: 0,
                }}
              >
                {/* Search Term Input (ขยายเพื่อกินพื้นที่ส่วนใหญ่) */}
                <TextField
                  // ลบ label ออกเพื่อทำตามภาพ (ใช้ placeholder แทน)
                  // label="ค้นหา"
                  variant="outlined"
                  size="small"
                  fullWidth // ให้เต็มพื้นที่ที่เหลือ
                  placeholder="ค้นหา"
                  value={searchInput}
                  // 🎯 อัปเดต searchInput เมื่อมีการพิมพ์
                  onChange={(e) => setSearchInput(e.target.value)}
                  sx={{ flexGrow: 1, ...inputStyle }}
                />

                {/* Search Button */}
                <Button
                  variant="contained"
                  sx={{
                    bgcolor: "#00796b",
                    color: "white",
                    minWidth: "120px",
                    borderRadius: 2,
                    "&:hover": { bgcolor: "#00695c" },
                  }}
                  onClick={() => setSearchTerm(searchInput)}
                >
                  ค้นหา
                </Button>

                {/* Clear Button (ล้าง) */}
                <Button
                  variant="outlined"
                  onClick={() => {
                    setSearchTerm("");
                    setSearchInput("");
                    setSemesterFilter("");
                    setAcademicYearFilter("");
                    setFilterType("");
                    setFilterValue("");
                  }}
                  sx={{
                    color: "#00796b",
                    borderColor: "#00796b",
                    minWidth: "120px",
                    height: "36px",
                    borderWidth: "2px",
                    borderRadius: 2,
                    "&:hover": {
                      borderColor: "#00796b",
                      borderWidth: "2px",
                    },
                  }}
                >
                  ล้างค่า
                </Button>
              </Box>

              {/* 🎯 NEW: Row 1.1: คำอธิบายการค้นหา (Caption) */}
              <Typography
                variant="caption"
                color="textSecondary"
                sx={{
                  mt: 0.5, // ระยะห่างจากช่องค้นหา
                  mb: 1.5, // ระยะห่างก่อนแถวที่ 2
                  display: "block",
                  fontFamily: '"Kanit", sans-serif',
                }}
              >
                ค้นหา: รหัสประจำตัว, ชื่อ-นามสกุล, สถานประกอบการ, ตำแหน่ง
              </Typography>

              {/* Row 2: Filters (Semester, Academic Year) */}
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                {/* หมวดหมู่ - ภาคเรียน */}
                <FormControl
                  sx={{ minWidth: 150 }}
                  size="small"
                  variant="outlined"
                  color="primary"
                >
                  <InputLabel
                    id="filter-type-label"
                    shrink={false} // ป้องกันไม่ให้ label ลอยขึ้น
                    sx={{
                      opacity: 0, // ซ่อน Label
                      visibility: "hidden",
                      pointerEvents: "none",
                    }}
                  >
                    หมวดหมู่
                  </InputLabel>
                  <Select
                    value={filterType} // ✅ 1. เพิ่ม displayEmpty
                    displayEmpty // ✅ 2. ใช้ renderValue เพื่อแสดงข้อความในช่อง
                    renderValue={(selected) => {
                      if (selected === "") {
                        // แสดง Placeholder "หมวดหมู่" เป็นสีเทา
                        return (
                          <Typography color="textSecondary">
                            หมวดหมู่
                          </Typography>
                        );
                      } // ถ้าเลือกค่าแล้ว ให้แปลง value เป็นข้อความที่ต้องการ
                      return selected === "semester"
                        ? "ภาคเรียน"
                        : "ปีการศึกษา";
                    }}
                    onChange={(e) => {
                      setFilterType(e.target.value);
                      setFilterValue(""); // 🎯 FIX: ตั้งค่าเริ่มต้นของ Dropdown 2 ให้เป็น "ALL" เพื่อแสดง "ทั้งหมด" // รีเซ็ตตัวกรองเดิม
                      setSemesterFilter("");
                      setAcademicYearFilter("");
                    }}
                    sx={{
                      ...inputStyle,
                      // ✅ FIX: บังคับให้กรอบเป็นสีเขียวเมื่อถูกโฟกัส
                      "& .MuiOutlinedInput-notchedOutline": {
                        transition:
                          "border-color 200ms cubic-bezier(0.0, 0, 0.2, 1) 0ms",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        // ใช้สีเขียวหลักของคุณ (#00796b)
                        borderColor: "#00796b !important",
                        borderWidth: "2px !important", // อาจเพิ่มความหนาให้ชัดเจนขึ้น
                      },
                      // ✅ (Optional) ทำให้กรอบเป็นสีเขียวทันทีที่เมนูถูกเปิดด้วย
                      "&.Mui-active .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#00796b !important",
                        borderWidth: "2px !important",
                      },
                      borderRadius: 2,
                      height: 36
                    }}
                  >
                    <MenuItem value="semester">ภาคเรียน</MenuItem>
                    <MenuItem value="academicYear">ปีการศึกษา</MenuItem>
                  </Select>
                </FormControl>

                {/* 🎯 Dropdown 2: แสดงตัวเลือกตามหมวดหมู่ที่เลือก */}
                {filterType && (
                  <FormControl
                    sx={{ minWidth: 150 }}
                    size="small"
                    variant="outlined"
                    color="primary"
                  >
                    <InputLabel
                      id="filter-value-label"
                      shrink={false}
                      sx={{
                        opacity: 0,
                        visibility: "hidden",
                        pointerEvents: "none",
                      }}
                    >
                      {filterType === "semester"
                        ? "เลือกภาคเรียน"
                        : "เลือกปีการศึกษา"}
                    </InputLabel>
                    <Select
                      value={filterValue}
                      displayEmpty
                      renderValue={(selected) => {
                        const placeholderText =
                          filterType === "semester"
                            ? "เลือกภาคเรียน"
                            : "เลือกปีการศึกษา";

                        if (selected === "") {
                          return (
                            <Typography color="textSecondary">
                              ทั้งหมด
                            </Typography>
                          );
                        }
                        const options =
                          filterType === "semester"
                            ? semesterOptions
                            : academicYearOptions;
                        const selectedOption = options.find(
                          (option) => option.value === selected
                        );

                        return selectedOption ? selectedOption.label : selected;
                      }}
                      onChange={(e) => {
                        const selectedValue = e.target.value;
                        setFilterValue(selectedValue); // ตั้งค่า UI State (จะเป็น "" หรือค่าจริง)

                        const filterValueForLogic =
                          selectedValue === "ทั้งหมด" ? "" : selectedValue;

                        if (filterType === "semester") {
                          setSemesterFilter(filterValueForLogic);
                          setAcademicYearFilter("");
                        } else if (filterType === "academicYear") {
                          setAcademicYearFilter(filterValueForLogic);
                          setSemesterFilter("");
                        }
                      }}
                      sx={{
                        ...inputStyle,
                        // ✅ FIX: บังคับให้กรอบเป็นสีเขียวเมื่อถูกโฟกัส
                        "& .MuiOutlinedInput-notchedOutline": {
                          transition:
                            "border-color 200ms cubic-bezier(0.0, 0, 0.2, 1) 0ms",
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          // ใช้สีเขียวหลักของคุณ (#00796b)
                          borderColor: "#00796b !important",
                          borderWidth: "2px !important", // อาจเพิ่มความหนาให้ชัดเจนขึ้น
                        },
                        // ✅ (Optional) ทำให้กรอบเป็นสีเขียวทันทีที่เมนูถูกเปิดด้วย
                        "&.Mui-active .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#00796b !important",
                          borderWidth: "2px !important",
                        },
                        borderRadius: 2,
                      }}
                    >
                      <MenuItem value="ทั้งหมด">ทั้งหมด</MenuItem>
                      {filterType === "semester"
                        ? semesterOptions.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))
                        : academicYearOptions.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                    </Select>
                  </FormControl>
                )}
              </Box>
            </Paper>
            {/* ================================================================= */}

            {loading ? (
              <Box sx={{ textAlign: "center", mt: 6 }}>
                <CircularProgress size={48} color="success" />
              </Box>
            ) : filteredStudents.length === 0 ? (
              <Box
                sx={{
                  textAlign: "center",
                  py: 4,
                  bgcolor: "#fff",
                  borderRadius: 2,
                  // border: "1px solid #e0e0e0", // <--- REMOVED
                  mt: 2,
                }}
              >
                <Typography
                  variant="h6"
                  color="textSecondary"
                  sx={{ fontFamily: '"Kanit", sans-serif' }}
                >
                  ไม่พบข้อมูลนักศึกษาตามเงื่อนไขที่ค้นหา
                </Typography>
                {searchTerm && (
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{ fontFamily: '"Kanit", sans-serif' }}
                  >
                    กรุณาระบุข้อมูลให้ถูกต้อง
                  </Typography>
                )}
              </Box>
            ) : (
              <Paper
                elevation={1}
                sx={{
                  overflowX: "auto",
                  borderRadius: 2,
                  // border: "1px solid #e0e0e0", // <--- REMOVED
                  "& td, & th": {
                    fontSize: isSmallScreen ? "0.75rem" : "1rem",
                    padding: isSmallScreen ? "6px 8px" : "12px 16px",
                    mt: 2,
                  },
                }}
              >
                <Table>
                  {/* 🔴 FIX: ปรับ Table Head ให้นำ 'bold' ออก และใช้ข้อมูลครบทุกคอลัมน์ */}
                  <TableHead sx={{ bgcolor: "#00796b" }}>
                    <TableRow>
                      <TableCell sx={headerCellStyle} align="center">
                        ลำดับ
                      </TableCell>
                      <TableCell sx={headerCellStyle} align="center">
                        รหัสประจำตัว
                      </TableCell>
                      <TableCell sx={headerCellStyle}>ชื่อ-นามสกุล</TableCell>
                      <TableCell sx={headerCellStyle} align="center">
                        ภาคเรียน
                      </TableCell>
                      <TableCell sx={headerCellStyle} align="center">
                        ปีการศึกษา
                      </TableCell>
                      <TableCell sx={headerCellStyle} align="center">
                        สถานที่ประกอบการ
                      </TableCell>
                      <TableCell sx={headerCellStyle} align="center">
                        ตำแหน่ง
                      </TableCell>
                      <TableCell sx={headerCellStyle} align="center">
                        จำนวน Timesheet
                      </TableCell>
                      <TableCell sx={headerCellStyle}>ดำเนินการ</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {/* ✅ UPDATE: Use filteredStudents */}
                    {filteredStudents.map((student, index) => (
                      <TableRow key={student.id}>
                        <TableCell
                          sx={{ fontFamily: '"Kanit", sans-serif' }}
                          align="center"
                        >
                          {index + 1}
                        </TableCell>
                        <TableCell
                          sx={{ fontFamily: '"Kanit", sans-serif' }}
                          align="center"
                        >
                          {student.studentId}
                        </TableCell>
                        <TableCell sx={{ fontFamily: '"Kanit", sans-serif' }}>
                          {student.fullName}
                        </TableCell>
                        <TableCell
                          sx={{ fontFamily: '"Kanit", sans-serif' }}
                          align="center"
                        >
                          {student.semester || "-"}
                        </TableCell>
                        <TableCell
                          sx={{ fontFamily: '"Kanit", sans-serif' }}
                          align="center"
                        >
                          {student.academicYear || "-"}
                        </TableCell>
                        <TableCell
                          sx={{ fontFamily: '"Kanit", sans-serif' }}
                          align="center"
                        >
                          {student.companyName || "-"}
                        </TableCell>
                        <TableCell
                          sx={{ fontFamily: '"Kanit", sans-serif' }}
                          align="center"
                        >
                          {student.internPosition || "-"}
                        </TableCell>
                        <TableCell
                          sx={{ fontFamily: '"Kanit", sans-serif' }}
                          align="center"
                        >
                          {student._count.timesheet}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          <Tooltip title="แก้ไขข้อมูล">
                            <IconButton
                              onClick={() => handleEditOpen(student)}
                              sx={{ color: "#00796b" }}
                              size={isSmallScreen ? "small" : "medium"}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="ดู Timesheet">
                            <IconButton
                              onClick={() => handleViewTimesheet(student.id)}
                              sx={{ color: "#929292" }}
                              size={isSmallScreen ? "small" : "medium"}
                            >
                              <DescriptionIcon />
                            </IconButton>
                          </Tooltip>
                          {/* <Tooltip title="ลบนักศึกษา">
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
                            </Tooltip> */}
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
            {/* Summary Cards for Admins */}
            {summary && (
              <Grid
                container
                spacing={2}
                justifyContent="space-between"
                sx={{ mb: 4 }}
              >
                {/* Summary Card 1: จำนวนอาจารย์ */}
                <Grid item xs={12} sm={6}>
                  <Paper
                    // 🎯 CHANGE: เพิ่มเงา (elevation) เป็น 2 และลบ border
                    elevation={2}
                    sx={{
                      p: 3, // เพิ่ม Padding ให้การ์ดดูใหญ่ขึ้น
                      bgcolor: "#fff",
                      borderRadius: 2,
                      // border: "1px solid #ddd", // <--- REMOVED
                      // ✅ FIX: เปลี่ยนเป็น Flex Row เพื่อจัดไอคอนซ้าย, ข้อความขวา
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 2,
                    }}
                  >
                    {/* ✅ 1. ไอคอนขนาดใหญ่ */}
                    <GroupsIcon
                      sx={{
                        color: "#00796b",
                        fontSize: "4rem", // ปรับขนาดไอคอน
                      }}
                    />
                    {/* ✅ 2. Box สำหรับหัวข้อ (บน) และตัวเลข (ล่าง) */}
                    <Box sx={{ textAlign: "left" }}>
                      <Typography
                        variant="subtitle1"
                        color="textSecondary"
                        sx={{
                          mb: 0.5,
                          fontWeight: "bold",
                          fontFamily: '"Kanit", sans-serif',
                          lineHeight: 1,
                        }}
                      >
                        จำนวนอาจารย์
                      </Typography>
                      <Typography
                        variant="h4" // ทำให้ตัวเลขใหญ่ขึ้น
                        sx={{
                          fontWeight: "bold",
                          color: "#333",
                          fontFamily: '"Kanit", sans-serif',
                          lineHeight: 1,
                          textAlign: "center",
                        }}
                      >
                        {totalTeachers}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
                {/* Summary Card 2: จำนวน Admin */}
                <Grid item xs={12} sm={6}>
                  <Paper
                    // 🎯 CHANGE: เพิ่มเงา (elevation) เป็น 2 และลบ border
                    elevation={2}
                    sx={{
                      p: 3, // เพิ่ม Padding ให้การ์ดดูใหญ่ขึ้น
                      bgcolor: "#fff",
                      borderRadius: 2,
                      // border: "1px solid #ddd", // <--- REMOVED
                      // ✅ FIX: เปลี่ยนเป็น Flex Row เพื่อจัดไอคอนซ้าย, ข้อความขวา
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 2,
                    }}
                  >
                    {/* ✅ 1. ไอคอนขนาดใหญ่ */}
                    <GroupsIcon
                      sx={{
                        color: "#00796b",
                        fontSize: "4rem", // ปรับขนาดไอคอน
                      }}
                    />
                    {/* ✅ 2. Box สำหรับหัวข้อ (บน) และตัวเลข (ล่าง) */}
                    <Box sx={{ textAlign: "left" }}>
                      <Typography
                        variant="subtitle1"
                        color="textSecondary"
                        sx={{
                          mb: 0.5,
                          fontWeight: "bold",
                          fontFamily: '"Kanit", sans-serif',
                          lineHeight: 1,
                        }}
                      >
                        จำนวน Admin
                      </Typography>
                      <Typography
                        variant="h4" // ทำให้ตัวเลขใหญ่ขึ้น
                        sx={{
                          fontWeight: "bold",
                          color: "#333",
                          fontFamily: '"Kanit", sans-serif',
                          lineHeight: 1,
                          textAlign: "center",
                        }}
                      >
                        {totalAdmins}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            )}

            {/* =================================================================
            // 🎯 REVISED: Search UI for System User Tab (Index 1)
            // 🎯 CHANGE: เปลี่ยน Box เป็น Paper และเพิ่ม elevation
            // ================================================================= */}
            <Paper
              elevation={1}
              sx={{
                mb: 2,
                // border: "1px solid #ccc", // <--- REMOVED
                p: 2,
                borderRadius: 2,
                bgcolor: "#fff",
              }}
            >
              {/* Admin/System User Search and Table */}
              <Typography
                variant={isSmallScreen ? "h6" : "h5"}
                gutterBottom
                sx={{
                  fontWeight: "bold",
                  color: "#575757",
                  mb: 2,
                  fontFamily: '"Kanit", sans-serif',
                }}
              >
                รายชื่อผู้ดูแลระบบ
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  {/* Label: รหัสประจำตัว (Typography) - อยู่ติดกับช่องกรอก */}
                  <Typography
                    sx={{
                      fontFamily: '"Kanit", sans-serif',
                      whiteSpace: "nowrap",
                      // จัดกึ่งกลาง Typography กับ TextField
                      pt: 0.5,
                      pb: 0.5,
                    }}
                  >
                    รหัสประจำตัว
                  </Typography>
                  <TextField
                    // ลบ label ออก
                    placeholder="ค้นหา"
                    variant="outlined"
                    size="small"
                    value={searchInput}
                    // 🎯 อัปเดต searchInput เมื่อมีการพิมพ์
                    onChange={(e) => setSearchInput(e.target.value)}
                    sx={{ width: "250px", ...inputStyle }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>

                {/* 2. กลุ่ม: [ค้นหา] [ล้าง] (อยู่ขวา) */}
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <Button
                    variant="contained"
                    sx={{
                      bgcolor: "#00796b",
                      color: "white",
                      borderRadius: 2,
                      minWidth: "120px",
                      "&:hover": { bgcolor: "#00695c" },
                    }}
                    onClick={() => setSearchTerm(searchInput)}
                  >
                    ค้นหา
                  </Button>
                  <Button
                    variant="outlined"
                    sx={{
                      color: "#00796b",
                      borderColor: "#00796b",
                      minWidth: "120px",
                      height: "36px",
                      borderRadius: 2,
                      borderWidth: "2px",
                      "&:hover": {
                        borderColor: "#00796b", // ให้ขอบเป็นสีเขียวคงเดิม
                        borderWidth: "2px",
                      },
                    }}
                    onClick={() => setSearchTerm("")}
                  >
                    ล้างค่า
                  </Button>
                </Box>
                {/* ปุ่ม + เพิ่มผู้ใช้ (อยู่ขวา) */}
              </Box>
            </Paper>
            {/* ================================================================= */}

            {loading ? (
              <Box sx={{ textAlign: "center", mt: 6 }}>
                <CircularProgress size={48} color="success" />
              </Box>
            ) : filteredSystemUsers.length === 0 ? (
              <Box
                sx={{
                  textAlign: "center",
                  py: 4,
                  bgcolor: "#fff",
                  borderRadius: 2,
                  // border: "1px solid #e0e0e0", // <--- REMOVED
                }}
              >
                <Typography
                  variant="h6"
                  color="textSecondary"
                  sx={{ fontFamily: '"Kanit", sans-serif' }}
                >
                  {/* 📌 เปลี่ยนข้อความหลักให้เจาะจง */}
                  ไม่พบรหัสประจำตัวผู้ใช้งานในระบบ
                </Typography>
                {/* 💡 แสดงข้อความแจ้งเมื่อ searchTerm ถูกใช้ */}
                {searchTerm && (
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{ fontFamily: '"Kanit", sans-serif' }}
                  >
                    กรุณาระบุข้อมูลให้ถูกต้อง
                  </Typography>
                )}
              </Box>
            ) : (
              <Paper
                elevation={1}
                sx={{
                  overflowX: "auto",
                  borderRadius: 2,
                  // border: "1px solid #e0e0e0", // <--- REMOVED
                  "& td, & th": {
                    fontSize: isSmallScreen ? "0.75rem" : "1rem",
                    padding: isSmallScreen ? "6px 8px" : "12px 16px",
                  },
                }}
              >
                <Table>
                  {/* 🔴 FIX: ปรับ Table Head ให้นำ 'bold' ออก และใช้ข้อมูลครบทุกคอลัมน์ */}
                  <TableHead sx={{ bgcolor: "#00796b" }}>
                    <TableRow>
                      <TableCell sx={headerCellStyle} align="center">
                        ลำดับ
                      </TableCell>
                      <TableCell sx={headerCellStyle} align="center">
                        รหัสประจำตัว
                      </TableCell>
                      <TableCell sx={headerCellStyle}>ชื่อ-นามสกุล</TableCell>
                      <TableCell sx={headerCellStyle} align="center">
                        สาขา
                      </TableCell>
                      <TableCell sx={headerCellStyle} align="center">
                        อีเมล
                      </TableCell>
                      <TableCell sx={headerCellStyle} align="center">
                        เบอร์โทรศัพท์
                      </TableCell>
                      <TableCell sx={headerCellStyle} align="center">
                        สิทธิ์การใช้งาน
                      </TableCell>
                      {/* <TableCell sx={headerCellStyle}>ดำเนินการ</TableCell> */}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {/* ✅ UPDATE: Use filteredSystemUsers */}
                    {filteredSystemUsers.map((user, index) => (
                      <TableRow key={user.id}>
                        <TableCell
                          sx={{ fontFamily: '"Kanit", sans-serif' }}
                          align="center"
                        >
                          {index + 1}
                        </TableCell>
                        <TableCell
                          sx={{ fontFamily: '"Kanit", sans-serif' }}
                          align="center"
                        >
                          {user.studentId || "-"}
                        </TableCell>
                        <TableCell sx={{ fontFamily: '"Kanit", sans-serif' }}>
                          {user.fullName}
                        </TableCell>
                        <TableCell
                          sx={{ fontFamily: '"Kanit", sans-serif' }}
                          align="center"
                        >
                          {user.branch || "-"}
                        </TableCell>
                        <TableCell
                          sx={{ fontFamily: '"Kanit", sans-serif' }}
                          align="center"
                        >
                          {user.email || "-"}
                        </TableCell>
                        <TableCell
                          sx={{ fontFamily: '"Kanit", sans-serif' }}
                          align="center"
                        >
                          {user.phone || "-"}
                        </TableCell>
                        <TableCell
                          sx={{ fontFamily: '"Kanit", sans-serif' }}
                          align="center"
                        >
                          {user.role === "admin"
                            ? "Admin"
                            : user.role === "teacher"
                            ? "Teacher"
                            : user.role}
                        </TableCell>
                        {/* <TableCell sx={{ whiteSpace: "nowrap" }}>
                          <Tooltip title="แก้ไขข้อมูล">
                            <IconButton
                              onClick={() => handleEditOpen(user)}
                              sx={{ color: "#00796b" }}
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
                              }
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell> */}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            )}
          </TabPanel>
          {/* ------------------ Edit Dialog (ส่วนที่แก้ไข) ------------------ */}
          <Dialog
            open={editOpen}
            onClose={handleEditClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: 3,
                fontFamily: '"Kanit", sans-serif',
                ...(value === 1 && { maxWidth: "550px" }),
              },
            }}
          >
            {/* 🎯 ส่วนที่แก้ไข: หัวข้อ Dialog และเส้นแบ่ง */}
            <DialogTitle
              sx={{
                fontWeight: "bold",
                color: "#00796b", // สีเขียว
                textAlign: "center", // จัดกึ่งกลาง
                mt: 2, // เพิ่มระยะห่างด้านบน
                mb: 0,
                p: 0,
              }}
            >
              <Box
                sx={{
                  pb: 1, // Padding ด้านล่างสำหรับเส้นใต้
                  borderBottom: "1.5px solid #00796b", // เส้นใต้สีเขียว
                  width: "80%", // ความกว้างของเส้นใต้
                  mx: "auto", // จัดกึ่งกลาง
                  pt: 0,
                }}
              >
                <Typography variant="h6" component="span">
                  {/* เงื่อนไขแสดงหัวข้อตามค่า value (0 = จัดการข้อมูลนักศึกษา, 1 = ข้อมูลผู้ใช้) */}
                  {value === 0 ? "แก้ไขข้อมูลนักศึกษา" : "แก้ไขข้อมูลผู้ใช้"}
                </Typography>
              </Box>
            </DialogTitle>
            {/* FIX: แทนที่ตรรกะเดิมด้วยการใช้ 'value' และจัดเรียง Grid ใหม่ */}
            <DialogContent
              dividers
              sx={{
                px: isSmallScreen ? 2 : 3, // คง padding แนวนอนไว้
                py: value === 1 ? 5 : isSmallScreen ? 2 : 3,
              }}
            >
              {selectedStudent && (
                <Box component="form" onSubmit={(e) => e.preventDefault()}>
                  <Grid container spacing={2}>
                    {/* Row 1: Role (สิทธิ์การใช้งาน) & Student ID (รหัสประจำตัว) */}
                    <Grid item xs={12} sm={6}>
                      <FormControl
                        fullWidth
                        sx={inputStyle}
                        size="small"
                        variant="outlined"
                      >
                        <InputLabel id="role-label">สิทธิ์การใช้งาน</InputLabel>
                        <Select
                          labelId="role-label"
                          name="role"
                          value={formData.role}
                          onChange={handleChange}
                          label="สิทธิ์การใช้งาน"
                          // Disabled ถ้าอยู่บน Tab 0 ("จัดการข้อมูลนักศึกษา")
                          disabled={value === 0}
                        >
                          <MenuItem value="admin">Admin</MenuItem>
                          <MenuItem value="teacher">Teacher</MenuItem>
                          {value === 0 && (
                            <MenuItem value="student">Student</MenuItem>
                          )}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="รหัสประจำตัว"
                        name="studentId"
                        value={formData.studentId}
                        onChange={handleChange}
                        fullWidth
                        size="small"
                        sx={inputStyle}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="ชื่อ-นามสกุล"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        fullWidth
                        size="small"
                        sx={inputStyle}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="สาขา"
                        name="branch"
                        value={formData.branch}
                        onChange={handleChange}
                        fullWidth
                        size="small"
                        sx={inputStyle}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="อีเมล"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        fullWidth
                        size="small"
                        sx={inputStyle}
                        disabled
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="เบอร์โทรศัพท์"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        fullWidth
                        size="small"
                        sx={inputStyle}
                        disabled
                      />
                    </Grid>
                    {value === 0 && (
                      <>
                        {/* Row 4: Course & Branch */}
                        <Grid item xs={12} sm={12}>
                          <TextField
                            label="หลักสูตร"
                            name="course"
                            value={formData.course}
                            onChange={handleChange}
                            fullWidth
                            size="small"
                            sx={inputStyle}
                          />
                        </Grid>
                        {/* Row 5: Company Name & Position */}
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="ชื่อสถานประกอบการ"
                            name="companyName"
                            value={formData.companyName}
                            onChange={handleChange}
                            fullWidth
                            size="small"
                            sx={inputStyle}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="ตำแหน่งที่ฝึกงาน"
                            name="internPosition"
                            value={formData.internPosition}
                            onChange={handleChange}
                            fullWidth
                            size="small"
                            sx={inputStyle}
                          />
                        </Grid>

                        {/* Row 6: Semester & Academic Year */}
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="ภาคการศึกษา"
                            name="semester"
                            value={formData.semester}
                            onChange={handleChange}
                            fullWidth
                            size="small"
                            sx={inputStyle}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="ปีการศึกษา"
                            name="academicYear"
                            value={formData.academicYear}
                            onChange={handleChange}
                            fullWidth
                            size="small"
                            sx={inputStyle}
                          />
                        </Grid>
                      </>
                    )}
                  </Grid>
                </Box>
              )}
            </DialogContent>
            <DialogActions
              sx={{
                pb: 2,
                // จัดกึ่งกลางปุ่ม
                justifyContent: "center",
                // เพิ่มระยะห่างระหว่างปุ่ม
                "& > :not(style) ~ :not(style)": { ml: 2 },
              }}
            >
              <Button
                onClick={handleEditClose}
                sx={{
                  color: "#00796b",
                  textTransform: "none",
                  borderRadius: 2,
                  fontFamily: '"Kanit", sans-serif',
                  // 🎯 แก้ไข: กำหนดความกว้างคงที่
                  width: "120px",
                  border: "2px solid #00796b",
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
                  borderRadius: 2,
                  fontFamily: '"Kanit", sans-serif',
                  // 🎯 แก้ไข: กำหนดความกว้างคงที่
                  width: "120px",
                  "&:hover": {
                    backgroundColor: "#005a4e",
                  },
                }}
                size={isSmallScreen ? "small" : "medium"}
              >
                บันทึกข้อมูล
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Box>
    </Box>
  );
}

export default TeacherDashboard;