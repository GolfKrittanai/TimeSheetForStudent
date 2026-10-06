import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  useMediaQuery,
  useTheme,
  Chip,
  Select,
  MenuItem,
  FormControl,
} from "@mui/material";
import {
  CloudUpload as CloudUploadIcon,
  Close as CloseIcon,
  NavigateNext as NavigateNextIcon,
  DescriptionOutlined as DescriptionIcon,
  PersonOutlined as PersonIcon,
  BusinessOutlined as BusinessIcon,
  PhoneOutlined as PhoneIcon,
  EmailOutlined as EmailIcon,
  AssignmentIndOutlined as CardIcon,
  SchoolOutlined as SchoolIcon,
  WorkOutlined as WorkIcon,
  CalendarTodayOutlined as CalendarIcon,
  FactCheckOutlined as CheckStatusIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import {
  uploadAndScanDocument,
  getUserDocumentHistory,
  cancelUserDocument,
} from "../../services/documentScanService";

const RAW_API = process.env.REACT_APP_API || process.env.REACT_APP_API_URL || "http://localhost:5000";
const SERVER_BASE_URL = RAW_API.replace(/\/api\/?$/, "");

const BRAND_DARK = "#0b2b26";
const BRAND_CARD = "#081f1c";
const BRAND_GREEN = "#10b981";

const INITIAL_STEP2_DOCS = [
  { id: 1, code: "1", name: "เอกสารตอบกลับ (หน้า 1)", status: "ยังไม่ได้ส่ง", date: "...", fileUrl: null, dbId: null, extractedData: {} },
  { id: 2, code: "2", name: "เอกสารตอบกลับ (หน้า 2)", status: "ยังไม่ได้ส่ง", date: "...", fileUrl: null, dbId: null, extractedData: {} },
];

const STEPS = [
  { num: "1", title: "อัปโหลดเอกสาร", sub: "เลือกเอกสารที่ต้องการ", active: true },
  { num: "2", title: "สถานะ", sub: "รอการตรวจสอบ", active: false },
  { num: "3", title: "สำเร็จ", sub: "ผ่านการตรวจสอบ", active: false },
];

const DetailRow = ({ icon: Icon, value, label }) => (
  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 1.8 }}>
    <Icon sx={{ color: BRAND_GREEN, fontSize: 22, mt: 0.2 }} />
    <Box sx={{ flexGrow: 1, borderBottom: "1px solid rgba(255, 255, 255, 0.1)", pb: 0.6 }}>
      <Typography variant="body2" sx={{ fontWeight: 700, color: "#ffffff", fontSize: "0.85rem" }}>
        {value || "-"}
      </Typography>
      <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "0.72rem" }}>
        {label}
      </Typography>
    </Box>
  </Box>
);

function DocumentScanUpload2() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();

  const [step2Docs, setStep2Docs] = useState(INITIAL_STEP2_DOCS);
  const [pageLoading, setPageLoading] = useState(true);

  // โหลดค่า fileType ล่าสุดจาก localStorage (ถ้าไม่มีจะใช้ 'pdf')
  const [fileType, setFileType] = useState(() => {
    return localStorage.getItem("step2_file_type") || "pdf";
  });

  const [openPreviewModal, setOpenPreviewModal] = useState(false);
  const [selectedDocDetails, setSelectedDocDetails] = useState(null);
  const [uploadingDocId, setUploadingDocId] = useState(null);

  const fileInputRefs = useRef({});

  // บันทึกประเภทไฟล์ลง localStorage เมื่อเปลี่ยนตัวเลือก
  const handleFileTypeChange = (e) => {
    const newType = e.target.value;
    setFileType(newType);
    localStorage.setItem("step2_file_type", newType);
  };

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
        setStep2Docs((prevDocs) =>
          prevDocs.map((doc) => {
            const matchedLogs = historyData.filter((item) => {
              const url = (item.fileUrl || "").toLowerCase();
              const isPdfFile = url.endsWith(".pdf");

              // ✅ โหมด PDF
              if (fileType === "pdf") {
                if (!isPdfFile) return false;
                return (
                  item.docCategory === "เอกสารตอบกลับ (PDF)" ||
                  item.docCategory === "เอกสารตอบกลับ" ||
                  item.docCategory?.includes("ตอบกลับ")
                );
              }

              // ✅ โหมด รูปภาพ (JPG/PNG)
              if (isPdfFile) return false;
              if (doc.name.includes("หน้า 1")) {
                return (
                  item.docCategory === "เอกสารตอบกลับ (หน้า 1)" ||
                  (item.docCategory?.includes("ตอบกลับ") && item.docCategory?.includes("หน้า 1"))
                );
              } else if (doc.name.includes("หน้า 2")) {
                return (
                  item.docCategory === "เอกสารตอบกลับ (หน้า 2)" ||
                  (item.docCategory?.includes("ตอบกลับ") && item.docCategory?.includes("หน้า 2"))
                );
              }
              return item.docCategory === doc.name;
            });

            if (matchedLogs.length > 0) {
              matchedLogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
              const latest = matchedLogs[0];

              let parsedExtracted = latest.extractedData;
              if (typeof latest.extractedData === "string") {
                try {
                  parsedExtracted = JSON.parse(latest.extractedData);
                } catch (e) {
                  parsedExtracted = {};
                }
              }

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
                fileUrl: latest.fileUrl,
                dbId: latest.id,
                extractedData: parsedExtracted || {},
              };
            }
            return {
              ...doc,
              status: "ยังไม่ได้ส่ง",
              date: "...",
              fileUrl: null,
              dbId: null,
              extractedData: {},
            };
          })
        );
      }
    } catch (error) {
      console.error("Failed to load upload history:", error);
    } finally {
      setPageLoading(false);
    }
  }, [fileType]);

  useEffect(() => {
    loadLatestStatus();
  }, [loadLatestStatus]);

  const getFileFullUrl = (rawPath) => {
    if (!rawPath) return null;
    let cleanPath = String(rawPath).trim();
    if (/^https?:\/\//i.test(cleanPath) || cleanPath.startsWith("data:")) return cleanPath;
    cleanPath = cleanPath.replace(/\\/g, "/").replace(/^\/?(uploads\/)+/i, "");
    return `${SERVER_BASE_URL}/uploads/${cleanPath}`;
  };

  const handleDirectFileUpload = async (event, docTarget) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    setUploadingDocId(docTarget.id);
    try {
      const userId = getCurrentUserId();
      // ✅ ส่งชื่อ docCategory ตาม fileType ที่เลือก
      const categoryName = fileType === "pdf" ? "เอกสารตอบกลับ (PDF)" : docTarget.name;

      await uploadAndScanDocument(file, categoryName, userId);
      await loadLatestStatus();
    } catch (error) {
      console.error("Upload Error:", error);
      alert("เกิดข้อผิดพลาดในการอัปโหลดเอกสาร");
    } finally {
      setUploadingDocId(null);
      event.target.value = "";
    }
  };

  const handleCancelDocument = async (dbId) => {
    if (window.confirm("ต้องการยกเลิกการส่งเอกสารนี้?")) {
      if (dbId) {
        try {
          await cancelUserDocument(dbId);
          await loadLatestStatus();
        } catch (error) {
          alert("ไม่สามารถยกเลิกเอกสารได้");
        }
      }
    }
  };

  const triggerFileInput = (docId) => {
    if (fileInputRefs.current[docId]) {
      fileInputRefs.current[docId].click();
    }
  };

  const renderDocDetails = (doc) => {
    const data = doc?.extractedData || {};
    const type = doc?.name || "";

    if (type.includes("หน้า 1") || fileType === "pdf") {
      return (
        <>
          <DetailRow icon={PersonIcon} value={data.studentName} label="ชื่อนักศึกษา" />
          <DetailRow icon={CardIcon} value={data.studentId} label="รหัสนักศึกษา" />
          <DetailRow icon={SchoolIcon} value={data.branch} label="สาขาวิชา" />
          <DetailRow icon={BusinessIcon} value={data.companyName} label="ชื่อสถานประกอบการ" />
          <DetailRow icon={PersonIcon} value={data.coordinatorName} label="ชื่อผู้ประสานงาน" />
          <DetailRow icon={WorkIcon} value={data.position} label="ตำแหน่ง" />
          <DetailRow icon={PhoneIcon} value={data.phone} label="โทรศัพท์บริษัท" />
          <DetailRow icon={EmailIcon} value={data.email} label="อีเมล" />
          <DetailRow icon={CheckStatusIcon} value={data.responseStatus} label="ผลการตอบรับ (รับ/ไม่รับ)" />
        </>
      );
    } else {
      return (
        <>
          <DetailRow icon={DescriptionIcon} value={data.qualification} label="รายละเอียดคุณสมบัตินักศึกษา" />
          <DetailRow icon={WorkIcon} value={data.jobPosition} label="ตำแหน่งงาน" />
          <DetailRow icon={CalendarIcon} value={data.workDays} label="วันที่ทำงาน" />
        </>
      );
    }
  };

  // ✅ กำหนดรายการเอกสารที่ต้องแสดงตาม fileType
  const docsToDisplay = fileType === "pdf" ? [step2Docs[0]] : step2Docs;

  // ✅ ตรวจสอบสถานะการอัปโหลดจากเอกสารที่แสดงผลเท่านั้น
  const isAllUploaded = docsToDisplay.every((doc) => doc.status !== "ยังไม่ได้ส่ง");

  return (
    <Box sx={{ display: "flex", bgcolor: "#f8fafc", minHeight: "100vh" }}>
      <Sidebar />

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 2.5 }, fontFamily: '"Kanit", sans-serif' }}>
        {/* Stepper Header */}
        <Paper elevation={0} sx={{ p: 2.5, mb: 2, borderRadius: 3, border: "1px solid #e2e8f0" }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#00423b" }}>ขั้นตอนการใช้งาน</Typography>
          <Typography variant="caption" sx={{ color: "#64748b", mb: 2, display: "block" }}>
            เอกสารของท่านอยู่ระหว่างการตรวจสอบ
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "space-between", px: isSmallScreen ? 0 : 4 }}>
            {STEPS.map((step, idx) => (
              <React.Fragment key={step.num}>
                <Box sx={{ textAlign: "center" }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      bgcolor: step.active ? "#007a5e" : "#cbd5e1",
                      color: step.active ? "#fff" : "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      margin: "0 auto 4px",
                    }}
                  >
                    {step.num}
                  </Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, display: "block" }}>{step.title}</Typography>
                  <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.7rem" }}>{step.sub}</Typography>
                </Box>
                {idx < STEPS.length - 1 && <Box sx={{ flexGrow: 1, height: 2, bgcolor: "#cbd5e1", my: 2, mx: 2 }} />}
              </React.Fragment>
            ))}
          </Box>
        </Paper>

        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#00423b", mb: 0.2 }}>
          ขั้นตอน : เอกสารตอบรับจากสถานประกอบการ
        </Typography>
        <Typography variant="caption" sx={{ color: "#64748b", mb: 1.5, display: "block" }}>
          อัปโหลดเอกสารเพื่อให้ระบบตรวจสอบ
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2, flexWrap: "wrap" }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: "#475569" }}>
            เลือกประเภทเอกสารที่ต้องส่ง
          </Typography>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select
              value={fileType}
              onChange={handleFileTypeChange}
              sx={{
                bgcolor: "#fff",
                borderRadius: 2,
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#00423b",
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "#cbd5e1" },
              }}
            >
              <MenuItem value="pdf">PDF</MenuItem>
              <MenuItem value="image">รูปภาพ (JPG/PNG)</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="body2" sx={{ fontWeight: 600, color: "#475569", ml: { md: 2 } }}>
            เลือกประเภทเอกสาร
          </Typography>
          <Chip label="เอกสารตอบกลับ" sx={{ bgcolor: "#cbd5e1", color: "#475569", fontWeight: 600, borderRadius: 1 }} />
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          {docsToDisplay.map((doc) => {
            const isThisUploading = uploadingDocId === doc.id;

            return (
              <Grid item xs={12} md={fileType === "image" ? 6 : 12} key={doc.id}>
                <input
                  type="file"
                  ref={(el) => (fileInputRefs.current[doc.id] = el)}
                  style={{ display: "none" }}
                  accept={fileType === "pdf" ? ".pdf" : ".png,.jpg,.jpeg"}
                  onChange={(e) => handleDirectFileUpload(e, doc)}
                />

                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    border: "2px dashed #94a3b8",
                    bgcolor: "#fff",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: fileType === "image" ? 180 : 200,
                    height: "100%",
                    boxSizing: "border-box",
                    position: "relative",
                  }}
                >
                  {pageLoading || isThisUploading ? (
                    <Box sx={{ textAlign: "center", py: 2 }}>
                      <CircularProgress size={32} sx={{ color: "#00423b", mb: 1 }} />
                      <Typography variant="body2" sx={{ color: "#00423b", fontWeight: 600 }}>
                        {isThisUploading ? "กำลังอัปโหลดและสแกนเอกสาร..." : "กำลังโหลด..."}
                      </Typography>
                    </Box>
                  ) : doc.status !== "ยังไม่ได้ส่ง" ? (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}>
                      <DescriptionIcon sx={{ fontSize: 38, color: "#00423b" }} />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#0f172a" }}>
                          {fileType === "pdf" ? "เอกสารตอบกลับ (PDF)" : doc.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>
                          อัปโหลดเมื่อ {doc.date}
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleCancelDocument(doc.dbId)}
                        sx={{
                          bgcolor: "#d32f2f",
                          color: "#ffffff",
                          borderRadius: 2,
                          fontWeight: 600,
                          px: 2.5,
                          py: 0.6,
                          "&:hover": { bgcolor: "#9a0007" },
                        }}
                      >
                        ยกเลิก
                      </Button>
                    </Box>
                  ) : (
                    <Box
                      sx={{ textAlign: "center", cursor: "pointer", width: "100%", py: 1 }}
                      onClick={() => triggerFileInput(doc.id)}
                    >
                      <CloudUploadIcon sx={{ fontSize: fileType === "image" ? 44 : 52, color: "#00423b", mb: 0.5 }} />
                      <Typography variant={fileType === "image" ? "subtitle1" : "h6"} sx={{ fontWeight: 700, color: "#1e293b", mb: 0.5 }}>
                        {fileType === "pdf" ? "ลากไฟล์มาวางที่นี่" : `ลากไฟล์มาวางที่นี่ (${doc.name})`}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#64748b", display: "block", mb: 1 }}>
                        หรือ
                      </Typography>
                      <Button variant="outlined" size="small" sx={{ color: "#00423b", borderColor: "#00423b", fontWeight: 600, px: 2.5, py: 0.4 }}>
                        เลือกไฟล์
                      </Button>
                      <Typography variant="caption" sx={{ color: "#94a3b8", display: "block", mt: 1, fontSize: "0.7rem" }}>
                        {fileType === "pdf" ? "รองรับไฟล์ PDF (ขนาดไม่เกิน 10 MB)" : "รองรับไฟล์ JPG, PNG (ขนาดไม่เกิน 10 MB)"}
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>
            );
          })}
        </Grid>

        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
          <Button variant="outlined" onClick={() => navigate("/student/step2-dashboard")} sx={{ color: "#00423b", borderColor: "#00423b", fontWeight: 700, px: 3 }}>
            ย้อนกลับ
          </Button>
          <Button
            variant="contained"
            disabled={!isAllUploaded}
            onClick={() => navigate("/student/step2-summary")}
            sx={{ bgcolor: isAllUploaded ? "#00423b" : "#94a3b8" }}
            endIcon={<NavigateNextIcon />}
          >
            ติดตามสถานะ
          </Button>
        </Box>

        {/* Modal แสดงตัวอย่าง */}
        <Dialog
          open={openPreviewModal}
          onClose={() => setOpenPreviewModal(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 4,
              overflow: "hidden",
              maxWidth: 820,
              bgcolor: BRAND_DARK,
              border: "1px solid rgba(16, 185, 129, 0.2)",
            },
          }}
        >
          <Box sx={{ p: 2, px: 3, display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: BRAND_DARK, borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <DescriptionIcon sx={{ color: BRAND_GREEN, fontSize: 28 }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: "#ffffff" }}>
                รายละเอียดเอกสาร ({selectedDocDetails?.name})
              </Typography>
            </Box>
            <IconButton onClick={() => setOpenPreviewModal(false)} sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
              <CloseIcon />
            </IconButton>
          </Box>

          <DialogContent sx={{ p: 3, bgcolor: BRAND_DARK }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.5,
                    bgcolor: BRAND_CARD,
                    border: "1px solid rgba(16, 185, 129, 0.2)",
                    borderRadius: 3,
                    height: 460,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {getFileFullUrl(selectedDocDetails?.fileUrl)?.toLowerCase().includes(".pdf") ? (
                    <iframe src={getFileFullUrl(selectedDocDetails?.fileUrl)} title="PDF Preview" width="100%" height="100%" style={{ border: "none" }} />
                  ) : (
                    <Box component="img" src={getFileFullUrl(selectedDocDetails?.fileUrl)} alt="Preview" sx={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 2 }} />
                  )}
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "#ffffff", mb: 2 }}>
                    ข้อมูลที่สแกนได้
                  </Typography>
                  {renderDocDetails(selectedDocDetails)}
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
        </Dialog>
      </Box>
    </Box>
  );
}

export default DocumentScanUpload2;