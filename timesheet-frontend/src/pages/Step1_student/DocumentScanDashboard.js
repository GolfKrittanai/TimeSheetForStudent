import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  MenuItem,
  Select,
  FormControl,
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogContent,
  IconButton,
  Grid,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  CloudUpload as CloudUploadIcon,
  Close as CloseIcon,
  ErrorOutline as ErrorOutlineIcon,
  AccessTime as AccessTimeIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  NavigateNext as NavigateNextIcon,
  Check as CheckIcon,
  NotificationsNoneOutlined as NotificationsIcon,
  History as HistoryIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import {
  uploadAndScanDocument,
  getUserDocumentHistory,
  cancelUserDocument,
} from "../../services/documentScanService";

const SHOW_STATUS_COLUMN = false;

const INITIAL_DOCUMENTS = [
  { id: 1, code: "1", name: "BA Co-op 01 เอกสารติดต่องานสหกิจศึกษา", status: "ยังไม่ได้ส่ง", date: "..." },
  { id: 2, code: "2", name: "BA Co-op 02-1 เอกสารยินยอมจากผู้ปกครอง", status: "ยังไม่ได้ส่ง", date: "..." },
  { id: 3, code: "3", name: "BA Co-op 02-2 ใบสมัครงานสหกิจศึกษา", status: "ยังไม่ได้ส่ง", date: "..." },
  { id: 4, code: "4", name: "BA Co-op 04 เอกสารรายละเอียดที่พัก", status: "ยังไม่ได้ส่ง", date: "..." },
  { id: 5, code: "5", name: "BA Co-op 05 ผลการศึกษาฉบับ (ชั่วคราว)", status: "ยังไม่ได้ส่ง", date: "..." },
];

function DocumentScanDashboard() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();

  const [documents, setDocuments] = useState(INITIAL_DOCUMENTS);
  const [pageLoading, setPageLoading] = useState(true);

  // State สำหรับสลับหน้าแสดงผลสำเร็จ
  const [showSuccessView, setShowSuccessView] = useState(false);

  const [openUploadModal, setOpenUploadModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [fileType, setFileType] = useState("PDF");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const getCurrentUserId = () => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    return storedUser.id || storedUser.userId || 1;
  };

  const loadLatestStatus = useCallback(async () => {
    try {
      setPageLoading(true);
      const userId = getCurrentUserId();
      const res = await getUserDocumentHistory(userId);
      const historyData = Array.isArray(res) ? res : res?.data || res?.documents || [];

      if (historyData && Array.isArray(historyData)) {
        setDocuments((prevDocs) =>
          prevDocs.map((doc) => {
            const matchedLogs = historyData.filter(
              (item) => item.docCategory === doc.name
            );

            if (matchedLogs.length > 0) {
              matchedLogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
              const latest = matchedLogs[0];
              
              let mappedStatus = "รอตรวจสอบ";
              const rawStatus = String(latest.status || "").trim().toLowerCase();

              if (rawStatus === "passed" || rawStatus === "ผ่าน") {
                mappedStatus = "ผ่าน";
              } else if (rawStatus === "failed" || rawStatus === "rejected" || rawStatus === "ไม่ผ่าน") {
                mappedStatus = "ไม่ผ่าน";
              } else if (rawStatus === "pending" || rawStatus === "waiting" || rawStatus === "รอตรวจสอบ") {
                mappedStatus = "รอตรวจสอบ";
              } else {
                mappedStatus = latest.status || "รอตรวจสอบ";
              }

              const formattedDate = latest.createdAt
                ? new Date(latest.createdAt).toLocaleDateString("th-TH", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "...";

              return {
                ...doc,
                status: mappedStatus,
                date: formattedDate,
                dbId: latest.id
              };
            }
            
            return {
              ...doc,
              status: "ยังไม่ได้ส่ง",
              date: "...",
              dbId: null
            };
          })
        );
      }
    } catch (error) {
      console.error("Failed to load upload history:", error);
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLatestStatus();
  }, [loadLatestStatus]);

  const isAllPassed = useMemo(() => {
    return (
      documents.length === 5 &&
      documents.every((doc) => doc.status === "ผ่าน")
    );
  }, [documents]);

  useEffect(() => {
    if (isAllPassed) {
      setShowSuccessView(true);
    } else {
      setShowSuccessView(false);
    }
  }, [isAllPassed]);

  const isReadyToNext = useMemo(() => {
    return (
      documents.length === 5 &&
      documents.every((doc) => doc.status === "ผ่าน" || doc.status === "รอตรวจสอบ")
    );
  }, [documents]);

  const steps = useMemo(() => {
    const passedCount = documents.filter((doc) => doc.status === "ผ่าน").length;
    const hasUploadedAny = documents.some((doc) => doc.status !== "ยังไม่ได้ส่ง");

    let currentStep = 1;

    if (passedCount === 5 || isAllPassed) {
      currentStep = 4;
    } else if (isReadyToNext) {
      currentStep = 3;
    } else if (hasUploadedAny) {
      currentStep = 2;
    }

    return [
      { num: 1, title: "อัปโหลดเอกสาร", sub: "เลือกเอกสารที่ต้องการ" },
      { num: 2, title: "ตรวจสอบ", sub: "ตรวจสอบผล" },
      { num: 3, title: "สถานะ", sub: "รอการตรวจสอบ" },
      { num: 4, title: "สำเร็จ", sub: "ผ่านการตรวจสอบ" },
    ].map((step) => ({
      ...step,
      active: step.num <= currentStep,
    }));
  }, [documents, isAllPassed, isReadyToNext]);

  const getAcceptFileType = () => {
    switch (fileType) {
      case "JPG": return ".jpg,.jpeg";
      case "PNG": return ".png";
      case "PDF":
      default: return ".pdf";
    }
  };

  const handleOpenUploadModal = (doc) => {
    setSelectedDoc(doc);
    setSelectedFile(null);
    setOpenUploadModal(true);
  };

  const handleCloseModal = () => {
    if (!isLoading) {
      setOpenUploadModal(false);
      setSelectedDoc(null);
      setSelectedFile(null);
    }
  };

  const validateAndSetFile = (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("ขนาดไฟล์เกิน 10 MB กรุณาเลือกไฟล์ใหม่");
      return;
    }
    setSelectedFile(file);
  };

  const handleSaveDocument = async () => {
    if (!selectedFile || !selectedDoc) {
      alert("กรุณาเลือกไฟล์เอกสารก่อนบันทึกข้อมูล");
      return;
    }
    setIsLoading(true);
    try {
      const userId = getCurrentUserId();
      await uploadAndScanDocument(selectedFile, selectedDoc.name, userId);
      await loadLatestStatus();
      handleCloseModal();
    } catch (error) {
      console.error("Upload Error:", error);
      alert("เกิดข้อผิดพลาดในการอัปโหลดเอกสาร");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToSummary = () => {
    if (isReadyToNext || isAllPassed) {
      navigate("/student/scan-summary");
    }
  };

  const renderStatusChip = (status) => {
    switch (status) {
      case "ผ่าน":
        return <Chip icon={<CheckCircleIcon sx={{ fontSize: 16, color: "#166534 !important" }} />} label={status} size="small" sx={{ bgcolor: "#dcfce7", color: "#166534", fontWeight: 600, height: 28 }} />;
      case "ไม่ผ่าน":
        return <Chip icon={<CancelIcon sx={{ fontSize: 16, color: "#991b1b !important" }} />} label={status} size="small" sx={{ bgcolor: "#fee2e2", color: "#991b1b", fontWeight: 600, height: 28 }} />;
      case "รอตรวจสอบ":
        return <Chip icon={<AccessTimeIcon sx={{ fontSize: 16, color: "#9a3412 !important" }} />} label={status} size="small" sx={{ bgcolor: "#ffedd5", color: "#9a3412", fontWeight: 600, height: 28 }} />;
      default:
        return <Chip icon={<ErrorOutlineIcon sx={{ fontSize: 16, color: "#475569 !important" }} />} label="ยังไม่ได้ส่ง" size="small" sx={{ bgcolor: "#e2e8f0", color: "#475569", fontWeight: 600, height: 28 }} />;
    }
  };

  const renderActionButton = (row) => {
    if (row.status === "รอตรวจสอบ") {
      return (
        <Button
          size="small"
          onClick={async () => {
            if (window.confirm("ต้องการยกเลิกการส่งเอกสารนี้?")) {
              if (row.dbId) {
                try {
                  await cancelUserDocument(row.dbId);
                  await loadLatestStatus();
                } catch (error) {
                  alert("ไม่สามารถยกเลิกเอกสารได้");
                }
              }
            }
          }}
          sx={{ bgcolor: "#d32f2f", color: "#ffffff", borderRadius: 5, px: 2, py: 0.5, fontSize: "0.85rem", fontWeight: 600, textTransform: "none", boxShadow: "none", "&:hover": { bgcolor: "#9a0007" } }}
        >
          ยกเลิก
        </Button>
      );
    }

    if (row.status === "ผ่าน") {
      return <Chip label="ผ่านแล้ว" size="small" color="success" variant="outlined" sx={{ fontWeight: 600, fontSize: "0.8125rem", height: 28 }} />;
    }

    return (
      <Button
        size="small"
        onClick={() => handleOpenUploadModal(row)}
        sx={{
          bgcolor: row.status === "ไม่ผ่าน" ? "#e65100" : "#007a5e",
          color: "#ffffff",
          borderRadius: 5,
          px: 2.5,
          py: 0.5,
          fontSize: "0.85rem",
          fontWeight: 600,
          textTransform: "none",
          boxShadow: "none",
          "&:hover": { bgcolor: row.status === "ไม่ผ่าน" ? "#b23c00" : "#005a45" },
        }}
      >
        {row.status === "ไม่ผ่าน" ? "อัปโหลดใหม่" : "อัปโหลด"}
      </Button>
    );
  };

  return (
    <Box sx={{ display: "flex", bgcolor: "#f8fafc", height: "100vh", overflow: "hidden" }}>
      <Sidebar />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          boxSizing: "border-box",
        }}
      >
        {/* แถบ Stepper แสดงขั้นตอน (ปรับ Layout ให้เท่ากับ DocumentSummary) */}
        <Paper elevation={0} sx={{ p: 2.5, mb: 2, borderRadius: 3, bgcolor: "#ffffff", border: "1px solid #e2e8f0" }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#00423b", mb: 0.2, fontSize: "1.1rem" }}>
            ขั้นตอนการใช้งาน 4 ขั้นตอน
          </Typography>
          <Typography variant="caption" sx={{ color: "#64748b", mb: 2, display: "block" }}>
            {isAllPassed ? "การตรวจสอบเอกสารเสร็จสมบูรณ์" : "เอกสารของท่านอยู่ระหว่างการตรวจสอบ"}
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: { xs: 0, md: 3 } }}>
            {steps.map((step, idx) => (
              <React.Fragment key={step.num}>
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      bgcolor: step.active ? "#007a5e" : "#cbd5e1",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      mb: 0.5,
                      transition: "all 0.3s ease",
                    }}
                  >
                    {step.num}
                  </Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "#1e293b", fontSize: "0.8rem" }}>
                    {step.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.7rem" }}>
                    {step.sub}
                  </Typography>
                </Box>

                {idx < steps.length - 1 && (
                  <Box 
                    sx={{ 
                      flexGrow: 1, 
                      height: 2, 
                      bgcolor: steps[idx + 1].active ? "#007a5e" : "#cbd5e1", 
                      mx: 2,
                      transition: "all 0.3s ease",
                    }} 
                  />
                )}
              </React.Fragment>
            ))}
          </Box>
        </Paper>

        {/* 🟢 กรณีเอกสารผ่านครบทั้ง 5 ฉบับ และอยู่โหมดแสดงความสำเร็จ */}
        {showSuccessView && isAllPassed ? (
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: "1px solid #e2e8f0",
              bgcolor: "#fff",
              mb: 2,
              flexGrow: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              overflow: "auto",
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#00423b", mb: 0.5, textAlign: "center" }}>
              ดำเนินการเสร็จสิ้น
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748b", mb: 2, textAlign: "center" }}>
              ระบบตรวจสอบเสร็จเรียบร้อย
            </Typography>

            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 4,
                border: "1px solid #e2e8f0",
                bgcolor: "#ffffff",
                textAlign: "center",
                maxWidth: 520,
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)",
                mb: 2,
              }}
            >
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  bgcolor: "#f0fdf4",
                  border: "2px solid #22c55e",
                  color: "#22c55e",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 1.5,
                }}
              >
                <CheckIcon sx={{ fontSize: 40 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: "#1e293b", mb: 1 }}>
                อัปโหลดเอกสารสำเร็จ
              </Typography>
              <Typography variant="body2" sx={{ color: "#64748b", lineHeight: 1.6 }}>
                เอกสารของท่านถูกส่งเข้าสู่ระบบตรวจสอบเรียบร้อยแล้ว <br />
                ท่านสามารถตรวจสอบสถานะและผลการตรวจสอบได้ในภายหลัง
              </Typography>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                px: 2.5,
                borderRadius: 3,
                bgcolor: "#fffbeb",
                border: "1px solid #fef3c7",
                maxWidth: 520,
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <NotificationsIcon sx={{ color: "#d97706", fontSize: 24 }} />
              <Box sx={{ textAlign: "left" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#92400e", fontSize: "0.85rem" }}>
                  ประกาศ
                </Typography>
                <Typography variant="caption" sx={{ color: "#b45309", fontSize: "0.75rem" }}>
                  กรุณาตรวจสอบเนื้อหาเอกสารและไฟล์ให้ถูกต้อง
                </Typography>
              </Box>
            </Paper>
          </Paper>
        ) : (
          /* 🔴 กรณีที่ยังไม่ผ่านครบ หรือกดสลับมาดูตารางอัปโหลดปกติ */
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: "1px solid #e2e8f0",
              bgcolor: "#fff",
              mb: 2,
              flexGrow: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "auto",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#00423b", mb: 1.5, fontSize: "1.05rem" }}>
              อัปโหลดเอกสาร
            </Typography>
            <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e2e8f0", flexGrow: 1, overflowY: "auto" }}>
              <Table size="small" stickyHeader sx={{ minWidth: 600 }}>
                <TableHead>
                  <TableRow>
                    <TableCell align="center" sx={{ fontWeight: 600, color: "#000000", width: "8%", bgcolor: "#f8fafc" }}>
                      ลำดับ
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "#000000", width: SHOW_STATUS_COLUMN ? "42%" : "52%", bgcolor: "#f8fafc" }}>
                      เอกสาร
                    </TableCell>
                    {SHOW_STATUS_COLUMN && (
                      <TableCell align="center" sx={{ fontWeight: 600, color: "#000000", width: "18%", bgcolor: "#f8fafc" }}>
                        สถานะ
                      </TableCell>
                    )}
                    <TableCell align="center" sx={{ fontWeight: 600, color: "#000000", width: "22%", bgcolor: "#f8fafc" }}>
                      วันที่
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, color: "#000000", width: "18%", bgcolor: "#f8fafc" }}>
                      ดำเนินการ
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pageLoading ? (
                    <TableRow>
                      <TableCell colSpan={SHOW_STATUS_COLUMN ? 5 : 4} align="center" sx={{ py: 3 }}>
                        <CircularProgress size={24} sx={{ color: "#00423b" }} />
                      </TableCell>
                    </TableRow>
                  ) : (
                    documents.map((row) => (
                      <TableRow key={row.id} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                        <TableCell align="center">{row.id}</TableCell>
                        <TableCell>{row.name}</TableCell>
                        {SHOW_STATUS_COLUMN && <TableCell align="center">{renderStatusChip(row.status)}</TableCell>}
                        <TableCell align="center">
                          {row.date}
                        </TableCell>
                        <TableCell align="center">{renderActionButton(row)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* แถบปุ่มควบคุมด้านล่าง (ให้ระยะและฟอนต์ตรงกับ DocumentSummary) */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {isAllPassed ? (
            <Button
              variant="outlined"
              startIcon={<HistoryIcon />}
              onClick={() => setShowSuccessView(!showSuccessView)}
              sx={{
                borderColor: "#cbd5e1",
                color: "#334155",
                fontWeight: 700,
                borderRadius: 2,
                px: 2.5,
                "&:hover": { borderColor: "#00423b", bgcolor: "#f0fdf4" },
              }}
            >
              {showSuccessView ? "ดูรายละเอียด/จัดการเอกสาร" : "หน้าสรุปการอัปโหลด"}
            </Button>
          ) : (
            <Box />
          )}

          <Button
            variant="contained"
            disableElevation
            disabled={!isReadyToNext && !isAllPassed}
            onClick={handleGoToSummary}
            endIcon={<NavigateNextIcon />}
            sx={{
              bgcolor: isReadyToNext || isAllPassed ? "#00423b" : "#94a3b8",
              color: "#ffffff",
              fontWeight: 700,
              px: 3,
              py: 1,
              borderRadius: 2,
              cursor: isReadyToNext || isAllPassed ? "pointer" : "not-allowed",
              "&:hover": { bgcolor: isReadyToNext || isAllPassed ? "#002b26" : "#94a3b8" },
            }}
          >
            ขั้นตอนถัดไป
          </Button>
        </Box>

        {/* Dialog สำหรับอัปโหลดไฟล์ */}
        <Dialog open={openUploadModal} onClose={handleCloseModal} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 4, p: 2 } }}>
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <IconButton onClick={handleCloseModal} disabled={isLoading}><CloseIcon /></IconButton>
          </Box>
          <DialogContent sx={{ pt: 0 }}>
            <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
              <Grid item xs={12} sm="auto">
                <Typography variant="body1" sx={{ color: "#334155", fontWeight: 500 }}>เลือกประเภทนามสกุลไฟล์</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <FormControl fullWidth size="small">
                  <Select value={fileType} onChange={(e) => setFileType(e.target.value)}>
                    <MenuItem value="PDF">PDF</MenuItem>
                    <MenuItem value="JPG">JPG</MenuItem>
                    <MenuItem value="PNG">PNG</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm="auto">
                <Typography variant="body1" sx={{ color: "#334155", fontWeight: 500 }}>เลือกหัวข้อเอกสาร</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small" disabled>
                  <Select value={selectedDoc?.code || "1"}>
                    <MenuItem value={selectedDoc?.code || "1"}>{selectedDoc?.name}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Typography variant="h6" sx={{ fontWeight: 700, color: "#00423b", mb: 2 }}>
              อัปโหลดและตรวจสอบเอกสาร
            </Typography>

            <Box
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files[0]) validateAndSetFile(e.dataTransfer.files[0]);
              }}
              sx={{
                border: "2px dashed #cbd5e1",
                borderRadius: 3,
                p: 4,
                textAlign: "center",
                bgcolor: "#f8fafc",
                cursor: "pointer",
                "&:hover": { borderColor: "#00423b", bgcolor: "#f0fdf4" },
              }}
            >
              <Box sx={{ width: 50, height: 50, bgcolor: "#00423b", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", mb: 1.5 }}>
                <CloudUploadIcon sx={{ fontSize: 30, color: "#fff" }} />
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#334155", mb: 0.5 }}>ลากไฟล์มาวางที่นี่</Typography>
              <Typography variant="body2" sx={{ color: "#94a3b8", mb: 1.5 }}>หรือ</Typography>
              <Button
                variant="contained"
                component="label"
                disabled={isLoading}
                sx={{ bgcolor: "#007a5e", color: "#fff", fontWeight: 600, "&:hover": { bgcolor: "#00423b" } }}
              >
                เลือกไฟล์
                <input type="file" hidden accept={getAcceptFileType()} onChange={(e) => e.target.files?.[0] && validateAndSetFile(e.target.files[0])} />
              </Button>
              {selectedFile && (
                <Typography variant="body2" sx={{ color: "#007a5e", mt: 2, fontWeight: 600 }}>
                  ไฟล์ที่เลือก: {selectedFile.name}
                </Typography>
              )}
            </Box>

            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
              <Button
                variant="contained"
                onClick={handleSaveDocument}
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
                sx={{ bgcolor: "#007a5e", color: "#fff", fontWeight: 600, px: 4, "&:hover": { bgcolor: "#00423b" } }}
              >
                {isLoading ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
              </Button>
            </Box>
          </DialogContent>
        </Dialog>
      </Box>
    </Box>
  );
}

export default DocumentScanDashboard;