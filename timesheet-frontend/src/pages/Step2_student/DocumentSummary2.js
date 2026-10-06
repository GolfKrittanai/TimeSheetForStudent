import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Dialog,
  DialogContent,
  IconButton,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
} from "@mui/material";
import {
  ArrowBackIosNew as ArrowBackIosNewIcon,
  NavigateNext as NavigateNextIcon,
  Close as CloseIcon,
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
  Check as CheckIcon,
  NotificationsNoneOutlined as NotificationsIcon,
  PriorityHigh as PriorityHighIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import { getUserDocumentHistory } from "../../services/documentScanService";

const RAW_API = process.env.REACT_APP_API || process.env.REACT_APP_API_URL || "http://localhost:5000";
const SERVER_BASE_URL = RAW_API.replace(/\/api\/?$/, "");

const STEPS = [
  { num: 1, title: "เตรียมเอกสาร", sub: "เลือกเอกสารที่ต้องการ" },
  { num: 2, title: "สถานะ", sub: "รอการตรวจสอบ" },
  { num: 3, title: "สำเร็จ", sub: "ผ่านการตรวจสอบ" },
];

const BRAND_DARK = "#0b2b26";
const BRAND_CARD = "#081f1c";
const BRAND_GREEN = "#10b981";

const DetailRow = ({ icon: Icon, value, label }) => (
  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 1.5 }}>
    <Icon sx={{ color: BRAND_GREEN, fontSize: 22, mt: 0.2 }} />
    <Box sx={{ flexGrow: 1, borderBottom: "1px solid rgba(255, 255, 255, 0.1)", pb: 0.5 }}>
      <Typography variant="body2" sx={{ fontWeight: 700, color: "#ffffff", fontSize: "0.85rem" }}>
        {value || "-"}
      </Typography>
      <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "0.72rem" }}>
        {label}
      </Typography>
    </Box>
  </Box>
);

function DocumentSummary2() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(2);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openModal, setOpenModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);

  // ✅ 1. โหลดประเภทไฟล์จาก localStorage (ค่าเริ่มต้นเป็น 'pdf')
  const fileType = localStorage.getItem("step2_file_type") || "pdf";

  const getCurrentUserId = () => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    return storedUser.id || storedUser.userId || 1;
  };

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const userId = getCurrentUserId();
      const res = await getUserDocumentHistory(userId);
      const historyData = Array.isArray(res) ? res : res?.data || res?.documents || [];

      // ✅ 2. กำหนดรายการเป้าหมายตามประเภทไฟล์ (PDF = 1 รายการ, Image = 2 รายการ)
      const targets =
        fileType === "pdf"
          ? [{ code: "1", name: "เอกสารตอบกลับ (PDF)" }]
          : [
              { code: "1", name: "เอกสารตอบกลับ (หน้า 1)" },
              { code: "2", name: "เอกสารตอบกลับ (หน้า 2)" },
            ];

      if (Array.isArray(historyData) && historyData.length > 0) {
        const mappedDocs = targets.map((target, index) => {
          const matchedLogs = historyData.filter((item) => {
            const url = (item.fileUrl || "").toLowerCase();
            const isPdfFile = url.endsWith(".pdf");

            // กรองนามสกุลให้ตรงกับโหมด
            if (fileType === "pdf" && !isPdfFile) return false;
            if (fileType === "image" && isPdfFile) return false;

            if (fileType === "pdf") {
              return true; // โหมด PDF ดึงไฟล์ PDF ล่าสุดมาเลย
            }

            if (target.code === "1") {
              return (
                item.docCategory === "เอกสารตอบกลับ (หน้า 1)" ||
                (item.docCategory?.includes("ตอบกลับ") && item.docCategory?.includes("หน้า 1"))
              );
            } else if (target.code === "2") {
              return (
                item.docCategory === "เอกสารตอบกลับ (หน้า 2)" ||
                (item.docCategory?.includes("ตอบกลับ") && item.docCategory?.includes("หน้า 2"))
              );
            }
            return item.docCategory === target.name;
          });

          if (matchedLogs.length > 0) {
            matchedLogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            const latestDoc = matchedLogs[0];

            let parsedExtracted = latestDoc.extractedData;
            if (typeof latestDoc.extractedData === "string") {
              try {
                parsedExtracted = JSON.parse(latestDoc.extractedData);
              } catch (e) {
                parsedExtracted = {};
              }
            }

            let mappedStatus = "รอการตรวจสอบ";
            if (latestDoc.status === "passed") mappedStatus = "สำเร็จ";
            else if (latestDoc.status === "failed") mappedStatus = "ไม่ผ่าน";
            else if (latestDoc.status === "pending") mappedStatus = "รอการตรวจสอบ";

            return {
              id: index + 1,
              code: target.code,
              name: target.name,
              status: mappedStatus,
              fileUrl: latestDoc.fileUrl,
              extractedData: parsedExtracted || {},
              createdAt: latestDoc.createdAt,
            };
          }

          return {
            id: index + 1,
            code: target.code,
            name: target.name,
            status: "ยังไม่ได้ส่ง",
            fileUrl: null,
            extractedData: {},
          };
        });

        setDocuments(mappedDocs);
      } else {
        setDocuments(
          targets.map((target, index) => ({
            id: index + 1,
            code: target.code,
            name: target.name,
            status: "ยังไม่ได้ส่ง",
            fileUrl: null,
            extractedData: {},
          }))
        );
      }
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setLoading(false);
    }
  }, [fileType]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleBack = () => {
    if (activeStep === 2) {
      navigate("/student/step2-upload");
    } else {
      setActiveStep(2);
    }
  };

  const handleNext = () => {
    if (activeStep === 2) {
      setOpenConfirmModal(true);
    } else if (activeStep === 3) {
      navigate("/student");
    }
  };

  const handleConfirmNext = () => {
    setOpenConfirmModal(false);
    setActiveStep(3);
  };

  const getFileFullUrl = (doc) => {
    if (!doc) return null;
    const rawPath = doc.fileUrl;
    if (!rawPath) return null;

    let cleanPath = String(rawPath).trim();
    if (/^https?:\/\//i.test(cleanPath) || cleanPath.startsWith("data:")) return cleanPath;
    cleanPath = cleanPath.replace(/\\/g, "/").replace(/^\/?(uploads\/)+/i, "");
    return `${SERVER_BASE_URL}/uploads/${cleanPath}`;
  };

  const isPassed = documents.length > 0 && documents.every((doc) => doc.status === "สำเร็จ");

  const renderDocDetails = (doc) => {
    const data = doc?.extractedData || {};
    const docName = doc?.name || "";

    if (docName.includes("หน้า 2")) {
      return (
        <>
          <DetailRow icon={DescriptionIcon} value={data.qualification} label="รายละเอียดคุณสมบัตินักศึกษา" />
          <DetailRow icon={WorkIcon} value={data.jobPosition} label="ตำแหน่งงาน" />
          <DetailRow icon={CalendarIcon} value={data.workDays} label="วันที่ทำงาน" />
        </>
      );
    }

    return (
      <>
        <DetailRow icon={PersonIcon} value={data.studentName} label="ชื่อนักศึกษา" />
        <DetailRow icon={CardIcon} value={data.studentId} label="รหัสนักศึกษา" />
        <DetailRow icon={SchoolIcon} value={data.branch} label="สาขาวิชา" />
        <DetailRow icon={BusinessIcon} value={data.companyName} label="ชื่อสถานประกอบการ" />
        <DetailRow icon={PersonIcon} value={data.coordinatorName} label="ชื่อผู้ประสานงาน" />
        <DetailRow icon={WorkIcon} value={data.position || data.jobPosition} label="ตำแหน่ง" />
        <DetailRow icon={PhoneIcon} value={data.phone} label="โทรศัพท์บริษัท" />
        <DetailRow icon={EmailIcon} value={data.email} label="อีเมล" />
        <DetailRow icon={CheckStatusIcon} value={data.responseStatus} label="ผลการตอบรับ (รับ/ไม่รับ)" />
      </>
    );
  };

  const renderStep2Content = () => (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Typography variant="h6" sx={{ fontWeight: 800, color: "#00423b", mb: 1.5 }}>
        ติดตามสถานะ ({fileType === "pdf" ? "ไฟล์ PDF" : "ไฟล์รูปภาพ"})
      </Typography>
      <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #f1f5f9", flexGrow: 1 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "#f8fafc" }}>
              <TableCell align="center" sx={{ fontWeight: 600, color: "#475569", py: 1.5 }}>ลำดับ</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, color: "#475569", py: 1.5 }}>Co-op</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, color: "#475569", py: 1.5 }}>สถานะ</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, color: "#475569", py: 1.5 }}>ดำเนินการ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id} hover>
                <TableCell align="center" sx={{ color: "#334155", py: 1.5 }}>{doc.code}</TableCell>
                <TableCell align="center" sx={{ color: "#334155", py: 1.5 }}>{doc.name}</TableCell>
                <TableCell align="center" sx={{ py: 1.5 }}>
                  {doc.status === "สำเร็จ" ? (
                    <Chip
                      label="สำเร็จ"
                      size="small"
                      sx={{ bgcolor: "#86efac", color: "#166534", fontWeight: 700, px: 1.5, borderRadius: "16px" }}
                    />
                  ) : doc.status === "รอการตรวจสอบ" ? (
                    <Chip
                      label="รอการตรวจสอบ"
                      size="small"
                      sx={{ bgcolor: "#fde047", color: "#854d0e", fontWeight: 700, px: 1.5, borderRadius: "16px" }}
                    />
                  ) : (
                    <Chip
                      label="ยังไม่ได้ส่ง"
                      size="small"
                      sx={{ bgcolor: "#e2e8f0", color: "#64748b", fontWeight: 700, px: 1.5, borderRadius: "16px" }}
                    />
                  )}
                </TableCell>
                <TableCell align="center" sx={{ py: 1.5 }}>
                  {doc.fileUrl ? (
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => {
                        setSelectedDoc(doc);
                        setOpenModal(true);
                      }}
                      sx={{
                        bgcolor: "#005a4e",
                        color: "#fff",
                        borderRadius: "20px",
                        px: 2,
                        py: 0.5,
                        fontWeight: 600,
                        textTransform: "none",
                        "&:hover": { bgcolor: "#00423b" },
                      }}
                    >
                      ดูรายละเอียด
                    </Button>
                  ) : (
                    <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                      ไม่มีไฟล์
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderStep3Content = () => (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", py: 1 }}>
      <Typography variant="h5" sx={{ fontWeight: 800, color: "#00423b", mb: 0.5, textAlign: "center" }}>
        ดำเนินการเสร็จสิ้น
      </Typography>
      <Typography variant="body2" sx={{ color: "#64748b", mb: 2, textAlign: "center" }}>
        ระบบตรวจสอบเสร็จเรียบร้อย
      </Typography>

      <Paper
        elevation={0}
        sx={{
          p: 3, borderRadius: 4, border: "1px solid #e2e8f0", bgcolor: "#ffffff", textAlign: "center", maxWidth: 480, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.03)", mb: 2,
        }}
      >
        <Box sx={{ width: 64, height: 64, borderRadius: "50%", bgcolor: "#f0fdf4", border: "3px solid #22c55e", color: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center", mb: 1.5 }}>
          <CheckIcon sx={{ fontSize: 38, stroke: "#22c55e", strokeWidth: 1.5 }} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 800, color: "#00423b", mb: 0.5 }}>
          อัปโหลดเอกสารสำเร็จ
        </Typography>
        <Typography variant="body2" sx={{ color: "#64748b", lineHeight: 1.5, fontSize: "0.85rem" }}>
          เอกสารของท่านถูกส่งเข้าสู่ระบบตรวจสอบเรียบร้อยแล้ว <br />
          ท่านสามารถตรวจสอบสถานะและผลการตรวจสอบได้ในภายหลัง
        </Typography>
      </Paper>

      <Paper
        elevation={0}
        sx={{ p: 1.5, px: 2.5, borderRadius: 3, bgcolor: "#fffbeb", border: "1px solid #fef3c7", maxWidth: 480, width: "100%", display: "flex", alignItems: "center", gap: 1.5 }}
      >
        <NotificationsIcon sx={{ color: "#d97706", fontSize: 24 }} />
        <Box sx={{ textAlign: "left" }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#92400e", fontSize: "0.85rem" }}>
            ประกาศ
          </Typography>
          <Typography variant="caption" sx={{ color: "#b45309", fontSize: "0.78rem" }}>
            กรุณาตรวจสอบเนื้อหาเอกสารและไฟล์ให้ถูกต้อง
          </Typography>
        </Box>
      </Paper>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", bgcolor: "#f8fafc", minHeight: "100vh" }}>
      <Sidebar />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 2.5 },
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          boxSizing: "border-box",
        }}
      >
        {/* Step Stepper Header */}
        <Paper elevation={0} sx={{ p: 2, px: 3, mb: 2, borderRadius: 3, bgcolor: "#ffffff", border: "1px solid #e2e8f0" }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#00423b", mb: 0.2 }}>
            ขั้นตอนการใช้งาน
          </Typography>
          <Typography variant="caption" sx={{ color: "#64748b", mb: 2, display: "block" }}>
            เอกสารของท่านอยู่ระหว่างการตรวจสอบ
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: { xs: 0, md: 4 } }}>
            {STEPS.map((step, idx) => {
              const isCurrent = step.num === activeStep;
              const isDone = step.num < activeStep;

              return (
                <React.Fragment key={step.num}>
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        bgcolor: isCurrent ? "#007a5e" : isDone ? "#007a5e" : "#94a3b8",
                        color: isCurrent ? "#fff" : "#fff",
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
                    <Box sx={{ flexGrow: 1, height: 3, bgcolor: isDone ? "#007a5e" : "#cbd5e1", mx: 2 }} />
                  )}
                </React.Fragment>
              );
            })}
          </Box>
        </Paper>

        {/* Dynamic Content */}
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #e2e8f0", bgcolor: "#fff", mb: 2, flexGrow: 1, display: "flex", flexDirection: "column" }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
              <CircularProgress color="success" />
            </Box>
          ) : (
            <>
              {activeStep === 2 && renderStep2Content()}
              {activeStep === 3 && renderStep3Content()}
            </>
          )}
        </Paper>

        {/* Bottom Actions */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Button
            variant="outlined"
            onClick={handleBack}
            startIcon={<ArrowBackIosNewIcon sx={{ fontSize: "0.85rem !important" }} />}
            sx={{
              borderColor: "#00423b",
              color: "#00423b",
              fontWeight: 700,
              borderRadius: 2,
              px: 3,
              py: 0.8,
              "&:hover": { borderColor: "#002b26", bgcolor: "#f0fdf4" },
            }}
          >
            {activeStep === 3 ? "กลับสถานะ" : "กลับหน้าแรก"}
          </Button>

          <Button
            variant="contained"
            disabled={activeStep === 2 && !isPassed}
            onClick={handleNext}
            endIcon={<NavigateNextIcon />}
            sx={{
              bgcolor: activeStep === 2 && !isPassed ? "#525252" : "#00423b",
              color: "#ffffff",
              fontWeight: 700,
              borderRadius: 2,
              px: 3,
              py: 0.8,
              "&:hover": { bgcolor: activeStep === 2 && !isPassed ? "#525252" : "#002b26" },
              "&.Mui-disabled": { bgcolor: "#525252", color: "#d4d4d4" },
            }}
          >
            <Box sx={{ textAlign: "right" }}>
              <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
                {activeStep === 3 ? "ขั้นตอนถัดไป" : "ยืนยันเอกสาร"}
              </Typography>
              <Typography variant="caption" sx={{ fontSize: "0.65rem", opacity: 0.85, display: "block" }}>
                {activeStep === 3 ? "(ไปยังขั้นตอนที่ 3)" : "(เมื่อเอกสารมีสถานะผ่านแล้ว)"}
              </Typography>
            </Box>
          </Button>
        </Box>

        {/* Modal แสดงรายละเอียด */}
        <Dialog
          open={openModal}
          onClose={() => setOpenModal(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: 4, overflow: "hidden", maxWidth: 800, bgcolor: BRAND_DARK, border: "1px solid rgba(16, 185, 129, 0.2)" } }}
        >
          <Box sx={{ p: 2, px: 3, display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: BRAND_DARK, borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <DescriptionIcon sx={{ color: BRAND_GREEN, fontSize: 26 }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: "#ffffff" }}>
                รายละเอียดเอกสารตอบรับ ({selectedDoc?.name})
              </Typography>
            </Box>
            <IconButton onClick={() => setOpenModal(false)} sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
              <CloseIcon />
            </IconButton>
          </Box>

          <DialogContent sx={{ p: 3, bgcolor: BRAND_DARK }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper
                  elevation={0}
                  sx={{ p: 1.5, bgcolor: BRAND_CARD, border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: 3, height: 420, display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  {getFileFullUrl(selectedDoc)?.toLowerCase().includes(".pdf") ? (
                    <iframe src={getFileFullUrl(selectedDoc)} title="PDF Preview" width="100%" height="100%" style={{ border: "none" }} />
                  ) : (
                    <Box component="img" src={getFileFullUrl(selectedDoc)} alt="Preview" sx={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 2 }} />
                  )}
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "#ffffff", mb: 2 }}>
                    รายละเอียดข้อมูลที่สแกนได้
                  </Typography>
                  {renderDocDetails(selectedDoc)}
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
        </Dialog>

        {/* Modal ยืนยัน */}
        <Dialog open={openConfirmModal} onClose={() => setOpenConfirmModal(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4, p: 3, textAlign: "center", maxWidth: 380, bgcolor: BRAND_DARK, color: "#ffffff" } }}>
          <DialogContent sx={{ p: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Box sx={{ width: 60, height: 60, borderRadius: "50%", bgcolor: "rgba(16, 185, 129, 0.15)", color: BRAND_GREEN, border: `1.5px solid ${BRAND_GREEN}`, display: "flex", alignItems: "center", justifyContent: "center", mb: 2 }}>
              <PriorityHighIcon sx={{ fontSize: 36 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: "#ffffff", mb: 1 }}>
              ยืนยันการส่งเอกสาร
            </Typography>
            <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.7)", mb: 3 }}>
              กรุณาตรวจสอบเอกสารให้ถูกต้องก่อนยืนยันขั้นตอน
            </Typography>
            <Box sx={{ display: "flex", gap: 1.5, width: "100%" }}>
              <Button fullWidth variant="outlined" onClick={() => setOpenConfirmModal(false)} sx={{ borderColor: "rgba(255, 255, 255, 0.3)", color: "#ffffff" }}>
                ย้อนกลับ
              </Button>
              <Button fullWidth variant="contained" onClick={handleConfirmNext} sx={{ bgcolor: BRAND_GREEN, color: "#ffffff" }}>
                ยืนยัน
              </Button>
            </Box>
          </DialogContent>
        </Dialog>
      </Box>
    </Box>
  );
}

export default DocumentSummary2;