// src/pages/ReportExport.js
import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Stack,
  Select,
  MenuItem,
  FormControl,
  CircularProgress,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import Swal from "sweetalert2";
import axios from "axios";
import Sidebar from "../components/Sidebar";

const API_URL = process.env.REACT_APP_API;

/* =========================
   ตัวเลือก (ตามสเปกล่าสุด)
   ========================= */
const SEMESTERS = [
  { value: "ทั้งหมด", label: "ทั้งหมด" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3 (ฤดูร้อน)" },
];

const ACADEMIC_YEARS = ["ทั้งหมด", "2566", "2567", "2568"];
const COURSES = ["ทั้งหมด", "2 ปี", "4 ปี"]; // หลักสูตร(ปี)

/* =========================
   สไตล์กรอบ: ใช้เหมือนหน้า Profile
   ========================= */
const textFieldSx = {
  borderRadius: 2,
  backgroundColor: "#ffffff",
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#cfd8dc" },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#0b7a6b" },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "#0b7a6b",
    // boxShadow: "0 0 0 3px rgba(11,122,107,.15)", // เปิดถ้าอยากได้เงาตอน focus
  },
};

/* label แบบอยู่ "เหนือช่อง" เหมือนหน้า Profile */
const FieldLabel = ({ children, required }) => (
  <Typography
    sx={{
      fontSize: 14,
      lineHeight: 1.2,
      color: "#455a64",
      mb: 0.5,
      display: "inline-flex",
      alignItems: "center",
      gap: 0.5,
      fontWeight: 500,
    }}
  >
    {children}
    {required && <Box component="span" sx={{ color: "#e53935", fontSize: 14 }}>*</Box>}
  </Typography>
);

export default function ReportExport() {
  /* ----------------------
     สถานะฟอร์ม (ช่องค้นหา)
     ---------------------- */
  const [semester, setSemester] = useState("1");
  const [academicYear, setAcademicYear] = useState(ACADEMIC_YEARS[0]); // เริ่มที่ "ทั้งหมด"
  const [studentId, setStudentId] = useState("");
  const [course, setCourse] = useState("ทั้งหมด");
  const [companyName, setCompanyName] = useState("");
  const [internPosition, setInternPosition] = useState("");
  const [format, setFormat] = useState("pdf");

  /* ----------------------
     พรีวิว
     ---------------------- */
  const [previewData, setPreviewData] = useState([]);
  const [loading, setLoading] = useState(false);

  const params = useMemo(
    () => ({
      semester: semester === "ทั้งหมด" ? undefined : semester,
      academicYear: academicYear === "ทั้งหมด" ? undefined : academicYear, // "ทั้งหมด" = ไม่กรอง
      studentId: studentId?.trim() || undefined,
      course: course === "ทั้งหมด" ? undefined : course,
      companyName: companyName?.trim() || undefined,
      internPosition: internPosition?.trim() || undefined,
    }),
    [semester, academicYear, studentId, course, companyName, internPosition]
  );

  const fetchPreview = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/reports/students`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });

      setPreviewData(res?.data || []);
      if (!res?.data?.length) {
        Swal.fire({
          title: "ไม่มีข้อมูล",
          text: "ไม่พบรายชื่อนักศึกษาตามเงื่อนไขที่เลือก",
          icon: "info",
          confirmButtonColor: "#0b7a6b",
        });
      }
    } catch (err) {
      Swal.fire({
        title: "ผิดพลาด",
        text: "โหลดตัวอย่างไม่สำเร็จ",
        icon: "error",
        confirmButtonColor: "#0b7a6b",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const body = { ...params, format: String(format).toLowerCase() };

      const response = await axios.post(
        `${API_URL}/reports/students/export`,
        body,
        { responseType: "blob", headers: { Authorization: `Bearer ${token}` } }
      );

      const blob = new Blob([response.data], {
        type:
          body.format === "pdf"
            ? "application/pdf"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      const fileYear = academicYear === "ทั้งหมด" ? "all" : academicYear;
      const fileSem = semester === "ทั้งหมด" ? "all" : semester;   // ← ถ้ามีตัวเลือก "ทั้งหมด"
      link.download = `students_${fileSem}_${fileYear}.${body.format === "pdf" ? "pdf" : "xlsx"}`;
      link.click();
    } catch (err) {
      Swal.fire({
        title: "ผิดพลาด",
        text: "ส่งออกไฟล์ไม่สำเร็จ",
        icon: "error",
        confirmButtonColor: "#0b7a6b",
      });
    } finally {
      setLoading(false);
    }
  };

  // ล้างค่าแบบครบชุด + ล้างผลพรีวิว
  const handleClear = () => {
    setSemester("1");              // ค่าเริ่มต้นภาคเรียน
    setAcademicYear("ทั้งหมด");   // ปีการศึกษา: ทั้งหมด
    setStudentId("");
    setCourse("ทั้งหมด");
    setCompanyName("");
    setInternPosition("");
    setFormat("pdf");              // ตั้งค่า export กลับเป็น PDF
    setPreviewData([]);            // เคลียร์ตารางพรีวิว
  };

  return (
    <Box sx={{ display: "flex", backgroundColor: "#f5f7fa" }}>
      <Sidebar />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 4,
          mt: 5,
          minHeight: "100vh",
          backgroundColor: "#f5f7fa",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          fontFamily: '"Kanit", sans-serif',
        }}
      >
        <Typography
          variant="h4"
          sx={{ fontWeight: 700, color: "#0b7a6b", mb: 3, textAlign: "center" }}
        >
          EXPORT REPORT (รายชื่อนักศึกษา)
        </Typography>

        <Paper
          elevation={4}
          sx={{
            width: "100%",
            maxWidth: 1200,
            mb: 3,
            p: 3,
            borderRadius: 3,
            backgroundColor: "#fff",
            boxShadow: "0 8px 24px rgba(0,102,204,0.12)",
          }}
        >
          <Grid container spacing={2.5}>
            {/* ภาคเรียน */}
            <Grid item xs={12} md={6}>
              <FieldLabel required>ภาคเรียน</FieldLabel>
              <FormControl fullWidth>
                <Select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  sx={textFieldSx}
                >
                  {SEMESTERS.map((s) => (
                    <MenuItem key={s.value} value={s.value}>
                      {s.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* ปีการศึกษา */}
            <Grid item xs={12} md={6}>
              <FieldLabel required>ปีการศึกษา</FieldLabel>
              <FormControl fullWidth>
                <Select
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  sx={textFieldSx}
                >
                  {ACADEMIC_YEARS.map((y) => (
                    <MenuItem key={y} value={y}>
                      {y}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* รหัสประจำตัว */}
            <Grid item xs={12} md={6}>
              <FieldLabel>รหัสประจำตัว</FieldLabel>
              <TextField
                placeholder="ทั้งหมด"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                fullWidth
                InputProps={{ sx: textFieldSx }}
              />
            </Grid>

            {/* หลักสูตร(ปี) */}
            <Grid item xs={12} md={6}>
              <FieldLabel required>หลักสูตร(ปี)</FieldLabel>
              <FormControl fullWidth>
                <Select
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  sx={textFieldSx}
                >
                  {COURSES.map((c) => (
                    <MenuItem key={c} value={c}>
                      {c}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* ชื่อสถานประกอบการ */}
            <Grid item xs={12} md={6}>
              <FieldLabel>ชื่อสถานประกอบการ</FieldLabel>
              <TextField
                placeholder="ทั้งหมด"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                fullWidth
                InputProps={{ sx: textFieldSx }}
              />
            </Grid>

            {/* ตำแหน่งฝึกงาน */}
            <Grid item xs={12} md={6}>
              <FieldLabel>ตำแหน่งฝึกงาน</FieldLabel>
              <TextField
                placeholder="ทั้งหมด"
                value={internPosition}
                onChange={(e) => setInternPosition(e.target.value)}
                fullWidth
                InputProps={{ sx: textFieldSx }}
              />
            </Grid>

            {/* ปุ่ม Preview (ซ้าย) + ล้างค่า (ขวาสุด) */}
            <Grid item xs={12}>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"   // ← ดันซ้าย-ขวา
                spacing={2}
              >
                {/* กลุ่มซ้าย: Preview + ข้อความช่วย */}
                <Stack direction="row" spacing={2} alignItems="center">
                  <Button
                    variant="contained"
                    onClick={fetchPreview}
                    disabled={loading}
                    sx={{
                      borderRadius: 2,
                      textTransform: "none",
                      px: 3,
                      py: 1.2,
                      fontWeight: 500,
                      backgroundColor: "#0b7a6b",
                      "&:hover": { backgroundColor: "#095f52" },
                    }}
                  >
                    {loading ? <CircularProgress size={20} color="inherit" /> : "Preview"}
                  </Button>

                  <Typography variant="body2" color="text.secondary">
                    ดูตัวอย่าง report ก่อน Export
                  </Typography>
                </Stack>

                {/* ปุ่มขวาสุด: ล้างค่า */}
                <Button
                  variant="outlined"
                  onClick={handleClear}
                  disabled={loading}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    px: 3,
                    py: 1.2,
                    fontWeight: 500,
                    borderColor: "#0b7a6b",
                    color: "#0b7a6b",
                    "&:hover": { borderColor: "#095f52", backgroundColor: "rgba(11,122,107,0.06)", color: "#095f52" },
                  }}
                >
                  ล้างค่า
                </Button>
              </Stack>
            </Grid>

            {/* PREVIEW TABLE */}
            <Grid item xs={12}>
              <Paper
                elevation={0}
                sx={{ borderRadius: 2, overflow: "hidden", border: "1px solid #d9e1e7" }}
              >
                <Box sx={{ bgcolor: "#0b7a6b", color: "#fff", py: 1, textAlign: "center" }}>
                  <Typography sx={{ fontWeight: 500 }}>
                    ปีการศึกษา {academicYear === "ทั้งหมด" ? "ทั้งหมด" : academicYear}
                  </Typography>
                </Box>
                <Box sx={{ bgcolor: "#e7f4f2", color: "#0b7a6b", py: 0.75, textAlign: "center" }}>
                  <Typography sx={{ fontWeight: 500 }}>
                    ภาคเรียนที่ {semester === "ทั้งหมด" ? "ทั้งหมด" : semester}
                  </Typography>
                </Box>

                <TableContainer sx={{ maxHeight: 360 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow sx={{ "& th": { bgcolor: "#f6faf9", fontWeight: 500 } }}>
                        <TableCell align="center" sx={{ width: 72 }}>
                          ลำดับ
                        </TableCell>
                        <TableCell align="center" sx={{ width: 140 }}>
                          รหัสประจำตัว
                        </TableCell>
                        <TableCell sx={{ width: 220 }}>ชื่อ-นามสกุล</TableCell>
                        <TableCell>ชื่อสถานประกอบการ</TableCell>
                        <TableCell>ตำแหน่งฝึกงาน</TableCell>
                        <TableCell align="center" sx={{ width: 220 }}>
                          สาขา
                        </TableCell>
                        <TableCell align="center" sx={{ width: 120 }}>
                          หลักสูตร(ปี)
                        </TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {previewData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 6, color: "text.secondary" }}>
                            ไม่มีข้อมูลแสดง
                          </TableCell>
                        </TableRow>
                      ) : (
                        previewData.map((it, idx) => (
                          <TableRow key={`${it.studentId}-${idx}`} hover>
                            <TableCell align="center">{idx + 1}</TableCell>
                            <TableCell align="center">{it.studentId || "-"}</TableCell>
                            <TableCell>{it.fullName || "-"}</TableCell>
                            <TableCell>{it.companyName || "-"}</TableCell>
                            <TableCell>{it.internPosition || "-"}</TableCell>
                            <TableCell align="center">{it.branch || "-"}</TableCell>
                            <TableCell align="center">{it.course || "-"}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>

            {/* Export file (ซ้าย = เลือกชนิด, ขวา = ปุ่ม) */}
            <Grid item xs={12}>
              <FieldLabel>รูปแบบการ Export ไฟล์</FieldLabel>
              <FormControl fullWidth>
                <Select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  sx={textFieldSx}
                >
                  <MenuItem value="pdf">PDF</MenuItem>
                  <MenuItem value="xlsx">Excel (XLSX)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleExport}
                disabled={loading || previewData.length === 0}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  py: 1.4,
                  fontWeight: 500,
                  backgroundColor: "#0b7a6b",
                  "&:hover": { backgroundColor: "#095f52" },
                }}
              >
                {loading ? <CircularProgress size={20} color="inherit" /> : "Export file"}
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Box>
  );
}
