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
  Delete as DeleteIcon,
  Description as DescriptionIcon,
  Groups as GroupsIcon,
  AccessTime as AccessTimeIcon,
  Verified as VerifiedIcon,
  EditNote as EditNoteIcon,
} from "@mui/icons-material";

import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";
import {
  getAllStudents,
  deleteStudent,
  updateStudent,
  getAdminSummary,
} from "../../services/studentService";

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

const getCurrentYear = () => {
  const currentChristianYear = new Date().getFullYear();
  const currentBuddhistYear = currentChristianYear + 543;
  return currentBuddhistYear;
};

const generateAcademicYearOptions = () => {
  const currentYear = getCurrentYear();
  const years = [];

  years.push({
    value: currentYear.toString(),
    label: `ปีปัจจุบัน`,
  });

  const yearBack1 = currentYear - 1;
  years.push({
    value: yearBack1.toString(),
    label: yearBack1,
  });

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

  // ✅ 2. State สำหรับ Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const drawerWidth = 240;

  const mainTitle = value === 0 ? "Management data" : "User list information";
  const subTitle = value === 0 ? "จัดการข้อมูล" : "ข้อมูลรายชื่อผู้ใช้";

  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [submittedSearchTerm, setSubmittedSearchTerm] = useState("");
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
        if (a.role === "admin" && b.role !== "admin") return -1;
        if (a.role !== "admin" && b.role === "admin") return 1;
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

  // ✅ NEW: Handlers สำหรับ Pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // รีเซ็ตหน้ากลับไปที่ 0 เมื่อเปลี่ยนจำนวนรายการต่อหน้า
  };
  // End Pagination Handlers

  const handleAddUser = () => {
    navigate("/admin/add-account");
  };

  const handleChangeTab = (event, newValue) => {
    setValue(newValue);
    setSearchInput("");
    setSearchTerm("");
    setSemesterFilter("");
    setAcademicYearFilter("");
    setPage(0); // ✅ รีเซ็ตหน้าเมื่อเปลี่ยน Tab
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
    navigate(`/admin/student/${id}/timesheets`);
  };

  const handleDelete = async (id, role) => {
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

  const totalStudents = summary?.totalStudents || 0;
  const totalTimesheets = summary?.totalTimesheets || 0;
  const totalAdmins = students.filter((s) => s.role === "admin").length;
  const totalTeachers = students.filter((s) => s.role === "teacher").length;

  // 🔴 Logic สำหรับการค้นหา (ใช้ร่วมกันสำหรับ Tab 0 และ Tab 1)
  const handleSearch = () => {
    setSearchTerm(searchInput);
    setPage(0); // ✅ รีเซ็ตหน้ากลับไปที่ 0 เมื่อค้นหา
  };

  // 🔴 Logic สำหรับการล้างค่า (ใช้ใน Tab 0)
  const handleClearFilters = () => {
    setSearchTerm("");
    setSearchInput("");
    setSemesterFilter("");
    setAcademicYearFilter("");
    setFilterType("");
    setFilterValue("");
    setPage(0);
  };

  // =================================================================
  // ✅ Filtering Logic for Student Tab (Index 0)
  // =================================================================
  const filteredStudents = React.useMemo(() => {
    const getSafeLowerString = (value) => (value ?? "").toLowerCase();

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

  // ✅ NEW: Slicing for Student Tab
  const studentDataForPage = filteredStudents.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // =================================================================
  // ✅ Filtering Logic for System User Tab (Index 1)
  // =================================================================
  const filteredSystemUsers = React.useMemo(() => {
    return students
      .filter((s) => s.role !== "student") // Only Admin/Teacher in this tab
      .filter((user) => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          searchTerm === "" ||
          (user.studentId &&
            user.studentId.toLowerCase().includes(searchLower));

        return matchesSearch;
      });
  }, [students, searchTerm]);

  // ✅ NEW: Slicing for System User Tab
  const userDataForPage = filteredSystemUsers.slice(
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
          {/* ------------------ Tabs ------------------ */}
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
          {/* ---------------- Tab Panel 1: Student Data (Index 0) ---------------- */}
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
                  onClick={handleSearch} // ✅ ใช้ handleSearch
                >
                  ค้นหา
                </Button>

                {/* Clear Button (ล้าง) */}
                <Button
                  variant="outlined"
                  onClick={handleClearFilters} // ✅ ใช้ handleClearFilters
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

              {/* Row 1.1: คำอธิบายการค้นหา (Caption) */}
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

                {/* Dropdown 2: แสดงตัวเลือกตามหมวดหมู่ที่เลือก */}
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
                    {/* ✅ ใช้ studentDataForPage */}
                    {studentDataForPage.map((student, index) => (
                      <TableRow key={student.id}>
                        <TableCell
                          sx={{ fontFamily: '"Kanit", sans-serif' }}
                          align="center"
                        >
                          {/* ✅ ปรับการคำนวณลำดับ */}
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
                {/* ✅ เพิ่ม TablePagination สำหรับ Tab 0 */}
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
                        จำนวนอาจารย์
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
                        {totalTeachers}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
                {/* Summary Card 2: จำนวน Admin */}
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
                        จำนวน Admin
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
                        {totalAdmins}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            )}

            {/* Search UI for System User Tab (Index 1) */}
            <Paper
              elevation={1}
              sx={{
                mb: 2,
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
                  <Typography
                    sx={{
                      fontFamily: '"Kanit", sans-serif',
                      whiteSpace: "nowrap",
                      pt: 0.5,
                      pb: 0.5,
                    }}
                  >
                    รหัสประจำตัว
                  </Typography>
                  <TextField
                    placeholder="ค้นหา"
                    variant="outlined"
                    size="small"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    sx={{ width: "250px", ...inputStyle }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>

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
                    onClick={handleSearch} // ✅ ใช้ handleSearch
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
                        borderColor: "#00796b",
                        borderWidth: "2px",
                      },
                    }}
                    onClick={() => {
                      setSearchTerm("");
                      setSearchInput("");
                      setPage(0); // ✅ รีเซ็ตหน้าเมื่อล้างค่า
                    }}
                  >
                    ล้างค่า
                  </Button>
                </Box>
              </Box>
            </Paper>
            <Box
              sx={{
                width: "100%",
                display: "flex",
                justifyContent: "flex-end",
                mb: 2,
              }}
            >
              <Button
                variant="contained"
                onClick={handleAddUser}
                color="success"
                sx={{
                  bgcolor: "#00796b",
                  textTransform: "none",
                  borderRadius: 2,
                  whiteSpace: "nowrap",
                  minWidth: "120px",
                  height: "40px",
                  "&:hover": { bgcolor: "#00695c" },
                }}
              >
                + เพิ่มอาจารย์
              </Button>
            </Box>

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
                }}
              >
                <Typography
                  variant="h6"
                  color="textSecondary"
                  sx={{ fontFamily: '"Kanit", sans-serif' }}
                >
                  ไม่พบรหัสประจำตัวผู้ใช้งานในระบบ
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
                      {/* <TableCell sx={headerCellStyle} align="center">
                        สาขา
                      </TableCell> */}
                      <TableCell sx={headerCellStyle} align="center">
                        อีเมล
                      </TableCell>
                      <TableCell sx={headerCellStyle} align="center">
                        เบอร์โทรศัพท์
                      </TableCell>
                      <TableCell sx={headerCellStyle} align="center">
                        สิทธิ์การใช้งาน
                      </TableCell>
                      <TableCell sx={headerCellStyle}>ดำเนินการ</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {/* ✅ ใช้ userDataForPage */}
                    {userDataForPage.map((user, index) => (
                      <TableRow key={user.id}>
                        <TableCell
                          sx={{ fontFamily: '"Kanit", sans-serif' }}
                          align="left"
                        >
                          {/* ✅ ปรับการคำนวณลำดับ */}
                          {page * rowsPerPage + index + 1}
                        </TableCell>
                        <TableCell
                          sx={{ fontFamily: '"Kanit", sans-serif' }}
                          align="left"
                        >
                          {user.studentId || "-"}
                        </TableCell>
                        <TableCell sx={{ fontFamily: '"Kanit", sans-serif' }}>
                          {user.fullName}
                        </TableCell>
                        {/* <TableCell
                          sx={{ fontFamily: '"Kanit", sans-serif' }}
                          align="center"
                        >
                          {user.branch || "-"}
                        </TableCell> */}
                        <TableCell
                          sx={{ fontFamily: '"Kanit", sans-serif' }}
                          align="left"
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
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
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
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {/* ✅ เพิ่ม TablePagination สำหรับ Tab 1 */}
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
                    count={filteredSystemUsers.length}
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
                    count={Math.ceil(filteredSystemUsers.length / rowsPerPage)} // จำนวนหน้าทั้งหมด
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
                ...(value === 1 && { maxWidth: "550px" }),
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
                  {value === 0 ? "แก้ไขข้อมูลนักศึกษา" : "แก้ไขข้อมูลผู้ใช้"}
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent
              dividers
              sx={{
                px: isSmallScreen ? 2 : 3,
                py: value === 1 ? 5 : isSmallScreen ? 2 : 3,
              }}
            >
              {selectedStudent && (
                <Box component="form" onSubmit={(e) => e.preventDefault()}>
                  <Grid container spacing={2}>
                    {/* Row 1: Role (สิทธิ์การใช้งาน) & Student ID (รหัสประจำตัว) */}
                    <Grid item xs={12} sm={value === 0 ? 6 : 12}>
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
                    {value === 0 && (
                      <>
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
                      </>
                    )}
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
                        {/* Row 4: Course */}
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

export default AdminDashboard;
