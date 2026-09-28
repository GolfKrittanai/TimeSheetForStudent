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
  List,
  ListItem,
  ListItemText,
  Divider,
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
const REQUIRED_DOC_COUNT = 5; // กำหนดจำนวนเอกสารที่ต้องส่งให้ครบ

// แผนผังสถานะระดับนักศึกษา
const STUDENT_STATUS_MAP = {
  passed: { label: "ผ่าน", bg: "#e8f8ef", color: "#1e8e5a" },
  failed: { label: "ต้องแก้ไข", bg: "#fff3e0", color: "#e08a1f" },
  pending: { label: "รอตรวจสอบ", bg: "#eef0ff", color: "#5b5fe0" },
  incomplete: { label: "ยังส่งไม่ครบ", bg: "#f1f5f9", color: "#64748b" },
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

  // State สำหรับ Modal ตรวจสอบ/ดูรายละเอียดของนักศึกษา
  const [openStudentModal, setOpenStudentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [activeDoc, setActiveDoc] = useState(null);
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

  // Group ข้อมูลเอกสารตามตัวนักศึกษา
  const studentGroupedData = useMemo(() => {
    const groups = {};

    documents.forEach((doc) => {
      const studentId = doc.studentCode || doc.userId || "UNKNOWN";
      if (!groups[studentId]) {
        groups[studentId] = {
          studentCode: studentId,
          studentName: doc.studentName || "-",
          docs: [],
          latestDate: doc.createdAt,
        };
      }
      groups[studentId].docs.push(doc);

      // วันที่ส่งล่าสุด
      if (new Date(doc.createdAt) > new Date(groups[studentId].latestDate)) {
        groups[studentId].latestDate = doc.createdAt;
      }
    });

    return Object.values(groups).map((student) => {
      const totalDocsSubmitted = student.docs.length;
      const passedDocsCount = student.docs.filter((d) => d.status === "passed").length;
      const hasFailedDoc = student.docs.some((d) => d.status === "failed");
      const hasPendingDoc = student.docs.some((d) => d.status === "pending" || !d.status);

      let overallStatus = "pending";

      // ปรับลำดับเงื่อนไขใหม่ให้เข้มงวดขึ้น (บังคับเช็กจำนวนที่ต้องส่งก่อนเสมอ)
      if (totalDocsSubmitted < REQUIRED_DOC_COUNT) {
        overallStatus = "incomplete"; // ถ้ายังส่งไม่ครบ 5 ฉบับ ให้แสดงเป็น "ยังส่งไม่ครบ" เสมอ
      } else if (hasFailedDoc) {
        overallStatus = "failed";    // ถ้ามีเอกสารที่ต้องแก้ไข
      } else if (passedDocsCount === REQUIRED_DOC_COUNT) {
        overallStatus = "passed";    // ครบ 5 ฉบับ และผ่านทั้งหมด
      } else if (hasPendingDoc) {
        overallStatus = "pending";   // ครบ 5 ฉบับ แต่มีบางใบรอตรวจ
      }

      return {
        ...student,
        docCount: totalDocsSubmitted,
        overallStatus,
      };
    });
  }, [documents]);

  const totalStudents = studentGroupedData.length;
  const totalDocs = documents.length;

  const totalPages = Math.max(1, Math.ceil(totalStudents / PAGE_SIZE));
  const pagedStudents = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return studentGroupedData.slice(start, start + PAGE_SIZE);
  }, [studentGroupedData, page]);

  const allCurrentPageSelected =
    pagedStudents.length > 0 &&
    pagedStudents.every((s) => selected.includes(s.studentCode));

  const toggleSelectAll = () => {
    const pageIds = pagedStudents.map((s) => s.studentCode);
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

  const handleOpenStudentModal = (student) => {
    setSelectedStudent(student);
    if (student.docs && student.docs.length > 0) {
      setActiveDoc(student.docs[0]);
      setRemark(student.docs[0].remark || "");
    }
    setOpenStudentModal(true);
  };

  const handleCloseModal = () => {
    if (!isSubmitting) {
      setOpenStudentModal(false);
      setSelectedStudent(null);
      setActiveDoc(null);
      setRemark("");
    }
  };

  const handleSelectDocInModal = (doc) => {
    setActiveDoc(doc);
    setRemark(doc.remark || "");
  };

  const handleReview = async (decision) => {
    if (!activeDoc) return;
    if (decision === "failed" && !remark.trim()) {
      alert("กรุณาระบุเหตุผลที่ต้องแก้ไข เพื่อแจ้งให้นักศึกษาทราบ");
      return;
    }
    setIsSubmitting(true);
    try {
      await reviewDocument(activeDoc.id, decision, remark.trim());
      await loadDocuments();
      handleCloseModal();
    } catch (error) {
      console.error("Review Error:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกผลการตรวจสอบ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isImageFile = (url = "") => /\.(jpg|jpeg|png|webp|bmp)$/i.test(url);
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
              value={totalStudents}
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
                  <TableCell align="center" sx={{ fontWeight: 700, color: "#475569" }}>
                    จำนวนเอกสาร
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#475569" }}>วันที่ส่งล่าสุด</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: "#475569" }}>
                    สถานะ
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: "#475569" }}>
                    ดำเนินการ
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pageLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                      <CircularProgress size={26} sx={{ color: BRAND }} />
                    </TableCell>
                  </TableRow>
                ) : pagedStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 5, color: "#94a3b8" }}>
                      ไม่พบรายการนักศึกษา
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedStudents.map((row) => {
                    const statusInfo =
                      STUDENT_STATUS_MAP[row.overallStatus] || STUDENT_STATUS_MAP.pending;
                    const dt = formatDate(row.latestDate);
                    const isPassed = row.overallStatus === "passed";

                    return (
                      <TableRow key={row.studentCode} hover>
                        <TableCell padding="checkbox">
                          <Checkbox
                            size="small"
                            checked={selected.includes(row.studentCode)}
                            onChange={() => toggleSelectOne(row.studentCode)}
                          />
                        </TableCell>
                        <TableCell sx={{ color: "#334155", fontWeight: 500 }}>
                          {row.studentName}
                        </TableCell>
                        <TableCell sx={{ color: "#334155" }}>{row.studentCode}</TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                            <InsertDriveFileIcon sx={{ fontSize: 18, color: "#a855f7" }} />
                            <Typography variant="body2" sx={{ color: "#334155", fontWeight: 600 }}>
                              {row.docCount} / {REQUIRED_DOC_COUNT} ฉบับ
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
                        <TableCell align="center">
                          <Button
                            size="small"
                            onClick={() => handleOpenStudentModal(row)}
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
          {totalStudents > 0 && (
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
                {pagedStudents.length} / {totalStudents} รายการ
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

        {/* Modal แสดงรายการเอกสารของนักศึกษาเพื่อตรวจสอบ */}
        <Dialog
          open={openStudentModal}
          onClose={handleCloseModal}
          maxWidth="lg"
          fullWidth
          PaperProps={{ sx: { borderRadius: 4, p: 2, fontFamily: '"Kanit", sans-serif' } }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 2, pt: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: BRAND }}>
              เอกสารของ {selectedStudent?.studentName} ({selectedStudent?.studentCode})
            </Typography>
            <IconButton onClick={handleCloseModal} disabled={isSubmitting}>
              <CloseIcon />
            </IconButton>
          </Box>

          <DialogContent sx={{ pt: 2 }}>
            {selectedStudent && (
              <Grid container spacing={2}>
                {/* ฝั่งซ้าย: รายการเอกสารทั้งหมดที่ส่งมา */}
                <Grid item xs={12} md={4}>
                  <Paper variant="outlined" sx={{ borderRadius: 2, p: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, px: 1, color: "#475569" }}>
                      รายการเอกสาร ({selectedStudent.docs.length}/{REQUIRED_DOC_COUNT})
                    </Typography>
                    <List disablePadding>
                      {selectedStudent.docs.map((doc, idx) => {
                        const isSelected = activeDoc?.id === doc.id;
                        return (
                          <React.Fragment key={doc.id}>
                            {idx > 0 && <Divider />}
                            <ListItem
                              button
                              onClick={() => handleSelectDocInModal(doc)}
                              sx={{
                                borderRadius: 1.5,
                                bgcolor: isSelected ? "#eaf6f1" : "transparent",
                                "&:hover": { bgcolor: "#f1f5f9" },
                              }}
                            >
                              <ListItemText
                                primary={doc.docCategory || `เอกสารที่ ${idx + 1}`}
                                secondary={`สถานะ: ${doc.status === "passed" ? "ผ่าน" : doc.status === "failed" ? "ต้องแก้ไข" : "รอตรวจสอบ"}`}
                                primaryTypographyProps={{ fontSize: "0.9rem", fontWeight: isSelected ? 700 : 500 }}
                                secondaryTypographyProps={{ fontSize: "0.8rem" }}
                              />
                            </ListItem>
                          </React.Fragment>
                        );
                      })}
                    </List>
                  </Paper>
                </Grid>

                {/* ฝั่งขวา: พรีวิวไฟล์เอกสารและปุ่มให้คะแนน */}
                <Grid item xs={12} md={8}>
                  {activeDoc ? (
                    <Box sx={{ border: "1px solid #e2e8f0", borderRadius: 3, p: 2, bgcolor: "#fff" }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: BRAND, mb: 1 }}>
                        {activeDoc.docCategory}
                      </Typography>

                      <Box
                        sx={{
                          border: "1px solid #e2e8f0",
                          borderRadius: 2,
                          bgcolor: "#f8fafc",
                          minHeight: 320,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                          mb: 2,
                        }}
                      >
                        {activeDoc.fileUrl ? (
                          isImageFile(activeDoc.fileUrl) ? (
                            <Box
                              component="img"
                              src={activeDoc.fileUrl}
                              alt={activeDoc.docCategory}
                              sx={{ maxWidth: "100%", maxHeight: 360, objectFit: "contain" }}
                            />
                          ) : isPdfFile(activeDoc.fileUrl) ? (
                            <Box
                              component="iframe"
                              src={activeDoc.fileUrl}
                              title={activeDoc.docCategory}
                              sx={{ width: "100%", height: 360, border: "none" }}
                            />
                          ) : (
                            <Button
                              href={activeDoc.fileUrl}
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

                      {activeDoc.status === "passed" ? (
                        activeDoc.remark && (
                          <Typography variant="body2" sx={{ color: "#64748b" }}>
                            หมายเหตุ: {activeDoc.remark}
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
                    </Box>
                  ) : (
                    <Typography variant="body2" sx={{ color: "#94a3b8", textAlign: "center", py: 5 }}>
                      เลือกเอกสารทางซ้ายเพื่อตรวจสอบ
                    </Typography>
                  )}
                </Grid>
              </Grid>
            )}
          </DialogContent>

          {activeDoc && activeDoc.status !== "passed" && (
            <DialogActions sx={{ px: 3, pb: 2 }}>
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
                ต้องแก้ไขฉบับนี้
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
                อนุมัติฉบับนี้
              </Button>
            </DialogActions>
          )}
        </Dialog>
      </Box>
    </Box>
  );
}

export default DocumentReviewAdmin;