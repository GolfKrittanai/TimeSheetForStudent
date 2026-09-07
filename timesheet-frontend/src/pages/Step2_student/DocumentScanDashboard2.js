import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  useMediaQuery,
  useTheme,
  CircularProgress,
} from "@mui/material";
import {
  CloudUpload as CloudUploadIcon,
  HistoryOutlined as HistoryIcon,
  Lock as LockIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import { getUserDocumentHistory } from "../../services/documentScanService";

const BRAND_DARK = "#00423b";

function DocumentScanDashboard2() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [loading, setLoading] = useState(true);
  const [isStep1Passed, setIsStep1Passed] = useState(false);
  const [passedCount, setPassedCount] = useState(0);

  // ตรวจสอบสถานะขั้นตอนที่ 1 เมื่อเข้าหน้านี้
  useEffect(() => {
    const checkStep1Status = async () => {
      try {
        setLoading(true);
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        const userId = storedUser.id || storedUser.userId || 1;

        const res = await getUserDocumentHistory(userId);
        const historyData = Array.isArray(res)
          ? res
          : res?.data || res?.documents || [];

        // เอกสารที่ต้องผ่านครบทั้ง 5 รายการ
        const requiredDocs = [
          "BA Co-op 01 เอกสารติดต่องานสหกิจศึกษา",
          "BA Co-op 02-1 เอกสารยินยอมจากผู้ปกครอง",
          "BA Co-op 02-2 ใบสมัครงานสหกิจศึกษา",
          "BA Co-op 04 เอกสารรายละเอียดที่พัก",
          "BA Co-op 05 ผลการศึกษาฉบับ (ชั่วคราว)",
        ];

        const passedDocs = historyData.filter(
          (item) => item.status === "passed" || item.status === "ผ่าน"
        );
        const passedCategories = new Set(
          passedDocs.map((item) => item.docCategory)
        );

        setPassedCount(passedCategories.size);

        // เช็กว่าผ่านครบทั้ง 5 ประเภทเอกสารแล้วหรือยัง
        const isAllPassed = requiredDocs.every((docName) =>
          Array.from(passedCategories).some((cat) =>
            cat.includes(docName.split(" ")[0])
          )
        );

        setIsStep1Passed(isAllPassed);
      } catch (err) {
        console.error("Error checking step 1 status:", err);
      } finally {
        setLoading(false);
      }
    };

    checkStep1Status();
  }, [location]);

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
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: BRAND_DARK,
              mb: 0.5,
              fontSize: isSmallScreen ? "1.5rem" : "2rem",
            }}
          >
            ขั้นตอนที่ 2: จัดเตรียมเอกสารให้สถานประกอบการ
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: "#64748b", fontSize: "0.95rem" }}
          >
            จัดการและส่งเอกสารสำหรับสถานประกอบการสหกิจศึกษา
          </Typography>
        </Box>

        {/* ตรวจสอบเงื่อนไขเปิด/ปิด การเข้าถึงขั้นตอนที่ 2 */}
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              py: 8,
            }}
          >
            <CircularProgress color="success" />
          </Box>
        ) : !isStep1Passed ? (
          /* 🔴 กรณีที่ยังไม่ผ่านขั้นตอนที่ 1 */
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 4,
              border: "1px solid #fca5a5",
              bgcolor: "#fef2f2",
              mb: 4,
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                bgcolor: "#fee2e2",
                color: "#dc2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2,
              }}
            >
              <LockIcon sx={{ fontSize: 36 }} />
            </Box>

            <Typography
              variant="h6"
              sx={{ fontWeight: 800, color: "#991b1b", mb: 1 }}
            >
              คุณยังไม่ผ่านขั้นตอนที่ 1
            </Typography>

            <Typography
              variant="body1"
              sx={{ color: "#7f1d1d", mb: 3, maxWidth: 600, fontSize: "0.95rem" }}
            >
              การจะดำเนินการในขั้นตอนที่ 2 ได้ คุณต้องทำการส่งเอกสารในขั้นตอนที่ 1
              ให้ครบถ้วนทั้ง 5 ฉบับ และเอกสารทั้งหมดจะต้องได้รับการอนุมัติสถานะเป็น{" "}
              <strong>"ผ่าน"</strong> ก่อน <br />
              (สถานะปัจจุบัน: ผ่านแล้ว <strong>{passedCount}/5</strong> ฉบับ)
            </Typography>

            <Button
              variant="contained"
              onClick={() => navigate("/student/scan")}
              sx={{
                bgcolor: "#dc2626",
                color: "#ffffff",
                fontWeight: 700,
                borderRadius: 2.5,
                px: 4,
                py: 1.2,
                boxShadow: "0 4px 12px rgba(220, 38, 38, 0.2)",
                "&:hover": { bgcolor: "#b91c1c" },
              }}
            >
              กลับไปจัดการเอกสารขั้นตอนที่ 1
            </Button>
          </Paper>
        ) : (
          /* 🟢 กรณีที่ผ่านขั้นตอนที่ 1 ครบถ้วน แสดง UI การทำงานขั้นตอนที่ 2 */
          <Grid container spacing={3}>
            {/* Card 1: อัปโหลดเอกสาร */}
            <Grid item xs={12} md={6}>
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
                  minHeight: 240,
                }}
              >
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    bgcolor: "rgba(0, 178, 122, 0.1)",
                    color: BRAND_DARK,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 2,
                  }}
                >
                  <CloudUploadIcon sx={{ fontSize: 32 }} />
                </Box>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, color: BRAND_DARK, mb: 0.5 }}
                >
                  อัปโหลดเอกสารขั้นตอนที่ 2
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "#94a3b8", mb: 2.5, fontSize: "0.85rem" }}
                >
                  อัปโหลดเอกสารสำหรับสถานประกอบการ
                </Typography>
                <Button
                  variant="contained"
                  sx={{
                    bgcolor: "#007a5e",
                    color: "#fff",
                    fontWeight: 700,
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    "&:hover": { bgcolor: "#005c47" },
                  }}
                >
                  อัปโหลดเอกสาร
                </Button>
              </Paper>
            </Grid>

            {/* Card 2: ประวัติการส่งเอกสาร */}
            <Grid item xs={12} md={6}>
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
                  minHeight: 240,
                }}
              >
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    bgcolor: "rgba(0, 178, 122, 0.1)",
                    color: BRAND_DARK,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 2,
                  }}
                >
                  <HistoryIcon sx={{ fontSize: 32 }} />
                </Box>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, color: BRAND_DARK, mb: 0.5 }}
                >
                  ประวัติการส่งเอกสาร
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "#94a3b8", mb: 2.5, fontSize: "0.85rem" }}
                >
                  ตรวจสอบสถานะเอกสารในขั้นตอนที่ 2
                </Typography>
                <Button
                  variant="outlined"
                  sx={{
                    borderColor: "#007a5e",
                    color: "#007a5e",
                    fontWeight: 700,
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    "&:hover": {
                      borderColor: "#005c47",
                      bgcolor: "rgba(0,122,94,0.05)",
                    },
                  }}
                >
                  ดูประวัติ
                </Button>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Box>
    </Box>
  );
}

export default DocumentScanDashboard2;