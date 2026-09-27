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
  Chip,
} from "@mui/material";
import {
  Lock as LockIcon,
  VisibilityOutlined as VisibilityIcon,
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

  // ข้อมูลนักศึกษาและสถานประกอบการ
  const [studentInfo, setStudentInfo] = useState({
    fullName: "-",
    studentId: "-",
    major: "ระบบสารสนเทศทางธุรกิจ",
    faculty: "บริหารธุรกิจ",
  });

  const [companyInfo, setCompanyInfo] = useState({
    name: "-",
    position: "-",
  });

  // รายการเอกสารที่มหาวิทยาลัยจัดเตรียมให้สำหรับขั้นตอนที่ 2
  const [preparedDocs, setPreparedDocs] = useState([
    { id: 1, name: "ใบขอความอนุเคราะห์รับนักศึกษา", createdBy: "Admin", status: "พร้อมส่ง" },
    { id: 2, name: "เอกสาร BA Co-op 02-2", createdBy: "Admin", status: "พร้อมส่ง" },
    { id: 3, name: "ผลการศึกษาฉบับ (ชั่วคราว)", createdBy: "Admin", status: "พร้อมส่ง" },
    { id: 4, name: "เอกสารตอบรับ", createdBy: "Admin", status: "พร้อมส่ง" },
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

        // 🎯 แก้ไข: กรองเฉพาะเอกสารที่มีสถานะ "ผ่าน" เท่านั้น (ตัด pending/รอตรวจสอบ ออก)
        const validSubmittedDocs = historyData.filter((item) => {
          const status = String(item.status || "").trim().toLowerCase();
          return status === "passed" || status === "ผ่าน";
        });

        const submittedCategories = new Set(
          validSubmittedDocs.map((item) => item.docCategory)
        );

        setSubmittedCount(submittedCategories.size);

        // สกัดข้อมูลนักศึกษาและสถานประกอบการจากข้อมูลเอกสาร
        historyData.forEach((item) => {
          let ext = item.extractedData;
          if (typeof ext === "string") {
            try { ext = JSON.parse(ext); } catch (e) {}
          }
          if (ext) {
            if (ext.fullName) setStudentInfo((prev) => ({ ...prev, fullName: ext.fullName }));
            if (ext.studentId) setStudentInfo((prev) => ({ ...prev, studentId: ext.studentId }));
            if (ext.companyName) setCompanyInfo((prev) => ({ ...prev, name: ext.companyName }));
            if (ext.position) setCompanyInfo((prev) => ({ ...prev, position: ext.position }));
          }
        });

        // 🎯 ตรวจสอบว่ามีเอกสารที่มีสถานะ "ผ่าน" ครบทั้ง 5 หัวข้อหลักเรียบร้อยแล้ว
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
          p: isSmallScreen ? 2 : 3.5,
          fontFamily: '"Kanit", sans-serif',
        }}
      >
        {/* หัวข้อระบบ */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: BRAND_DARK,
              mb: 0.5,
              fontSize: isSmallScreen ? "1.3rem" : "1.6rem",
            }}
          >
            ระบบสแกนเอกสารก่อนสหกิจศึกษา
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "#64748b", fontSize: "0.875rem" }}
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
                width: 56,
                height: 56,
                borderRadius: "50%",
                bgcolor: "#fee2e2",
                color: "#dc2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2,
              }}
            >
              <LockIcon sx={{ fontSize: 32 }} />
            </Box>

            <Typography
              variant="h6"
              sx={{ fontWeight: 800, color: "#991b1b", mb: 1 }}
            >
              คุณยังไม่ผ่านขั้นตอนที่ 1
            </Typography>

            <Typography
              variant="body2"
              sx={{ color: "#7f1d1d", mb: 3, maxWidth: 600, fontSize: "0.9rem", lineHeight: 1.6 }}
            >
              การจะดำเนินการในขั้นตอนที่ 2 ได้ คุณต้องทำการส่งเอกสารในขั้นตอนที่ 1 ให้ครบถ้วนทั้ง 5 ฉบับ และเอกสารทั้งหมดจะต้องอยู่ในสถานะ{" "}
              <strong>"ผ่าน"</strong> <br />
              (สถานะปัจจุบัน: ผ่านแล้ว <strong>{submittedCount}/5</strong> ฉบับ)
            </Typography>

            <Button
              variant="contained"
              onClick={() => navigate("/student/scan")}
              sx={{
                bgcolor: "#dc2626",
                color: "#ffffff",
                fontWeight: 700,
                borderRadius: 2.5,
                px: 3.5,
                py: 1,
                boxShadow: "0 4px 12px rgba(220, 38, 38, 0.2)",
                "&:hover": { bgcolor: "#b91c1c" },
              }}
            >
              กลับไปจัดการเอกสารขั้นตอนที่ 1
            </Button>
          </Paper>
        ) : (
          /* 🟢 กรณีผ่านครบทั้ง 5 ฉบับแล้ว */
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            
            {/* 1. ข้อมูลนักศึกษาและสถานประกอบการ */}
            <Paper
              elevation={0}
              sx={{
                borderRadius: 3,
                border: "1px solid #e2e8f0",
                overflow: "hidden",
                bgcolor: "#ffffff",
              }}
            >
              <Box sx={{ bgcolor: "#f8fafc", px: 3, py: 1.5, borderBottom: "1px solid #e2e8f0" }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: BRAND_DARK, fontSize: "0.95rem" }}>
                  ข้อมูลนักศึกษาและสถานประกอบการ
                </Typography>
              </Box>

              <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  {/* ข้อมูลนักศึกษา */}
                  <Grid item xs={12} md={6} sx={{ borderRight: { md: "1px solid #e2e8f0" }, pr: { md: 3 } }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: BRAND_DARK, mb: 1.5 }}>
                      ข้อมูลนักศึกษา
                    </Typography>

                    <Grid container spacing={1} sx={{ fontSize: "0.85rem", color: "#334155" }}>
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

                  {/* ข้อมูลสถานประกอบการ */}
                  <Grid item xs={12} md={6} sx={{ pl: { md: 3 } }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: BRAND_DARK, mb: 1.5 }}>
                      ข้อมูลสถานประกอบการ
                    </Typography>

                    <Grid container spacing={1} sx={{ fontSize: "0.85rem", color: "#334155" }}>
                      <Grid item xs={5} sx={{ color: "#64748b", fontWeight: 600 }}>ชื่อสถานประกอบการ :</Grid>
                      <Grid item xs={7} sx={{ fontWeight: 700 }}>{companyInfo.name}</Grid>

                      <Grid item xs={5} sx={{ color: "#64748b", fontWeight: 600 }}>ตำแหน่งงาน :</Grid>
                      <Grid item xs={7} sx={{ fontWeight: 700 }}>{companyInfo.position}</Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Box>
            </Paper>

            {/* 2. ตารางเอกสารที่มหาวิทยาลัยจัดเตรียมให้ */}
            <Paper
              elevation={0}
              sx={{
                borderRadius: 3,
                border: "1px solid #e2e8f0",
                overflow: "hidden",
                bgcolor: "#ffffff",
              }}
            >
              <Box sx={{ bgcolor: "#f8fafc", px: 3, py: 1.5, borderBottom: "1px solid #e2e8f0" }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: BRAND_DARK, fontSize: "0.95rem" }}>
                  เอกสารที่มหาวิทยาลัยจัดเตรียมให้
                </Typography>
                <Typography variant="caption" sx={{ color: "#94a3b8", display: "block" }}>
                  ระบบไม่ได้ส่งเอกสารไปยังสถานประกอบการโดยตรง กรุณาดาวน์โหลดเอกสารและนำส่งผ่านช่องทางที่สถานประกอบการกำหนด
                </Typography>
              </Box>

              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "#f8fafc" }}>
                    <TableRow>
                      <TableCell align="center" sx={{ fontWeight: 700, color: "#64748b", width: "8%" }}>ลำดับ</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#64748b", width: "40%" }}>Co-op</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, color: "#64748b", width: "18%" }}>จัดทำโดย</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, color: "#64748b", width: "14%" }}>สถานะ</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, color: "#64748b", width: "20%" }}>ดำเนินการ</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {preparedDocs.map((doc, idx) => (
                      <TableRow key={doc.id} hover>
                        <TableCell align="center" sx={{ color: "#64748b" }}>{idx + 1}</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: "#334155" }}>{doc.name}</TableCell>
                        <TableCell align="center" sx={{ color: "#64748b" }}>{doc.createdBy}</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={doc.status}
                            size="small"
                            sx={{
                              bgcolor: "#dcfce7",
                              color: "#166534",
                              fontWeight: 700,
                              fontSize: "0.75rem",
                              borderRadius: 1.5,
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
                            <Button
                              size="small"
                              sx={{
                                minWidth: 32,
                                width: 32,
                                height: 32,
                                borderRadius: "50%",
                                color: "#00423b",
                                bgcolor: "#e2e8f0",
                                "&:hover": { bgcolor: "#cbd5e1" },
                              }}
                            >
                              <VisibilityIcon sx={{ fontSize: 18 }} />
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
                              sx={{
                                bgcolor: "#005c47",
                                color: "#ffffff",
                                borderRadius: "20px",
                                px: 2,
                                fontSize: "0.78rem",
                                fontWeight: 700,
                                textTransform: "none",
                                boxShadow: "none",
                                "&:hover": { bgcolor: "#00423b" },
                              }}
                            >
                              ดาวน์โหลด
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            {/* ปุ่มติดตามผล ไปยังขั้นตอนถัดไป */}
            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
              <Button
                variant="contained"
                endIcon={<NavigateNextIcon />}
                onClick={() => navigate("/student/step3")}
                sx={{
                  bgcolor: "#00423b",
                  color: "#ffffff",
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  textAlign: "right",
                  "&:hover": { bgcolor: "#002b26" },
                }}
              >
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", mr: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 800, fontSize: "0.85rem", lineHeight: 1.2 }}>
                    ติดตามผล
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: "0.68rem", opacity: 0.8, fontWeight: 400 }}>
                    เพื่อไปยังขั้นตอนถัดไป
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