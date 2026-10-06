// src/pages/Admin/AdminStudentDocReviewList.js
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Select,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Pagination,
  CircularProgress,
  Dialog,
  IconButton,
  FormControlLabel,
  Checkbox,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Close as CloseIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Fullscreen as FullscreenIcon,
  SkipPrevious as SkipPreviousIcon,
  SkipNext as SkipNextIcon,
  Check as CheckIcon,
  Clear as ClearIcon,
  CheckCircle as CheckCircleIcon,
  WarningRounded as WarningRoundedIcon,
  DescriptionOutlined as DocIcon,
  InsertDriveFile as FileIcon,
  ModeEdit as ModeEditIcon,
} from "@mui/icons-material";

import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";
import { getAllStudents } from "../../services/studentService";
import {
  getAllDocumentsForReview,
  getUserDocumentHistory,
  reviewDocument,
} from "../../services/documentScanService";

const BRAND_DARK = "#134e4a";
const THEME_GREEN = "#1b6957";
const THEME_HOVER = "#134e4a";

// 🟢 เอกสารเป้าหมายที่นักศึกษาอัปโหลดใน Step 2
const STEP2_TARGET_DOCS = [
  {
    key: "page1",
    label: "เอกสารตอบกลับ (หน้า 1)",
    subLabel: "ข้อมูลสถานประกอบการและผลการตอบรับ",
    matchPattern: /(ตอบกลับ.*หน้า\s*1|เอกสารตอบกลับ\s*\(หน้า\s*1\))/i,
  },
  {
    key: "page2",
    label: "เอกสารตอบกลับ (หน้า 2)",
    subLabel: "รายละเอียดคุณสมบัติและตำแหน่งงาน",
    matchPattern: /(ตอบกลับ.*หน้า\s*2|เอกสารตอบกลับ\s*\(หน้า\s*2\))/i,
  },
];

const TOTAL_STEP2_DOCS = STEP2_TARGET_DOCS.length;

function AdminStudentDocReviewList() {
  const { token } = useAuth();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [loading, setLoading] = useState(true);
  const [dataList, setDataList] = useState([]);

  // Filter & Search
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ทั้งหมด");
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  // 🟢 Modal Review State (เหมือนกับหน้า AdminDocumentManagement)
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDocsMap, setStudentDocsMap] = useState({});
  const [currentDocIndex, setCurrentDocIndex] = useState(0);
  const [reviewsState, setReviewsState] = useState({});
  const [actionLoading, setActionLoading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // ฟังก์ชันแปลง URL ไฟล์จริง
  const formatFileUrl = (url) => {
    if (!url) return null;
    let clean = String(url).trim();

    if (
      clean.startsWith("http://") ||
      clean.startsWith("https://") ||
      clean.startsWith("blob:") ||
      clean.startsWith("data:")
    ) {
      return clean;
    }

    clean = clean.replace(/\\/g, "/").replace(/^\/+/, "");

    if (!clean.toLowerCase().startsWith("uploads/")) {
      clean = `uploads/${clean}`;
    }

    const rawApi =
      process.env.REACT_APP_API ||
      process.env.REACT_APP_API_URL ||
      "http://localhost:5000";

    let baseHost = rawApi;
    try {
      const parsed = new URL(rawApi);
      baseHost = `${parsed.protocol}//${parsed.host}`;
    } catch {
      baseHost = rawApi.replace(/\/api\/?.*$/, "").replace(/\/+$/, "");
    }

    return `${baseHost}/${clean}`;
  };

  // ดึงข้อมูลนักศึกษาและเอกสารทั้งหมด
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const activeToken = token || localStorage.getItem("token");

      const [studentsRes, allDocsRes] = await Promise.all([
        getAllStudents(activeToken),
        getAllDocumentsForReview().catch(() => []),
      ]);

      let rawStudents = [];
      if (Array.isArray(studentsRes)) rawStudents = studentsRes;
      else if (studentsRes?.data && Array.isArray(studentsRes.data)) rawStudents = studentsRes.data;
      else if (studentsRes?.data?.data && Array.isArray(studentsRes.data.data)) rawStudents = studentsRes.data.data;

      let allDocs = [];
      if (Array.isArray(allDocsRes)) allDocs = allDocsRes;
      else if (allDocsRes?.data && Array.isArray(allDocsRes.data)) allDocs = allDocsRes.data;
      else if (allDocsRes?.data?.data && Array.isArray(allDocsRes.data.data)) allDocs = allDocsRes.data.data;

      const formatted = rawStudents
        .filter((item) => item.role === "student")
        .map((s) => {
          let docs = Array.isArray(s.documentScans)
            ? s.documentScans
            : Array.isArray(s.documents)
            ? s.documents
            : Array.isArray(s.DocumentScan)
            ? s.DocumentScan
            : Array.isArray(s.document_scan)
            ? s.document_scan
            : [];

          if (docs.length === 0 && allDocs.length > 0) {
            docs = allDocs.filter((d) => {
              const ext =
                typeof d.extractedData === "string"
                  ? JSON.parse(d.extractedData || "{}")
                  : d.extractedData || {};

              const matchesUserId = Number(d.userId) === Number(s.id);
              const matchesStudentId =
                ext.studentId &&
                s.studentId &&
                String(ext.studentId).trim() === String(s.studentId).trim();
              const matchesName =
                ext.fullName && s.fullName && s.fullName.includes(ext.fullName);

              return matchesUserId || matchesStudentId || matchesName;
            });
          }

          const latestStep2Docs = {};
          STEP2_TARGET_DOCS.forEach((target) => {
            const matchedList = docs.filter((d) => {
              const catName = String(d.docCategory || d.name || "");
              return target.matchPattern.test(catName);
            });

            if (matchedList.length > 0) {
              matchedList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
              latestStep2Docs[target.key] = matchedList[0];
            }
          });

          const activeDocsList = Object.values(latestStep2Docs);
          const uploadedCount = activeDocsList.length;

          let computedStatus = "รออัปโหลด";
          if (uploadedCount === 0) {
            computedStatus = "รออัปโหลด";
          } else {
            const hasFailed = activeDocsList.some(
              (d) =>
                d.status === "failed" ||
                d.status === "ไม่ผ่าน" ||
                d.status === "ต้องแก้ไข"
            );
            const hasPending = activeDocsList.some(
              (d) =>
                d.status === "pending" ||
                d.status === "รอการตรวจสอบ" ||
                d.status === "รอตรวจสอบ"
            );
            const isAllPassed =
              uploadedCount === TOTAL_STEP2_DOCS &&
              activeDocsList.every(
                (d) => d.status === "passed" || d.status === "ผ่าน" || d.status === "สำเร็จ"
              );

            if (hasFailed) computedStatus = "ต้องแก้ไข";
            else if (hasPending) computedStatus = "รอตรวจ";
            else if (isAllPassed) computedStatus = "ผ่านครบ";
            else computedStatus = "ยังส่งไม่ครบ";
          }

          const facultyBranch = `${s.faculty || "บริหารธุรกิจ"} / ${s.branch || s.major || "ระบบสารสนเทศ"}`;

          return {
            id: s.id,
            studentId: s.studentId || "-",
            name: s.fullName || "-",
            facultyBranch,
            course: s.course || "ปริญญาตรี",
            phone: s.phone || "-",
            email: s.email || "-",
            docCount: `${uploadedCount}/${TOTAL_STEP2_DOCS}`,
            uploadedDocs: activeDocsList,
            status: computedStatus,
          };
        });

      setDataList(formatted);
    } catch (err) {
      console.error("Error fetching students:", err);
      Swal.fire({
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถดึงข้อมูลเอกสารนักศึกษาได้",
        icon: "error",
        confirmButtonColor: THEME_GREEN,
      });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // สถิติ 4 ใบ
  const stats = useMemo(() => {
    return {
      pending: dataList.filter((d) => d.status === "รอตรวจ").length,
      passed: dataList.filter((d) => d.status === "ผ่านครบ").length,
      needsFix: dataList.filter((d) => d.status === "ต้องแก้ไข").length,
      incomplete: dataList.filter(
        (d) => d.status === "ยังส่งไม่ครบ" || d.status === "รออัปโหลด"
      ).length,
    };
  }, [dataList]);

  // เปิด Modal ตรวจสอบเอกสาร
  const handleOpenReviewModal = async (student) => {
    setSelectedStudent(student);
    setCurrentDocIndex(0);
    setZoomLevel(1);
    setReviewOpen(true);
    setReviewLoading(true);

    try {
      let rawHistory = [];
      try {
        const res = await getUserDocumentHistory(student.id);
        rawHistory = Array.isArray(res) ? res : res?.data || res?.documents || [];
      } catch (e) {
        console.warn("ดึงประวัติ student.id ไม่สำเร็จ:", e);
      }

      if (!rawHistory || rawHistory.length === 0) {
        try {
          const allDocsRes = await getAllDocumentsForReview();
          const allDocs = Array.isArray(allDocsRes) ? allDocsRes : allDocsRes?.data || [];

          rawHistory = allDocs.filter((doc) => {
            const ext =
              typeof doc.extractedData === "string"
                ? JSON.parse(doc.extractedData || "{}")
                : doc.extractedData || {};
            const matchesUserId = Number(doc.userId) === Number(student.id);
            const matchesStudentId =
              ext.studentId &&
              student.studentId &&
              String(ext.studentId).trim() === String(student.studentId).trim();
            const matchesName =
              ext.fullName && student.name && student.name.includes(ext.fullName);

            return matchesUserId || matchesStudentId || matchesName;
          });
        } catch (fallbackErr) {
          console.error("Fallback error:", fallbackErr);
        }
      }

      const docsMap = {};
      const initialReviews = {};

      STEP2_TARGET_DOCS.forEach((target) => {
        const matchedList = rawHistory.filter((doc) => {
          const catName = String(doc.docCategory || doc.name || "");
          return target.matchPattern.test(catName);
        });

        if (matchedList.length > 0) {
          matchedList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          const latest = matchedList[0];

          docsMap[target.key] = {
            ...latest,
            fileFullUrl: formatFileUrl(latest.fileUrl),
            parsedExtracted:
              typeof latest.extractedData === "string"
                ? JSON.parse(latest.extractedData || "{}")
                : latest.extractedData || {},
          };

          const isFailed = latest.status === "failed";
          initialReviews[target.key] = {
            decision: isFailed ? "failed" : "passed",
            reasons: {
              incomplete: latest.remark?.includes("เอกสารไม่ครบ") || false,
              mismatch: latest.remark?.includes("ข้อมูลไม่ตรง") || false,
              noSignature: latest.remark?.includes("ไม่มีลายเซ็น") || false,
              noDate: latest.remark?.includes("ไม่มีวันที่") || false,
            },
            customRemark: latest.remark ? latest.remark.replace(/.*ข้อเสนอแนะ:\s*/, "") : "",
          };
        } else {
          docsMap[target.key] = null;
          initialReviews[target.key] = {
            decision: "passed",
            reasons: { incomplete: false, mismatch: false, noSignature: false, noDate: false },
            customRemark: "",
          };
        }
      });

      setStudentDocsMap(docsMap);
      setReviewsState(initialReviews);
    } catch (err) {
      console.error("เกิดข้อผิดพลาดในการโหลดเอกสาร:", err);
      setStudentDocsMap({});
    } finally {
      setReviewLoading(false);
    }
  };

  const handleCloseReviewModal = () => {
    setReviewOpen(false);
    setSelectedStudent(null);
    setStudentDocsMap({});
    setReviewsState({});
  };

  // จัดการข้อมูลของเอกสารที่เปิดดูอยู่ปัจจุบัน
  const activeCategory = STEP2_TARGET_DOCS[currentDocIndex] || STEP2_TARGET_DOCS[0];
  const currentActiveDoc = studentDocsMap[activeCategory.key];
  const extracted = currentActiveDoc?.parsedExtracted || {};

  const currentDocReview = reviewsState[activeCategory.key] || {
    decision: "passed",
    reasons: { incomplete: false, mismatch: false, noSignature: false, noDate: false },
    customRemark: "",
  };

  const updateCurrentDocReview = (field, value) => {
    setReviewsState((prev) => ({
      ...prev,
      [activeCategory.key]: {
        ...prev[activeCategory.key],
        [field]: value,
      },
    }));
  };

  const displayStudentName = extracted.studentName || extracted.fullName || selectedStudent?.name || "-";
  const displayStudentId = extracted.studentId || selectedStudent?.studentId || "-";
  const displayDegree = extracted.degree || selectedStudent?.course || "ปริญญาตรี";
  const displayBranch = extracted.branch || selectedStudent?.facultyBranch || "ระบบสารสนเทศ";
  const displayPhone = extracted.phone || selectedStudent?.phone || "-";
  const displayEmail = extracted.email || selectedStudent?.email || "-";

  const uploadDate = currentActiveDoc?.createdAt
    ? new Date(currentActiveDoc.createdAt).toLocaleDateString("th-TH", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }) +
      " " +
      new Date(currentActiveDoc.createdAt).toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
      }) +
      " น."
    : "-";

  // บันทึกผลการตรวจแยกรายฉบับ
  const handleSaveReview = async () => {
    const uploadedDocsEntries = Object.entries(studentDocsMap).filter(([_, d]) => d && d.id);

    if (uploadedDocsEntries.length === 0) {
      Swal.fire({
        title: "ไม่พบเอกสาร",
        text: "นักศึกษายังไม่ได้อัปโหลดเอกสารเข้ามาในระบบ ไม่สามารถดำเนินการได้",
        icon: "warning",
        confirmButtonColor: THEME_GREEN,
      });
      return;
    }

    try {
      setActionLoading(true);

      const reviewPromises = uploadedDocsEntries.map(([catKey, doc]) => {
        const reviewData = reviewsState[catKey] || { decision: "passed", reasons: {}, customRemark: "" };
        const isPassed = reviewData.decision === "passed";
        let finalRemark = "";

        if (!isPassed) {
          const selectedReasons = [];
          if (reviewData.reasons.incomplete) selectedReasons.push("เอกสารไม่ครบ");
          if (reviewData.reasons.mismatch) selectedReasons.push("ข้อมูลไม่ตรง");
          if (reviewData.reasons.noSignature) selectedReasons.push("ไม่มีลายเซ็น");
          if (reviewData.reasons.noDate) selectedReasons.push("ไม่มีวันที่");

          finalRemark = selectedReasons.join(", ");
          if (reviewData.customRemark?.trim()) {
            finalRemark = finalRemark
              ? `${finalRemark} | ข้อเสนอแนะ: ${reviewData.customRemark.trim()}`
              : reviewData.customRemark.trim();
          }
        } else {
          finalRemark = reviewData.customRemark?.trim() || "เอกสารสมบูรณ์ผ่านการตรวจสอบ";
        }

        return reviewDocument(doc.id, isPassed ? "passed" : "failed", finalRemark);
      });

      await Promise.all(reviewPromises);

      handleCloseReviewModal();

      let passedCount = 0;
      let failedCount = 0;
      uploadedDocsEntries.forEach(([catKey]) => {
        if (reviewsState[catKey]?.decision === "passed") passedCount++;
        else failedCount++;
      });

      Swal.fire({
        title: "บันทึกผลการตรวจเรียบร้อย",
        text: `อนุมัติผ่าน ${passedCount} ฉบับ, ต้องแก้ไข ${failedCount} ฉบับ`,
        icon: "success",
        confirmButtonColor: THEME_GREEN,
      });

      fetchData();
    } catch (err) {
      console.error("Save Review Error:", err);
      Swal.fire({
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถบันทึกสถานะเอกสารได้ กรุณาลองใหม่อีกครั้ง",
        icon: "error",
        confirmButtonColor: THEME_GREEN,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSearch = () => {
    setSearchTerm(searchInput);
    setPage(1);
  };

  const filteredData = useMemo(() => {
    return dataList.filter((item) => {
      const lower = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !lower ||
        item.name.toLowerCase().includes(lower) ||
        item.studentId.toLowerCase().includes(lower);

      const matchesStatus =
        statusFilter === "ทั้งหมด" || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [dataList, searchTerm, statusFilter]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, page]);

  const renderStatusChip = (status) => {
    let bgcolor = "#f1f5f9";
    let color = "#475569";

    if (status === "รอตรวจ") {
      bgcolor = "#fef3c7";
      color = "#d97706";
    } else if (status === "ผ่านครบ") {
      bgcolor = "#dcfce7";
      color = "#16a34a";
    } else if (status === "ต้องแก้ไข") {
      bgcolor = "#fee2e2";
      color = "#dc2626";
    } else if (status === "รออัปโหลด" || status === "ยังส่งไม่ครบ") {
      bgcolor = "#e0f2fe";
      color = "#0284c7";
    }

    return (
      <Chip
        label={status}
        size="small"
        sx={{
          bgcolor,
          color,
          fontWeight: 700,
          borderRadius: "16px",
          px: 1.5,
          height: 26,
          fontSize: "0.78rem",
        }}
      />
    );
  };

  const isLastDocument = currentDocIndex === STEP2_TARGET_DOCS.length - 1;

  return (
    <Box sx={{ display: "flex", bgcolor: "#f4f6f8", minHeight: "100vh", fontFamily: '"Kanit", sans-serif' }}>
      <Sidebar />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: isSmallScreen ? 2 : 4,
          mt: isSmallScreen ? 5 : 0,
          maxWidth: 1400,
          mx: "auto",
          width: "100%",
        }}
      >
        {/* หัวข้อด้านบน */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="caption"
            sx={{ color: "#00796b", fontWeight: 700, fontSize: "0.95rem", letterSpacing: 0.5 }}
          >
            Management data
          </Typography>
          <Typography
            variant="h4"
            sx={{ fontWeight: 800, color: BRAND_DARK, mt: 0.5, letterSpacing: -0.5 }}
          >
            ตรวจสอบเอกสารนักศึกษา
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b", mt: 0.5 }}>
            ติดตามสถานะ ตรวจไฟล์ และค้นหานักศึกษาที่ส่งเอกสารเข้าระบบ
          </Typography>
        </Box>

        {/* การ์ดสถิติ 4 ช่อง */}
        <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: "16px", bgcolor: "#ffffff", border: "1px solid #e2e8f0" }}>
              <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.85rem", fontWeight: 600 }}>รอตรวจ</Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, color: "#1e293b", mt: 1 }}>{stats.pending}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: "16px", bgcolor: "#ffffff", border: "1px solid #e2e8f0" }}>
              <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.85rem", fontWeight: 600 }}>ผ่านครบ</Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, color: "#1e293b", mt: 1 }}>{stats.passed}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: "16px", bgcolor: "#ffffff", border: "1px solid #e2e8f0" }}>
              <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.85rem", fontWeight: 600 }}>ต้องแก้ไข</Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, color: "#1e293b", mt: 1 }}>{stats.needsFix}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: "16px", bgcolor: "#ffffff", border: "1px solid #e2e8f0" }}>
              <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.85rem", fontWeight: 600 }}>ยังส่งไม่ครบ</Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, color: "#1e293b", mt: 1 }}>{stats.incomplete}</Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* การ์ดค้นหาและตารางรายชื่อ */}
        <Paper elevation={0} sx={{ p: { xs: 2, sm: 3.5 }, borderRadius: "20px", bgcolor: "#ffffff", border: "1px solid #e2e8f0" }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#1e293b", mb: 2 }}>
            ค้นหาและกรอง
          </Typography>

          <Box sx={{ display: "flex", alignItems: "flex-end", gap: 2, mb: 3, flexWrap: "wrap" }}>
            <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 280px" } }}>
              <Typography variant="caption" sx={{ display: "block", color: "#64748b", mb: 0.5, fontWeight: 700 }}>
                ค้นหา
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="ชื่อ-นามสกุล หรือ รหัสนักศึกษา"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", bgcolor: "#ffffff" } }}
              />
            </Box>

            <Box sx={{ width: { xs: "100%", sm: 180 } }}>
              <Typography variant="caption" sx={{ display: "block", color: "#64748b", mb: 0.5, fontWeight: 700 }}>
                สถานะ
              </Typography>
              <Select
                fullWidth
                size="small"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                sx={{ borderRadius: "8px", height: 40 }}
              >
                <MenuItem value="ทั้งหมด">ทั้งหมด</MenuItem>
                <MenuItem value="รอตรวจ">รอตรวจ</MenuItem>
                <MenuItem value="ผ่านครบ">ผ่านครบ</MenuItem>
                <MenuItem value="ต้องแก้ไข">ต้องแก้ไข</MenuItem>
                <MenuItem value="รออัปโหลด">รออัปโหลด</MenuItem>
                <MenuItem value="ยังส่งไม่ครบ">ยังส่งไม่ครบ</MenuItem>
              </Select>
            </Box>

            <Button
              variant="contained"
              onClick={handleSearch}
              sx={{
                bgcolor: THEME_GREEN,
                color: "#ffffff",
                borderRadius: "8px",
                px: 4,
                height: 40,
                fontWeight: 700,
                fontSize: "0.95rem",
                textTransform: "none",
                boxShadow: "none",
                "&:hover": { bgcolor: THEME_HOVER, boxShadow: "none" },
              }}
            >
              ค้นหา
            </Button>
          </Box>

          <TableContainer sx={{ border: "1px solid #f1f5f9", borderRadius: "10px", overflowX: "auto" }}>
            <Table size="medium">
              <TableHead sx={{ bgcolor: "#fafafa" }}>
                <TableRow>
                  <TableCell align="center" sx={{ fontWeight: 700, color: "#64748b", fontSize: "0.82rem", width: 70 }}>ลำดับ</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#64748b", fontSize: "0.82rem" }}>รหัสนักศึกษา</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#64748b", fontSize: "0.82rem" }}>ชื่อ-นามสกุล</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#64748b", fontSize: "0.82rem" }}>คณะ / สาขา</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: "#64748b", fontSize: "0.82rem" }}>จำนวนเอกสาร</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: "#64748b", fontSize: "0.82rem" }}>สถานะ</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: "#64748b", fontSize: "0.82rem", width: 140 }}>ดำเนินการ</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <CircularProgress size={32} sx={{ color: THEME_GREEN }} />
                    </TableCell>
                  </TableRow>
                ) : paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4, color: "#94a3b8" }}>
                      ไม่พบข้อมูลนักศึกษาที่ค้นหา
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((row, index) => (
                    <TableRow
                      key={row.id}
                      hover
                      sx={{ "&:last-child td, &:last-child th": { border: 0 }, "& td": { py: 1.6, fontSize: "0.88rem" } }}
                    >
                      <TableCell align="center" sx={{ color: "#64748b" }}>
                        {(page - 1) * rowsPerPage + index + 1}
                      </TableCell>
                      <TableCell sx={{ color: "#334155" }}>{row.studentId}</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#334155" }}>{row.name}</TableCell>
                      <TableCell sx={{ color: "#64748b" }}>{row.facultyBranch}</TableCell>
                      <TableCell align="center" sx={{ color: "#334155", fontWeight: 600 }}>{row.docCount}</TableCell>
                      <TableCell align="center">{renderStatusChip(row.status)}</TableCell>
                      <TableCell align="center">
                        {/* 🟢 ปุ่มดูรายละเอียด: เปิด Pop-up Modal ตรวจเอกสารจริง */}
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleOpenReviewModal(row)}
                          sx={{
                            bgcolor: THEME_GREEN,
                            color: "#ffffff",
                            borderRadius: "6px",
                            px: 2,
                            py: 0.5,
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            textTransform: "none",
                            boxShadow: "none",
                            "&:hover": { bgcolor: THEME_HOVER, boxShadow: "none" },
                          }}
                        >
                          ดูรายละเอียด
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2.5, flexWrap: "wrap", gap: 1.5 }}>
            <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
              {filteredData.length > 0 ? `แสดง ${paginatedData.length} รายการจาก ${filteredData.length} รายการ` : "0 รายการ"}
            </Typography>

            <Pagination
              count={Math.ceil(filteredData.length / rowsPerPage) || 1}
              page={page}
              onChange={(e, val) => setPage(val)}
              shape="rounded"
              size="small"
              sx={{
                "& .MuiPaginationItem-root": { borderRadius: "6px", fontWeight: 600, fontSize: "0.8rem" },
                "& .Mui-selected": { bgcolor: "#1b6957 !important", color: "#fff" },
              }}
            />
          </Box>
        </Paper>

        {/* =================================================================== */}
        {/* 🟢 POP-UP MODAL ตรวจสอบเอกสาร (เหมือนกับหน้า AdminDocumentManagement) */}
        {/* =================================================================== */}
        <Dialog
          open={reviewOpen}
          onClose={handleCloseReviewModal}
          maxWidth="xl"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: "16px",
              bgcolor: "#ffffff",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              maxHeight: "96vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            },
          }}
        >
          {/* Header Bar สีเขียวเข้มพร้อมปุ่มปิด X */}
          <Box
            sx={{
              bgcolor: "#1b6957",
              color: "#ffffff",
              py: 1.5,
              px: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontWeight: 700,
              fontSize: "1.05rem",
              flexShrink: 0,
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
              ตรวจสอบเอกสารตอบกลับจากสถานประกอบการ
            </Typography>
            <IconButton onClick={handleCloseReviewModal} sx={{ color: "#ffffff", p: 0.5 }}>
              <CloseIcon sx={{ fontSize: 26 }} />
            </IconButton>
          </Box>

          <Box sx={{ p: 3, overflowY: "auto", flexGrow: 1, bgcolor: "#f8fafc" }}>
            <Grid container spacing={3}>
              {/* 🟢 ฝั่งซ้าย: ดูตัวอย่างไฟล์ (PDF / Image) */}
              <Grid item xs={12} md={6}>
                <Paper
                  variant="outlined"
                  sx={{
                    height: { xs: 550, md: 740 },
                    bgcolor: "#e2e8f0",
                    borderColor: "#cbd5e1",
                    borderRadius: "12px",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  <Box
                    sx={{
                      flexGrow: 1,
                      overflow: "auto",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      p: 2,
                    }}
                  >
                    {reviewLoading ? (
                      <Box sx={{ textAlign: "center" }}>
                        <CircularProgress size={40} sx={{ color: "#1b6957" }} />
                        <Typography variant="body2" sx={{ mt: 1.5, color: "#64748b" }}>
                          กำลังโหลดเอกสาร...
                        </Typography>
                      </Box>
                    ) : currentActiveDoc && currentActiveDoc.fileFullUrl ? (
                      currentActiveDoc.fileFullUrl.toLowerCase().includes(".pdf") ? (
                        <iframe
                          src={currentActiveDoc.fileFullUrl}
                          title="PDF Preview"
                          width="100%"
                          height="100%"
                          style={{ border: "none", borderRadius: "8px" }}
                        />
                      ) : (
                        <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
                          <Box
                            component="img"
                            src={currentActiveDoc.fileFullUrl}
                            alt="Document Preview"
                            sx={{
                              transform: `scale(${zoomLevel})`,
                              transformOrigin: "center center",
                              transition: "transform 0.2s ease-in-out",
                              maxWidth: "100%",
                              maxHeight: "100%",
                              objectFit: "contain",
                              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                              borderRadius: "4px",
                            }}
                          />
                        </Box>
                      )
                    ) : (
                      <Box sx={{ textAlign: "center", color: "#94a3b8", p: 3 }}>
                        <DocIcon sx={{ fontSize: 72, mb: 1, color: "#cbd5e1" }} />
                        <Typography variant="h6" sx={{ fontWeight: 700, color: "#64748b" }}>
                          ไม่มีเอกสารที่อัปโหลด
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                          นักศึกษายังไม่ได้อัปโหลดเอกสารหมวดนี้ ({activeCategory.label})
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* แถบเครื่องมือควบคุมการซูม */}
                  <Box
                    sx={{
                      bgcolor: "#ffffff",
                      py: 1,
                      px: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderTop: "1px solid #e2e8f0",
                    }}
                  >
                    <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
                      &lt; {currentDocIndex + 1} / {STEP2_TARGET_DOCS.length} &gt;
                    </Typography>

                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                      <IconButton size="small" onClick={() => setZoomLevel((prev) => Math.max(0.6, prev - 0.2))}>
                        <ZoomOutIcon sx={{ fontSize: 20 }} />
                      </IconButton>
                      <IconButton size="small" onClick={() => setZoomLevel((prev) => Math.min(2.5, prev + 0.2))}>
                        <ZoomInIcon sx={{ fontSize: 20 }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => {
                          if (currentActiveDoc?.fileFullUrl) window.open(currentActiveDoc.fileFullUrl, "_blank");
                        }}
                      >
                        <FullscreenIcon sx={{ fontSize: 20 }} />
                      </IconButton>
                    </Box>
                  </Box>
                </Paper>
              </Grid>

              {/* 🟢 ฝั่งขวา: รายละเอียดเอกสาร ข้อมูลนักศึกษา และผลการตรวจสอบ */}
              <Grid item xs={12} md={6}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 3,
                    bgcolor: "#ffffff",
                    borderColor: "#e2e8f0",
                    borderRadius: "12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 2.5,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                    <Box sx={{ bgcolor: "#e6f4ea", p: 1, borderRadius: "10px", color: "#134e4a", mt: 0.5 }}>
                      <FileIcon sx={{ fontSize: 28 }} />
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: "#134e4a", lineHeight: 1.2 }}>
                        {activeCategory.label}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 500 }}>
                        {activeCategory.subLabel}
                      </Typography>
                    </Box>
                  </Box>

                  {/* ข้อมูลนักศึกษาและข้อมูลที่สแกนได้ */}
                  <Box sx={{ bgcolor: "#f8fafc", borderRadius: "12px", border: "1px solid #f1f5f9", overflow: "hidden" }}>
                    <Box sx={{ bgcolor: "#f1f8f5", py: 1.2, px: 2, display: "flex", alignItems: "center", gap: 1 }}>
                      <DocIcon sx={{ fontSize: 20, color: "#1b6957" }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#134e4a" }}>
                        ข้อมูลนักศึกษาและข้อมูลตอบรับ
                      </Typography>
                    </Box>

                    <Box sx={{ p: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>ชื่อ-สกุล</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: "#1e293b" }}>{displayStudentName}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>รหัสนักศึกษา</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: "#1e293b" }}>{displayStudentId}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>คณะ / สาขา</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: "#334155" }}>{displayBranch}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>สถานประกอบการ</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: "#334155" }}>{extracted.companyName || "-"}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>ตำแหน่ง</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: "#334155" }}>{extracted.position || extracted.jobPosition || "-"}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>ผลตอบรับ</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: extracted.responseStatus?.includes("ไม่") ? "#dc2626" : "#16a34a" }}>
                            {extracted.responseStatus || "-"}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>วันที่อัปโหลด</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: "#334155" }}>{uploadDate}</Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  </Box>

                  {/* ผลการตรวจสอบเอกสารฉบับนี้ */}
                  <Box sx={{ bgcolor: "#f8fafc", borderRadius: "12px", border: "1px solid #f1f5f9", overflow: "hidden" }}>
                    <Box sx={{ bgcolor: "#f1f8f5", py: 1.2, px: 2, display: "flex", alignItems: "center", gap: 1 }}>
                      <ModeEditIcon sx={{ fontSize: 18, color: "#1b6957" }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#134e4a" }}>
                        ผลการตรวจสอบ ({activeCategory.label})
                      </Typography>
                    </Box>

                    <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
                      <Box sx={{ display: "flex", gap: 2 }}>
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<CheckIcon />}
                          onClick={() => updateCurrentDocReview("decision", "passed")}
                          sx={{
                            borderRadius: "10px",
                            py: 1.3,
                            fontWeight: 800,
                            fontSize: "0.95rem",
                            bgcolor: currentDocReview.decision === "passed" ? "#16a34a !important" : "#f1f5f9 !important",
                            color: currentDocReview.decision === "passed" ? "#ffffff !important" : "#64748b !important",
                            border: currentDocReview.decision === "passed" ? "2px solid #15803d" : "1px solid #cbd5e1",
                          }}
                        >
                          ผ่าน
                        </Button>

                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<ClearIcon />}
                          onClick={() => updateCurrentDocReview("decision", "failed")}
                          sx={{
                            borderRadius: "10px",
                            py: 1.3,
                            fontWeight: 800,
                            fontSize: "0.95rem",
                            bgcolor: currentDocReview.decision === "failed" ? "#dc2626 !important" : "#f1f5f9 !important",
                            color: currentDocReview.decision === "failed" ? "#ffffff !important" : "#64748b !important",
                            border: currentDocReview.decision === "failed" ? "2px solid #b91c1c" : "1px solid #cbd5e1",
                          }}
                        >
                          ไม่ผ่าน
                        </Button>
                      </Box>

                      {/* แสดงข้อความสถานะ */}
                      <Box
                        sx={{
                          py: 0.8,
                          px: 1.5,
                          borderRadius: "8px",
                          bgcolor: currentDocReview.decision === "passed" ? "#f0fdf4" : "#fef2f2",
                          border: `1px solid ${currentDocReview.decision === "passed" ? "#bbf7d0" : "#fecaca"}`,
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        {currentDocReview.decision === "passed" ? (
                          <CheckCircleIcon sx={{ fontSize: 18, color: "#16a34a" }} />
                        ) : (
                          <WarningRoundedIcon sx={{ fontSize: 18, color: "#dc2626" }} />
                        )}
                        <Typography variant="caption" sx={{ fontWeight: 700, color: currentDocReview.decision === "passed" ? "#15803d" : "#b91c1c" }}>
                          {currentDocReview.decision === "passed" ? "สถานะ: อนุมัติเอกสารฉบับนี้" : "สถานะ: เอกสารฉบับนี้ไม่ผ่าน (กรุณาระบุเหตุผล)"}
                        </Typography>
                      </Box>

                      {/* เหตุผลที่ไม่ผ่าน */}
                      {currentDocReview.decision === "failed" && (
                        <Box sx={{ bgcolor: "#fff", p: 1.5, borderRadius: "10px", border: "1px solid #fed7aa" }}>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: "#c2410c", display: "block", mb: 0.5 }}>
                            ระบุเหตุผลที่ไม่ผ่าน:
                          </Typography>
                          <Grid container spacing={1}>
                            <Grid item xs={6}>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    size="small"
                                    color="error"
                                    checked={currentDocReview.reasons.incomplete || false}
                                    onChange={(e) => updateCurrentDocReview("reasons", { ...currentDocReview.reasons, incomplete: e.target.checked })}
                                  />
                                }
                                label={<Typography variant="caption">เอกสารไม่ครบ</Typography>}
                              />
                            </Grid>
                            <Grid item xs={6}>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    size="small"
                                    color="error"
                                    checked={currentDocReview.reasons.mismatch || false}
                                    onChange={(e) => updateCurrentDocReview("reasons", { ...currentDocReview.reasons, mismatch: e.target.checked })}
                                  />
                                }
                                label={<Typography variant="caption">ข้อมูลไม่ตรง</Typography>}
                              />
                            </Grid>
                            <Grid item xs={6}>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    size="small"
                                    color="error"
                                    checked={currentDocReview.reasons.noSignature || false}
                                    onChange={(e) => updateCurrentDocReview("reasons", { ...currentDocReview.reasons, noSignature: e.target.checked })}
                                  />
                                }
                                label={<Typography variant="caption">ไม่มีลายเซ็น</Typography>}
                              />
                            </Grid>
                            <Grid item xs={6}>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    size="small"
                                    color="error"
                                    checked={currentDocReview.reasons.noDate || false}
                                    onChange={(e) => updateCurrentDocReview("reasons", { ...currentDocReview.reasons, noDate: e.target.checked })}
                                  />
                                }
                                label={<Typography variant="caption">ไม่มีวันที่</Typography>}
                              />
                            </Grid>
                          </Grid>
                        </Box>
                      )}

                      {/* ข้อเสนอแนะเพิ่มเติม */}
                      <Box>
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          placeholder="ระบุข้อเสนอแนะเพิ่มเติม..."
                          value={currentDocReview.customRemark || ""}
                          inputProps={{ maxLength: 250 }}
                          onChange={(e) => updateCurrentDocReview("customRemark", e.target.value)}
                          sx={{ bgcolor: "#ffffff", "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: "0.88rem" } }}
                        />
                      </Box>

                      {/* ปุ่ม ย้อนกลับ - ถัดไป / บันทึกผล */}
                      <Box sx={{ display: "flex", gap: 1.5, mt: 1 }}>
                        <Button
                          variant="outlined"
                          disabled={currentDocIndex === 0}
                          startIcon={<SkipPreviousIcon />}
                          onClick={() => {
                            setZoomLevel(1);
                            setCurrentDocIndex((prev) => Math.max(0, prev - 1));
                          }}
                          sx={{ flex: 1, borderRadius: "10px", borderColor: "#cbd5e1", color: "#475569", fontWeight: 700 }}
                        >
                          ย้อนกลับ
                        </Button>

                        {!isLastDocument ? (
                          <Button
                            variant="contained"
                            endIcon={<SkipNextIcon />}
                            onClick={() => {
                              setZoomLevel(1);
                              setCurrentDocIndex((prev) => Math.min(STEP2_TARGET_DOCS.length - 1, prev + 1));
                            }}
                            sx={{ flex: 1, borderRadius: "10px", bgcolor: "#1b6957", color: "#ffffff", fontWeight: 700 }}
                          >
                            ถัดไป
                          </Button>
                        ) : (
                          <Button
                            variant="contained"
                            disabled={actionLoading}
                            onClick={handleSaveReview}
                            sx={{ flex: 1, borderRadius: "10px", bgcolor: "#00796b", color: "#ffffff", fontWeight: 800 }}
                          >
                            {actionLoading ? "กำลังบันทึก..." : "บันทึกผล"}
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Dialog>
      </Box>
    </Box>
  );
}

export default AdminStudentDocReviewList;