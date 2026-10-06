// src/pages/Admin/AdminStudentDocForm.js
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Switch,
  Checkbox,
  FormControlLabel,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  CloudUpload as CloudUploadIcon,
  PictureAsPdf as PdfIcon,
} from "@mui/icons-material";

import Sidebar from "../../components/Sidebar";

const BRAND_DARK = "#134e4a";
const THEME_GREEN = "#1b6957";
const THEME_HOVER = "#134e4a";

function AdminStudentDocForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  // รับข้อมูลกรณีคลิก "แก้ไข" จากหน้ารายการ
  const editingDoc = location.state?.doc || null;

  // ฟอร์มข้อมูลฝั่งซ้าย
  const [docName, setDocName] = useState(editingDoc?.name || "เอกสารตอบกลับ");
  const [description, setDescription] = useState(
    editingDoc?.description || "เอกสารตอบรับจากสถานประกอบการ"
  );
  const [currentFile, setCurrentFile] = useState(
    editingDoc
      ? { name: editingDoc.fileName || "company-reply.pdf", size: "2.4 MB" }
      : { name: "company-reply.pdf", size: "2.4 MB" }
  );
  const [maxSize, setMaxSize] = useState("10");

  // รูปแบบไฟล์ที่อนุญาต
  const [allowedFormats, setAllowedFormats] = useState({
    pdf: true,
    jpg: true,
    png: true,
  });

  // การตั้งค่าฝั่งขวา
  const [isRequired, setIsRequired] = useState(true);
  const [isActive, setIsActive] = useState(true);

  const handleFormatChange = (field) => {
    setAllowedFormats((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setCurrentFile({
        name: file.name,
        size: `${fileSizeMB} MB`,
        rawFile: file,
      });
    }
  };

  const handleRemoveFile = () => {
    setCurrentFile(null);
  };

  const handleSave = () => {
    if (!docName.trim()) {
      Swal.fire({
        title: "กรุณากรอกข้อมูล",
        text: "ชื่อเอกสารต้องไม่เป็นค่าว่าง",
        icon: "warning",
        confirmButtonColor: THEME_GREEN,
      });
      return;
    }

    Swal.fire({
      title: "บันทึกสำเร็จ",
      text: "ข้อมูลเอกสารถูกบันทึกเรียบร้อยแล้ว",
      icon: "success",
      confirmButtonColor: THEME_GREEN,
      timer: 1500,
      showConfirmButton: false,
    }).then(() => {
      navigate("/admin/student-docs");
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
        {/* ลิงก์กลับไปหน้ารายการ */}
        <Box
          onClick={() => navigate("/admin/student-docs")}
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
          กลับไปหน้ารายการ
        </Box>

        {/* หัวข้อหน้า */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h4"
            sx={{ fontWeight: 800, color: BRAND_DARK, letterSpacing: -0.5 }}
          >
            เพิ่ม / แก้ไขเอกสารสำหรับนักศึกษา
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b", mt: 0.5 }}>
            กำหนดรายละเอียดและอัปโหลดไฟล์ต้นแบบเพื่อให้นักศึกษาดาวน์โหลดไปใช้งาน
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* 🟢 คอลัมน์ฝั่งซ้าย: ข้อมูลเอกสาร */}
          <Grid item xs={12} md={8}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.5, sm: 3.5 },
                borderRadius: "20px",
                bgcolor: "#ffffff",
                border: "1px solid #e2e8f0",
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#1e293b", mb: 2.5 }}>
                ข้อมูลเอกสาร
              </Typography>

              {/* ชื่อเอกสาร */}
              <Box sx={{ mb: 2.5 }}>
                <Typography variant="caption" sx={{ display: "block", fontWeight: 700, color: "#475569", mb: 0.8 }}>
                  ชื่อเอกสาร *
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder="ระบุชื่อเอกสาร..."
                  sx={{
                    "& .MuiOutlinedInput-root": { borderRadius: "10px", bgcolor: "#ffffff" },
                  }}
                />
              </Box>

              {/* คำอธิบาย */}
              <Box sx={{ mb: 2.5 }}>
                <Typography variant="caption" sx={{ display: "block", fontWeight: 700, color: "#475569", mb: 0.8 }}>
                  คำอธิบาย
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="ระบุคำอธิบายเพิ่มเติม..."
                  sx={{
                    "& .MuiOutlinedInput-root": { borderRadius: "10px", bgcolor: "#ffffff" },
                  }}
                />
              </Box>

              {/* อัปโหลดไฟล์ต้นแบบ (Dropzone) */}
              <Box sx={{ mb: 2.5 }}>
                <Typography variant="caption" sx={{ display: "block", fontWeight: 700, color: "#475569", mb: 0.8 }}>
                  ไฟล์ต้นแบบ *
                </Typography>
                <Box
                  component="label"
                  sx={{
                    border: "2px dashed #cbd5e1",
                    borderRadius: "14px",
                    p: 4,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    bgcolor: "#fafafa",
                    transition: "all 0.2s",
                    "&:hover": { bgcolor: "#f1f5f9", borderColor: THEME_GREEN },
                  }}
                >
                  <input
                    type="file"
                    hidden
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                  />
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      bgcolor: "#e6f4ea",
                      color: THEME_GREEN,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mb: 1.5,
                    }}
                  >
                    <CloudUploadIcon sx={{ fontSize: 26 }} />
                  </Box>
                  <Button
                    variant="outlined"
                    component="span"
                    size="small"
                    sx={{
                      borderColor: THEME_GREEN,
                      color: THEME_GREEN,
                      fontWeight: 700,
                      borderRadius: "8px",
                      textTransform: "none",
                      px: 2.5,
                      mb: 1,
                      pointerEvents: "none",
                    }}
                  >
                    เลือกไฟล์
                  </Button>
                  <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                    รองรับไฟล์ JPG, PNG (ขนาดไม่เกิน 10 MB)
                  </Typography>
                </Box>
              </Box>

              {/* ไฟล์ปัจจุบัน */}
              {currentFile && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="caption" sx={{ display: "block", fontWeight: 700, color: "#475569", mb: 0.8 }}>
                    ไฟล์ปัจจุบัน
                  </Typography>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.8,
                      px: 2.5,
                      borderRadius: "10px",
                      bgcolor: "#f8fafc",
                      border: "1px solid #f1f5f9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                      <PdfIcon sx={{ color: "#38bdf8", fontSize: 20 }} />
                      <Typography variant="body2" sx={{ color: "#0284c7", fontWeight: 600, fontSize: "0.85rem" }}>
                        {currentFile.name}
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                        {currentFile.size}
                      </Typography>
                      <Typography
                        component="button"
                        onClick={handleRemoveFile}
                        sx={{
                          border: "none",
                          background: "none",
                          color: "#ef4444",
                          fontWeight: 700,
                          fontSize: "0.8rem",
                          cursor: "pointer",
                          p: 0,
                          "&:hover": { textDecoration: "underline" },
                        }}
                      >
                        ลบไฟล์
                      </Typography>
                    </Box>
                  </Paper>
                </Box>
              )}

              {/* ขนาดไฟล์สูงสุด + รูปแบบไฟล์ที่อนุญาต */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ display: "block", fontWeight: 700, color: "#475569", mb: 0.8 }}>
                    ขนาดไฟล์สูงสุด (MB) *
                  </Typography>
                  <TextField
                    size="small"
                    value={maxSize}
                    onChange={(e) => setMaxSize(e.target.value)}
                    sx={{
                      width: "100%",
                      "& .MuiOutlinedInput-root": { borderRadius: "10px", bgcolor: "#ffffff" },
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ display: "block", fontWeight: 700, color: "#475569", mb: 0.8 }}>
                    รูปแบบไฟล์ที่อนุญาต
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, pt: 0.5 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={allowedFormats.pdf}
                          onChange={() => handleFormatChange("pdf")}
                          sx={{ color: THEME_GREEN, "&.Mui-checked": { color: THEME_GREEN } }}
                        />
                      }
                      label={<Typography variant="body2" sx={{ fontSize: "0.85rem", fontWeight: 600 }}>PDF</Typography>}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={allowedFormats.jpg}
                          onChange={() => handleFormatChange("jpg")}
                          sx={{ color: THEME_GREEN, "&.Mui-checked": { color: THEME_GREEN } }}
                        />
                      }
                      label={<Typography variant="body2" sx={{ fontSize: "0.85rem", fontWeight: 600 }}>JPG</Typography>}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={allowedFormats.png}
                          onChange={() => handleFormatChange("png")}
                          sx={{ color: THEME_GREEN, "&.Mui-checked": { color: THEME_GREEN } }}
                        />
                      }
                      label={<Typography variant="body2" sx={{ fontSize: "0.85rem", fontWeight: 600 }}>PNG</Typography>}
                    />
                  </Box>
                </Grid>
              </Grid>

              {/* ปุ่มยกเลิก / บันทึก */}
              <Box sx={{ display: "flex", gap: 1.5 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate("/admin/student-docs")}
                  sx={{
                    borderRadius: "10px",
                    borderColor: "#cbd5e1",
                    color: "#475569",
                    px: 3.5,
                    py: 0.8,
                    fontWeight: 700,
                    textTransform: "none",
                    "&:hover": { borderColor: "#94a3b8", bgcolor: "#f8fafc" },
                  }}
                >
                  ยกเลิก
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSave}
                  sx={{
                    borderRadius: "10px",
                    bgcolor: THEME_GREEN,
                    color: "#ffffff",
                    px: 3.5,
                    py: 0.8,
                    fontWeight: 700,
                    textTransform: "none",
                    boxShadow: "none",
                    "&:hover": { bgcolor: THEME_HOVER, boxShadow: "none" },
                  }}
                >
                  บันทึก
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* 🟢 คอลัมน์ฝั่งขวา: การตั้งค่า + พรีวิวสิ่งที่นักศึกษาจะเห็น */}
          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.5, sm: 3 },
                borderRadius: "20px",
                bgcolor: "#ffffff",
                border: "1px solid #e2e8f0",
                display: "flex",
                flexDirection: "column",
                gap: 2.5,
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#1e293b" }}>
                การตั้งค่า
              </Typography>

              {/* บังคับให้นักศึกษาอัปโหลด */}
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: "#334155", fontSize: "0.85rem" }}>
                  บังคับให้นักศึกษาอัปโหลด
                </Typography>
                <Switch
                  checked={isRequired}
                  onChange={(e) => setIsRequired(e.target.checked)}
                  sx={{
                    "& .MuiSwitch-switchBase.Mui-checked": { color: THEME_GREEN },
                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: THEME_GREEN },
                  }}
                />
              </Box>

              {/* เปิดใช้งานเอกสาร */}
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: "#334155", fontSize: "0.85rem" }}>
                  เปิดใช้งานเอกสาร
                </Typography>
                <Switch
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  sx={{
                    "& .MuiSwitch-switchBase.Mui-checked": { color: THEME_GREEN },
                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: THEME_GREEN },
                  }}
                />
              </Box>

              {/* ตัวอย่างสิ่งที่นักศึกษาจะเห็น */}
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "#64748b", display: "block", mb: 1 }}>
                  สิ่งที่นักศึกษาจะเห็น
                </Typography>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: "14px",
                    bgcolor: "#fafafa",
                    border: "1px solid #f1f5f9",
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#1e293b", fontSize: "0.88rem" }}>
                    4 {docName || "เอกสารตอบรับ"}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#94a3b8", display: "block", mb: 1.5 }}>
                    ไฟล์ต้นแบบ: {currentFile?.name || "ไม่มีไฟล์"}
                  </Typography>

                  <Button
                    fullWidth
                    variant="contained"
                    size="small"
                    sx={{
                      bgcolor: THEME_GREEN,
                      color: "#ffffff",
                      borderRadius: "8px",
                      py: 0.6,
                      fontWeight: 700,
                      fontSize: "0.8rem",
                      textTransform: "none",
                      boxShadow: "none",
                      "&:hover": { bgcolor: THEME_HOVER, boxShadow: "none" },
                    }}
                  >
                    ดาวน์โหลด
                  </Button>
                </Paper>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

export default AdminStudentDocForm;