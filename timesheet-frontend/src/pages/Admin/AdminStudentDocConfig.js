// src/pages/Admin/AdminStudentDocConfig.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Description as DescriptionIcon,
  Add as AddIcon,
  PictureAsPdf as PdfIcon,
} from "@mui/icons-material";

import Sidebar from "../../components/Sidebar";

const BRAND_DARK = "#134e4a";
const THEME_GREEN = "#1b6957";
const THEME_HOVER = "#134e4a";

function AdminStudentDocConfig() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  // ข้อมูลตั้งต้นตามภาพตัวอย่าง UI
  const [docList, setDocList] = useState([
    {
      id: 1,
      name: "ใบขอความอนุเคราะห์รับนักศึกษา",
      fileName: "student-request.pdf",
      fileUrl: "#",
      format: "PDF/JPG/PNG",
      maxSize: "10 MB",
      status: "เปิดใช้งาน",
    },
    {
      id: 2,
      name: "เอกสาร BA Co-op 02-2",
      fileName: "BA-Coop-02-2.pdf",
      fileUrl: "#",
      format: "PDF/JPG/PNG",
      maxSize: "10 MB",
      status: "เปิดใช้งาน",
    },
    {
      id: 3,
      name: "ผลการศึกษาฉบับ (ชั่วคราว)",
      fileName: "transcript-template.pdf",
      fileUrl: "#",
      format: "PDF/JPG/PNG",
      maxSize: "10 MB",
      status: "เปิดใช้งาน",
    },
    {
      id: 4,
      name: "เอกสารตอบรับ",
      fileName: "company-reply.pdf",
      fileUrl: "#",
      format: "PDF/JPG/PNG",
      maxSize: "10 MB",
      status: "เปิดใช้งาน",
    },
  ]);

  // 🟢 เมื่อกดปุ่ม "+ เพิ่มเอกสาร" ให้เด้งไปหน้า AdminStudentDocForm
  const handleOpenAdd = () => {
    navigate("/admin/student-docs/new");
  };

  // 🟢 เมื่อกดปุ่ม "แก้ไข" ให้เด้งไปหน้า AdminStudentDocForm พร้อมส่งข้อมูลเอกสารไปด้วย
  const handleOpenEdit = (item) => {
    navigate("/admin/student-docs/edit", { state: { doc: item } });
  };

  const handleDelete = (id, name) => {
    Swal.fire({
      title: "ยืนยันการลบ?",
      text: `ต้องการลบเอกสาร "${name}" หรือไม่?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
    }).then((res) => {
      if (res.isConfirmed) {
        setDocList((prev) => prev.filter((item) => item.id !== id));
        Swal.fire({
          title: "ลบข้อมูลสำเร็จ",
          icon: "success",
          confirmButtonColor: THEME_GREEN,
          timer: 1500,
          showConfirmButton: false,
        });
      }
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
        {/* หัวข้อด้านบน */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="caption"
            sx={{ color: "#00796b", fontWeight: 700, fontSize: "0.95rem", letterSpacing: 0.5 }}
          >
            Management data
          </Typography>
          <Typography
            variant="h4"
            sx={{ fontWeight: 800, color: BRAND_DARK, mt: 0.5, letterSpacing: -0.5 }}
          >
            จัดการเอกสารสำหรับนักศึกษา
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b", mt: 0.5 }}>
            อัปโหลดและกำหนดเอกสารต้นแบบที่นักศึกษาต้องใช้ในขั้นตอนสหกิจศึกษา
          </Typography>
        </Box>

        {/* แบนเนอร์: ตรวจสอบเอกสารนักศึกษา พร้อมปุ่มตรวจสอบ */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3 },
            mb: 4,
            borderRadius: "20px",
            bgcolor: "#e8f5e9",
            border: "1px solid #c8e6c9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
            <Box
              sx={{
                width: 54,
                height: 54,
                borderRadius: "14px",
                bgcolor: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              <DescriptionIcon sx={{ fontSize: 34, color: THEME_GREEN }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: BRAND_DARK, fontSize: "1.05rem" }}>
                ตรวจสอบเอกสารนักศึกษา
              </Typography>
              <Typography variant="body2" sx={{ color: "#52796f", fontSize: "0.85rem" }}>
                รายชื่อนักศึกษาแนบเอกสาร
              </Typography>
            </Box>
          </Box>

          <Button
            variant="contained"
            onClick={() => navigate("/admin/student-doc-reviews")}
            sx={{
              bgcolor: THEME_GREEN,
              color: "#ffffff",
              borderRadius: "24px",
              px: 4,
              py: 1.1,
              fontWeight: 700,
              fontSize: "0.95rem",
              textTransform: "none",
              boxShadow: "none",
              "&:hover": { bgcolor: THEME_HOVER, boxShadow: "none" },
            }}
          >
            ตรวจสอบ
          </Button>
        </Paper>

        {/* การ์ดรายการเอกสาร */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3.5 },
            borderRadius: "20px",
            bgcolor: "#ffffff",
            border: "1px solid #e2e8f0",
          }}
        >
          {/* Header รายการเอกสาร + ปุ่มเพิ่มเอกสาร */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2.5,
              flexWrap: "wrap",
              gap: 1.5,
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: "#1e293b", fontSize: "1.1rem" }}>
                รายการเอกสาร
              </Typography>
              <Typography variant="caption" sx={{ color: "#94a3b8", fontSize: "0.8rem" }}>
                เอกสาร {docList.length} รายการที่แสดงในฝั่งนักศึกษา
              </Typography>
            </Box>

            {/* 🟢 กดเพื่อไปหน้าฟอร์มเพิ่มเอกสารใหม่ */}
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenAdd}
              sx={{
                bgcolor: THEME_GREEN,
                color: "#ffffff",
                borderRadius: "10px",
                px: 2.5,
                py: 0.9,
                fontWeight: 700,
                fontSize: "0.88rem",
                textTransform: "none",
                boxShadow: "none",
                "&:hover": { bgcolor: THEME_HOVER, boxShadow: "none" },
              }}
            >
              เพิ่มเอกสาร
            </Button>
          </Box>

          {/* ตารางแสดงรายการเอกสาร */}
          <TableContainer sx={{ border: "1px solid #f1f5f9", borderRadius: "12px", overflowX: "auto" }}>
            <Table size="medium">
              <TableHead sx={{ bgcolor: "#f8fafc" }}>
                <TableRow>
                  <TableCell align="center" sx={{ fontWeight: 700, color: "#64748b", fontSize: "0.82rem", width: 70 }}>
                    ลำดับ
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#64748b", fontSize: "0.82rem" }}>
                    ชื่อเอกสาร
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#64748b", fontSize: "0.82rem" }}>
                    ไฟล์ต้นฉบับ
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#64748b", fontSize: "0.82rem" }}>
                    รูปแบบ
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#64748b", fontSize: "0.82rem" }}>
                    ขนาดสูงสุด
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: "#64748b", fontSize: "0.82rem" }}>
                    สถานะ
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: "#64748b", fontSize: "0.82rem", width: 140 }}>
                    จัดการ
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {docList.map((row, index) => (
                  <TableRow
                    key={row.id}
                    hover
                    sx={{
                      "&:last-child td, &:last-child th": { border: 0 },
                      "& td": { py: 1.8, fontSize: "0.88rem" },
                    }}
                  >
                    <TableCell align="center" sx={{ color: "#64748b", fontWeight: 600 }}>
                      {index + 1}
                    </TableCell>

                    <TableCell sx={{ fontWeight: 600, color: "#334155" }}>
                      {row.name}
                    </TableCell>

                    <TableCell>
                      <Box
                        component="a"
                        href={row.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 0.8,
                          color: "#0284c7",
                          textDecoration: "none",
                          fontSize: "0.85rem",
                          fontWeight: 500,
                          "&:hover": { textDecoration: "underline" },
                        }}
                      >
                        <PdfIcon sx={{ fontSize: 18, color: "#38bdf8" }} />
                        {row.fileName}
                      </Box>
                    </TableCell>

                    <TableCell sx={{ color: "#64748b" }}>
                      {row.format}
                    </TableCell>

                    <TableCell sx={{ color: "#64748b" }}>
                      {row.maxSize}
                    </TableCell>

                    <TableCell align="center">
                      <Chip
                        label={row.status}
                        size="small"
                        sx={{
                          bgcolor: "#dcfce7",
                          color: "#15803d",
                          fontWeight: 700,
                          fontSize: "0.78rem",
                          borderRadius: "16px",
                          px: 1.2,
                          height: 26,
                        }}
                      />
                    </TableCell>

                    <TableCell align="center">
                      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 1.5 }}>
                        {/* 🟢 กดเพื่อไปหน้าฟอร์มแก้ไขเอกสาร */}
                        <Typography
                          component="button"
                          onClick={() => handleOpenEdit(row)}
                          sx={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#475569",
                            fontSize: "0.82rem",
                            fontWeight: 600,
                            p: 0,
                            "&:hover": { color: THEME_GREEN, textDecoration: "underline" },
                          }}
                        >
                          แก้ไข
                        </Typography>
                        <Typography
                          component="button"
                          onClick={() => handleDelete(row.id, row.name)}
                          sx={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#ef4444",
                            fontSize: "0.82rem",
                            fontWeight: 600,
                            p: 0,
                            "&:hover": { color: "#b91c1c", textDecoration: "underline" },
                          }}
                        >
                          ลบ
                        </Typography>
                      </Box>
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

export default AdminStudentDocConfig;