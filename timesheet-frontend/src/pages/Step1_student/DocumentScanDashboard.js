import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  useMediaQuery,
  useTheme,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  CloudUpload as CloudUploadIcon,
  HistoryOutlined as HistoryIcon,
  CheckCircleOutline as CheckCircleIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import { getUserDocumentHistory } from "../../services/documentScanService";

// สีหลักให้ตรงกับ Sidebar และหน้า DocumentSummary
const BRAND_DARK = "#00423b";
const BRAND_GREEN = "#10b981";

function DocumentScanDashboard() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [loading, setLoading] = useState(false);
  const [openEmptyAlert, setOpenEmptyAlert] = useState(false);

  const getCurrentUserId = () => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    return storedUser.id || storedUser.userId || 1;
  };

  const handleHistoryClick = async () => {
    try {
      setLoading(true);
      const userId = getCurrentUserId();
      const res = await getUserDocumentHistory(userId);
      const historyData = Array.isArray(res) ? res : res?.data || res?.documents || [];

      if (!historyData || historyData.length === 0) {
        setOpenEmptyAlert(true);
        return;
      }

      const uploadedCategories = new Set(historyData.map((item) => item.docCategory));

      if (uploadedCategories.size >= 5) {
        navigate("/student/scan-summary");
      } else {
        navigate("/student/scan-upload");
      }
    } catch (error) {
      console.error("Error fetching history:", error);
      alert("เกิดข้อผิดพลาดในการดึงข้อมูลประวัติ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: "flex", bgcolor: "#f8fafc", minHeight: "100vh" }}>
      <Sidebar />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: isSmallScreen ? 2.5 : 4,
          fontFamily: '"Kanit", sans-serif',
        }}
      >
        {/* Header Section */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: BRAND_DARK,
              mb: 0.5,
              fontSize: isSmallScreen ? "1.5rem" : "2rem",
            }}
          >
            ขั้นตอนที่ 1 การแนบเอกสารสหกิจ
          </Typography>
          <Typography variant="body1" sx={{ color: "#64748b", fontSize: "0.95rem" }}>
            อัปโหลดเอกสารสหกิจของคุณและตรวจสอบสถานะการอนุมัติได้ที่นี่
          </Typography>
        </Box>

        <Typography variant="h6" sx={{ fontWeight: 700, color: BRAND_DARK, mb: 2.5, fontSize: "1.1rem" }}>
          บริการทั้งหมด
        </Typography>

        <Grid container spacing={3}>
          {/* Card 1: อัปโหลดเอกสาร */}
          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 3.5,
                borderRadius: 4,
                border: "1px solid #e2e8f0",
                bgcolor: "#ffffff",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                minHeight: 260,
                transition: "all 0.25s ease-in-out",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 12px 24px rgba(0, 66, 59, 0.08)",
                  borderColor: BRAND_DARK,
                },
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: BRAND_DARK, mb: 0.5, fontSize: "1.1rem" }}>
                อัปโหลดเอกสารสหกิจ
              </Typography>
              <Typography variant="body2" sx={{ color: "#94a3b8", mb: 2.5, fontSize: "0.85rem" }}>
                ตรวจสอบเอกสารของคุณทันทีด้วยระบบสแกน
              </Typography>

              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  bgcolor: "#dcfce7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#166534",
                  mb: 3,
                }}
              >
                <CloudUploadIcon sx={{ fontSize: 32 }} />
              </Box>

              <Button
                variant="contained"
                onClick={() => navigate("/student/scan-upload")}
                sx={{
                  bgcolor: "#007a5e",
                  color: "#ffffff",
                  borderRadius: 2.5,
                  px: 4,
                  py: 1,
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  textTransform: "none",
                  boxShadow: "none",
                  "&:hover": {
                    bgcolor: "#0b2b26",
                    boxShadow: "none",
                  },
                }}
              >
                อัปโหลดเอกสาร
              </Button>
            </Paper>
          </Grid>

          {/* Card 2: ประวัติเอกสาร */}
          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 3.5,
                borderRadius: 4,
                border: "1px solid #e2e8f0",
                bgcolor: "#ffffff",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                minHeight: 260,
                transition: "all 0.25s ease-in-out",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 12px 24px rgba(0, 66, 59, 0.08)",
                  borderColor: BRAND_DARK,
                },
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: BRAND_DARK, mb: 0.5, fontSize: "1.1rem" }}>
                ประวัติการส่งเอกสาร
              </Typography>
              <Typography variant="body2" sx={{ color: "#94a3b8", mb: 2.5, fontSize: "0.85rem" }}>
                ดูประวัติและตรวจสอบสถานะการอนุมัติ
              </Typography>

              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  bgcolor: "#e0f2fe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#0369a1",
                  mb: 3,
                }}
              >
                <HistoryIcon sx={{ fontSize: 30 }} />
              </Box>

              <Button
                variant="outlined"
                onClick={handleHistoryClick}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
                sx={{
                  borderColor: BRAND_DARK,
                  color: BRAND_DARK,
                  borderRadius: 2.5,
                  px: 4,
                  py: 0.9,
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  borderWidth: 1.5,
                  textTransform: "none",
                  "&:hover": {
                    borderColor: BRAND_DARK,
                    borderWidth: 1.5,
                    bgcolor: "#f0fdf4",
                  },
                }}
              >
                {loading ? "กำลังตรวจสอบ..." : "ดูประวัติ"}
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
                bgcolor: "#f0fdf4",
                border: "1px solid #bbf7d0",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                minHeight: 260,
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: BRAND_DARK, mb: 2.5, fontSize: "1.05rem" }}>
                💡 เคล็ดลับการอัปโหลดเอกสาร
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.2 }}>
                  <CheckCircleIcon sx={{ fontSize: 20, color: BRAND_GREEN, mt: 0.2 }} />
                  <Typography variant="body2" sx={{ color: "#334155", fontSize: "0.875rem", fontWeight: 500 }}>
                    ภาพเอกสารต้องมีความชัดเจน ไม่เบลอ และไม่มีแสงสะท้อน
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.2 }}>
                  <CheckCircleIcon sx={{ fontSize: 20, color: BRAND_GREEN, mt: 0.2 }} />
                  <Typography variant="body2" sx={{ color: "#334155", fontSize: "0.875rem", fontWeight: 500 }}>
                    ข้อมูลครบถ้วน และมองเห็นขอบเอกสารชัดเจน
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.2 }}>
                  <CheckCircleIcon sx={{ fontSize: 20, color: BRAND_GREEN, mt: 0.2 }} />
                  <Typography variant="body2" sx={{ color: "#334155", fontSize: "0.875rem", fontWeight: 500 }}>
                    รองรับไฟล์ประเภท JPG, PNG ขนาดไม่เกิน 10 MB
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Modal แจ้งเตือนเมื่อไม่พบประวัติ */}
        <Dialog 
          open={openEmptyAlert} 
          onClose={() => setOpenEmptyAlert(false)}
          PaperProps={{
            sx: { borderRadius: 3, p: 1 }
          }}
        >
          <DialogTitle sx={{ fontWeight: 800, color: BRAND_DARK }}>แจ้งเตือน</DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ color: "#475569" }}>
              ไม่พบประวัติเอกสาร เนื่องจากคุณยังไม่ได้ทำการอัปโหลดเอกสารใดๆ
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button
              variant="contained"
              onClick={() => {
                setOpenEmptyAlert(false);
                navigate("/student/scan-upload");
              }}
              sx={{ 
                bgcolor: BRAND_DARK, 
                fontWeight: 700,
                borderRadius: 2,
                "&:hover": { bgcolor: "#0b2b26" } 
              }}
            >
              ไปหน้าอัปโหลดเอกสาร
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}

export default DocumentScanDashboard;