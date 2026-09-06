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
  VisibilityOutlined as VisibilityIcon,
  DescriptionOutlined as DescriptionIcon,
  PersonOutlined as PersonIcon,
  CalendarTodayOutlined as CalendarIcon,
  BusinessOutlined as BusinessIcon,
  LocationOnOutlined as LocationIcon,
  PhoneOutlined as PhoneIcon,
  AssignmentIndOutlined as CardIcon,
  CreateOutlined as SignatureIcon,
  SchoolOutlined as GradeIcon,
  TaskAlt as TaskAltIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { getUserDocumentHistory } from "../services/documentScanService";

const MASTER_DOCS = [
  { id: 1, name: "BA Co-op 01 เอกสารติดต่องานสหกิจศึกษา" },
  { id: 2, name: "BA Co-op 02-1 เอกสารยินยอมจากผู้ปกครอง" },
  { id: 3, name: "BA Co-op 02-2 ใบสมัครงานสหกิจศึกษา" },
  { id: 4, name: "BA Co-op 04 เอกสารรายละเอียดที่พัก" },
  { id: 5, name: "BA Co-op 05 ผลการศึกษาฉบับ (ชั่วคราว)" },
];

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const STEPS = [
  { num: 1, title: "อัปโหลดเอกสาร", sub: "เลือกเอกสารที่ต้องการ" },
  { num: 2, title: "ตรวจสอบ", sub: "ตรวจสอบผล" },
  { num: 3, title: "สถานะ", sub: "รอการตรวจสอบ" },
  { num: 4, title: "สำเร็จ", sub: "ผ่านการตรวจสอบ" },
];

const DetailRow = ({ icon: Icon, value, label }) => (
  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 1.5 }}>
    <Icon sx={{ color: "#007a5e", fontSize: 24, mt: 0.2 }} />
    <Box sx={{ flexGrow: 1, borderBottom: "1px solid #e2e8f0", pb: 0.5 }}>
      <Typography variant="body2" sx={{ fontWeight: 700, color: "#1e293b" }}>
        {value || "-"}
      </Typography>
      <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.75rem" }}>
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

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const currentUserId = storedUser.id || storedUser.userId || 1;

      const res = await getUserDocumentHistory(currentUserId);

      if (res && Array.isArray(res)) {
        const sortedDocs = MASTER_DOCS.map((masterItem) => {
          const matched = res.find((item) => item.docCategory === masterItem.name);
          if (matched) {
            return {
              ...matched,
              id: masterItem.id,
              docCategory: masterItem.name,
            };
          }
          return {
            id: masterItem.id,
            docCategory: masterItem.name,
            status: "ยังไม่ได้ส่ง",
            createdAt: null,
          };
        });
        setDocuments(sortedDocs);
      } else {
        setDocuments(MASTER_DOCS.map((d) => ({ ...d, status: "ยังไม่ได้ส่ง" })));
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
    if (activeStep < 4) {
      setActiveStep((prev) => prev + 1);
    } else {
      navigate("/student/dashboard");
    }
  };

  const renderDocDetails = (doc) => {
    const type = doc?.docCategory || doc?.name || "";
    const data = doc?.extractedData || {};

    if (type.includes("01")) {
      return (
        <>
          <DetailRow icon={DescriptionIcon} value={type} label="ชื่อเอกสาร" />
          <DetailRow icon={PersonIcon} value={data.fullName || doc?.studentName} label="ชื่อ-นามสกุล (ตามที่ Ai สแกนได้ในเอกสาร)" />
          <DetailRow
            icon={CalendarIcon}
            value={data.signedDate || data.applyDate || (doc?.createdAt ? new Date(doc?.createdAt).toLocaleDateString("th-TH") : "-")}
            label="วันที่สมัคร (ตามที่ Ai สแกนได้ในเอกสาร)"
          />
        </>
      );
    } else if (type.includes("02-1")) {
      return (
        <>
          <DetailRow icon={DescriptionIcon} value={type} label="ชื่อเอกสาร" />
          <DetailRow icon={PersonIcon} value={data.fullName || doc?.studentName} label="ชื่อ-นามสกุล (ตามที่ Ai สแกนได้ในเอกสาร)" />
          <DetailRow icon={PersonIcon} value={data.parentName} label="ชื่อผู้ปกครอง (ตามที่ Ai สแกนได้ในเอกสาร)" />
          <DetailRow icon={BusinessIcon} value={data.companyName} label="สถานประกอบการ (ตามที่ Ai สแกนได้ในเอกสาร)" />
          <DetailRow icon={CalendarIcon} value={data.signedDate} label="วันที่ลงนาม (ตามที่ Ai สแกนได้ในเอกสาร)" />
        </>
      );
    } else if (type.includes("02-2")) {
      return (
        <>
          <DetailRow icon={DescriptionIcon} value={type} label="ชื่อเอกสาร" />
          <DetailRow icon={CardIcon} value={data.studentId} label="รหัสนักศึกษา (ตามที่ Ai สแกนได้ในเอกสาร)" />
          <DetailRow icon={PhoneIcon} value={data.phone || data.contact} label="ช่องทางการติดต่อ (ตามที่ Ai สแกนได้ในเอกสาร)" />
          <DetailRow icon={BusinessIcon} value={data.companyName} label="สถานประกอบการ (ตามที่ Ai สแกนได้ในเอกสาร)" />
          <DetailRow icon={PersonIcon} value={data.position} label="ตำแหน่ง (ตามที่ Ai สแกนได้ในเอกสาร)" />
          <DetailRow icon={SignatureIcon} value={data.signature || "--------------------"} label="ลงนาม (ตามที่ Ai สแกนได้ในเอกสาร)" />
          <DetailRow icon={CalendarIcon} value={data.signedDate} label="วันที่ลงนาม" />
        </>
      );
    } else if (type.includes("04")) {
      return (
        <>
          <DetailRow icon={DescriptionIcon} value={type} label="ชื่อเอกสาร" />
          <DetailRow icon={BusinessIcon} value={data.companyName} label="สถานประกอบการ (ตามที่ Ai สแกนได้ในเอกสาร)" />
          <DetailRow icon={LocationIcon} value={data.address} label="ที่อยู่สถานที่ตั้ง (ตามที่ Ai สแกนได้ในเอกสาร)" />
          <DetailRow icon={PersonIcon} value={data.position} label="ตำแหน่ง (ตามที่ Ai สแกนได้ในเอกสาร)" />
          <DetailRow icon={CalendarIcon} value={data.period || data.duration} label="ระยะเวลา (ตามที่ Ai สแกนได้ในเอกสาร)" />
          <DetailRow icon={CalendarIcon} value={data.startDate} label="วันที่เริ่มงาน (ตามที่ Ai สแกนได้ในเอกสาร)" />
        </>
      );
    } else if (type.includes("05")) {
      return (
        <>
          <DetailRow icon={DescriptionIcon} value={type} label="ชื่อเอกสาร" />
          <DetailRow icon={PersonIcon} value={data.fullName || doc?.studentName} label="ชื่อ-นามสกุล (ตามที่ Ai สแกนได้ในเอกสาร)" />
          <DetailRow icon={GradeIcon} value={data.totalCredits || data.gpa} label="หน่วยกิตสะสม/เกรดเฉลี่ยสะสม (ตามที่ Ai สแกนได้ในเอกสาร)" />
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
              <TableCell align="center" sx={{ fontWeight: 600, bgcolor: "#f8fafc" }}>วันที่ตรวจสอบ</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, bgcolor: "#f8fafc" }}>ดำเนินการ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {documents.map((doc, idx) => (
              <TableRow key={doc.id || idx} hover>
                <TableCell align="center">{idx + 1}</TableCell>
                <TableCell>{doc.docCategory}</TableCell>
                <TableCell align="center">
                  {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString("th-TH") : "-"}
                </TableCell>
                <TableCell align="center">
                  {doc.fileUrl ? (
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<VisibilityIcon />}
                      onClick={() => {
                        setSelectedDoc(doc);
                        setImageError(false);
                        setOpenModal(true);
                      }}
                      sx={{
                        bgcolor: "#e2e8f0",
                        color: "#1e293b",
                        "&:hover": { bgcolor: "#cbd5e1" },
                        textTransform: "none",
                        boxShadow: "none",
                        py: 0.3,
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
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderStep3Content = () => (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Typography variant="h6" sx={{ fontWeight: 700, color: "#00423b", mb: 1.5, fontSize: "1.05rem" }}>
        สถานะการตรวจสอบเอกสาร
      </Typography>
      <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e2e8f0", flexGrow: 1, overflowY: "auto" }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={{ bgcolor: "#f8fafc", fontWeight: 600 }}>ลำดับ</TableCell>
              <TableCell sx={{ bgcolor: "#f8fafc", fontWeight: 600 }}>เอกสาร</TableCell>
              <TableCell align="center" sx={{ bgcolor: "#f8fafc", fontWeight: 600 }}>วันที่ตรวจสอบ</TableCell>
              <TableCell align="center" sx={{ bgcolor: "#f8fafc", fontWeight: 600 }}>สถานะ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {documents.map((doc, idx) => (
              <TableRow key={doc.id || idx}>
                <TableCell align="center">{idx + 1}</TableCell>
                <TableCell>{doc.docCategory}</TableCell>
                <TableCell align="center">
                  {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString("th-TH") : "-"}
                </TableCell>
                <TableCell align="center">
                  <Chip
                    icon={<AccessTimeIcon sx={{ fontSize: 16 }} />}
                    label={doc.status || "รอการตรวจสอบ"}
                    size="small"
                    sx={{ bgcolor: "#ffedd5", color: "#9a3412", fontWeight: 600 }}
                  />
                </TableCell>
              </TableRow>
            ))}
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
            sx={{ borderColor: "#00423b", color: "#00423b", fontWeight: 700, borderWidth: 2 }}
          >
            ย้อนกลับ
          </Button>

          <Button
            variant="contained"
            onClick={handleNext}
            endIcon={<NavigateNextIcon />}
            sx={{ bgcolor: "#00423b", color: "#ffffff", fontWeight: 700, px: 3, py: 1 }}
          >
            {activeStep === 3 ? "ยืนยันสถานะ" : activeStep === 4 ? "กลับหน้าแรก" : "ตรวจสอบเอกสาร"}
          </Button>
        </Box>

        {/* Modal สำหรับดูรายละเอียดเอกสาร */}
        <Dialog
          open={openModal}
          onClose={() => setOpenModal(false)}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 4, overflow: "hidden" },
          }}
        >
          <Box
            sx={{
              p: 2,
              px: 3,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              bgcolor: "#e8f5e9",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <DescriptionIcon sx={{ color: "#007a5e", fontSize: 28 }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: "#00423b" }}>
                รายละเอียดเอกสาร
              </Typography>
            </Box>
            <IconButton onClick={() => setOpenModal(false)} sx={{ color: "#00423b" }}>
              <CloseIcon sx={{ fontSize: 24 }} />
            </IconButton>
          </Box>

          <DialogContent sx={{ p: 3, bgcolor: "#ffffff" }}>
            <Grid container spacing={3}>
              {/* ฝั่งซ้าย: แสดงรูปภาพเอกสาร / ไฟล์สแกน */}
              <Grid item xs={12} md={6}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    bgcolor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: 3,
                    minHeight: 400,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, alignSelf: "flex-start", color: "#334155" }}>
                    {selectedDoc?.docCategory || selectedDoc?.name || "เอกสารที่อัปโหลด"}
                  </Typography>

                  {(() => {
                    const rawUrl =
                      selectedDoc?.fileUrl ||
                      selectedDoc?.filePath ||
                      selectedDoc?.file_path ||
                      selectedDoc?.documentUrl ||
                      selectedDoc?.url ||
                      selectedDoc?.path;

                    if (!rawUrl || imageError) {
                      return (
                        <Box sx={{ textAlign: "center", color: "#94a3b8", my: "auto" }}>
                          <DescriptionIcon sx={{ fontSize: 56, mb: 1, color: "#cbd5e1" }} />
                          <Typography variant="body2">ไม่พบไฟล์ตัวอย่างเอกสาร</Typography>
                        </Box>
                      );
                    }

                    const cleanPath = rawUrl.replace(/\\/g, "/");
                    const fullUrl = cleanPath.startsWith("http") || cleanPath.startsWith("data:")
                      ? cleanPath
                      : `${API_BASE_URL}/${cleanPath.startsWith("/") ? cleanPath.substring(1) : cleanPath}`;

                    const isPdf = fullUrl.toLowerCase().includes(".pdf");

                    return isPdf ? (
                      <iframe
                        src={fullUrl}
                        title="Document Preview"
                        width="100%"
                        height="360px"
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
                        sx={{
                          maxWidth: "100%",
                          maxHeight: 360,
                          objectFit: "contain",
                          borderRadius: 2,
                          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                        }}
                      />
                    );
                  })()}
                </Paper>
              </Grid>

              {/* ฝั่งขวา: รายละเอียดเอกสารที่ AI สแกนได้ */}
              <Grid item xs={12} md={6} sx={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "#1e293b", fontSize: "1.1rem" }}>
                      รายละเอียด
                    </Typography>
                    <Chip
                      label="ปริญญาตรี"
                      size="small"
                      sx={{ bgcolor: "#388e3c", color: "#ffffff", fontWeight: 700, borderRadius: 1.5 }}
                    />
                  </Box>

                  {renderDocDetails(selectedDoc)}
                </Box>

                <Box
                  sx={{
                    mt: 2,
                    p: 1.2,
                    bgcolor: selectedDoc?.status === "failed" ? "#fee2e2" : "#e8f5e9",
                    borderRadius: 2.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1,
                    color: selectedDoc?.status === "failed" ? "#991b1b" : "#2e7d32",
                  }}
                >
                  {selectedDoc?.status === "failed" ? (
                    <>
                      <CancelIcon sx={{ fontSize: 22 }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>ไม่ผ่าน</Typography>
                    </>
                  ) : (
                    <>
                      <TaskAltIcon sx={{ fontSize: 22 }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>ผ่าน</Typography>
                    </>
                  )}
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
        </Dialog>
      </Box>
    </Box>
  );
}

export default DocumentSummary;