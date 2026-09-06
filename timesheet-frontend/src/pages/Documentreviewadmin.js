import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
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
  Checkbox,
  Dialog,
  DialogContent,
  DialogActions,
  IconButton,
  Avatar,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Close as CloseIcon,
  Groups as GroupsIcon,
  Description as DescriptionIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  InsertDriveFile as InsertDriveFileIcon,
} from "@mui/icons-material";
import Sidebar from "../components/Sidebar";
import {
  getAllDocumentsForReview,
  reviewDocument,
} from "../services/documentScanService";

const PAGE_SIZE = 10;
const BRAND = "#00423b";

// สถานะฝั่ง backend (pending/passed/failed) -> ป้ายที่แสดงในตาราง
const STATUS_MAP = {
  passed: { label: "ผ่าน", bg: "#e8f8ef", color: "#1e8e5a" },
  failed: { label: "ต้องแก้ไข", bg: "#fff3e0", color: "#e08a1f" },
  pending: { label: "รอตรวจสอบ", bg: "#eef0ff", color: "#5b5fe0" },
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return {
    date: d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) + " น.",
  };
};

function DocumentReviewAdmin() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [documents, setDocuments] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);

  const [searchInput, setSearchInput] = useState("");
  const [searchText, setSearchText] = useState("");

  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(1);

  const [openReviewModal, setOpenReviewModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [readOnly, setReadOnly] = useState(false);
  const [remark, setRemark] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadDocuments = useCallback(async () => {
    try {
      setPageLoading(true);
      const data = await getAllDocumentsForReview({
        status: "all",
        search: searchText,
      });
      setDocuments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load documents for review:", error);
      setDocuments([]);
    } finally {
      setPageLoading(false);
    }
  }, [searchText]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleSearch = () => {
    setPage(1);
    setSearchText(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearchText("");
    setPage(1);
  };

  // สถิติด้านบน: จำนวนนักศึกษาไม่ซ้ำ และจำนวนเอกสารทั้งหมดที่พบ
  const studentCount = useMemo(() => {
    const ids = new Set(documents.map((d) => d.studentCode || d.userId));
    return ids.size;
  }, [documents]);

  const totalDocs = documents.length;

  const totalPages = Math.max(1, Math.ceil(totalDocs / PAGE_SIZE));
  const pagedDocuments = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return documents.slice(start, start + PAGE_SIZE);
  }, [documents, page]);

  const allCurrentPageSelected =
    pagedDocuments.length > 0 && pagedDocuments.every((d) => selected.includes(d.id));

  const toggleSelectAll = () => {
    const pageIds = pagedDocuments.map((d) => d.id);
    if (allCurrentPageSelected) {
      setSelected((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelected((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const toggleSelectOne = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleOpenModal = (doc) => {
    setSelectedDoc(doc);
    setRemark(doc.remark || "");
    setReadOnly(doc.status === "passed");
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
      alert("กรุณาระบุเหตุผลที่ต้องแก้ไข เพื่อแจ้งให้นักศึกษาทราบ");
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

  const isImageFile = (url = "") => /\.(jpg|jpeg|png)$/i.test(url);
  const isPdfFile = (url = "") => /\.pdf$/i.test(url);

  const StatCard = ({ icon, label, value }) => (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        border: "1px solid #e2e8f0",
        display: "flex",
        alignItems: "center",
        gap: 2.5,
        height: "100%",
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          bgcolor: "#eaf6f1",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: BRAND,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography sx={{ color: "#64748b", fontSize: "0.95rem" }}>{label}</Typography>
        <Typography sx={{ fontWeight: 700, fontSize: "1.8rem", color: "#1e293b" }}>
          {value}
        </Typography>
      </Box>
    </Paper>
  );

  return (
    <Box sx={{ display: "flex", bgcolor: "#f8fafc", minHeight: "100vh" }}>
      <Sidebar />

      <Box
        component="main"
        sx={{ flexGrow: 1, p: isSmallScreen ? 2 : 4, fontFamily: '"Kanit", sans-serif' }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700, color: BRAND, mb: 3 }}>
          ตรวจสอบเอกสาร
        </Typography>

        {/* Stat cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <StatCard
              icon={<GroupsIcon sx={{ fontSize: 28 }} />}
              label="จำนวนนักศึกษา"
              value={studentCount}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <StatCard
              icon={<DescriptionIcon sx={{ fontSize: 28 }} />}
              label="เอกสารทั้งหมด"
              value={totalDocs}
            />
          </Grid>
        </Grid>

        <Typography variant="h6" sx={{ fontWeight: 700, color: "#1e293b", mb: 2 }}>
          เอกสาร รายชื่อนักศึกษา
        </Typography>

        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #e2e8f0" }}>
          {/* แถบค้นหา */}
          <Grid container spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
            <Grid item xs={12} sm={6} md={5}>
              <TextField
                fullWidth
                size="small"
                placeholder="ค้นหา"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                sx={{ bgcolor: "#fff", "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
              />
            </Grid>
            <Grid item>
              <Button
                onClick={handleSearch}
                sx={{
                  bgcolor: BRAND,
                  color: "#fff",
                  px: 3,
                  borderRadius: 1.5,
                  textTransform: "none",
                  fontWeight: 600,
                  "&:hover": { bgcolor: "#002b26" },
                }}
              >
                ค้นหา
              </Button>
            </Grid>
            <Grid item>
              <Button
                onClick={handleClearSearch}
                sx={{
                  border: "1px solid #cbd5e1",
                  color: "#475569",
                  px: 3,
                  borderRadius: 1.5,
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                ล้าง
              </Button>
            </Grid>
          </Grid>
          <Typography variant="caption" sx={{ color: "#94a3b8", display: "block", mb: 2 }}>
            ค้นหา : รหัสประจำตัว, ชื่อ-นามสกุล
          </Typography>

          <TableContainer>
            <Table sx={{ minWidth: 900 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: "#eef2ff" }}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      size="small"
                      checked={allCurrentPageSelected}
                      onChange={toggleSelectAll}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#475569" }}>ชื่อ-นามสกุล</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#475569" }}>รหัสนักศึกษา</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#475569" }}>ประเภทเอกสาร</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#475569" }}>วันที่ส่ง</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: "#475569" }}>
                    สถานะ
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: "#475569" }}>
                    AI OCR
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: "#475569" }}>
                    ดำเนินการ
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pageLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                      <CircularProgress size={26} sx={{ color: BRAND }} />
                    </TableCell>
                  </TableRow>
                ) : pagedDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 5, color: "#94a3b8" }}>
                      ไม่พบรายการเอกสาร
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedDocuments.map((row, idx) => {
                    const statusInfo = STATUS_MAP[row.status] || STATUS_MAP.pending;
                    const dt = formatDate(row.createdAt);
                    const isPassed = row.status === "passed";
                    return (
                      <TableRow key={row.id} hover>
                        <TableCell padding="checkbox">
                          <Checkbox
                            size="small"
                            checked={selected.includes(row.id)}
                            onChange={() => toggleSelectOne(row.id)}
                          />
                        </TableCell>
                        <TableCell sx={{ color: "#334155", fontWeight: 500 }}>
                          {row.studentName || "-"}
                        </TableCell>
                        <TableCell sx={{ color: "#334155" }}>
                          {row.studentCode || row.userId}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <InsertDriveFileIcon sx={{ fontSize: 18, color: "#a855f7" }} />
                            <Typography variant="body2" sx={{ color: "#334155" }}>
                              {row.docCategory}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: "#64748b" }}>
                          <Typography variant="body2">{dt.date}</Typography>
                          <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                            {dt.time}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={statusInfo.label}
                            size="small"
                            sx={{
                              bgcolor: statusInfo.bg,
                              color: statusInfo.color,
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ color: "#334155", fontWeight: 600 }}>
                          {row.ocrConfidence != null ? `${row.ocrConfidence} %` : "-"}
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            size="small"
                            onClick={() => handleOpenModal(row)}
                            sx={{
                              textTransform: "none",
                              fontWeight: 600,
                              borderRadius: 2,
                              px: 2,
                              ...(isPassed
                                ? { color: "#1e8e5a" }
                                : {
                                    border: `1px solid ${statusInfo.color}`,
                                    color: statusInfo.color,
                                  }),
                            }}
                          >
                            {isPassed ? "ดูรายละเอียด" : "ตรวจสอบ"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {totalDocs > 0 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mt: 2,
                flexWrap: "wrap",
                gap: 1,
              }}
            >
              <Typography variant="body2" sx={{ color: "#64748b" }}>
                {pagedDocuments.length} / {totalDocs} รายการ
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <IconButton
                  size="small"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeftIcon fontSize="small" />
                </IconButton>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Button
                    key={p}
                    size="small"
                    onClick={() => setPage(p)}
                    sx={{
                      minWidth: 32,
                      height: 32,
                      borderRadius: "50%",
                      fontWeight: 700,
                      ...(p === page
                        ? { bgcolor: BRAND, color: "#fff", "&:hover": { bgcolor: BRAND } }
                        : { color: "#475569" }),
                    }}
                  >
                    {p}
                  </Button>
                ))}
                <IconButton
                  size="small"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRightIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          )}
        </Paper>

        {/* Modal ตรวจสอบ/ดูรายละเอียดเอกสาร */}
        <Dialog
          open={openReviewModal}
          onClose={handleCloseModal}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: 4, p: 2, fontFamily: '"Kanit", sans-serif' } }}
        >
          <Box sx={{ display: "flex", justifyContent: "flex-end", pr: 1, pt: 1 }}>
            <IconButton onClick={handleCloseModal} disabled={isSubmitting}>
              <CloseIcon />
            </IconButton>
          </Box>
          <DialogContent sx={{ pt: 0 }}>
            {selectedDoc && (
              <>
                <Typography variant="h6" sx={{ fontWeight: 700, color: BRAND, mb: 0.5 }}>
                  {selectedDoc.docCategory}
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b", mb: 2 }}>
                  {selectedDoc.studentName || "-"}{" "}
                  {selectedDoc.studentCode ? `(${selectedDoc.studentCode})` : ""}
                </Typography>

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
                      <Button
                        href={selectedDoc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ textTransform: "none", color: BRAND }}
                      >
                        เปิดไฟล์ในแท็บใหม่
                      </Button>
                    )
                  ) : (
                    <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                      ไม่พบไฟล์แนบ
                    </Typography>
                  )}
                </Box>

                {readOnly ? (
                  selectedDoc.remark && (
                    <Typography variant="body2" sx={{ color: "#64748b" }}>
                      หมายเหตุ: {selectedDoc.remark}
                    </Typography>
                  )
                ) : (
                  <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    label="หมายเหตุ (จำเป็นเมื่อต้องแก้ไข)"
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    disabled={isSubmitting}
                    sx={{ mb: 1, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  />
                )}
              </>
            )}
          </DialogContent>

          {!readOnly && (
            <DialogActions sx={{ px: 3, pb: 3 }}>
              <Button
                onClick={() => handleReview("failed")}
                disabled={isSubmitting}
                sx={{
                  bgcolor: "#e08a1f",
                  color: "#fff",
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  fontWeight: 600,
                  textTransform: "none",
                  "&:hover": { bgcolor: "#b96f14" },
                }}
              >
                ต้องแก้ไข
              </Button>
              <Button
                onClick={() => handleReview("passed")}
                disabled={isSubmitting}
                sx={{
                  bgcolor: "#1e8e5a",
                  color: "#fff",
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  fontWeight: 600,
                  textTransform: "none",
                  "&:hover": { bgcolor: "#166b44" },
                }}
              >
                ผ่าน
              </Button>
            </DialogActions>
          )}
        </Dialog>
      </Box>
    </Box>
  );
}

export default DocumentReviewAdmin;