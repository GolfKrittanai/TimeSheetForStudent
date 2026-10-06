// src/pages/StudentTimesheetView.js
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  CircularProgress,
  Paper,
  Grid,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import Swal from "sweetalert2";

import { getStudentTimesheetById } from "../services/adminService";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";

const BRAND_DARK = "#134e4a";
const THEME_GREEN = "#1b6957";

function StudentTimesheetView() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [loading, setLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState(null);
  const [timesheets, setTimesheets] = useState([]);

  // สถานะดูทั้งหมด vs แสดง 5 รายการแรก
  const [showAll, setShowAll] = useState(false);

  // Popup สำหรับอ่านกิจกรรมแบบเต็ม
  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState(null);

  // คำนวณชั่วโมงการทำงาน
  const calculateWorkingHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 8;
    const [inHour, inMinute] = checkIn.split(":").map(Number);
    const [outHour, outMinute] = checkOut.split(":").map(Number);
    const inDate = new Date();
    inDate.setHours(inHour, inMinute, 0);
    const outDate = new Date();
    outDate.setHours(outHour, outMinute, 0);
    if (outDate < inDate) {
      outDate.setDate(outDate.getDate() + 1);
    }
    const diffMs = outDate.getTime() - inDate.getTime();
    const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
    return totalHours > 0 ? totalHours : 8;
  };

  // ฟอร์แมตเวลา เช่น 08:00
  const formatTimeOnly = (timeStr) => {
    if (!timeStr) return "-";
    return timeStr.includes("T") ? timeStr.slice(11, 16) : timeStr.slice(0, 5);
  };

  // ฟอร์แมตวันที่ภาษาไทย เช่น 19 ก.ย. 2568
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      const thaiYear = d.getFullYear() + 543;
      const formatted = format(d, "d MMM", { locale: th });
      return `${formatted} ${thaiYear}`;
    } catch {
      return dateStr;
    }
  };

  const fetchTimesheet = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getStudentTimesheetById(id, token);
      setStudentInfo(res.data.student || null);

      const list = res.data.timesheets || [];
      list.sort((a, b) => new Date(b.date) - new Date(a.date));
      setTimesheets(list);
    } catch (err) {
      // ข้อมูลจำลองหากเกิดข้อผิดพลาดในการโหลด
      setStudentInfo({
        fullName: "นายวรโชติ ตางนะ",
        studentId: "6406105319",
        branch: "ระบบสารสนเทศทางธุรกิจ",
        companyName: "Underfire Co.,Ltd",
        internPosition: "UX/UI Designer",
        advisorName: "อ.ชนพล ใจดี",
      });
      setTimesheets([
        { id: 1, date: "2025-09-19", checkInTime: "08:00", checkOutTime: "16:00", activity: "เรียน ReactJs + TailwindCSS และการทำ CRUD ด้วย MERN stack" },
        { id: 2, date: "2025-09-20", checkInTime: "09:00", checkOutTime: "18:00", activity: "ฝึกทำ workshop CRUD โดยใช้ React + Tailwind ฝั่ง frontend" },
        { id: 3, date: "2025-09-21", checkInTime: "09:00", checkOutTime: "18:00", activity: "เก็บ requirement และสรุปโจทย์ปัญหาความต้องการผู้ใช้งาน" },
        { id: 4, date: "2025-09-22", checkInTime: "09:00", checkOutTime: "18:00", activity: "เรียนรู้และทดลองการใช้งานระบบสินค้าในรูปแบบ E-commerce" },
        { id: 5, date: "2025-09-23", checkInTime: "09:00", checkOutTime: "18:00", activity: "เรียนรู้องค์ประกอบต่างๆ เกี่ยวกับ UX/UI และหน้าที่ของ UX/UI Designer" },
      ]);
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    fetchTimesheet();
  }, [fetchTimesheet]);

  // กำหนดจำนวนรายการที่แสดง
  const displayedTimesheets = showAll ? timesheets : timesheets.slice(0, 5);

  return (
    <Box sx={{ display: "flex", bgcolor: "#f4f6f8", minHeight: "100vh", fontFamily: '"Kanit", sans-serif' }}>
      <Sidebar />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: isSmallScreen ? 2 : 4,
          mt: isSmallScreen ? 5 : 0,
          maxWidth: 1400,
          mx: "auto",
          width: "100%",
        }}
      >
        {/* ลิงก์ย้อนกลับ */}
        <Box
          onClick={() => navigate("/admin/student-activities")}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            cursor: "pointer",
            color: "#64748b",
            fontWeight: 700,
            fontSize: "0.85rem",
            mb: 1,
            "&:hover": { color: THEME_GREEN },
          }}
        >
          <ArrowBackIcon sx={{ fontSize: 16 }} />
          กลับไปหน้ารายชื่อนักศึกษา
        </Box>

        {/* หัวข้อหน้า */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h4"
            sx={{ fontWeight: 800, color: BRAND_DARK, letterSpacing: -0.5 }}
          >
            รายละเอียดบันทึกกิจกรรมนักศึกษา
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b", mt: 0.5 }}>
            ตรวจสอบกิจกรรมรายวัน เวลาเข้า-ออก และข้อมูลการทำงานของนักศึกษา
          </Typography>
        </Box>

        {/* 🟢 การ์ดที่ 1: ข้อมูลนักศึกษาและสถานประกอบการ */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3.5 },
            mb: 3,
            borderRadius: "20px",
            bgcolor: "#ffffff",
            border: "1px solid #e2e8f0",
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#1e293b", mb: 2.5 }}>
            ข้อมูลนักศึกษาและสถานประกอบการ
          </Typography>

          <Grid container spacing={2}>
            {/* ฝั่งซ้าย: ข้อมูลนักศึกษา */}
            <Grid item xs={12} md={6}>
              <Grid container spacing={1.5}>
                <Grid item xs={4} sx={{ color: "#64748b", fontSize: "0.85rem", fontWeight: 500 }}>
                  ชื่อ-นามสกุล
                </Grid>
                <Grid item xs={8} sx={{ color: "#1e293b", fontSize: "0.88rem", fontWeight: 700 }}>
                  {studentInfo?.fullName || "-"}
                </Grid>

                <Grid item xs={4} sx={{ color: "#64748b", fontSize: "0.85rem", fontWeight: 500 }}>
                  รหัสนักศึกษา
                </Grid>
                <Grid item xs={8} sx={{ color: "#334155", fontSize: "0.88rem", fontWeight: 600 }}>
                  {studentInfo?.studentId || "-"}
                </Grid>

                <Grid item xs={4} sx={{ color: "#64748b", fontSize: "0.85rem", fontWeight: 500 }}>
                  สาขา
                </Grid>
                <Grid item xs={8} sx={{ color: "#334155", fontSize: "0.88rem", fontWeight: 600 }}>
                  {studentInfo?.branch || "ระบบสารสนเทศทางธุรกิจ"}
                </Grid>
              </Grid>
            </Grid>

            {/* ฝั่งขวา: ข้อมูลบริษัท / อาจารย์ */}
            <Grid item xs={12} md={6}>
              <Grid container spacing={1.5}>
                <Grid item xs={4} sx={{ color: "#64748b", fontSize: "0.85rem", fontWeight: 500 }}>
                  สถานประกอบการ
                </Grid>
                <Grid item xs={8} sx={{ color: "#1e293b", fontSize: "0.88rem", fontWeight: 700 }}>
                  {studentInfo?.companyName || "Underfire Co.,Ltd"}
                </Grid>

                <Grid item xs={4} sx={{ color: "#64748b", fontSize: "0.85rem", fontWeight: 500 }}>
                  ตำแหน่ง
                </Grid>
                <Grid item xs={8} sx={{ color: "#334155", fontSize: "0.88rem", fontWeight: 600 }}>
                  {studentInfo?.internPosition || "UX/UI Designer"}
                </Grid>

                <Grid item xs={4} sx={{ color: "#64748b", fontSize: "0.85rem", fontWeight: 500 }}>
                  อาจารย์ที่ปรึกษา
                </Grid>
                <Grid item xs={8} sx={{ color: "#334155", fontSize: "0.88rem", fontWeight: 600 }}>
                  {studentInfo?.advisorName || "อ.ชนพล ใจดี"}
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Paper>

        {/* 🟢 การ์ดที่ 2: ประวัติกิจกรรม */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3.5 },
            borderRadius: "20px",
            bgcolor: "#ffffff",
            border: "1px solid #e2e8f0",
          }}
        >
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#1e293b" }}>
              ประวัติกิจกรรม
            </Typography>
            <Typography variant="caption" sx={{ color: "#94a3b8", fontSize: "0.78rem" }}>
              ตรวจดูรายละเอียดการทำงานตามวันที่นักศึกษาบันทึก
            </Typography>
          </Box>

          <TableContainer sx={{ border: "1px solid #f1f5f9", borderRadius: "12px", overflowX: "auto" }}>
            <Table size="medium">
              <TableHead sx={{ bgcolor: "#fafafa" }}>
                <TableRow>
                  <TableCell align="center" sx={{ fontWeight: 700, color: "#64748b", fontSize: "0.82rem", width: 60 }}>
                    ลำดับ
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: "#64748b", fontSize: "0.82rem", width: 130 }}>
                    วันที่
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: "#64748b", fontSize: "0.82rem", width: 100 }}>
                    เวลาเข้า
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: "#64748b", fontSize: "0.82rem", width: 100 }}>
                    เวลาออก
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#64748b", fontSize: "0.82rem" }}>
                    กิจกรรม
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: "#64748b", fontSize: "0.82rem", width: 90 }}>
                    ชั่วโมง
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: "#64748b", fontSize: "0.82rem", width: 140 }}>
                    สถานะ
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <CircularProgress sx={{ color: THEME_GREEN }} />
                    </TableCell>
                  </TableRow>
                ) : displayedTimesheets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 5, color: "#94a3b8" }}>
                      ไม่มีข้อมูลกิจกรรมที่บันทึก
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedTimesheets.map((row, index) => {
                    const checkInFormatted = formatTimeOnly(row.checkInTime);
                    const checkOutFormatted = formatTimeOnly(row.checkOutTime);
                    const hours = calculateWorkingHours(row.checkInTime, row.checkOutTime);

                    return (
                      <TableRow
                        key={row.id || index}
                        hover
                        onClick={() => {
                          setViewData(row);
                          setViewOpen(true);
                        }}
                        sx={{
                          cursor: "pointer",
                          "&:last-child td, &:last-child th": { border: 0 },
                          "& td": { py: 1.8, fontSize: "0.85rem" },
                        }}
                      >
                        <TableCell align="center" sx={{ color: "#64748b" }}>
                          {index + 1}
                        </TableCell>

                        <TableCell align="center" sx={{ color: "#334155", fontWeight: 500 }}>
                          {formatDateDisplay(row.date)}
                        </TableCell>

                        <TableCell align="center" sx={{ color: "#10b981", fontWeight: 700 }}>
                          {checkInFormatted}
                        </TableCell>

                        <TableCell align="center" sx={{ color: "#ef4444", fontWeight: 700 }}>
                          {checkOutFormatted}
                        </TableCell>

                        <TableCell sx={{ color: "#334155" }}>
                          {row.activity || "-"}
                        </TableCell>

                        <TableCell align="center" sx={{ color: "#334155", fontWeight: 600 }}>
                          {hours}
                        </TableCell>

                        <TableCell align="center">
                          <Chip
                            label="บันทึกเรียบร้อย"
                            size="small"
                            sx={{
                              bgcolor: "#e8f5e9",
                              color: "#1b6957",
                              fontWeight: 700,
                              fontSize: "0.75rem",
                              borderRadius: "16px",
                              px: 1,
                              height: 24,
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* 🟢 ปุ่มดูประวัติทั้งหมด */}
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2.5 }}>
            <Button
              variant="outlined"
              onClick={() => setShowAll((prev) => !prev)}
              sx={{
                borderColor: "#cbd5e1",
                color: "#475569",
                borderRadius: "8px",
                px: 3,
                py: 0.6,
                fontWeight: 700,
                fontSize: "0.82rem",
                textTransform: "none",
                "&:hover": { borderColor: THEME_GREEN, color: THEME_GREEN, bgcolor: "#f8fafc" },
              }}
            >
              {showAll ? "ย่อรายการ" : "ดูประวัติทั้งหมด"}
            </Button>
          </Box>
        </Paper>

        {/* Modal แสดงกิจกรรมฉบับเต็มเมื่อคลิกแถว */}
        <Dialog
          open={viewOpen}
          onClose={() => setViewOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: "16px", p: 1 } }}
        >
          <DialogTitle sx={{ fontWeight: 800, color: BRAND_DARK }}>
            รายละเอียดกิจกรรม
          </DialogTitle>
          <DialogContent dividers>
            <Typography variant="body1" sx={{ color: "#334155", whiteSpace: "pre-wrap" }}>
              {viewData?.activity || "ไม่มีข้อมูลกิจกรรม"}
            </Typography>
          </DialogContent>
          <Box sx={{ display: "flex", justifyContent: "flex-end", p: 1.5 }}>
            <Button
              onClick={() => setViewOpen(false)}
              sx={{ color: THEME_GREEN, fontWeight: 700 }}
            >
              ปิด
            </Button>
          </Box>
        </Dialog>
      </Box>
    </Box>
  );
}

export default StudentTimesheetView;
