// src/pages/DocumentScanDashboard.js
import React from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Grid,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Cancel as CancelIcon,
  AccessTime as AccessTimeIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";

// 💡 import ทั้ง 2 รูปภาพจากโฟลเดอร์ assets
import validDocImg from "../assets/exam.png"; // ภาพแรก (เอกสารถูกต้อง)
import invalidDocImg from "../assets/exam_error.png"; // ภาพที่สอง (เอกสารไม่ถูกต้อง - เปลี่ยนชื่อไฟล์ให้ตรงกับในเครื่องของคุณ)

function DocumentScanDashboard() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  // ข้อมูลเช็คลิสต์รายการเอกสาร
  const checklistData = [
    {
      id: 1,
      name: "BA Co-op 01: เอกสารติดต่อสหกิจศึกษา",
      status: "ผ่าน",
      statusType: "success",
      date: "19 มกราคม 2569",
      action: "ดูรายละเอียด",
      actionColor: "#c8e6c9",
      actionTextColor: "#2e7d32",
    },
    {
      id: 2,
      name: "BA Co-op 02-1: หนังสือยินยอมผู้ปกครอง",
      status: "ไม่ผ่าน",
      statusType: "error",
      date: "19 มกราคม 2569",
      action: "แก้ไข",
      actionColor: "#ffe082",
      actionTextColor: "#f57f17",
    },
    {
      id: 3,
      name: "BA Co-op 02-2: ใบสมัครงานสหกิจ",
      status: "ผ่าน",
      statusType: "success",
      date: "19 มกราคม 2569",
      action: "ดูรายละเอียด",
      actionColor: "#c8e6c9",
      actionTextColor: "#2e7d32",
    },
    {
      id: 4,
      name: "BA Co-op 04: รายละเอียดที่พัก",
      status: "รอดำเนินการ",
      statusType: "warning",
      date: "19 มกราคม 2569",
      action: "ยกเลิก",
      actionColor: "#d32f2f",
      actionTextColor: "#ffffff",
    },
    {
      id: 5,
      name: "เอกสารรายงานผลการศึกษา (ฉบับชั่วคราว)",
      status: "ยังไม่ได้ส่ง",
      statusType: "default",
      date: "19 มกราคม 2569",
      action: "อัปโหลด",
      actionColor: "#00423b",
      actionTextColor: "#ffffff",
    },
  ];

  // Render Status Badge ในตาราง
  const renderStatusChip = (status, type) => {
    switch (type) {
      case "success":
        return (
          <Chip
            icon={<CheckCircleIcon sx={{ fontSize: 16, color: "#2e7d32 !important" }} />}
            label={status}
            size="small"
            sx={{ bgcolor: "#e8f5e9", color: "#2e7d32", fontWeight: 600 }}
          />
        );
      case "error":
        return (
          <Chip
            icon={<CancelIcon sx={{ fontSize: 16, color: "#d32f2f !important" }} />}
            label={status}
            size="small"
            sx={{ bgcolor: "#ffebee", color: "#d32f2f", fontWeight: 600 }}
          />
        );
      case "warning":
        return (
          <Chip
            icon={<AccessTimeIcon sx={{ fontSize: 16, color: "#ed6c02 !important" }} />}
            label={status}
            size="small"
            sx={{ bgcolor: "#fff3e0", color: "#ed6c02", fontWeight: 600 }}
          />
        );
      default:
        return (
          <Chip
            icon={<InfoIcon sx={{ fontSize: 16, color: "#757575 !important" }} />}
            label={status}
            size="small"
            sx={{ bgcolor: "#eee", color: "#616161", fontWeight: 600 }}
          />
        );
    }
  };

  return (
    <Box sx={{ display: "flex", bgcolor: "#f8fafc", minHeight: "100vh" }}>
      <Sidebar />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: isSmallScreen ? 2 : 4,
          fontFamily: '"Kanit", sans-serif',
        }}
      >
        {/* Header ส่วนหัวหน้าเว็บ */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 4,
            flexDirection: isSmallScreen ? "column" : "row",
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: "#00423b" }}>
              ระบบสแกนเอกสารก่อนสหกิจศึกษา
            </Typography>
            <Typography variant="body2" sx={{ color: "#666", mt: 0.5 }}>
              ตรวจสอบข้อมูลของท่านให้ครบถ้วน ก่อนออกสหกิจ
            </Typography>
          </Box>

          <Button
          variant="contained"
          startIcon={<DownloadIcon sx={{ color: "#ffffff" }} />}
          onClick={() => navigate("/student/scan-upload")}
            sx={{
               bgcolor: "#007a5e",
               color: "#ffffff",
               borderRadius: 2,
               px: 2.5,
               py: 1,
               fontWeight: 600,
               textTransform: "none",
               boxShadow: "none",
               "&:hover": {
               bgcolor: "#007a5e",
               boxShadow: "none",
              },
           }}
          >
           อัปโหลดเอกสารสหกิจ
        </Button>
        </Box>

        <Typography
          variant="h6"
          align="center"
          sx={{ fontWeight: 700, color: "#333", mb: 3 }}
        >
          เอกสาร
        </Typography>

        {/* 1. ส่วนตัวอย่างเอกสาร ถูกต้อง / ไม่ถูกต้อง */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 3,
            border: "1px solid #e2e8f0",
            bgcolor: "#fff",
          }}
        >
          <Grid container spacing={3}>
            {/* ฝั่งซ้าย: ตัวอย่างเอกสารถูกต้อง (ใช้ภาพแรก) */}
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
                  <CheckCircleIcon sx={{ color: "#10b981", fontSize: 32 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: "#065f46" }}>
                    ตัวอย่างเอกสารถูกต้อง
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: "#6b7280", ml: 5.5 }}>
                  เอกสารของท่านผ่านการตรวจสอบ
                </Typography>
              </Box>

              <Paper
                elevation={0}
                sx={{
                  bgcolor: "#e6f4f1",
                  p: 2,
                  borderRadius: 3,
                  display: "flex",
                  gap: 2,
                  alignItems: "center",
                }}
              >
                <Box
                  component="img"
                  src={validDocImg} // 💡 แสดงรูปภาพฝั่งซ้าย (อันแรก)
                  alt="ตัวอย่างเอกสารถูกต้อง"
                  sx={{
                    width: 110,
                    height: 150,
                    objectFit: "cover",
                    borderRadius: 1,
                    border: "1px solid #cbd5e1",
                    bgcolor: "#fff",
                  }}
                />
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CheckCircleIcon sx={{ color: "#10b981", fontSize: 18 }} />
                    <Typography variant="body2" sx={{ color: "#374151" }}>
                      <strong>ชื่อ-นามสกุล</strong> นาย ศักดิ์สิทธิ์ นัยสุนทร
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CheckCircleIcon sx={{ color: "#10b981", fontSize: 18 }} />
                    <Typography variant="body2" sx={{ color: "#374151" }}>
                      <strong>รหัสนักศึกษา</strong> 6406105322
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CheckCircleIcon sx={{ color: "#10b981", fontSize: 18 }} />
                    <Typography variant="body2" sx={{ color: "#374151" }}>
                      <strong>สาขา</strong> ระบบสารสนเทศทางธุรกิจ
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CheckCircleIcon sx={{ color: "#10b981", fontSize: 18 }} />
                    <Typography variant="body2" sx={{ color: "#374151" }}>
                      <strong>ลายเซ็น</strong> พบลายเซ็น
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CheckCircleIcon sx={{ color: "#10b981", fontSize: 18 }} />
                    <Typography variant="body2" sx={{ color: "#374151" }}>
                      <strong>วันที่</strong> 8 สิงหาคม 2569
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CheckCircleIcon sx={{ color: "#10b981", fontSize: 18 }} />
                    <Typography variant="body2" sx={{ color: "#374151" }}>
                      <strong>เอกสาร</strong> เอกสารครบถ้วน
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>

            {/* ฝั่งขวา: ตัวอย่างเอกสารไม่ถูกต้อง (ใช้ภาพที่สอง) */}
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
                  <ErrorIcon sx={{ color: "#ef4444", fontSize: 32 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: "#991b1b" }}>
                    ตัวอย่างเอกสารไม่ถูกต้อง
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: "#ef4444", ml: 5.5 }}>
                  พบข้อผิดพลาด 2 รายการ กรุณาแก้ไขและอัปโหลดเอกสารใหม่
                </Typography>
              </Box>

              <Paper
                elevation={0}
                sx={{
                  bgcolor: "#fde8e8",
                  p: 2,
                  borderRadius: 3,
                  display: "flex",
                  gap: 2,
                  alignItems: "center",
                }}
              >
                <Box
                  component="img"
                  src={invalidDocImg} // 💡 แสดงรูปภาพฝั่งขวา (อันที่สอง)
                  alt="ตัวอย่างเอกสารไม่ถูกต้อง"
                  sx={{
                    width: 110,
                    height: 150,
                    objectFit: "cover",
                    borderRadius: 1,
                    border: "2px solid #ef4444",
                    bgcolor: "#fff",
                  }}
                />
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                    <ErrorIcon sx={{ color: "#ef4444", fontSize: 28, mt: 0.3 }} />
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#991b1b" }}>
                        ไม่พบลายเซ็นในเอกสาร
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#7f1d1d" }}>
                        กรุณาเซ็นชื่อในเอกสาร
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                    <ErrorIcon sx={{ color: "#ef4444", fontSize: 28, mt: 0.3 }} />
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#991b1b" }}>
                        วันที่หมดอายุ
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#7f1d1d" }}>
                        เอกสารหมดอายุเมื่อ 1/07/2569
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Paper>

        {/* 2. ส่วนเช็คลิสต์เอกสารที่ต้องส่ง */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            border: "1px solid #e2e8f0",
            bgcolor: "#fff",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#00423b", mb: 3 }}>
            ตัวอย่างสถานะและลิสต์เอกสารที่ต้องส่ง
          </Typography>

          <TableContainer>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: "#f8fafc" }}>
                  <TableCell align="center" sx={{ fontWeight: 700, color: "#64748b" }}>
                    ลำดับ
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#64748b" }}>
                    เอกสาร
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: "#64748b" }}>
                    สถานะ
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: "#64748b" }}>
                    วันที่ส่ง
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: "#64748b" }}>
                    ดำเนินการ
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {checklistData.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell align="center" sx={{ color: "#475569" }}>
                      {row.id}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500, color: "#334155" }}>
                      {row.name}
                    </TableCell>
                    <TableCell align="center">
                      {renderStatusChip(row.status, row.statusType)}
                    </TableCell>
                    <TableCell align="center" sx={{ color: "#64748b", fontSize: "0.875rem" }}>
                      {row.date}
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        onClick={() => {
                          if (row.action === "อัปโหลด" || row.action === "แก้ไข") {
                            navigate("/student/scan-upload");
                          }
                        }}
                        sx={{
                          bgcolor: row.actionColor,
                          color: row.actionTextColor,
                          borderRadius: 2,
                          px: 2,
                          py: 0.5,
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          textTransform: "none",
                          "&:hover": {
                            bgcolor: row.actionColor,
                            opacity: 0.9,
                          },
                        }}
                      >
                        {row.action}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Box>
  );
}

export default DocumentScanDashboard;