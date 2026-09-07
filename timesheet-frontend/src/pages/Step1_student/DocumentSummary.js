import React, { useState, useEffect } from "react";
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
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  Close as CloseIcon,
  DescriptionOutlined as DescriptionIcon,
  PersonOutlined as PersonIcon,
  CalendarTodayOutlined as CalendarIcon,
  BusinessOutlined as BusinessIcon,
  LocationOnOutlined as LocationIcon,
  PhoneOutlined as PhoneIcon,
  AssignmentIndOutlined as CardIcon,
  CreateOutlined as SignatureIcon,
  SchoolOutlined as GradeIcon,
  Cancel as CancelIcon,
  PriorityHigh as PriorityHighIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import { getUserDocumentHistory } from "../../services/documentScanService";

const MASTER_DOCS = [
  { id: 1, name: "BA Co-op 01 เอกสารติดต่องานสหกิจศึกษา" },
  { id: 2, name: "BA Co-op 02-1 เอกสารยินยอมจากผู้ปกครอง" },
  { id: 3, name: "BA Co-op 02-2 ใบสมัครงานสหกิจศึกษา" },
  { id: 4, name: "BA Co-op 04 เอกสารรายละเอียดที่พัก" },
  { id: 5, name: "BA Co-op 05 ผลการศึกษาฉบับ (ชั่วคราว)" },
];

const RAW_API = process.env.REACT_APP_API || process.env.REACT_APP_API_URL || "http://localhost:5000";
const SERVER_BASE_URL = RAW_API.replace(/\/api\/?$/, "");

const STEPS = [
  { num: 1, title: "อัปโหลดเอกสาร", sub: "เลือกเอกสารที่ต้องการ" },
  { num: 2, title: "ตรวจสอบ", sub: "ตรวจสอบผล" },
  { num: 3, title: "สถานะ", sub: "รอการตรวจสอบ" },
  { num: 4, title: "สำเร็จ", sub: "ผ่านการตรวจสอบ" },
];

// โทนสีเขียวเดียวกับ Sidebar
const BRAND_DARK = "#0b2b26";
const BRAND_CARD = "#081f1c";
const BRAND_GREEN = "#10b981";

// Custom DetailRow สไตล์ Dark Theme เข้ากับ Sidebar
const DetailRow = ({ icon: Icon, value, label }) => (
  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 2 }}>
    <Icon sx={{ color: BRAND_GREEN, fontSize: 24, mt: 0.2 }} />
    <Box sx={{ flexGrow: 1, borderBottom: "1px solid rgba(255, 255, 255, 0.1)", pb: 0.8 }}>
      <Typography variant="body2" sx={{ fontWeight: 700, color: "#ffffff" }}>
        {value || "-"}
      </Typography>
      <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "0.75rem" }}>
        {label}
      </Typography>
    </Box>
  </Box>
);

function DocumentSummary() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(2);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openModal, setOpenModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [imageError, setImageError] = useState(false);

  const [openConfirmModal, setOpenConfirmModal] = useState(false);

  const isAllPassed =
    documents.length === 5 &&
    documents.every((doc) => doc.status === "ผ่าน" || doc.status === "passed");

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const currentUserId = storedUser.id || storedUser.userId || 1;

      const res = await getUserDocumentHistory(currentUserId);
      const historyData = Array.isArray(res) ? res : res?.data || res?.documents || [];

      if (Array.isArray(historyData) && historyData.length > 0) {
        const sortedHistory = [...historyData].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        const sortedDocs = MASTER_DOCS.map((masterItem) => {
          const codeMatch = masterItem.name.match(/\d+([.-]\d+)?/);
          const docCode = codeMatch ? codeMatch[0] : null;

          const matched = sortedHistory.find((item) => {
            if (!item.docCategory) return false;
            if (item.docCategory === masterItem.name) return true;
            if (docCode && item.docCategory.includes(docCode)) return true;
            return false;
          });

          if (matched) {
            let parsedExtracted = matched.extractedData;
            if (typeof matched.extractedData === "string") {
              try {
                parsedExtracted = JSON.parse(matched.extractedData);
              } catch (e) {
                parsedExtracted = { rawText: matched.extractedData };
              }
            }

            let mappedStatus = "รอตรวจสอบ";
            if (matched.status === "passed") mappedStatus = "ผ่าน";
            else if (matched.status === "failed") mappedStatus = "ไม่ผ่าน";
            else if (matched.status === "pending") mappedStatus = "รอตรวจสอบ";
            else if (matched.status) mappedStatus = matched.status;

            return {
              ...matched,
              id: masterItem.id,
              docCategory: masterItem.name,
              status: mappedStatus,
              extractedData: parsedExtracted || {},
            };
          }

          return {
            id: masterItem.id,
            docCategory: masterItem.name,
            status: "ยังไม่ได้ส่ง",
            createdAt: null,
            fileUrl: null,
            extractedData: null,
          };
        });
        setDocuments(sortedDocs);
      } else {
        setDocuments(MASTER_DOCS.map((d) => ({ ...d, status: "ยังไม่ได้ส่ง", fileUrl: null, extractedData: null })));
      }
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleBack = () => {
    if (activeStep === 2) {
      navigate("/student/scan-upload");
    } else {
      setActiveStep((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (activeStep === 2) {
      setOpenConfirmModal(true);
    } else if (activeStep === 3) {
      if (isAllPassed) {
        setOpenConfirmModal(true);
      }
    } else if (activeStep === 4) {
      navigate("/student/dashboard");
    }
  };

  const handleConfirmNext = () => {
    setOpenConfirmModal(false);
    setActiveStep((prev) => prev + 1);
  };

  const getFileFullUrl = (doc) => {
    if (!doc) return null;
    const rawPath = doc.fileUrl || doc.filePath || doc.file_path || doc.documentUrl || doc.url || doc.path;
    if (!rawPath) return null;

    let cleanPath = String(rawPath).trim();

    if (/^https?:\/\//i.test(cleanPath) || cleanPath.startsWith("data:")) {
      return cleanPath;
    }

    cleanPath = cleanPath.replace(/\\/g, "/").replace(/^\/?(uploads\/)+/i, "");
    
    return `${SERVER_BASE_URL}/uploads/${cleanPath}`;
  };

  const renderDocDetails = (doc) => {
    const type = doc?.docCategory || doc?.name || "";
    const data = doc?.extractedData || {};

    if (type.includes("01")) {
      return (
        <>
          <DetailRow icon={DescriptionIcon} value={type} label="ชื่อเอกสาร" />
          <DetailRow icon={PersonIcon} value={data.fullName || doc?.studentName} label="ชื่อ-นามสกุล " />
          <DetailRow
            icon={CalendarIcon}
            value={data.signedDate || data.applyDate || (doc?.createdAt ? new Date(doc?.createdAt).toLocaleDateString("th-TH") : "-")}
            label="วันที่สมัคร "
          />
        </>
      );
    } else if (type.includes("02-1")) {
      return (
        <>
          <DetailRow icon={DescriptionIcon} value={type} label="ชื่อเอกสาร" />
          <DetailRow icon={PersonIcon} value={data.fullName || doc?.studentName} label="ชื่อ-นามสกุล " />
          <DetailRow icon={PersonIcon} value={data.parentName} label="ชื่อผู้ปกครอง " />
          <DetailRow icon={BusinessIcon} value={data.companyName} label="สถานประกอบการ " />
          <DetailRow icon={CalendarIcon} value={data.signedDate} label="วันที่ลงนาม " />
        </>
      );
    } else if (type.includes("02-2")) {
      return (
        <>
          <DetailRow icon={DescriptionIcon} value={type} label="ชื่อเอกสาร" />
          <DetailRow icon={CardIcon} value={data.studentId} label="รหัสนักศึกษา " />
          <DetailRow icon={PhoneIcon} value={data.phone || data.contact} label="ช่องทางการติดต่อ " />
          <DetailRow icon={BusinessIcon} value={data.companyName} label="สถานประกอบการ " />
          <DetailRow icon={PersonIcon} value={data.position} label="ตำแหน่ง " />
          <DetailRow icon={SignatureIcon} value={data.signature || "--------------------"} label="ลงนาม " />
          <DetailRow icon={CalendarIcon} value={data.signedDate} label="วันที่ลงนาม" />
        </>
      );
    } else if (type.includes("04")) {
      return (
        <>
          <DetailRow icon={DescriptionIcon} value={type} label="ชื่อเอกสาร" />
          <DetailRow icon={BusinessIcon} value={data.companyName} label="สถานประกอบการ " />
          <DetailRow icon={LocationIcon} value={data.address} label="ที่อยู่สถานที่ตั้ง " />
          <DetailRow icon={PersonIcon} value={data.position} label="ตำแหน่ง " />
          <DetailRow icon={CalendarIcon} value={data.period || data.duration} label="ระยะเวลา " />
          <DetailRow icon={CalendarIcon} value={data.startDate} label="วันที่เริ่มงาน " />
        </>
      );
    } else if (type.includes("05")) {
      return (
        <>
          <DetailRow icon={DescriptionIcon} value={type} label="ชื่อเอกสาร" />
          <DetailRow icon={PersonIcon} value={data.fullName || doc?.studentName} label="ชื่อ-นามสกุล " />
          <DetailRow icon={PersonIcon} value={data.studentId} label="รหัสนักศึกษา" />
          <DetailRow icon={GradeIcon} value={data.totalCredits || data.gpa} label="เกรดเฉลี่ยสะสม " />
        </>
      );
    }

    return (
      <>
        <DetailRow icon={DescriptionIcon} value={type} label="ชื่อเอกสาร" />
        <DetailRow icon={PersonIcon} value={data.fullName || doc?.studentName} label="ชื่อ-นามสกุล" />
      </>
    );
  };

  const renderStep2Content = () => (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Typography variant="h6" sx={{ fontWeight: 700, color: "#00423b", mb: 1.5, fontSize: "1.05rem" }}>
        ประวัติการตรวจสอบ
      </Typography>
      <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e2e8f0", flexGrow: 1, overflowY: "auto" }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={{ fontWeight: 600, bgcolor: "#f8fafc" }}>ลำดับ</TableCell>
              <TableCell sx={{ fontWeight: 600, bgcolor: "#f8fafc" }}>เอกสาร</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, bgcolor: "#f8fafc" }}>วันที่</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, bgcolor: "#f8fafc" }}>ดำเนินการ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {documents.map((doc, idx) => {
              const fileUrl = getFileFullUrl(doc);
              return (
                <TableRow key={doc.id || idx} hover>
                  <TableCell align="center">{idx + 1}</TableCell>
                  <TableCell>{doc.docCategory}</TableCell>
                  <TableCell align="center">
                    {doc.createdAt 
                    ? new Date(doc.createdAt).toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "long",
                        year: "numeric"
                      }) 
                    : "-"}
                  </TableCell>
                  <TableCell align="center">
                    {fileUrl ? (
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => {
                          setSelectedDoc(doc);
                          setImageError(false);
                          setOpenModal(true);
                        }}
                        sx={{
                          bgcolor: "#d8e7e1",
                          color: "#007a5e",
                          borderRadius: "20px",
                          px: 2.5,
                          py: 0.5,
                          fontWeight: 600,
                          fontSize: "0.85rem",
                          boxShadow: "none",
                          textTransform: "none",
                          "&:hover": {
                            bgcolor: "#c2dcd3",
                            boxShadow: "none",
                          },
                        }}
                      >
                        ดูรายละเอียด
                      </Button>
                    ) : (
                      <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                        ยังไม่ได้อัปโหลด
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderStep3Content = () => (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Typography variant="h6" sx={{ fontWeight: 700, color: "#00423b", mb: 1.5, fontSize: "1.05rem" }}>
        สถานะของเอกสาร
      </Typography>
      <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e2e8f0", flexGrow: 1, overflowY: "auto" }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={{ bgcolor: "#f8fafc", fontWeight: 600 }}>ลำดับ</TableCell>
              <TableCell sx={{ bgcolor: "#f8fafc", fontWeight: 600 }}>เอกสาร</TableCell>
              <TableCell align="center" sx={{ bgcolor: "#f8fafc", fontWeight: 600 }}>วันที่</TableCell>
              <TableCell align="center" sx={{ bgcolor: "#f8fafc", fontWeight: 600 }}>สถานะ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {documents.map((doc, idx) => {
              const isPassedDoc = doc.status === "ผ่าน" || doc.status === "passed";
              const isFailedDoc = doc.status === "ไม่ผ่าน" || doc.status === "failed";

              return (
                <TableRow key={doc.id || idx} hover>
                  <TableCell align="center">{idx + 1}</TableCell>
                  <TableCell>{doc.docCategory}</TableCell>
                  <TableCell align="center">
                    {doc.createdAt 
                    ? new Date(doc.createdAt).toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "long",
                        year: "numeric"
                      }) 
                    : "-"}
                  </TableCell>
                  <TableCell align="center">
                    {isPassedDoc ? (
                      <Chip
                        icon={<CheckCircleIcon sx={{ fontSize: 16, color: "#166534 !important" }} />}
                        label="ผ่าน"
                        size="small"
                        sx={{
                          bgcolor: "#dcfce7",
                          color: "#166534",
                          fontWeight: 600,
                          px: 1,
                          fontSize: "0.8125rem",
                          height: 28,
                          minWidth: 100,
                        }}
                      />
                    ) : isFailedDoc ? (
                      <Chip
                        icon={<CancelIcon sx={{ fontSize: 16, color: "#991b1b !important" }} />}
                        label="ไม่ผ่าน"
                        size="small"
                        sx={{
                          bgcolor: "#fee2e2",
                          color: "#991b1b",
                          fontWeight: 600,
                          px: 1,
                          fontSize: "0.8125rem",
                          height: 28,
                          minWidth: 100,
                        }}
                      />
                    ) : (
                      <Chip
                        icon={<AccessTimeIcon sx={{ fontSize: 16, color: "#9a3412 !important" }} />}
                        label={doc.status || "รอการตรวจสอบ"}
                        size="small"
                        sx={{
                          bgcolor: "#ffedd5",
                          color: "#9a3412",
                          fontWeight: 600,
                          px: 1,
                          fontSize: "0.8125rem",
                          height: 28,
                          minWidth: 100,
                        }}
                      />
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderStep4Content = () => (
    <Box sx={{ textAlign: "center", py: 3, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%" }}>
      <Box
        sx={{
          width: 70,
          height: 70,
          borderRadius: "50%",
          bgcolor: "#dcfce7",
          color: "#166534",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 1.5,
        }}
      >
        <CheckCircleIcon sx={{ fontSize: 50 }} />
      </Box>
      <Typography variant="h5" sx={{ fontWeight: 800, color: "#00423b", mb: 1 }}>
        ดำเนินการเสร็จสิ้น
      </Typography>
      <Typography variant="body2" sx={{ color: "#64748b" }}>
        ระบบตรวจสอบเรียบร้อยแล้ว ท่านสามารถตรวจสอบสถานะและผลการตรวจสอบได้ในภายหลัง
      </Typography>
    </Box>
  );

  const fullUrl = getFileFullUrl(selectedDoc);
  const isNextDisabled = activeStep === 3 && !isAllPassed;

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
        <Paper elevation={0} sx={{ p: 2.5, mb: 2, borderRadius: 3, bgcolor: "#ffffff", border: "1px solid #e2e8f0" }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#00423b", mb: 0.2, fontSize: "1.1rem" }}>
            ขั้นตอนการใช้งาน 4 ขั้นตอน
          </Typography>
          <Typography variant="caption" sx={{ color: "#64748b", mb: 2, display: "block" }}>
            เอกสารของท่านอยู่ระหว่างการตรวจสอบ
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: { xs: 0, md: 3 } }}>
            {STEPS.map((step, idx) => {
              const isCurrent = step.num === activeStep;
              const isPassed = step.num < activeStep;

              return (
                <React.Fragment key={step.num}>
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        bgcolor: isCurrent ? "#facc15" : isPassed ? "#007a5e" : "#cbd5e1",
                        color: isCurrent ? "#000" : "#fff",
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
                    <Box sx={{ flexGrow: 1, height: 2, bgcolor: isPassed ? "#007a5e" : "#cbd5e1", mx: 2 }} />
                  )}
                </React.Fragment>
              );
            })}
          </Box>
        </Paper>

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
            overflow: "hidden",
          }}
        >
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {activeStep === 2 && renderStep2Content()}
              {activeStep === 3 && renderStep3Content()}
              {activeStep === 4 && renderStep4Content()}
            </>
          )}
        </Paper>

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Button
            variant="outlined"
            onClick={handleBack}
            startIcon={<ArrowBackIosNewIcon />}
            sx={{ 
              borderColor: "#00423b", 
              color: "#00423b", 
              fontWeight: 700, 
              borderWidth: 2,
              "&:hover": {
                borderColor: "#002b26",
                bgcolor: "#f0fdf4",
              }
            }}
          >
            ย้อนกลับ
          </Button>

          <Button
            variant="contained"
            disabled={isNextDisabled}
            onClick={handleNext}
            endIcon={<NavigateNextIcon />}
            sx={{ 
              bgcolor: isNextDisabled ? "#94a3b8" : "#00423b", 
              color: "#ffffff", 
              fontWeight: 700, 
              px: 3, 
              py: 1,
              cursor: isNextDisabled ? "not-allowed" : "pointer",
              "&:hover": {
                bgcolor: isNextDisabled ? "#94a3b8" : "#002b26",
              },
              "&.Mui-disabled": {
                bgcolor: "#94a3b8",
                color: "#ffffff",
                opacity: 0.8,
              },
            }}
          >
            {activeStep === 3 ? "ยืนยันสถานะ" : activeStep === 4 ? "กลับหน้าแรก" : "ส่งเอกสาร"}
          </Button>
        </Box>

        {/* 🟢 Modal ดูรายละเอียดเอกสาร (ดีไซน์ใหม่ โทนสีเดียวกับ Sidebar) */}
        <Dialog
          open={openModal}
          onClose={() => setOpenModal(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 4,
              overflow: "hidden",
              maxWidth: 780,
              bgcolor: BRAND_DARK, // ใช้สีเดียวกับ Sidebar
              border: "1px solid rgba(16, 185, 129, 0.2)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)"
            },
          }}
        >
          {/* Header Modal */}
          <Box
            sx={{
              p: 2,
              px: 3,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              bgcolor: BRAND_DARK,
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)"
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <DescriptionIcon sx={{ color: BRAND_GREEN, fontSize: 28 }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: "#ffffff" }}>
                รายละเอียดเอกสาร
              </Typography>
            </Box>
            <IconButton onClick={() => setOpenModal(false)} sx={{ color: "rgba(255, 255, 255, 0.7)", "&:hover": { color: "#fff" } }}>
              <CloseIcon sx={{ fontSize: 24 }} />
            </IconButton>
          </Box>

          {/* Modal Content */}
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
                    height: 440,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {!fullUrl || imageError ? (
                    <Box sx={{ textAlign: "center", color: "rgba(255, 255, 255, 0.5)", my: "auto" }}>
                      <DescriptionIcon sx={{ fontSize: 56, mb: 1, color: "rgba(255, 255, 255, 0.2)" }} />
                      <Typography variant="body2">ไม่พบไฟล์ตัวอย่างเอกสาร</Typography>
                    </Box>
                  ) : fullUrl.toLowerCase().includes(".pdf") ? (
                    <iframe
                      src={fullUrl}
                      title="Document Preview"
                      width="100%"
                      height="100%"
                      style={{ border: "none", borderRadius: "8px" }}
                    />
                  ) : (
                    <Box
                      component="img"
                      src={fullUrl}
                      alt="เอกสารที่สแกน"
                      onError={() => {
                        console.error("Failed to load image at:", fullUrl);
                        setImageError(true);
                      }}
                      onMouseMove={(e) => {
                        const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
                        const x = ((e.clientX - left) / width) * 100;
                        const y = ((e.clientY - top) / height) * 100;
                        e.currentTarget.style.transformOrigin = `${x}% ${y}%`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transformOrigin = "center center";
                      }}
                      sx={{
                        maxWidth: "100%",
                        maxHeight: "100%",
                        objectFit: "contain",
                        borderRadius: 2,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                        cursor: "zoom-in",
                        transition: "transform 0.2s ease-out",
                        "&:hover": {
                          transform: "scale(2.2)",
                        },
                      }}
                    />
                  )}
                </Paper>
              </Grid>

              <Grid item xs={12} md={6} sx={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "#ffffff", fontSize: "1.1rem" }}>
                      รายละเอียด
                    </Typography>
                    <Chip
                      label="ปริญญาตรี"
                      size="small"
                      sx={{
                        bgcolor: "rgba(16, 185, 129, 0.15)",
                        color: BRAND_GREEN,
                        border: `1px solid rgba(16, 185, 129, 0.4)`,
                        fontWeight: 700,
                        borderRadius: 1.5,
                      }}
                    />
                  </Box>

                  {renderDocDetails(selectedDoc)}
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
        </Dialog>

        {/* 🟢 Modal ยืนยันการส่งเอกสาร (โทนสีเดียวกับ Sidebar) */}
        <Dialog
          open={openConfirmModal}
          onClose={() => setOpenConfirmModal(false)}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 4,
              p: 3,
              textAlign: "center",
              maxWidth: 380,
              bgcolor: BRAND_DARK,
              color: "#ffffff",
              border: "1px solid rgba(16, 185, 129, 0.2)"
            },
          }}
        >
          <DialogContent sx={{ p: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                bgcolor: "rgba(16, 185, 129, 0.15)",
                color: BRAND_GREEN,
                border: `1.5px solid ${BRAND_GREEN}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2,
              }}
            >
              <PriorityHighIcon sx={{ fontSize: 38 }} />
            </Box>

            <Typography variant="h6" sx={{ fontWeight: 800, color: "#ffffff", mb: 1 }}>
              {activeStep === 2 ? "ยืนยันการส่งเอกสาร" : "ยืนยันสถานะข้อมูล"}
            </Typography>

            <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.7)", mb: 3, px: 1, lineHeight: 1.4 }}>
              {activeStep === 2
                ? "กรุณาตรวจสอบข้อมูลและเอกสารก่อนยืนยันการส่ง"
                : "กรุณาตรวจสอบข้อมูลและเอกสารให้ถูกต้องก่อนยืนยัน เมื่อส่งแล้วจะไม่สามารถแก้ไขข้อมูลได้"}
            </Typography>

            <Box sx={{ display: "flex", gap: 1.5, width: "100%" }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => setOpenConfirmModal(false)}
                sx={{
                  borderColor: "rgba(255, 255, 255, 0.3)",
                  color: "#ffffff",
                  fontWeight: 700,
                  borderRadius: 2,
                  py: 1,
                  "&:hover": {
                    borderColor: BRAND_GREEN,
                    bgcolor: "rgba(255, 255, 255, 0.05)",
                  },
                }}
              >
                แก้ไขต่อ
              </Button>

              <Button
                fullWidth
                variant="contained"
                onClick={handleConfirmNext}
                sx={{
                  bgcolor: BRAND_GREEN,
                  color: "#ffffff",
                  fontWeight: 700,
                  borderRadius: 2,
                  py: 1,
                  boxShadow: "none",
                  "&:hover": {
                    bgcolor: "#0d9668",
                    boxShadow: "none",
                  },
                }}
              >
                ยืนยัน
              </Button>
            </Box>
          </DialogContent>
        </Dialog>
      </Box>
    </Box>
  );
}

export default DocumentSummary;