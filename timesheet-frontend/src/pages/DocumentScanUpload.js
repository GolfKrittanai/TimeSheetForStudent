import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  MenuItem,
  Select,
  FormControl,
  Button,
  Grid,
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
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { uploadAndScanDocument, getUserDocumentHistory, cancelUserDocument } from "../services/documentScanService";

const INITIAL_DOCUMENTS = [
  { id: 1, code: "1", name: "BA Co-op 01 เอกสารติดต่องานสหกิจศึกษา", status: "ยังไม่ได้ส่ง", date: "..." },
  { id: 2, code: "2", name: "BA Co-op 02-1 เอกสารยินยอมจากผู้ปกครอง", status: "ยังไม่ได้ส่ง", date: "..." },
  { id: 3, code: "3", name: "BA Co-op 02-2 ใบสมัครงานสหกิจศึกษา", status: "ยังไม่ได้ส่ง", date: "..." },
  { id: 4, code: "4", name: "BA Co-op 04 เอกสารรายละเอียดที่พัก", status: "ยังไม่ได้ส่ง", date: "..." },
  { id: 5, code: "5", name: "BA Co-op 05 ผลการศึกษาฉบับ (ชั่วคราว)", status: "ยังไม่ได้ส่ง", date: "..." },
];

const STEPS = [
  { num: "1", title: "อัปโหลดเอกสาร", sub: "เลือกเอกสารที่ต้องการ", active: true },
  { num: "2", title: "ตรวจสอบ", sub: "ตรวจสอบผล", active: false },
  { num: "3", title: "สถานะ", sub: "รอการตรวจสอบ", active: false },
  { num: "4", title: "สำเร็จ", sub: "ผ่านการตรวจสอบ", active: false },
];

function DocumentScanUpload() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();

  const [documents, setDocuments] = useState(INITIAL_DOCUMENTS);
  const [pageLoading, setPageLoading] = useState(true);

  const [openUploadModal, setOpenUploadModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [fileType, setFileType] = useState("PDF");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // เช็กว่าอัปโหลดเอกสารครบทั้ง 5 รายการแล้วหรือไม่
  const isAllUploaded =
    documents.length === 5 &&
    documents.every((doc) => doc.status !== "ยังไม่ได้ส่ง");

  const loadLatestStatus = useCallback(async () => {
    try {
      setPageLoading(true);
      const historyData = await getUserDocumentHistory(1);

      if (historyData && Array.isArray(historyData)) {
        setDocuments((prevDocs) =>
          prevDocs.map((doc) => {
            const matchedLogs = historyData.filter(
              (item) => item.docCategory === doc.name
            );

            if (matchedLogs.length > 0) {
              const latest = matchedLogs[0];
              
              let mappedStatus = "รอตรวจสอบ";
              if (latest.status === "passed") mappedStatus = "ผ่าน";
              else if (latest.status === "failed") mappedStatus = "ไม่ผ่าน";
              else if (latest.status === "pending") mappedStatus = "รอตรวจสอบ";

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

  const getAcceptFileType = () => {
    switch (fileType) {
      case "JPG":
        return ".jpg,.jpeg";
      case "PNG":
        return ".png";
      case "PDF":
      default:
        return ".pdf";
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

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const validateAndSetFile = (file) => {
    if (!file) return;
    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      alert("ขนาดไฟล์เกิน 10 MB กรุณาเลือกไฟล์ใหม่");
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      validateAndSetFile(event.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      validateAndSetFile(event.target.files[0]);
    }
  };

  const handleSaveDocument = async () => {
    if (!selectedFile || !selectedDoc) {
      alert("กรุณาเลือกไฟล์เอกสารก่อนบันทึกข้อมูล");
      return;
    }

    setIsLoading(true);
    try {
      await uploadAndScanDocument(selectedFile, selectedDoc.name, 1);
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
    if (isAllUploaded) {
      navigate("/student/scan-summary");
    }
  };

  const renderStatusChip = (status) => {
    switch (status) {
      case "ผ่าน":
        return (
          <Chip
            icon={<CheckCircleIcon sx={{ fontSize: 16, color: "#166534 !important" }} />}
            label={status}
            size="small"
            sx={{ bgcolor: "#dcfce7", color: "#166534", fontWeight: 600 }}
          />
        );
      case "ไม่ผ่าน":
        return (
          <Chip
            icon={<CancelIcon sx={{ fontSize: 16, color: "#991b1b !important" }} />}
            label={status}
            size="small"
            sx={{ bgcolor: "#fee2e2", color: "#991b1b", fontWeight: 600 }}
          />
        );
      case "รอตรวจสอบ":
        return (
          <Chip
            icon={<AccessTimeIcon sx={{ fontSize: 16, color: "#9a3412 !important" }} />}
            label={status}
            size="small"
            sx={{ bgcolor: "#ffedd5", color: "#9a3412", fontWeight: 600 }}
          />
        );
      default:
        return (
          <Chip
            icon={<ErrorOutlineIcon sx={{ fontSize: 16, color: "#475569 !important" }} />}
            label="ยังไม่ได้ส่ง"
            size="small"
            sx={{ bgcolor: "#e2e8f0", color: "#475569", fontWeight: 600 }}
          />
        );
    }
  };

  return (
    <Box sx={{ display: "flex", bgcolor: "#f8fafc", height: "100vh", overflow: "hidden" }}>
      <Sidebar />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          fontFamily: '"Kanit", sans-serif',
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          boxSizing: "border-box",
        }}
      >
        {/* Card แสดงขั้นตอน 4 ขั้นตอน ด้านบน */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            mb: 2,
            borderRadius: 3,
            bgcolor: "#ffffff",
            border: "1px solid #e2e8f0",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#00423b", mb: 0.2, fontSize: "1.1rem" }}>
            ขั้นตอนการใช้งาน 4 ขั้นตอน
          </Typography>
          <Typography variant="caption" sx={{ color: "#64748b", mb: 2, display: "block" }}>
            เอกสารของท่านอยู่ระหว่างการตรวจสอบ
          </Typography>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: isSmallScreen ? 0 : 3,
            }}
          >
            {STEPS.map((step, idx) => (
              <React.Fragment key={step.num}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                  }}
                >
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      bgcolor: step.active ? "#facc15" : "#cbd5e1",
                      color: step.active ? "#000" : "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      mb: 0.5,
                      boxShadow: step.active ? "0 2px 8px rgba(250, 204, 21, 0.4)" : "none",
                    }}
                  >
                    {step.num}
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      color: "#1e293b",
                      fontSize: "0.8rem",
                    }}
                  >
                    {step.title}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "#64748b", fontSize: "0.7rem" }}
                  >
                    {step.sub}
                  </Typography>
                </Box>

                {idx < STEPS.length - 1 && (
                  <Box
                    sx={{
                      flexGrow: 1,
                      height: 2,
                      bgcolor: "#cbd5e1",
                      mx: 2,
                    }}
                  />
                )}
              </React.Fragment>
            ))}
          </Box>
        </Paper>

        {/* ตารางรายการเอกสาร (ส่วนกลาง - ยืดเต็มพื้นที่ที่เหลือ) */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid #e2e8f0",
            bgcolor: "#fff",
            mb: 2,
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <TableContainer sx={{ flexGrow: 1, overflowY: "auto" }}>
            <Table stickyHeader size="small" sx={{ minWidth: 600 }}>
              <TableHead>
                <TableRow>
                  <TableCell align="center" sx={{ fontWeight: 600, color: "#1e3a8a", width: 80, bgcolor: "#f8fafc" }}>
                    ลำดับ
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#1e3a8a", bgcolor: "#f8fafc" }}>เอกสาร</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, color: "#1e3a8a", bgcolor: "#f8fafc" }}>
                    สถานะ
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, color: "#1e3a8a", bgcolor: "#f8fafc" }}>
                    วันที่ตรวจสอบ
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, color: "#1e3a8a", width: 140, bgcolor: "#f8fafc" }}>
                    ดำเนินการ
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pageLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={28} sx={{ color: "#00423b" }} />
                    </TableCell>
                  </TableRow>
                ) : (
                  documents.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell align="center" sx={{ color: "#475569" }}>
                        {row.id}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500, color: "#334155" }}>{row.name}</TableCell>
                      <TableCell align="center">{renderStatusChip(row.status)}</TableCell>
                      <TableCell align="center" sx={{ color: "#475569", fontWeight: row.date === "..." ? 700 : 400 }}>
                        {row.date}
                      </TableCell>
                      <TableCell align="center">
                        {row.status === "รอตรวจสอบ" ? (
                          <Button
                            size="small"
                            onClick={async () => {
                              if (window.confirm("ต้องการยกเลิกการส่งเอกสารนี้?")) {
                                if (row.dbId) {
                                  try {
                                    await cancelUserDocument(row.dbId);
                                    loadLatestStatus();
                                  } catch (error) {
                                    alert("ไม่สามารถยกเลิกเอกสารได้");
                                  }
                                }
                              }
                            }}
                            sx={{
                              bgcolor: "#d32f2f",
                              color: "#ffffff",
                              borderRadius: 5,
                              px: 2,
                              py: 0.3,
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              textTransform: "none",
                              boxShadow: "none",
                              "&:hover": { bgcolor: "#9a0007" },
                            }}
                          >
                            ยกเลิก
                          </Button>
                        ) : (
                          <Button
                            size="small"
                            onClick={() => handleOpenUploadModal(row)}
                            sx={{
                              bgcolor: "#1e5245",
                              color: "#ffffff",
                              borderRadius: 5,
                              px: 2,
                              py: 0.3,
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              textTransform: "none",
                              boxShadow: "none",
                              "&:hover": { bgcolor: "#13372e" },
                            }}
                          >
                            {row.status === "ยังไม่ได้ส่ง" ? "อัปโหลด" : "อัปโหลดใหม่"}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* ปุ่มควบคุมด้านล่าง (จัดชิดขวา) */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            width: "100%",
          }}
        >
          {/* ปุ่มตรวจสอบเอกสาร */}
          <Button
            variant="contained"
            disableElevation
            disabled={!isAllUploaded}
            onClick={handleGoToSummary}
            sx={{
              bgcolor: isAllUploaded ? "#00423b" : "#94a3b8",
              color: "#ffffff",
              borderRadius: 2,
              px: 3,
              py: 0.8,
              textTransform: "none",
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              cursor: isAllUploaded ? "pointer" : "not-allowed",
              "&:hover": {
                bgcolor: isAllUploaded ? "#002b26" : "#94a3b8",
              },
              "&.Mui-disabled": {
                bgcolor: "#94a3b8",
                color: "#ffffff",
                opacity: 0.8,
              },
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.9rem", lineHeight: 1.2 }}>
                ตรวจสอบเอกสาร
              </Typography>
              <Typography variant="caption" sx={{ fontSize: "0.7rem", opacity: 0.8, fontWeight: 400 }}>
                เพื่อไปยังขั้นตอนถัดไป
              </Typography>
            </Box>
            <NavigateNextIcon sx={{ fontSize: "1.6rem" }} />
          </Button>
        </Box>

        {/* Modal อัปโหลดไฟล์ */}
        <Dialog
          open={openUploadModal}
          onClose={handleCloseModal}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: 4, p: 2 } }}
        >
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <IconButton onClick={handleCloseModal} disabled={isLoading}>
              <CloseIcon />
            </IconButton>
          </Box>
          <DialogContent sx={{ pt: 0 }}>
            <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
              <Grid item xs={12} sm="auto">
                <Typography variant="body1" sx={{ color: "#334155", fontWeight: 500 }}>
                  เลือกประเภทนามสกุลไฟล์
                </Typography>
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
                <Typography variant="body1" sx={{ color: "#334155", fontWeight: 500 }}>
                  เลือกหัวข้อเอกสาร
                </Typography>
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
              onDragOver={handleDragOver}
              onDrop={handleDrop}
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
              <Box
                sx={{
                  width: 50,
                  height: 50,
                  bgcolor: "#00423b",
                  borderRadius: "50%",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 1.5,
                }}
              >
                <CloudUploadIcon sx={{ fontSize: 30, color: "#fff" }} />
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#334155", mb: 0.5 }}>
                ลากไฟล์มาวางที่นี่
              </Typography>
              <Typography variant="body2" sx={{ color: "#94a3b8", mb: 1.5 }}>
                หรือ
              </Typography>
              <Button
                variant="contained"
                component="label"
                disabled={isLoading}
                sx={{ bgcolor: "#007a5e", color: "#fff" }}
              >
                เลือกไฟล์
                <input type="file" hidden accept={getAcceptFileType()} onChange={handleFileChange} />
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
                sx={{ bgcolor: "#005a45", color: "#fff", px: 4 }}
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

export default DocumentScanUpload;