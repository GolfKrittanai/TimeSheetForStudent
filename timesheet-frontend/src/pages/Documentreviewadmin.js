import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  MenuItem,
  Select,
  FormControl,
  TextField,
  InputAdornment,
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
  DialogActions,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Search as SearchIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  AccessTime as AccessTimeIcon,
  Visibility as VisibilityIcon,
  InsertDriveFile as InsertDriveFileIcon,
} from "@mui/icons-material";
import Sidebar from "../components/Sidebar";
import {
  getAllDocumentsForReview,
  reviewDocument,
} from "../services/documentScanService";

// แปลงสถานะจาก backend (pending/passed/failed) เป็นข้อความภาษาไทย
const mapStatusToLabel = (status) => {
  switch (status) {
    case "passed":
      return "ผ่าน";
    case "failed":
      return "ไม่ผ่าน";
    case "pending":
    default:
      return "รอตรวจสอบ";
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return "...";
  return new Date(dateStr).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

function DocumentReviewAdmin() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [documents, setDocuments] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);

  // ตัวกรอง
  const [statusFilter, setStatusFilter] = useState("pending");
  const [searchText, setSearchText] = useState("");

  // Modal ตรวจสอบเอกสาร
  const [openReviewModal, setOpenReviewModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [remark, setRemark] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadDocuments = useCallback(async () => {
    try {
      setPageLoading(true);
      const data = await getAllDocumentsForReview({
        status: statusFilter,
        search: searchText,
      });
      setDocuments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load documents for review:", error);
      setDocuments([]);
    } finally {
      setPageLoading(false);
    }
  }, [statusFilter, searchText]);

  useEffect(() => {
    // หน่วงเวลาเล็กน้อยตอนพิมพ์ค้นหา เพื่อลดการยิง request ถี่เกินไป
    const timer = setTimeout(() => {
      loadDocuments();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadDocuments]);

  const handleOpenReviewModal = (doc) => {
    setSelectedDoc(doc);
    setRemark(doc.remark || "");
    setOpenReviewModal(true);
  };

  const handleCloseModal = () => {
    if (!isSubmitting) {
      setOpenReviewModal(false);
      setSelectedDoc(null);
      setRemark("");
    }
  };

  const handleReview = async (decision) => {
    if (!selectedDoc) return;

    if (decision === "failed" && !remark.trim()) {
      alert("กรุณาระบุเหตุผลที่ไม่ผ่าน เพื่อแจ้งให้นักศึกษาทราบ");
      return;
    }

    setIsSubmitting(true);
    try {
      await reviewDocument(selectedDoc.id, decision, remark.trim());
      await loadDocuments();
      handleCloseModal();
    } catch (error) {
      console.error("Review Error:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกผลการตรวจสอบ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStatusChip = (status) => {
    const label = mapStatusToLabel(status);
    switch (label) {
      case "ผ่าน":
        return (
          <Chip
            icon={<CheckCircleIcon sx={{ fontSize: 16, color: "#2e7d32 !important" }} />}
            label={label}
            size="small"
            sx={{ bgcolor: "#e8f5e9", color: "#2e7d32", fontWeight: 600 }}
          />
        );
      case "ไม่ผ่าน":
        return (
          <Chip
            icon={<CancelIcon sx={{ fontSize: 16, color: "#d32f2f !important" }} />}
            label={label}
            size="small"
            sx={{ bgcolor: "#ffebee", color: "#d32f2f", fontWeight: 600 }}
          />
        );
      default:
        return (
          <Chip
            icon={<AccessTimeIcon sx={{ fontSize: 16, color: "#ed6c02 !important" }} />}
            label={label}
            size="small"
            sx={{ bgcolor: "#fff3e0", color: "#ed6c02", fontWeight: 600 }}
          />
        );
    }
  };

  const isImageFile = (url = "") => /\.(jpg|jpeg|png)$/i.test(url);
  const isPdfFile = (url = "") => /\.pdf$/i.test(url);

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
          ตรวจสอบเอกสารนักศึกษา
        </Typography>

        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            border: "1px solid #007a5e",
            bgcolor: "#fff",
          }}
        >
          {/* แถบตัวกรอง */}
          <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4} md={3}>
              <TextField
                fullWidth
                size="small"
                placeholder="ค้นหาชื่อ หรือ รหัสนักศึกษา"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: "#94a3b8", fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  sx: { bgcolor: "#fff", borderRadius: 1.5 },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4} md={3}>
              <FormControl fullWidth size="small">
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  sx={{ bgcolor: "#fff", borderRadius: 1.5, fontSize: "0.9rem" }}
                >
                  <MenuItem value="all">ทุกสถานะ</MenuItem>
                  <MenuItem value="pending">รอตรวจสอบ</MenuItem>
                  <MenuItem value="passed">ผ่าน</MenuItem>
                  <MenuItem value="failed">ไม่ผ่าน</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <TableContainer>
            <Table sx={{ minWidth: 750 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: "#f8fafc" }}>
                  <TableCell align="center" sx={{ fontWeight: 700, color: "#64748b" }}>
                    ลำดับ
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#64748b" }}>
                    นักศึกษา
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#64748b" }}>
                    เอกสาร
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: "#64748b" }}>
                    วันที่ส่ง
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: "#64748b" }}>
                    สถานะ
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: "#64748b" }}>
                    ดำเนินการ
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pageLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={28} sx={{ color: "#007a5e" }} />
                    </TableCell>
                  </TableRow>
                ) : documents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4, color: "#94a3b8" }}>
                      ไม่พบรายการเอกสาร
                    </TableCell>
                  </TableRow>
                ) : (
                  documents.map((row, index) => (
                    <TableRow key={row.id} hover>
                      <TableCell align="center" sx={{ color: "#475569" }}>
                        {index + 1}
                      </TableCell>
                      <TableCell sx={{ color: "#334155" }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {row.studentName || "-"}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                          {row.studentCode || row.userId}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500, color: "#334155" }}>
                        {row.docCategory}
                      </TableCell>
                      <TableCell align="center" sx={{ color: "#64748b" }}>
                        {formatDate(row.createdAt)}
                      </TableCell>
                      <TableCell align="center">
                        {renderStatusChip(row.status)}
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          startIcon={<VisibilityIcon sx={{ fontSize: 18 }} />}
                          onClick={() => handleOpenReviewModal(row)}
                          sx={{
                            bgcolor: "#00423b",
                            color: "#ffffff",
                            borderRadius: 2,
                            px: 2.5,
                            py: 0.5,
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            textTransform: "none",
                            "&:hover": { bgcolor: "#002b26" },
                          }}
                        >
                          ตรวจสอบ
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Modal ตรวจสอบเอกสาร */}
        <Dialog
          open={openReviewModal}
          onClose={handleCloseModal}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 4, p: 2, fontFamily: '"Kanit", sans-serif' },
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "flex-end", pr: 1, pt: 1 }}>
            <IconButton onClick={handleCloseModal} disabled={isSubmitting}>
              <CloseIcon />
            </IconButton>
          </Box>
          <DialogContent sx={{ pt: 0 }}>
            {selectedDoc && (
              <>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#00423b", mb: 0.5 }}>
                  {selectedDoc.docCategory}
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b", mb: 2 }}>
                  {selectedDoc.studentName || "-"}{" "}
                  {selectedDoc.studentCode ? `(${selectedDoc.studentCode})` : ""} · ส่งเมื่อ{" "}
                  {formatDate(selectedDoc.createdAt)}
                </Typography>

                {/* พื้นที่แสดงตัวอย่างไฟล์ */}
                <Box
                  sx={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 3,
                    bgcolor: "#f8fafc",
                    minHeight: 380,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    mb: 3,
                  }}
                >
                  {selectedDoc.fileUrl ? (
                    isImageFile(selectedDoc.fileUrl) ? (
                      <Box
                        component="img"
                        src={selectedDoc.fileUrl}
                        alt={selectedDoc.docCategory}
                        sx={{ maxWidth: "100%", maxHeight: 420, objectFit: "contain" }}
                      />
                    ) : isPdfFile(selectedDoc.fileUrl) ? (
                      <Box
                        component="iframe"
                        src={selectedDoc.fileUrl}
                        title={selectedDoc.docCategory}
                        sx={{ width: "100%", height: 420, border: "none" }}
                      />
                    ) : (
                      <Box sx={{ textAlign: "center", py: 6 }}>
                        <InsertDriveFileIcon sx={{ fontSize: 48, color: "#94a3b8", mb: 1 }} />
                        <Typography variant="body2" sx={{ color: "#64748b", mb: 1 }}>
                          ไม่สามารถแสดงตัวอย่างไฟล์นี้ได้
                        </Typography>
                        <Button
                          href={selectedDoc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          size="small"
                          sx={{ textTransform: "none", color: "#007a5e" }}
                        >
                          เปิดไฟล์ในแท็บใหม่
                        </Button>
                      </Box>
                    )
                  ) : (
                    <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                      ไม่พบไฟล์แนบ
                    </Typography>
                  )}
                </Box>

                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  label="หมายเหตุ (จำเป็นเมื่อไม่ผ่าน)"
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  disabled={isSubmitting}
                  sx={{ mb: 3, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                />
              </>
            )}
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button
              onClick={() => handleReview("failed")}
              disabled={isSubmitting}
              startIcon={
                isSubmitting ? <CircularProgress size={18} color="inherit" /> : <CancelIcon />
              }
              sx={{
                bgcolor: "#d32f2f",
                color: "#fff",
                px: 3,
                py: 1,
                borderRadius: 2,
                fontWeight: 600,
                textTransform: "none",
                "&:hover": { bgcolor: "#9a0007" },
              }}
            >
              ไม่ผ่าน
            </Button>
            <Button
              onClick={() => handleReview("passed")}
              disabled={isSubmitting}
              startIcon={
                isSubmitting ? <CircularProgress size={18} color="inherit" /> : <CheckCircleIcon />
              }
              sx={{
                bgcolor: "#007a5e",
                color: "#fff",
                px: 3,
                py: 1,
                borderRadius: 2,
                fontWeight: 600,
                textTransform: "none",
                "&:hover": { bgcolor: "#005a45" },
              }}
            >
              ผ่าน
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}

export default DocumentReviewAdmin;
