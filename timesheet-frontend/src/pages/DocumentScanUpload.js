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
  Info as InfoIcon,
  Close as CloseIcon,
  HourglassEmpty as HourglassEmptyIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";
import Sidebar from "../components/Sidebar";
import { uploadAndScanDocument, getUserDocumentHistory } from "../services/documentScanService";

const INITIAL_DOCUMENTS = [
  { id: 1, code: "1", name: "BA Co-op 01: เอกสารติดต่อสหกิจศึกษา", status: "ยังไม่ได้ส่ง", date: "..." },
  { id: 2, code: "2", name: "BA Co-op 02-1: หนังสือยินยอมผู้ปกครอง", status: "ยังไม่ได้ส่ง", date: "..." },
  { id: 3, code: "3", name: "BA Co-op 02-2: ใบสมัครงานสหกิจ", status: "ยังไม่ได้ส่ง", date: "..." },
  { id: 4, code: "4", name: "BA Co-op 04-1: รายละเอียดที่พัก", status: "ยังไม่ได้ส่ง", date: "..." },
  { id: 5, code: "5", name: "เอกสารรายงานผลการศึกษา (ฉบับชั่วคราว)", status: "ยังไม่ได้ส่ง", date: "..." },
];

function DocumentScanUpload() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [documents, setDocuments] = useState(INITIAL_DOCUMENTS);
  const [pageLoading, setPageLoading] = useState(true);

  // State สำหรับ Modal Popup
  const [openUploadModal, setOpenUploadModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [fileType, setFileType] = useState("PDF");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // ฟังก์ชันดึงประวัติมา Sync กับตารางอัปโหลด
  const loadLatestStatus = useCallback(async () => {
    try {
      setPageLoading(true);
      const historyData = await getUserDocumentHistory(1);

      if (historyData && Array.isArray(historyData)) {
        setDocuments((prevDocs) =>
          prevDocs.map((doc) => {
            // ค้นหารายการล่าสุดของเอกสารหมวดนี้ใน Database
            const matchedLogs = historyData.filter(
              (item) => item.docCategory === doc.name
            );

            if (matchedLogs.length > 0) {
              const latest = matchedLogs[0]; // ประวัติเรียงจากล่าสุดก่อน
              
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
              };
            }
            return doc;
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
      // เมื่ออัปโหลดสำเร็จ ดึงข้อมูลใหม่จาก Database
      await loadLatestStatus();
      handleCloseModal();
    } catch (error) {
      console.error("Upload Error:", error);
      alert("เกิดข้อผิดพลาดในการอัปโหลดเอกสาร");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStatusChip = (status) => {
    if (status === "รอตรวจสอบ") {
      return (
        <Chip
          icon={<HourglassEmptyIcon sx={{ fontSize: 16, color: "#eab308 !important" }} />}
          label="รอตรวจสอบ"
          size="small"
          sx={{ bgcolor: "#fef9c3", color: "#854d0e", fontWeight: 600 }}
        />
      );
    } else if (status === "ผ่าน") {
      return (
        <Chip
          icon={<CheckCircleIcon sx={{ fontSize: 16, color: "#16a34a !important" }} />}
          label="ผ่าน"
          size="small"
          sx={{ bgcolor: "#dcfce7", color: "#15803d", fontWeight: 600 }}
        />
      );
    } else if (status === "ไม่ผ่าน") {
      return (
        <Chip
          icon={<CancelIcon sx={{ fontSize: 16, color: "#dc2626 !important" }} />}
          label="ไม่ผ่าน"
          size="small"
          sx={{ bgcolor: "#fee2e2", color: "#991b1b", fontWeight: 600 }}
        />
      );
    }
    return (
      <Chip
        icon={<InfoIcon sx={{ fontSize: 16, color: "#757575 !important" }} />}
        label="ยังไม่ได้ส่ง"
        size="small"
        sx={{ bgcolor: "#eee", color: "#616161", fontWeight: 600 }}
      />
    );
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
        <Typography variant="h5" sx={{ fontWeight: 700, color: "#00423b", mb: 3 }}>
          อัปโหลดเอกสารก่อนสหกิจ
        </Typography>

        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            border: "1px solid #e2e8f0",
            bgcolor: "#fff",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#00423b", mb: 2 }}>
            เอกสารที่เกี่ยวข้อง
          </Typography>

          <TableContainer>
            <Table sx={{ minWidth: 600 }}>
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
                {pageLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={28} sx={{ color: "#007a5e" }} />
                    </TableCell>
                  </TableRow>
                ) : (
                  documents.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell align="center" sx={{ color: "#475569" }}>
                        {row.id}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500, color: "#334155" }}>
                        {row.name}
                      </TableCell>
                      <TableCell align="center">
                        {renderStatusChip(row.status)}
                      </TableCell>
                      <TableCell align="center" sx={{ color: "#64748b" }}>
                        {row.date}
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          onClick={() => handleOpenUploadModal(row)}
                          sx={{
                            bgcolor: "#00423b",
                            color: "#ffffff",
                            borderRadius: 2,
                            px: 2.5,
                            py: 0.5,
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            textTransform: "none",
                            "&:hover": {
                              bgcolor: "#002b26",
                            },
                          }}
                        >
                          {row.status === "ยังไม่ได้ส่ง" ? "อัปโหลด" : "อัปโหลดใหม่"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Dialog
          open={openUploadModal}
          onClose={handleCloseModal}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 4, p: 2, fontFamily: '"Kanit", sans-serif' },
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "flex-end", pr: 1, pt: 1 }}>
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
                  <Select
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value)}
                    sx={{ bgcolor: "#fff", borderRadius: 1.5, fontSize: "0.9rem" }}
                  >
                    <MenuItem value="PDF">PDF</MenuItem>
                    <MenuItem value="JPG">JPG</MenuItem>
                    <MenuItem value="PNG">PNG</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm="auto" sx={{ ml: { sm: 2 } }}>
                <Typography variant="body1" sx={{ color: "#334155", fontWeight: 500 }}>
                  เลือกหัวข้อเอกสาร
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small" disabled>
                  <Select
                    value={selectedDoc?.code || "1"}
                    sx={{ bgcolor: "#f1f5f9", borderRadius: 1.5, fontSize: "0.9rem" }}
                  >
                    <MenuItem value={selectedDoc?.code || "1"}>
                      {selectedDoc?.name}
                    </MenuItem>
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
                p: 5,
                textAlign: "center",
                bgcolor: "#f8fafc",
                cursor: "pointer",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  borderColor: "#00423b",
                  bgcolor: "#f0fdf4",
                },
              }}
            >
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  bgcolor: "#00423b",
                  borderRadius: "50%",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 2,
                }}
              >
                <CloudUploadIcon sx={{ fontSize: 35, color: "#fff" }} />
              </Box>

              <Typography variant="h6" sx={{ fontWeight: 600, color: "#334155", mb: 1 }}>
                ลากไฟล์มาวางที่นี่
              </Typography>

              <Typography variant="body2" sx={{ color: "#94a3b8", mb: 2 }}>
                หรือ
              </Typography>

              <Button
                variant="contained"
                component="label"
                disabled={isLoading}
                sx={{
                  bgcolor: "#007a5e",
                  color: "#fff",
                  px: 4,
                  py: 1,
                  borderRadius: 2,
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  textTransform: "none",
                  boxShadow: "none",
                  "&:hover": { bgcolor: "#005a45" },
                }}
              >
                เลือกไฟล์
                <input
                  type="file"
                  hidden
                  accept={getAcceptFileType()}
                  onChange={handleFileChange}
                />
              </Button>

              {selectedFile && (
                <Typography variant="body2" sx={{ color: "#007a5e", mt: 2, fontWeight: 600 }}>
                  ไฟล์ที่เลือก: {selectedFile.name}
                </Typography>
              )}

              <Typography variant="body2" sx={{ color: "#64748b", mt: 2, fontWeight: 500 }}>
                รองรับไฟล์ {fileType} (ขนาดไม่เกิน 10 MB)
              </Typography>
            </Box>

            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
              <Button
                variant="contained"
                onClick={handleSaveDocument}
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
                sx={{
                  bgcolor: "#005a45",
                  color: "#fff",
                  px: 4,
                  py: 1.2,
                  borderRadius: 2,
                  fontWeight: 600,
                  fontSize: "1rem",
                  textTransform: "none",
                  boxShadow: "none",
                  "&:hover": { bgcolor: "#00423b" },
                }}
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