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
  Pagination,
  TablePagination,
} from "@mui/material";
import {
  Edit as EditIcon,
  Description as DescriptionIcon,
  Groups as GroupsIcon,
  AccessTime as AccessTimeIcon,
  EditNote as EditNoteIcon,
} from "@mui/icons-material";

import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import {
  getAllStudents,
  // deleteStudent, // ไม่ได้ใช้แล้ว
  updateStudent,
  getAdminSummary,
} from "../services/studentService";

// Helper component for Tab content (ไม่เปลี่ยนแปลง)
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

// ... (ส่วน inputStyle และ Academic Year/Semester Options ไม่เปลี่ยนแปลง)
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

const getCurrentYear = () => {
  const currentChristianYear = new Date().getFullYear();
  return currentChristianYear + 543;
};

const generateAcademicYearOptions = () => {
  const currentYear = getCurrentYear();
  const years = [];
  years.push({ value: currentYear.toString(), label: `ปีปัจจุบัน` });
  const yearBack1 = currentYear - 1;
  years.push({ value: yearBack1.toString(), label: yearBack1 });
  const yearBack2 = currentYear - 2;
  years.push({ value: yearBack2.toString(), label: yearBack2 });
  return years;
};

const academicYearOptions = generateAcademicYearOptions();
const semesterOptions = [
  { value: "1", label: " 1" },
  { value: "2", label: " 2" },
  { value: "3 (ฤดูร้อน)", label: " 3 (ฤดูร้อน)" },
];

const courseTypeOptions = ["2 ปี", "4 ปี"];
const editSemesterOptions = ["1", "2", "3 (ฤดูร้อน)"];

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

  // ✅ (2) State สำหรับ Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const mainTitle = "Management data";
  const subTitle = "จัดการข้อมูล";

  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [academicYearFilter, setAcademicYearFilter] = useState("");

  const [filterType, setFilterType] = useState("");
  const [filterValue, setFilterValue] = useState("");

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

  // ✅ (3) Handlers สำหรับ Pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // รีเซ็ตหน้ากลับไปที่ 0 เมื่อเปลี่ยนจำนวนรายการต่อหน้า
  };
  // End Pagination Handlers

  // 🔴 Logic สำหรับการค้นหา
  const handleSearch = () => {
    setSearchTerm(searchInput);
    setPage(0); // ✅ รีเซ็ตหน้ากลับไปที่ 0 เมื่อค้นหา
  };

  // 🔴 Logic สำหรับการล้างค่า
  const handleClearFilters = () => {
    setSearchTerm("");
    setSearchInput("");
    setSemesterFilter("");
    setAcademicYearFilter("");
    setFilterType("");
    setFilterValue("");
    setPage(0); // ✅ รีเซ็ตหน้ากลับไปที่ 0 เมื่อล้างค่า
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

  const totalStudents = summary?.totalStudents || 0;
  const totalTimesheets = summary?.totalTimesheets || 0;

  // =================================================================
  // ✅ (4) Filtering Logic for Student Tab (Index 0) - ปรับปรุงการรีเซ็ตหน้า
  // =================================================================
  const filteredStudents = React.useMemo(() => {
    const getSafeLowerString = (value) => (value ?? "").toLowerCase();

    // ❌ ลบ setPage(0) ออกจาก useMemo เพื่อป้องกัน loop หรือ render ที่ไม่จำเป็น

    return students
      .filter((s) => s.role === "student")
      .filter((student) => {
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
  }, [students, searchTerm, semesterFilter, academicYearFilter]);

  // ✅ New: Logic เพื่อแสดงข้อมูลในหน้าปัจจุบัน
  const studentDataForPage = filteredStudents.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

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
          {/* ------------------ Tabs (นำ Tab ที่ 2 ออก) ------------------ */}
          <Paper
            elevation={2}
            sx={{
              mb: 3,
              bgcolor: "#fff",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <Tabs
              value={0}
              aria-label="management tabs"
              variant="fullWidth"
              TabIndicatorProps={{ style: { display: "none" } }}
              sx={{
                minHeight: "48px",
                "& .MuiTabs-flexContainer": {
                  display: "flex",
                  height: "48px",
                  "& button": { flexGrow: 1, maxWidth: "100%" },
                },
              }}
            >
              <Tab
                iconPosition="start"
                icon={<EditNoteIcon sx={{ color: "white" }} />}
                label="จัดการข้อมูลนักศึกษา"
                sx={{
                  fontWeight: "bold",
                  fontFamily: '"Kanit", sans-serif',
                  color: "white !important",
                  backgroundColor: "#00796b",
                  borderRight: "none",
                  minHeight: "48px",
                  p: 2,
                  "&:hover": {
                    backgroundColor: "#00796b",
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
          {/* ---------------- Tab Panel 1: Student Data (Index 0) ---------------- */}
          <TabPanel value={0} index={0}>
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
                    elevation={2}
                    sx={{
                      p: 3,
                      bgcolor: "#fff",
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 2,
                    }}
                  >
                    <GroupsIcon
                      sx={{
                        color: "#00796b",
                        fontSize: "4rem",
                      }}
                    />
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
                        จำนวนนักศึกษา
                      </Typography>
                      <Typography
                        variant="h4"
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
                    elevation={2}
                    sx={{
                      p: 3,
                      bgcolor: "#fff",
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 2,
                    }}
                  >
                    <AccessTimeIcon
                      sx={{
                        color: "#00796b",
                        fontSize: "4rem",
                      }}
                    />
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
                        variant="h4"
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
            // Combined Search/Filter UI for Students
            // ================================================================= */}
            <Paper
              elevation={1}
              sx={{
                mb: 2,
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
                  mb: 0,
                }}
              >
                {/* Search Term Input (ขยายเพื่อกินพื้นที่ส่วนใหญ่) */}
                <TextField
                  variant="outlined"
                  size="small"
                  fullWidth
                  placeholder="ค้นหา"
                  value={searchInput}
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
                  // 🔴 (5) ใช้ handleSearch ที่มีการรีเซ็ต page
                  onClick={handleSearch}
                >
                  ค้นหา
                </Button>

                {/* Clear Button (ล้าง) */}
                <Button
                  variant="outlined"
                  // 🔴 (6) ใช้ handleClearFilters ที่มีการรีเซ็ต page
                  onClick={handleClearFilters}
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
                  mt: 0.5,
                  mb: 1.5,
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
                    shrink={false}
                    sx={{
                      opacity: 0,
                      visibility: "hidden",
                      pointerEvents: "none",
                    }}
                  >
                    หมวดหมู่
                  </InputLabel>
                  <Select
                    value={filterType}
                    displayEmpty
                    renderValue={(selected) => {
                      if (selected === "") {
                        return (
                          <Typography color="textSecondary">
                            หมวดหมู่
                          </Typography>
                        );
                      }
                      return selected === "semester"
                        ? "ภาคเรียน"
                        : "ปีการศึกษา";
                    }}
                    onChange={(e) => {
                      setFilterType(e.target.value);
                      setFilterValue("");
                      setSemesterFilter("");
                      setAcademicYearFilter("");
                      setPage(0); // ✅ รีเซ็ตหน้าเมื่อเปลี่ยนหมวดหมู่หลัก
                    }}
                    sx={{
                      ...inputStyle,
                      "& .MuiOutlinedInput-notchedOutline": {
                        transition:
                          "border-color 200ms cubic-bezier(0.0, 0, 0.2, 1) 0ms",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#00796b !important",
                        borderWidth: "2px !important",
                      },
                      "&.Mui-active .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#00796b !important",
                        borderWidth: "2px !important",
                      },
                      borderRadius: 2,
                      height: 36,
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
                        setFilterValue(selectedValue);

                        const filterValueForLogic =
                          selectedValue === "ทั้งหมด" ? "" : selectedValue;

                        if (filterType === "semester") {
                          setSemesterFilter(filterValueForLogic);
                          setAcademicYearFilter("");
                        } else if (filterType === "academicYear") {
                          setAcademicYearFilter(filterValueForLogic);
                          setSemesterFilter("");
                        }
                        setPage(0); // ✅ รีเซ็ตหน้าเมื่อเปลี่ยนค่า Filter
                      }}
                      sx={{
                        ...inputStyle,
                        "& .MuiOutlinedInput-notchedOutline": {
                          transition:
                            "border-color 200ms cubic-bezier(0.0, 0, 0.2, 1) 0ms",
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#00796b !important",
                          borderWidth: "2px !important",
                        },
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
                  "& td, & th": {
                    fontSize: isSmallScreen ? "0.75rem" : "1rem",
                    padding: isSmallScreen ? "6px 8px" : "12px 16px",
                    mt: 2,
                  },
                }}
              >
                <Table>
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
                    {/* ✅ (7) ใช้ studentDataForPage และปรับการคำนวณลำดับ */}
                    {studentDataForPage.map((student, index) => (
                      <TableRow key={student.id}>
                        <TableCell
                          sx={{ fontFamily: '"Kanit", sans-serif' }}
                          align="center"
                        >
                          {page * rowsPerPage + index + 1}
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
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between", // แยกซ้าย (Status) และขวา (Pagination)
                    alignItems: "center",
                    py: 1, // Padding แนวตั้ง
                    px: 2, // Padding แนวนอน
                    fontFamily: '"Kanit", sans-serif',
                    // Note: เราจะใช้ rowsPerPage ที่ตั้งค่าไว้ก่อนหน้า (สมมติว่าเป็น 10)
                  }}
                >
                  {/* 1. ส่วนซ้าย: ข้อความสถานะ "1-10 จาก 11" */}
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={filteredStudents.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage} // 💡 ต้องมีตัวนี้ด้วย
                    labelRowsPerPage="" // ✅ ซ่อน Label "รายการต่อหน้า:"
                    labelDisplayedRows={() => ""} // ✅ ซ่อนข้อความสถานะ "1-10 จาก 11"
                    sx={{
                      // กำหนดความกว้างให้พอดีกับเนื้อหา
                      width: "auto",
                      overflow: "hidden", // ซ่อนส่วนที่อาจจะล้นออกไป

                      "& .MuiTablePagination-toolbar": {
                        padding: 0,
                        minHeight: "auto", // ลดความสูงไม่ให้กินพื้นที่มากเกินไป

                        // ซ่อนส่วนประกอบที่ไม่ต้องการ
                        "& .MuiTablePagination-actions": {
                          display: "none", // ✅ ซ่อนปุ่มลูกศร (< >)
                        },
                        "& .MuiTablePagination-spacer": {
                          display: "none", // ✅ ซ่อน Spacer
                        },
                        "& .MuiTablePagination-displayedRows": {
                          display: "none", // ✅ ซ่อนข้อความสถานะ
                        },

                        // จัด Select ให้อยู่ชิดซ้าย
                        "& .MuiTablePagination-selectRoot": {
                          margin: 0,

                          // Style Select Dropdown
                          "& .MuiTablePagination-select": {
                            fontFamily: '"Kanit", sans-serif',
                            fontSize: 14,
                            fontWeight: 500,
                          },
                        },
                      },
                    }}
                  />
                  {/* 2. ส่วนขวา: ปุ่มตัวเลข Pagination */}
                  <Pagination
                    count={Math.ceil(filteredStudents.length / rowsPerPage)} // จำนวนหน้าทั้งหมด
                    page={page + 1} // หน้าปัจจุบัน (ต้องเริ่มจาก 1 สำหรับ Pagination)
                    onChange={(event, value) =>
                      handleChangePage(event, value - 1)
                    } // ปรับค่ากลับเป็น Index 0
                    variant="outlined"
                    shape="rounded"
                    sx={{
                      "& .MuiPaginationItem-root": {
                        fontFamily: '"Kanit", sans-serif',
                        fontWeight: 500,
                        borderRadius: "50%",
                      },
                      // ✅ เพิ่ม Style สำหรับปุ่มที่ถูกเลือก (Active Page)
                      "& .MuiPaginationItem-root.Mui-selected": {
                        backgroundColor: "#00796b", // สีพื้นหลัง: เขียว
                        color: "white", // สีตัวอักษร: ขาว
                        fontWeight: 700,
                        borderRadius: "50%",
                        // ทำให้สีไม่เปลี่ยนกลับเมื่อชี้เม้าส์
                        "&:hover": {
                          backgroundColor: "#024f46", // สีเข้มขึ้นเมื่อ hover (ตามสไตล์ที่คุณชอบ)
                          color: "white",
                        },
                      },
                    }}
                  />
                </Box>
              </Paper>
            )}
          </TabPanel>
          {/* ------------------ Edit Dialog (ส่วนที่เหลือไม่เปลี่ยนแปลง) ------------------ */}
          <Dialog
            open={editOpen}
            onClose={handleEditClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: 3,
                fontFamily: '"Kanit", sans-serif',
              },
            }}
          >
            <DialogTitle
              sx={{
                fontWeight: "bold",
                color: "#00796b",
                textAlign: "center",
                mt: 2,
                mb: 0,
                p: 0,
              }}
            >
              <Box
                sx={{
                  pb: 1,
                  borderBottom: "1.5px solid #00796b",
                  width: "80%",
                  mx: "auto",
                  pt: 0,
                }}
              >
                <Typography variant="h6" component="span">
                  แก้ไขข้อมูลนักศึกษา
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent
              dividers
              sx={{
                px: isSmallScreen ? 2 : 3,
                py: isSmallScreen ? 2 : 3,
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
                          // ✅ FIX: Disabled เสมอ (สำหรับ Student)
                          disabled={true}
                        >
                          <MenuItem value="admin">Admin</MenuItem>
                          <MenuItem value="teacher">Teacher</MenuItem>
                          <MenuItem value="student">Student</MenuItem>
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
                    {/* Row 4: Course */}
                    <Grid item xs={12} sm={12}>
                      <FormControl fullWidth size="small" sx={inputStyle}>
                        <InputLabel id="course-label">หลักสูตร</InputLabel>
                        <Select
                          labelId="course-label"
                          name="course"
                          value={formData.course || ""}
                          label="หลักสูตร"
                          onChange={handleChange}
                        >
                          {courseTypeOptions.map((option) => (
                            <MenuItem key={option} value={option}>
                              {option}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
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
                      <FormControl fullWidth size="small" sx={inputStyle}>
                        <InputLabel id="semester-label">ภาคเรียน</InputLabel>
                        <Select
                          labelId="semester-label"
                          name="semester"
                          value={formData.semester || ""}
                          label="ภาคเรียน"
                          onChange={handleChange}
                        >
                          {editSemesterOptions.map((option) => (
                            <MenuItem key={option} value={option}>
                              {option}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
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
                  </Grid>
                </Box>
              )}
            </DialogContent>
            <DialogActions
              sx={{
                pb: 2,
                justifyContent: "center",
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
