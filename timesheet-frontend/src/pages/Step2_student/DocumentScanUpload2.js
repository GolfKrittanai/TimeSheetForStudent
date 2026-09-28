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
  Description as DescriptionIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import { uploadAndScanDocument, getUserDocumentHistory, cancelUserDocument } from "../../services/documentScanService";

const SHOW_STATUS_COLUMN = false;

const INITIAL_DOCUMENTS = [
  { id: 1, code: "1", name: "BA Co-op 01 เอกสารติดต่องานสหกิจศึกษา", status: "ยังไม่ได้ส่ง", date: "..." },
  { id: 2, code: "2", name: "BA Co-op 02-1 เอกสารยินยอมจากผู้ปกครอง", status: "ยังไม่ได้ส่ง", date: "..." },
  { id: 3, code: "3", name: "BA Co-op 02-2 ใบสมัครงานสหกิจศึกษา", status: "ยังไม่ได้ส่ง", date: "..." },
  { id: 4, code: "4", name: "BA Co-op 04 เอกสารรายละเอียดที่พัก", status: "ยังไม่ได้ส่ง", date: "..." },
  { id: 5, code: "5", name: "BA Co-op 05 ผลการศึกษาฉบับ (ชั่วคราว)", status: "ยังไม่ได้ส่ง", date: "..." },
];

const STEPS = [
  { num: "1", title: "อัปโหลดเอกสาร", sub: "เลือกเอกสารที่ต้องการ", active: true },
  { num: "2", title: "สถานะ", sub: "รอการตรวจสอบ", active: false },
  { num: "3", title: "สำเร็จ", sub: "ผ่านการตรวจสอบ", active: false },
];

function DocumentScanUpload2() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();

  const [documents, setDocuments] = useState(INITIAL_DOCUMENTS);
  const [pageLoading, setPageLoading] = useState(true);

  const [openUploadModal, setOpenUploadModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [fileType, setFileType] = useState("PNG");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const isAllUploaded =
    documents.length === 5 &&
    documents.every((doc) => doc.status !== "ยังไม่ได้ส่ง");

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
              if (latest.status === "passed") mappedStatus = "ผ่าน";
              else if (latest.status === "failed") mappedStatus = "ไม่ผ่าน";
              else if (latest.status === "pending") mappedStatus = "รอตรวจสอบ";

              const formattedDate = latest.createdAt
                ? new Date(latest.createdAt).toLocaleDateString("th-TH", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }) + " น."
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
    if (isAllUploaded) {
      navigate("/student/scan-summary");
    }
  };

  return (
    <Box sx={{ display: "flex", bgcolor: "#f8fafc", minHeight: "100vh" }}>
      <Sidebar />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          fontFamily: '"Kanit", sans-serif',
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
        }}
      >
        {/* ส่วนหัวขั้นตอนการใช้งาน */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 3,
            bgcolor: "#ffffff",
            border: "1px solid #e2e8f0",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#00423b", mb: 0.5, fontSize: "1.1rem" }}>
            ขั้นตอนการใช้งาน
          </Typography>
          <Typography variant="caption" sx={{ color: "#64748b", mb: 3, display: "block" }}>
            เอกสารของท่านอยู่ระหว่างการตรวจสอบ
          </Typography>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: isSmallScreen ? 0 : 4,
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
                      bgcolor: step.active ? "#facc15" : "#64748b",
                      color: step.active ? "#000" : "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      mb: 0.5,
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

                {idx < STEPS.length - 1 && (
                  <Box sx={{ flexGrow: 1, height: 2, bgcolor: "#64748b", mx: 3 }} />
                )}
              </React.Fragment>
            ))}
          </Box>
        </Paper>

        {/* ส่วนหัวข้อหัวข้อย่อย */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#00423b", fontSize: "1rem" }}>
            ขั้นตอน : เอกสารตอบกลับจากสถานประกอบการ
          </Typography>
          <Typography variant="caption" sx={{ color: "#64748b" }}>
            เมื่อสถานประกอบการพิจารณาแล้ว จะออกเอกสารตอบกลับ
          </Typography>
        </Box>

        {/* ส่วนเลือกประเภทเอกสารและฟอร์มกล่องอัปโหลด */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2, flexWrap: "wrap" }}>
          <Typography variant="body2" sx={{ color: "#334155", fontWeight: 500 }}>
            เลือกประเภทเอกสารที่ต้องส่ง
          </Typography>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <Select value={fileType} onChange={(e) => setFileType(e.target.value)}>
              <MenuItem value="PDF">PDF</MenuItem>
              <MenuItem value="JPG">JPG</MenuItem>
              <MenuItem value="PNG">PNG</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="body2" sx={{ color: "#334155", fontWeight: 500, ml: 2 }}>
            เลือกประเภทเอกสาร
          </Typography>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <Select value="เอกสารตอบกลับ" disabled>
              <MenuItem value="เอกสารตอบกลับ">เอกสารตอบกลับ</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* พื้นที่กล่องอัปโหลดหรือแสดงสถานะสำเร็จ */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "2px dashed #94a3b8",
            bgcolor: "#fff",
            p: 6,
            textAlign: "center",
            mb: 3,
          }}
        >
          {pageLoading ? (
            <CircularProgress size={32} sx={{ color: "#00423b" }} />
          ) : documents[0]?.status !== "ยังไม่ได้ส่ง" && documents[0]?.status !== "ไม่ผ่าน" ? (
            /* กรณีอัปโหลดสำเร็จแล้ว แสดงหน้าตาตามภาพตัวอย่างที่ 2 */
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <Box sx={{ display: "flex", width: "100%", alignItems: "flex-start", textAlign: "left", gap: 3 }}>
                <Box
                  sx={{
                    width: 60,
                    height: 75,
                    bgcolor: "#e2e8f0",
                    borderRadius: 1.5,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                  }}
                >
                  <DescriptionIcon sx={{ fontSize: 40, color: "#64748b" }} />
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1e293b", fontSize: "0.95rem" }}>
                    เอกสารตอบกลับ
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#64748b", display: "block", mb: 1.5 }}>
                    อัปโหลดเมื่อ {documents[0]?.date || "19 มกราคม 2569 เวลา 14.25 น."}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>
                    ประเภทเอกสาร
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#334155", fontWeight: 500, fontSize: "0.85rem" }}>
                    เอกสารตอบกลับจากสถานประกอบการ
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Button
                    variant="contained"
                    size="small"
                    sx={{
                      bgcolor: "#00423b",
                      color: "#fff",
                      textTransform: "none",
                      fontWeight: 600,
                      borderRadius: 2,
                      px: 3,
                      boxShadow: "none",
                      "&:hover": { bgcolor: "#002b26" },
                    }}
                  >
                    ดูเอกสาร
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleOpenUploadModal(documents[0])}
                    sx={{
                      bgcolor: "#007a5e",
                      color: "#fff",
                      textTransform: "none",
                      fontWeight: 600,
                      borderRadius: 2,
                      px: 3,
                      boxShadow: "none",
                      "&:hover": { bgcolor: "#00423b" },
                    }}
                  >
                    อัปโหลดใหม่
                  </Button>
                </Box>
              </Box>
            </Box>
          ) : (
            /* กรณีเริ่มต้นยังไม่ได้อัปโหลดไฟล์ แสดงกล่องให้เลือกไฟล์ */
            <Box
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              sx={{ cursor: "pointer" }}
              onClick={() => handleOpenUploadModal(documents[0])}
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
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#334155", mb: 0.5 }}>
                ลากไฟล์มาวางที่นี่
              </Typography>
              <Typography variant="body2" sx={{ color: "#94a3b8", mb: 1.5 }}>
                หรือ
              </Typography>
              <Button
                variant="outlined"
                sx={{
                  color: "#00423b",
                  borderColor: "#00423b",
                  fontWeight: 600,
                  borderRadius: 2,
                  mb: 2,
                  "&:hover": { borderColor: "#002b26", bgcolor: "#f0fdf4" },
                }}
              >
                เลือกไฟล์
              </Button>
              <Typography variant="caption" sx={{ color: "#94a3b8", display: "block" }}>
                รองรับไฟล์ JPG, PNG (ขนาดไม่เกิน 10 MB)
              </Typography>
            </Box>
          )}
        </Paper>

        {/* ปุ่มด้านล่าง (ย้อนกลับ / ติดตามสถานะ) */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            mt: "auto",
          }}
        >
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{
              color: "#00423b",
              borderColor: "#00423b",
              borderRadius: 2,
              px: 3,
              py: 0.8,
              textTransform: "none",
              fontWeight: 600,
              "&:hover": { borderColor: "#002b26", bgcolor: "#f0fdf4" },
            }}
          >
            ย้อนกลับ
          </Button>

          <Button
            variant="contained"
            disableElevation
            disabled={!isAllUploaded}
            onClick={handleGoToSummary}
            sx={{
              bgcolor: isAllUploaded ? "#00423b" : "#00423b",
              color: "#ffffff",
              borderRadius: 2,
              px: 3,
              py: 0.8,
              textTransform: "none",
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              "&:hover": {
                bgcolor: "#002b26",
              },
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.9rem", lineHeight: 1.2 }}>
                ติดตามสถานะ
              </Typography>
              <Typography variant="caption" sx={{ fontSize: "0.7rem", opacity: 0.8, fontWeight: 400 }}>
                เพื่อไปยังขั้นตอนถัดไป
              </Typography>
            </Box>
            <NavigateNextIcon sx={{ fontSize: "1.6rem" }} />
          </Button>
        </Box>

        {/* Modal สำหรับอัปโหลดไฟล์ */}
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
                sx={{ 
                  bgcolor: "#007a5e", 
                  color: "#fff",
                  fontWeight: 600,
                  "&:hover": { bgcolor: "#00423b" },
                }}
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
                sx={{ 
                  bgcolor: "#007a5e", 
                  color: "#fff",
                  fontWeight: 600,
                  "&:hover": { bgcolor: "#00423b" },
                  px: 4,
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

export default DocumentScanUpload2;