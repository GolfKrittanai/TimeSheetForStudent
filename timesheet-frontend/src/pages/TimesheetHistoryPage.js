// src/pages/TimesheetHistoryPage.js
import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
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
  Paper,
  TableContainer,
  Button,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon, // 🟢 เปลี่ยนมาใช้ ArrowBack แบบภาพฝั่งซ้าย
  FileDownloadOutlined as FileDownloadIcon,
} from "@mui/icons-material";
import { getMyTimeSheets } from "../services/timesheetService";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";
import Sidebar from "../components/Sidebar";

const BRAND_DARK = "#134e4a";
const THEME_GREEN = "#1b6957";
const THEME_HOVER = "#134e4a";

function TimesheetHistoryPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [timeSheets, setTimeSheets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState(null);

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getMyTimeSheets(token);
      const data = Array.isArray(res) ? res : res?.data || [];
      setTimeSheets(data);
    } catch {
      Swal.fire({
        title: "ผิดพลาด",
        text: "ไม่สามารถโหลดประวัติกิจกรรมได้",
        icon: "error",
        confirmButtonColor: THEME_GREEN,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    return hours > 0 ? hours : 8;
  };

  // จัดฟอร์แมตเวลา เช่น 08 : 00 PM
  const formatTimeDisplay = (timeStr) => {
    if (!timeStr) return "-";
    const rawTime = timeStr.includes("T") ? timeStr.slice(11, 16) : timeStr.slice(0, 5);
    const [hStr, mStr] = rawTime.split(":");
    let h = parseInt(hStr, 10);
    const period = h >= 12 ? "PM" : "AM";
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    const formattedH = String(h).padStart(2, "0");
    return `${formattedH} : ${mStr} ${period}`;
  };

  // จัดรูปแบบวันที่ภาษาไทย ปี พ.ศ. เช่น 19 ก.ย. 2568
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

  const handleExport = () => {
    Swal.fire({
      title: "Export ข้อมูล",
      text: "ระบบกำลังเตรียมไฟล์สำหรับส่งออก...",
      icon: "info",
      confirmButtonColor: THEME_GREEN,
    });
  };

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
        {/* 🟢 ปุ่มย้อนกลับแบบรูปฝั่งซ้าย (วางไว้บนสุด เหนือหัวข้อหลัก) */}
        <Button
          onClick={() => navigate("/student")}
          startIcon={<ArrowBackIcon sx={{ fontSize: "1.1rem !important" }} />}
          sx={{
            color: BRAND_DARK,
            fontWeight: 700,
            fontSize: "0.95rem",
            p: 0,
            mb: 1.5,
            textTransform: "none",
            bgcolor: "transparent",
            "&:hover": {
              bgcolor: "transparent",
              color: THEME_GREEN,
              textDecoration: "underline",
            },
          }}
        >
          กลับไปหน้าบันทึกกิจกรรม
        </Button>

        {/* หัวข้อด้านบน */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h4"
            sx={{ fontWeight: 800, color: BRAND_DARK, letterSpacing: -0.5 }}
          >
            รายละเอียดบันทึกกิจกรรมนักศึกษา
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 500, mt: 0.5 }}>
            ตรวจสอบกิจกรรมรายวัน เวลาเข้า-ออก และข้อมูลการทำงานของนักศึกษา
          </Typography>
        </Box>

        {/* แถบหัวข้อ ประวัติกิจกรรม + ปุ่ม Export */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
            flexWrap: "wrap",
            gap: 1.5,
          }}
        >
          <Typography
            variant="h6"
            sx={{ fontWeight: 800, color: BRAND_DARK, fontSize: "1.2rem" }}
          >
            ประวัติการกิจกรรม
          </Typography>

          {/* ปุ่ม Export */}
          <Button
            variant="contained"
            onClick={handleExport}
            startIcon={<FileDownloadIcon sx={{ fontSize: "1.1rem !important" }} />}
            sx={{
              bgcolor: THEME_GREEN,
              color: "#ffffff",
              borderRadius: "8px",
              px: 3.5,
              py: 0.75,
              fontWeight: 700,
              fontSize: "0.9rem",
              textTransform: "none",
              boxShadow: "none",
              "&:hover": { bgcolor: THEME_HOVER, boxShadow: "none" },
            }}
          >
            Export
          </Button>
        </Box>

        {/* ตารางแสดงข้อมูล */}
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            overflowX: "auto",
            bgcolor: "#ffffff",
          }}
        >
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 8 }}>
              <CircularProgress sx={{ color: THEME_GREEN }} />
            </Box>
          ) : timeSheets.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 8, color: "#94a3b8" }}>
              <Typography variant="body1">ยังไม่มีประวัติกิจกรรม</Typography>
            </Box>
          ) : (
            <Table size="medium">
              <TableHead sx={{ bgcolor: THEME_GREEN }}>
                <TableRow>
                  <TableCell align="center" sx={{ color: "#ffffff", fontWeight: 700, fontSize: "0.85rem", width: "70px" }}>
                    ลำดับ
                  </TableCell>
                  <TableCell align="center" sx={{ color: "#ffffff", fontWeight: 700, fontSize: "0.85rem", width: "130px" }}>
                    วันที่
                  </TableCell>
                  <TableCell align="center" sx={{ color: "#ffffff", fontWeight: 700, fontSize: "0.85rem", width: "130px" }}>
                    เวลาเข้า
                  </TableCell>
                  <TableCell align="center" sx={{ color: "#ffffff", fontWeight: 700, fontSize: "0.85rem", width: "130px" }}>
                    เวลาออก
                  </TableCell>
                  <TableCell sx={{ color: "#ffffff", fontWeight: 700, fontSize: "0.85rem" }}>
                    กิจกรรม
                  </TableCell>
                  <TableCell align="center" sx={{ color: "#ffffff", fontWeight: 700, fontSize: "0.85rem", width: "140px" }}>
                    ชั่วโมงการทำงาน
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {timeSheets.map((row, index) => {
                  const checkInFormatted = formatTimeDisplay(row.checkInTime);
                  const checkOutFormatted = formatTimeDisplay(row.checkOutTime);
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
                        "& td": { py: 1.8, fontSize: "0.88rem" },
                      }}
                    >
                      <TableCell align="center" sx={{ color: "#64748b", fontWeight: 500 }}>
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

                      <TableCell sx={{ color: "#334155", fontWeight: 500 }}>
                        {row.activity || "-"}
                      </TableCell>

                      <TableCell align="center" sx={{ color: "#334155", fontWeight: 600 }}>
                        {hours}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </TableContainer>

        {/* Modal ดูกิจกรรมเต็ม */}
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

export default TimesheetHistoryPage;