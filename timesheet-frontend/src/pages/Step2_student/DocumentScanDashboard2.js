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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  Lock as LockIcon,
  DownloadOutlined as DownloadIcon,
  NavigateNext as NavigateNextIcon,
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
  const [submittedCount, setSubmittedCount] = useState(0);

  // ข้อมูลนักศึกษา
  const [studentInfo, setStudentInfo] = useState({
    fullName: "-",
    studentId: "-",
    major: "ระบบสารสนเทศทางธุรกิจ",
    faculty: "บริหารธุรกิจ",
  });

  // รายการเอกสารที่มหาวิทยาลัยจัดเตรียมให้สำหรับขั้นตอนที่ 2
  const [preparedDocs, setPreparedDocs] = useState([
    { id: 1, name: "ใบขอความอนุเคราะห์รับนักศึกษา" },
    { id: 2, name: "เอกสาร BA Co-op 02-2" },
    { id: 3, name: "ผลการศึกษาฉบับ (ชั่วคราว)" },
    { id: 4, name: "เอกสารตอบรับ" },
  ]);

  useEffect(() => {
    const checkStep1Status = async () => {
      try {
        setLoading(true);
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        const userId = storedUser.id || storedUser.userId || 1;

        if (storedUser.fullName) {
          setStudentInfo((prev) => ({
            ...prev,
            fullName: storedUser.fullName || storedUser.name || "-",
            studentId: storedUser.studentId || storedUser.code || "-",
          }));
        }

        const res = await getUserDocumentHistory(userId);
        const historyData = Array.isArray(res)
          ? res
          : res?.data || res?.documents || [];

        const requiredDocs = [
          "BA Co-op 01",
          "BA Co-op 02-1",
          "BA Co-op 02-2",
          "BA Co-op 04",
          "BA Co-op 05",
        ];

        const validSubmittedDocs = historyData.filter((item) => {
          const status = String(item.status || "").trim().toLowerCase();
          return status === "passed" || status === "ผ่าน";
        });

        const submittedCategories = new Set(
          validSubmittedDocs.map((item) => item.docCategory)
        );

        setSubmittedCount(submittedCategories.size);

        historyData.forEach((item) => {
          let ext = item.extractedData;
          if (typeof ext === "string") {
            try { ext = JSON.parse(ext); } catch (e) {}
          }
          if (ext) {
            if (ext.fullName) setStudentInfo((prev) => ({ ...prev, fullName: ext.fullName }));
            if (ext.studentId) setStudentInfo((prev) => ({ ...prev, studentId: ext.studentId }));
          }
        });

        const isAllSubmitted = requiredDocs.every((docPrefix) =>
          Array.from(submittedCategories).some((cat) => cat && cat.includes(docPrefix))
        );

        setIsStep1Passed(isAllSubmitted);
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
          p: isSmallScreen ? 2 : 2.5,
          fontFamily: '"Kanit", sans-serif',
          overflowX: "hidden",
        }}
      >
        {/* หัวข้อระบบ */}
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: BRAND_DARK,
              mb: 0.2,
              fontSize: isSmallScreen ? "1.2rem" : "1.4rem",
            }}
          >
            ระบบสแกนเอกสารก่อนสหกิจศึกษา
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "#64748b", fontSize: "0.8rem" }}
          >
            ตรวจสอบความถูกต้องของเอกสารด้วย AI ก่อนเข้าสู่ระบบสหกิจศึกษา
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 10 }}>
            <CircularProgress color="success" />
          </Box>
        ) : !isStep1Passed ? (
          /* 🔴 กรณีขั้นตอนที่ 1 ยังไม่ผ่านครบ 5 ฉบับ */
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: "1px solid #fca5a5",
              bgcolor: "#fef2f2",
              mb: 3,
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                bgcolor: "#fee2e2",
                color: "#dc2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 1.5,
              }}
            >
              <LockIcon sx={{ fontSize: 26 }} />
            </Box>

            <Typography
              variant="h6"
              sx={{ fontWeight: 800, color: "#991b1b", mb: 0.5, fontSize: "1.1rem" }}
            >
              คุณยังไม่ผ่านขั้นตอนที่ 1
            </Typography>

            <Typography
              variant="body2"
              sx={{ color: "#7f1d1d", mb: 2, maxWidth: 600, fontSize: "0.85rem", lineHeight: 1.5 }}
            >
              การจะดำเนินการในขั้นตอนที่ 2 ได้ คุณต้องทำการส่งเอกสารในขั้นตอนที่ 1 ให้ครบถ้วนทั้ง 5 ฉบับ และเอกสารทั้งหมดจะต้องอยู่ในสถานะ{" "}
              <strong>"ผ่าน"</strong> (ผ่านแล้ว <strong>{submittedCount}/5</strong> ฉบับ)
            </Typography>

            <Button
              variant="contained"
              onClick={() => navigate("/student/scan")}
              sx={{
                bgcolor: "#dc2626",
                color: "#ffffff",
                fontWeight: 700,
                borderRadius: 2,
                px: 3,
                py: 0.8,
                fontSize: "0.85rem",
                boxShadow: "none",
                "&:hover": { bgcolor: "#b91c1c" },
              }}
            >
              กลับไปจัดการเอกสารขั้นตอนที่ 1
            </Button>
          </Paper>
        ) : (
          /* 🟢 กรณีผ่านครบทั้ง 5 ฉบับแล้ว */
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            
            {/* 1. ข้อมูลนักศึกษา (แสดงเต็มหน้าจอแบบไม่มีเส้นแบ่งกลาง) */}
            <Paper
              elevation={0}
              sx={{
                borderRadius: 2.5,
                border: "1px solid #e2e8f0",
                overflow: "hidden",
                bgcolor: "#ffffff",
              }}
            >
              <Box sx={{ bgcolor: "#f8fafc", px: 2.5, py: 1, borderBottom: "1px solid #e2e8f0" }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: BRAND_DARK, fontSize: "0.9rem" }}>
                  ข้อมูลนักศึกษา
                </Typography>
              </Box>

              <Box sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Grid container spacing={0.8} sx={{ fontSize: "0.8rem", color: "#334155" }}>
                      <Grid item xs={4} sx={{ color: "#64748b", fontWeight: 600 }}>ชื่อ-นามสกุล :</Grid>
                      <Grid item xs={8} sx={{ fontWeight: 700 }}>{studentInfo.fullName}</Grid>

                      <Grid item xs={4} sx={{ color: "#64748b", fontWeight: 600 }}>รหัสนักศึกษา :</Grid>
                      <Grid item xs={8} sx={{ fontWeight: 700 }}>{studentInfo.studentId}</Grid>

                      <Grid item xs={4} sx={{ color: "#64748b", fontWeight: 600 }}>สาขา :</Grid>
                      <Grid item xs={8}>{studentInfo.major}</Grid>

                      <Grid item xs={4} sx={{ color: "#64748b", fontWeight: 600 }}>คณะ :</Grid>
                      <Grid item xs={8}>{studentInfo.faculty}</Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Box>
            </Paper>

            {/* 2. ตารางเอกสารที่มหาวิทยาลัยจัดเตรียมให้ */}
            <Paper
              elevation={0}
              sx={{
                borderRadius: 2.5,
                border: "1px solid #e2e8f0",
                overflow: "hidden",
                bgcolor: "#ffffff",
              }}
            >
              <Box sx={{ bgcolor: "#f8fafc", px: 2.5, py: 1, borderBottom: "1px solid #e2e8f0" }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: BRAND_DARK, fontSize: "0.9rem" }}>
                  เอกสารที่มหาวิทยาลัยจัดเตรียมให้
                </Typography>
                <Typography variant="caption" sx={{ color: "#94a3b8", display: "block", fontSize: "0.75rem" }}>
                  ระบบไม่ได้ส่งเอกสารไปยังสถานประกอบการโดยตรง กรุณาดาวน์โหลดเอกสารและนำส่งผ่านช่องทางที่สถานประกอบการกำหนด
                </Typography>
              </Box>

              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "#f8fafc" }}>
                    <TableRow>
                      <TableCell align="center" sx={{ fontWeight: 700, color: "#64748b", width: "10%", py: 1 }}>ลำดับ</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#64748b", width: "70%", py: 1 }}>Co-op</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, color: "#64748b", width: "20%", py: 1 }}>ดำเนินการ</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {preparedDocs.map((doc, idx) => (
                      <TableRow key={doc.id} hover>
                        <TableCell align="center" sx={{ color: "#64748b", py: 1 }}>{idx + 1}</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: "#334155", py: 1, fontSize: "0.85rem" }}>{doc.name}</TableCell>
                        <TableCell align="center" sx={{ py: 1 }}>
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<DownloadIcon sx={{ fontSize: 15 }} />}
                            sx={{
                              bgcolor: "#005c47",
                              color: "#ffffff",
                              borderRadius: "20px",
                              px: 2,
                              py: 0.4,
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              textTransform: "none",
                              boxShadow: "none",
                              "&:hover": { bgcolor: "#00423b" },
                            }}
                          >
                            ดาวน์โหลด
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            {/* ปุ่มติดตามผล ไปยังขั้นตอนถัดไป */}
            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 0.5 }}>
              <Button
                variant="contained"
                endIcon={<NavigateNextIcon />}
                onClick={() => navigate("/student/step2-upload")}
                sx={{
                  bgcolor: "#00423b",
                  color: "#ffffff",
                  borderRadius: 2,
                  px: 2.5,
                  py: 0.8,
                  boxShadow: "none",
                  "&:hover": { bgcolor: "#002b26" },
                }}
              >
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", mr: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 800, fontSize: "0.8rem", lineHeight: 1.1 }}>
                    อัปโหลดเอกสาร
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: "0.65rem", opacity: 0.8, fontWeight: 400 }}>
                    ขั้นตอนถัดไป
                  </Typography>
                </Box>
              </Button>
            </Box>

          </Box>
        )}
      </Box>
    </Box>
  );
}

export default DocumentScanDashboard2;