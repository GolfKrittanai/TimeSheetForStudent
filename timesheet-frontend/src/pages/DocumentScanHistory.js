import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useMediaQuery,
  useTheme,
  Dialog,
  DialogContent,
  Grid,
  Chip,
  CircularProgress,
  IconButton,
  Divider,
} from "@mui/material";
import {
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Close as CloseIcon,
  Description as DescriptionIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Place as PlaceIcon,
  Badge as BadgeIcon,
  CropFree as CropFreeIcon,
  FormatListNumbered as CreditsIcon,
  AccessTime as AccessTimeIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
// เพิ่มนำเข้า cancelUserDocument
import { getUserDocumentHistory, cancelUserDocument } from "../services/documentScanService";

function DocumentScanHistory() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openModal, setOpenModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const getFormattedFileUrl = (fileUrl) => {
    if (!fileUrl) return "";
    if (
      fileUrl.startsWith("http://") ||
      fileUrl.startsWith("https://") ||
      fileUrl.startsWith("blob:")
    ) {
      return fileUrl;
    }
    const cleanPath = fileUrl.replace(/^\/+/, "").replace(/\\/g, "/");
    return `http://localhost:5000/${cleanPath}`;
  };

  // แยก fetchHistory ออกมาเพื่อให้เรียกใช้งานซ้ำได้เมื่อกดยกเลิก
  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await getUserDocumentHistory(1);

      const filteredData = (data || [])
        .filter((item) => item.status !== "ยังไม่ได้ส่ง")
        .map((item) => ({
          id: item.id,
          name: item.docCategory,
          docCategory: item.docCategory,
          status:
            item.status === "passed" || item.status === "ผ่าน"
              ? "ผ่าน"
              : item.status === "pending" || item.status === "รอตรวจสอบ"
              ? "รอตรวจสอบ"
              : "ไม่ผ่าน",
          date: item.createdAt
            ? new Date(item.createdAt).toLocaleDateString("th-TH", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })
            : "-",
          fileUrl: getFormattedFileUrl(item.fileUrl),
          extractedText: item.extractedText || "",
          extractedData: item.extractedData || {},
        }));

      setHistoryList(filteredData);
    } catch (error) {
      console.error("Failed to fetch document history:", error);
      setHistoryList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleOpenDetail = (doc) => {
    setSelectedDoc(doc);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedDoc(null);
  };

  const renderValue = (val) => {
    if (!val || String(val).trim() === "" || val === "null" || val === "undefined") {
      return (
        <Typography component="span" sx={{ color: "#94a3b8", fontStyle: "italic", fontSize: "0.95rem" }}>
          ไม่พบข้อมูล
        </Typography>
      );
    }
    return val;
  };

  const renderStatusChip = (status) => {
    switch (status) {
      case "ผ่าน":
        return (
          <Chip
            icon={<CheckCircleIcon sx={{ fontSize: 16, color: "#2e7d32 !important" }} />}
            label={status}
            size="small"
            sx={{ bgcolor: "#e8f5e9", color: "#2e7d32", fontWeight: 600 }}
          />
        );
      case "ไม่ผ่าน":
        return (
          <Chip
            icon={<CancelIcon sx={{ fontSize: 16, color: "#d32f2f !important" }} />}
            label={status}
            size="small"
            sx={{ bgcolor: "#ffebee", color: "#d32f2f", fontWeight: 600 }}
          />
        );
      case "รอตรวจสอบ":
      case "รอดำเนินการ":
        return (
          <Chip
            icon={<AccessTimeIcon sx={{ fontSize: 16, color: "#ed6c02 !important" }} />}
            label={status}
            size="small"
            sx={{ bgcolor: "#fff3e0", color: "#ed6c02", fontWeight: 600 }}
          />
        );
      default:
        return (
          <Chip
            icon={<InfoIcon sx={{ fontSize: 16, color: "#757575 !important" }} />}
            label={status}
            size="small"
            sx={{ bgcolor: "#eee", color: "#616161", fontWeight: 600 }}
          />
        );
    }
  };

  const renderStatusBanner = (status) => {
    if (status === "ผ่าน") {
      return (
        <Box sx={{ bgcolor: "#e8f5e9", color: "#2e7d32", borderRadius: 8, py: 1.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 1, fontWeight: 700, fontSize: "1.1rem", mt: 2 }}>
          <CheckCircleIcon sx={{ color: "#2e7d32", fontSize: 26 }} /> ผ่าน
        </Box>
      );
    } else if (status === "ไม่ผ่าน") {
      return (
        <Box sx={{ bgcolor: "#ffebee", color: "#d32f2f", borderRadius: 8, py: 1.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 1, fontWeight: 700, fontSize: "1.1rem", mt: 2 }}>
          <CancelIcon sx={{ color: "#d32f2f", fontSize: 26 }} /> ไม่ผ่าน
        </Box>
      );
    }
    return (
      <Box sx={{ bgcolor: "#fff3e0", color: "#ed6c02", borderRadius: 8, py: 1.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 1, fontWeight: 700, fontSize: "1.1rem", mt: 2 }}>
        <AccessTimeIcon sx={{ color: "#ed6c02", fontSize: 26 }} /> รอตรวจสอบ
      </Box>
    );
  };

  const FieldRow = ({ icon, mainText, subText, isTitle = false }) => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, py: 1.2 }}>
      <Box sx={{ bgcolor: "#e8f5e9", p: 1, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", color: "#2e7d32" }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="body1" sx={{ fontWeight: isTitle ? 700 : 600, color: "#1e293b", fontSize: isTitle ? "1.05rem" : "0.95rem" }}>
          {renderValue(mainText)}
        </Typography>
        {subText && (
          <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>
            {subText}
          </Typography>
        )}
      </Box>
    </Box>
  );

  const renderDocumentDetails = (doc) => {
    const category = doc.docCategory || doc.name || "";
    const ext = doc.extractedData || {};

    if (category.includes("BA Co-op 01")) {
      return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          <FieldRow icon={<DescriptionIcon />} mainText="BA Co-op 01" subText="เอกสารติดต่องานสหกิจศึกษา" isTitle />
          <Divider />
          <FieldRow icon={<PersonIcon />} mainText={ext.fullName} subText="ชื่อ-นามสกุล" />
          <Divider />
          <FieldRow icon={<CalendarIcon />} mainText={ext.signedDate} subText="วันที่สมัคร" />
        </Box>
      );
    }

    if (category.includes("BA Co-op 02-1")) {
      return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          <FieldRow icon={<DescriptionIcon />} mainText="BA Co-op 02-1" subText="เอกสารยินยอมจากผู้ปกครอง" isTitle />
          <Divider />
          <FieldRow icon={<PersonIcon />} mainText={ext.fullName} subText="ชื่อ-นามสกุล นักศึกษา" />
          <Divider />
          <FieldRow icon={<PersonIcon />} mainText={ext.parentName} subText="ชื่อผู้ปกครอง" />
          <Divider />
          <FieldRow icon={<BusinessIcon />} mainText={ext.companyName} subText="ชื่อบริษัท / สถานประกอบการ" />
          <Divider />
          <FieldRow icon={<CalendarIcon />} mainText={ext.signedDate} subText="วันที่ลงนาม" />
        </Box>
      );
    }

    if (category.includes("BA Co-op 02-2")) {
      return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          <FieldRow icon={<DescriptionIcon />} mainText="BA Co-op 02-2" subText="ใบสมัครงานสหกิจศึกษา" isTitle />
          <Divider />
          <FieldRow icon={<BadgeIcon />} mainText={ext.studentId} subText="รหัสนักศึกษา" />
          <Divider />
          <FieldRow icon={<PhoneIcon />} mainText={ext.phone} subText="ช่องทางติดต่อ" />
          <Divider />
          <FieldRow icon={<BusinessIcon />} mainText={ext.companyName} subText="สถานประกอบการ" />
          <Divider />
          <FieldRow icon={<CropFreeIcon />} mainText={ext.position} subText="ตำแหน่ง" />
          <Divider />
          <FieldRow icon={<CalendarIcon />} mainText={ext.signedDate} subText="วันที่ลงนาม" />
        </Box>
      );
    }

    if (category.includes("BA Co-op 04")) {
      return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          <FieldRow icon={<DescriptionIcon />} mainText="BA Co-op 04" subText="เอกสารรายละเอียดที่พัก" isTitle />
          <Divider />
          <FieldRow icon={<BusinessIcon />} mainText={ext.companyName} subText="สถานประกอบการ" />
          <Divider />
          <FieldRow icon={<PlaceIcon />} mainText={ext.address} subText="ที่อยู่สถานที่ตั้ง" />
          <Divider />
          <FieldRow icon={<CropFreeIcon />} mainText={ext.position} subText="ตำแหน่ง" />
          <Divider />
          <FieldRow icon={<CalendarIcon />} mainText={ext.period} subText="ระยะเวลา" />
          <Divider />
          <FieldRow 
            icon={<CalendarIcon />} 
            mainText={ext.startDate} 
            subText="วันที่เริ่มงาน" 
          />
        </Box>
      );
    }

    if (category.includes("BA Co-op 05") || category.includes("รายงานผลการศึกษา") || category.includes("Transcript")) {
      return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          <FieldRow 
            icon={<DescriptionIcon />} 
            mainText={category || "เอกสารรายงานผลการศึกษา (ฉบับชั่วคราว)"} 
            subText="รายละเอียดเอกสาร" 
            isTitle 
          />
          <Divider />
          <FieldRow 
            icon={<PersonIcon />} 
            mainText={ext.fullName} 
            subText="ชื่อ-นามสกุล" 
          />
          <Divider />
          <FieldRow 
            icon={<BadgeIcon />} 
            mainText={ext.studentId} 
            subText="รหัสนักศึกษา" 
          />
          <Divider />
          <FieldRow 
            icon={<CreditsIcon />} 
            mainText={ext.totalCredits} 
            subText="คะแนนเฉลี่ยสะสม / หน่วยกิตสะสม" 
          />
        </Box>
      );
    }

    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        <FieldRow icon={<DescriptionIcon />} mainText={category} subText="รายละเอียดเอกสาร" isTitle />
        <Divider />
        <FieldRow icon={<PersonIcon />} mainText={ext.fullName} subText="ชื่อ-นามสกุล" />
        <Divider />
        <FieldRow icon={<CalendarIcon />} mainText={doc.date} subText="วันที่ส่ง" />
      </Box>
    );
  };

  return (
    <Box sx={{ display: "flex", bgcolor: "#f8fafc", minHeight: "100vh" }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, p: isSmallScreen ? 2 : 4, fontFamily: '"Kanit", sans-serif' }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 4 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: "#00423b" }}>ระบบสแกนเอกสารก่อนสหกิจศึกษา</Typography>
            <Typography variant="body2" sx={{ color: "#666", mt: 0.5 }}>ตรวจสอบข้อมูลของท่านให้ครบถ้วน ก่อนออกสหกิจ</Typography>
          </Box>
          <Button variant="contained" startIcon={<DownloadIcon />} onClick={() => navigate("/student/scan-upload")} sx={{ bgcolor: "#007a5e", borderRadius: 2, px: 2.5, py: 1 }}>
            อัปโหลดเอกสารสหกิจ
          </Button>
        </Box>

        <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <TableContainer>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: "#f8fafc" }}>
                  <TableCell align="center">ลำดับ</TableCell>
                  <TableCell>เอกสาร</TableCell>
                  <TableCell align="center">สถานะ</TableCell>
                  <TableCell align="center">วันที่ส่ง</TableCell>
                  <TableCell align="center">ดำเนินการ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6 }}><CircularProgress size={30} /></TableCell></TableRow>
                ) : historyList.map((row, index) => (
                  <TableRow key={row.id || index} hover>
                    <TableCell align="center">{historyList.length - index}</TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell align="center">{renderStatusChip(row.status)}</TableCell>
                    <TableCell align="center">{row.date}</TableCell>
                    
                    {/* ปรับแก้ปุ่มดำเนินการที่นี่ */}
                    <TableCell align="center">
                      {row.status === "รอตรวจสอบ" ? (
                        <Button
                          size="small"
                          onClick={async () => {
                            if (window.confirm("คุณต้องการยกเลิกเอกสารนี้ใช่หรือไม่? ไฟล์ที่อัปโหลดจะถูกลบออก")) {
                              try {
                                await cancelUserDocument(row.id);
                                fetchHistory(); // รีเฟรชตารางหลังยกเลิกสำเร็จ
                              } catch (err) {
                                alert("ไม่สามารถยกเลิกเอกสารได้");
                              }
                            }
                          }}
                          sx={{
                            bgcolor: "#d32f2f",
                            color: "#ffffff",
                            borderRadius: 2,
                            px: 2,
                            py: 0.5,
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            textTransform: "none",
                            "&:hover": { bgcolor: "#9a0007" },
                          }}
                        >
                          ยกเลิก
                        </Button>
                      ) : (
                        <Button size="small" onClick={() => handleOpenDetail(row)} sx={{ bgcolor: "#c8e6c9", color: "#2e7d32", textTransform: "none" }}>
                          ดูรายละเอียด
                        </Button>
                      )}
                    </TableCell>

                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Dialog open={openModal} onClose={handleCloseModal} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 4, overflow: "hidden" } }}>
          <Box sx={{ bgcolor: "#e8f5e9", px: 3, py: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#2e7d32" }}>รายละเอียดเอกสาร</Typography>
            <IconButton onClick={handleCloseModal}><CloseIcon /></IconButton>
          </Box>
          <DialogContent sx={{ p: 3 }}>
            {selectedDoc && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ bgcolor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 3, p: 2, height: "100%", minHeight: 400, display: "flex", justifyContent: "center", alignItems: "center" }}>
                      {selectedDoc.fileUrl && selectedDoc.fileUrl.toLowerCase().endsWith(".pdf") ? (
                        <iframe
                          src={selectedDoc.fileUrl}
                          title="PDF Preview"
                          width="100%"
                          height="400px"
                          style={{ border: "none", borderRadius: "8px" }}
                        />
                      ) : (
                        <img 
                          src={selectedDoc.fileUrl} 
                          alt="Preview" 
                          style={{ maxWidth: "100%", maxHeight: 400, objectFit: "contain" }} 
                          onError={(e) => { e.target.src = "https://via.placeholder.com/350x450?text=Cannot+Load"; }} 
                        />
                      )}
                  </Box>
                </Grid>
                <Grid item xs={12} md={6} sx={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <Box sx={{ bgcolor: "#f8fcf9", p: 2.5, borderRadius: 3, border: "1px solid #e8f5e9" }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: "#1e293b", mb: 2 }}>
                      รายละเอียด
                    </Typography>
                    
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                      <Typography variant="body1" sx={{ fontWeight: 700 }}>ระดับนักศึกษา</Typography>
                      <Chip label="ปริญญาตรี" sx={{ bgcolor: "#419361", color: "#fff" }} />
                    </Box>
                    
                    {renderDocumentDetails(selectedDoc)}
                  </Box>
                  {renderStatusBanner(selectedDoc.status)}
                </Grid>
              </Grid>
            )}
          </DialogContent>
        </Dialog>
      </Box>
    </Box>
  );
}

export default DocumentScanHistory;