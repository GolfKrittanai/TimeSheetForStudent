// src/pages/DocumentScanDashboard.js
import React from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  CloudUpload as CloudUploadIcon,
  HistoryOutlined as HistoryIcon,
  Check as CheckIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";

function DocumentScanDashboard() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box sx={{ display: "flex", bgcolor: "#ffffff", minHeight: "100vh" }}>
      <Sidebar />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: isSmallScreen ? 3 : 5,
          fontFamily: '"Kanit", sans-serif',
        }}
      >
        {/* Header Section */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: "#0a3b2c",
              mb: 1,
              fontSize: isSmallScreen ? "1.6rem" : "2.1rem",
            }}
          >
            ระบบสแกนเอกสารก่อนสหกิจศึกษา
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: "#8a94a6", fontSize: "0.95rem" }}
          >
            ตรวจสอบความถูกต้องของเอกสารด้วย AI ก่อนเข้าสู่ระบบสหกิจศึกษา
          </Typography>
        </Box>

        {/* Section Title */}
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, color: "#0a3b2c", mb: 2.5, fontSize: "1.1rem" }}
        >
          อัปโหลดเอกสาร
        </Typography>

        {/* Action & Info Cards Grid */}
        <Grid container spacing={3}>
          {/* Card 1: อัปโหลดเอกสารใหม่ */}
          <Grid item xs={12} md={4}>
            <Paper
              variant="outlined"
              sx={{
                p: 3.5,
                borderRadius: 4,
                borderColor: "#e2e8f0",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                minHeight: 250,
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 700, color: "#0a3b2c", mb: 0.5, fontSize: "1.1rem" }}
              >
                อัปโหลดเอกสารใหม่
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "#94a3b8", mb: 2.5, fontSize: "0.85rem" }}
              >
                ตรวจสอบเอกสารของคุณทันที
              </Typography>

              {/* ไอคอน Cloud Upload สีตามภาพตัวอย่าง */}
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  bgcolor: "#dcfce7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#166534",
                  mb: 3,
                }}
              >
                <CloudUploadIcon sx={{ fontSize: 30 }} />
              </Box>

              <Button
                variant="contained"
                onClick={() => navigate("/student/scan-upload")}
                sx={{
                  bgcolor: "#05a863",
                  color: "#ffffff",
                  borderRadius: 2.5,
                  px: 3.5,
                  py: 1,
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  textTransform: "none",
                  boxShadow: "none",
                  "&:hover": {
                    bgcolor: "#048a51",
                    boxShadow: "none",
                  },
                }}
              >
                อัปโหลดเอกสาร
              </Button>
            </Paper>
          </Grid>

          {/* Card 2: ประวัติ */}
          <Grid item xs={12} md={4}>
            <Paper
              variant="outlined"
              sx={{
                p: 3.5,
                borderRadius: 4,
                borderColor: "#e2e8f0",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                minHeight: 250,
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 700, color: "#0a3b2c", mb: 0.5, fontSize: "1.1rem" }}
              >
                ประวัติ
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "#94a3b8", mb: 2.5, fontSize: "0.85rem" }}
              >
                ดูประวัติและสถานะเอกสาร
              </Typography>

              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  bgcolor: "#dcfce7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#166534",
                  mb: 3,
                }}
              >
                <HistoryIcon sx={{ fontSize: 28 }} />
              </Box>

              <Button
                variant="outlined"
                onClick={() => navigate("/student/history")}
                sx={{
                  color: "#05a863",
                  borderColor: "#05a863",
                  borderRadius: 2.5,
                  px: 4,
                  py: 0.8,
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  textTransform: "none",
                  "&:hover": {
                    borderColor: "#048a51",
                    bgcolor: "#f0fdf4",
                  },
                }}
              >
                ดูประวัติ
              </Button>
            </Paper>
          </Grid>

          {/* Card 3: เคล็ดลับการอัปโหลดเอกสาร */}
          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 3.5,
                borderRadius: 4,
                bgcolor: "#fffdf0",
                border: "1px solid #fef3c7",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                minHeight: 250,
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 700, color: "#854d0e", mb: 2.5, fontSize: "1rem" }}
              >
                เคล็ดลับการอัปโหลดเอกสาร
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.8 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                  <CheckIcon sx={{ fontSize: 18, color: "#64748b" }} />
                  <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.85rem" }}>
                    เอกสารต้องชัดเจนและไม่เบลอ
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                  <CheckIcon sx={{ fontSize: 18, color: "#64748b" }} />
                  <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.85rem" }}>
                    ข้อมูลครบถ้วน ไม่ถูกตัดขอบ
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                  <CheckIcon sx={{ fontSize: 18, color: "#64748b" }} />
                  <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.85rem" }}>
                    รองรับ JPG, PNG ไม่เกิน 10 MB
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

export default DocumentScanDashboard;