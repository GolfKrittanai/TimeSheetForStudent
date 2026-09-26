// src/pages/Admin/AdminDocumentManagement.js
import React, { useEffect, useState, useCallback, useMemo } from "react";
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
  Checkbox,
  Chip,
  Pagination,
  InputAdornment,
  CircularProgress,
  Dialog,
  IconButton,
  FormControlLabel,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  WarningRounded as WarningRoundedIcon,
  ModeEdit as ModeEditIcon,
  ErrorOutline as ErrorOutlineIcon,
  CalendarToday as CalendarTodayIcon,
  FilterAlt as FilterAltIcon,
  DescriptionOutlined as DocIcon,
  InsertDriveFile as FileIcon,
  Close as CloseIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Fullscreen as FullscreenIcon,
  SkipPrevious as SkipPreviousIcon,
  SkipNext as SkipNextIcon,
  Check as CheckIcon,
  Clear as ClearIcon,
} from "@mui/icons-material";

import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";
import { getAllStudents } from "../../services/studentService";
import {
  getUserDocumentHistory,
  reviewDocument,
  getAllDocumentsForReview,
} from "../../services/documentScanService";

const getCurrentYear = () => new Date().getFullYear() + 543;

// นิยามการ Match เอกสาร 5 ฉบับตามมาตรฐาน
const STANDARD_DOC_CATEGORIES = [
  { key: "01", matchPattern: /(01|ติดต่องาน)/i, label: "BA Co-op 01 ใบสมัครงานสหกิจศึกษา", subLabel: "เอกสารสมัครเข้าปฏิบัติงานสหกิจ" },
  { key: "02-1", matchPattern: /(02-1|ผู้ปกครอง)/i, label: "BA Co-op 02-1 หนังสือยินยอมผู้ปกครอง", subLabel: "เอกสารยินยอมจากผู้ปกครอง" },
  { key: "02-2", matchPattern: /(02-2|ใบสมัครงาน)/i, label: "BA Co-op 02-2 ใบสมัครสหกิจศึกษา", subLabel: "รายละเอียดตำแหน่งและบริษัท" },
  { key: "04", matchPattern: /(04|ที่พัก|ที่อยู่)/i, label: "BA Co-op 04 เอกสารที่อยู่สถานประกอบการ", subLabel: "แผนที่และข้อมูลการติดต่อบริษัท" },
  { key: "05", matchPattern: /(05|ผลการศึกษา|transcript)/i, label: "BA Co-op 05 เกรดเฉลี่ยสะสม (Transcript)", subLabel: "สำเนารายงานผลการศึกษาชั่วคราว" },
];

function AdminDocumentManagement() {
  const { token } = useAuth();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [loading, setLoading] = useState(true);
  const [dataList, setDataList] = useState([]);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [academicYear, setAcademicYear] = useState("ทั้งหมด");
  const [statusFilter, setStatusFilter] = useState("ทั้งหมด");
  const [docTypeFilter, setDocTypeFilter] = useState("ทั้งหมด");
  const [dateRange, setDateRange] = useState("");

  // Table & Pagination
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const [selectedIds, setSelectedIds] = useState([]);

  // Modal Review States
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDocsMap, setStudentDocsMap] = useState({});
  const [currentDocIndex, setCurrentDocIndex] = useState(0);

  // เก็บผลการตรวจแยกรายฉบับ { [docKey]: { decision, reasons, customRemark } }
  const [reviewsState, setReviewsState] = useState({});
  const [actionLoading, setActionLoading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // ฟังก์ชันจัด URL สำหรับไฟล์จริง
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

  // ดึงข้อมูลนักศึกษาและเอกสารทั้งหมดมาเชื่อมโยงกัน
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
              const ext = typeof d.extractedData === "string"
                ? JSON.parse(d.extractedData || "{}")
                : (d.extractedData || {});

              const matchesUserId = Number(d.userId) === Number(s.id);
              const matchesStudentId = ext.studentId && s.studentId && String(ext.studentId).trim() === String(s.studentId).trim();
              const matchesName = ext.fullName && s.fullName && s.fullName.includes(ext.fullName);

              return matchesUserId || matchesStudentId || matchesName;
            });
          }

          // คัดกรองเอาเฉพาะ "เอกสารฉบับล่าสุด" ของแต่ละหมวด (01, 02-1, 02-2, 04, 05)
          const latestDocsMap = {};
          STANDARD_DOC_CATEGORIES.forEach((cat) => {
            const matchedList = docs.filter((d) => {
              const catName = String(d.docCategory || d.name || "");
              return cat.matchPattern.test(catName);
            });

            if (matchedList.length > 0) {
              matchedList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
              latestDocsMap[cat.key] = matchedList[0];
            }
          });

          const activeDocsList = Object.values(latestDocsMap);
          const docCount = activeDocsList.length;

          let computedStatus = "ยังไม่ส่ง";
          if (docCount > 0) {
            const hasFailed = activeDocsList.some(
              (d) => d.status === "failed" || d.status === "ไม่ผ่าน" || d.status === "ต้องแก้ไข"
            );
            const hasPending = activeDocsList.some(
              (d) => d.status === "pending" || d.status === "รอตรวจสอบ"
            );
            const isAllPassed = activeDocsList.every(
              (d) => d.status === "passed" || d.status === "ผ่าน"
            );

            if (hasFailed) computedStatus = "ต้องแก้ไข";
            else if (hasPending) computedStatus = "รอตรวจสอบ";
            else if (isAllPassed) computedStatus = "ผ่าน";
            else computedStatus = "รอตรวจสอบ";
          }

          const latestDoc = docs.length > 0 ? docs[docs.length - 1] : null;
          const createdAtDate = latestDoc?.createdAt || s.updatedAt || s.createdAt;
          const validDate = createdAtDate ? new Date(createdAtDate) : null;

          const dateStr = validDate
            ? validDate.toLocaleDateString("th-TH", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "-";

          const timeStr = validDate
            ? validDate.toLocaleTimeString("th-TH", {
                hour: "2-digit",
                minute: "2-digit",
              }) + " น."
            : "";

          return {
            id: s.id,
            name: s.fullName || "-",
            studentId: s.studentId || "-",
            academicYear: s.academicYear ? s.academicYear.toString() : "",
            branch: s.branch || "-",
            course: s.course || "-",
            email: s.email || "-",
            phone: s.phone || "-",
            docCount: docCount,
            documents: docs,
            date: dateStr,
            time: timeStr,
            status: computedStatus,
          };
        });

      setDataList(formatted);
    } catch (err) {
      console.error("Error fetching students and documents:", err);
      Swal.fire({
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถดึงข้อมูลนักศึกษาได้",
        icon: "error",
        confirmButtonColor: "#00796b",
      });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // สถิติ 4 หมวดหมู่
  const stats = useMemo(() => {
    return {
      passed: dataList.filter((d) => d.status === "ผ่าน").length,
      pending: dataList.filter((d) => d.status === "รอตรวจสอบ").length,
      needsFix: dataList.filter((d) => d.status === "ต้องแก้ไข").length,
      unsubmitted: dataList.filter((d) => d.status === "ยังไม่ส่ง").length,
    };
  }, [dataList]);

  // การกรองข้อมูล
  const filteredData = useMemo(() => {
    return dataList.filter((item) => {
      const lowerSearch = searchTerm.trim().toLowerCase();
      const matchesSearch =
        lowerSearch === "" ||
        item.name.toLowerCase().includes(lowerSearch) ||
        item.studentId.toLowerCase().includes(lowerSearch);

      const matchesYear =
        academicYear === "ทั้งหมด" || !academicYear || item.academicYear === academicYear;

      const matchesStatus =
        statusFilter === "ทั้งหมด" || item.status === statusFilter;

      const matchesDocType =
        docTypeFilter === "ทั้งหมด" ||
        item.documents.some((d) => (d.docCategory || d.name || "").includes(docTypeFilter));

      return matchesSearch && matchesYear && matchesStatus && matchesDocType;
    });
  }, [dataList, searchTerm, academicYear, statusFilter, docTypeFilter]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, page]);

  const handleSearch = () => {
    setSearchTerm(searchInput);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSearchInput("");
    setAcademicYear("ทั้งหมด");
    setStatusFilter("ทั้งหมด");
    setDocTypeFilter("ทั้งหมด");
    setDateRange("");
    setPage(1);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedIds(paginatedData.map((item) => item.id));
    else setSelectedIds([]);
  };

  const handleSelectOne = (id) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter((item) => item !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  // ดึงประวัติไฟล์จริงและเปิด Modal
  const handleOpenReview = async (student) => {
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
        console.warn("ดึงด้วย student.id ไม่สำเร็จ:", e);
      }

      if (!rawHistory || rawHistory.length === 0) {
        try {
          const allDocsRes = await getAllDocumentsForReview();
          const allDocs = Array.isArray(allDocsRes) ? allDocsRes : allDocsRes?.data || [];

          rawHistory = allDocs.filter((doc) => {
            const ext = typeof doc.extractedData === "string" ? JSON.parse(doc.extractedData || "{}") : (doc.extractedData || {});
            const matchesUserId = Number(doc.userId) === Number(student.id);
            const matchesStudentId = ext.studentId && student.studentId && String(ext.studentId).trim() === String(student.studentId).trim();
            const matchesName = ext.fullName && student.name && student.name.includes(ext.fullName);

            return matchesUserId || matchesStudentId || matchesName;
          });
        } catch (fallbackErr) {
          console.error("Fallback error:", fallbackErr);
        }
      }

      const docsMap = {};
      const initialReviews = {};

      STANDARD_DOC_CATEGORIES.forEach((cat) => {
        const matchedList = rawHistory.filter((doc) => {
          const catName = String(doc.docCategory || doc.name || "");
          return cat.matchPattern.test(catName);
        });

        if (matchedList.length > 0) {
          matchedList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          const latest = matchedList[0];

          docsMap[cat.key] = {
            ...latest,
            fileFullUrl: formatFileUrl(latest.fileUrl),
            parsedExtracted: typeof latest.extractedData === "string" ? JSON.parse(latest.extractedData || "{}") : (latest.extractedData || {}),
          };

          const isFailed = latest.status === "failed";
          initialReviews[cat.key] = {
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
          docsMap[cat.key] = null;
          initialReviews[cat.key] = {
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

  const handleCloseReview = () => {
    setReviewOpen(false);
    setSelectedStudent(null);
    setStudentDocsMap({});
    setReviewsState({});
  };

  // ดึงหมวดหมู่และเอกสารปัจจุบัน
  const activeCategory = STANDARD_DOC_CATEGORIES[currentDocIndex];
  const currentActiveDoc = studentDocsMap[activeCategory.key];
  const extracted = currentActiveDoc?.parsedExtracted || {};

  // ดึงสถานะการตรวจของเอกสารใบปัจจุบัน
  const currentDocReview = reviewsState[activeCategory.key] || {
    decision: "passed",
    reasons: { incomplete: false, mismatch: false, noSignature: false, noDate: false },
    customRemark: "",
  };

  // ฟังก์ชันอัปเดตผลการตรวจเฉพาะเอกสารใบปัจจุบัน
  const updateCurrentDocReview = (field, value) => {
    setReviewsState((prev) => ({
      ...prev,
      [activeCategory.key]: {
        ...prev[activeCategory.key],
        [field]: value,
      },
    }));
  };

  // ดึงข้อมูลแสดงในแถบข้อมูลนักศึกษา
  const displayStudentName = extracted.fullName || selectedStudent?.name || "-";
  const displayStudentId = extracted.studentId || selectedStudent?.studentId || "-";
  const displayDegree = extracted.degree || selectedStudent?.course || "ปริญญาตรี";
  const displayBranch = extracted.branch || selectedStudent?.branch || "ระบบสารสนเทศทางธุรกิจ";
  const displayPhone = extracted.phone || selectedStudent?.phone || "-";
  const displayEmail = extracted.email || selectedStudent?.email || "-";

  const uploadDate = currentActiveDoc?.createdAt
    ? new Date(currentActiveDoc.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" }) +
      " " +
      new Date(currentActiveDoc.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) + " น."
    : selectedStudent ? `${selectedStudent.date} ${selectedStudent.time}` : "-";

  // บันทึกผลการตรวจแยกสถานะรายฉบับ แล้วปิด Pop-up ทันที
  const handleSaveReview = async () => {
    const uploadedDocsEntries = Object.entries(studentDocsMap).filter(([_, d]) => d && d.id);

    if (uploadedDocsEntries.length === 0) {
      Swal.fire({
        title: "ไม่พบเอกสาร",
        text: "นักศึกษายังไม่ได้อัปโหลดเอกสารเข้ามาในระบบ ไม่สามารถดำเนินการได้",
        icon: "warning",
        confirmButtonColor: "#00796b",
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

      // ปิด Pop-up ทันที
      handleCloseReview();

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
        confirmButtonColor: "#1b6957",
      });

      fetchData();
    } catch (err) {
      console.error("Save Review Error:", err);
      Swal.fire({
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถบันทึกสถานะเอกสารได้ กรุณาลองใหม่อีกครั้ง",
        icon: "error",
        confirmButtonColor: "#00796b",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const renderStatusBadge = (status) => {
    let bg = "#e2e8f0";
    let color = "#475569";
    if (status === "ผ่าน" || status === "passed") {
      bg = "#dcfce7";
      color = "#15803d";
    } else if (status === "รอตรวจสอบ" || status === "pending") {
      bg = "#e0e7ff";
      color = "#4338ca";
    } else if (status === "ต้องแก้ไข" || status === "failed") {
      bg = "#fef08a";
      color = "#854d0e";
    } else if (status === "ยังไม่ส่ง") {
      bg = "#f1f5f9";
      color = "#64748b";
    }

    return (
      <Chip
        label={status === "passed" ? "ผ่าน" : status === "failed" ? "ต้องแก้ไข" : status}
        size="small"
        sx={{
          bgcolor: bg,
          color: color,
          fontWeight: 700,
          borderRadius: "16px",
          px: 1,
          height: 26,
          fontSize: "0.78rem",
        }}
      />
    );
  };

  const isLastDocument = currentDocIndex === STANDARD_DOC_CATEGORIES.length - 1;

  return (
    <Box sx={{ display: "flex", bgcolor: "#f4f6f8", minHeight: "100vh", fontFamily: '"Kanit", sans-serif' }}>
      <Sidebar />

      <Box component="main" sx={{ flexGrow: 1, p: isSmallScreen ? 2 : 4, overflowX: "hidden" }}>
        {/* Header ส่วนบน */}
        <Box sx={{ mb: 2.5 }}>
          <Typography variant="caption" sx={{ color: "#00796b", fontWeight: 700, fontSize: "0.95rem" }}>
            Management data
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, color: "#134e4a" }}>
            จัดการข้อมูล
          </Typography>
        </Box>

        {/* Tab หัวข้อ */}
        <Box
          sx={{
            bgcolor: "#00796b",
            color: "#fff",
            p: 1.2,
            px: 2.5,
            borderRadius: "10px 10px 0 0",
            display: "inline-flex",
            alignItems: "center",
            gap: 1,
            fontWeight: 700,
            fontSize: "0.95rem",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <ModeEditIcon sx={{ fontSize: 18 }} />
          จัดการข้อมูลนักศึกษา
        </Box>

        {/* การ์ดสถิติ 4 ใบ */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            mb: 3,
            borderRadius: "0 0 16px 16px",
            border: "1px solid #e2e8f0",
            borderTop: "none",
            bgcolor: "#ffffff",
          }}
        >
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, p: 2, borderRadius: 3, bgcolor: "#f8fafc", border: "1px solid #f1f5f9" }}>
                <Box sx={{ width: 52, height: 52, borderRadius: "50%", bgcolor: "#10b981", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CheckCircleIcon sx={{ fontSize: 32 }} />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: "#1e293b", fontSize: "0.95rem" }}>ผ่าน</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "#0f172a", fontSize: "1.1rem" }}>
                    {stats.passed} <Typography component="span" variant="caption" sx={{ color: "#64748b" }}>รายการ</Typography>
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, p: 2, borderRadius: 3, bgcolor: "#f8fafc", border: "1px solid #f1f5f9" }}>
                <Box sx={{ width: 52, height: 52, borderRadius: "50%", bgcolor: "#facc15", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <WarningRoundedIcon sx={{ fontSize: 32 }} />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: "#1e293b", fontSize: "0.95rem" }}>รอตรวจสอบ</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "#0f172a", fontSize: "1.1rem" }}>
                    {stats.pending} <Typography component="span" variant="caption" sx={{ color: "#64748b" }}>รายการ</Typography>
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, p: 2, borderRadius: 3, bgcolor: "#f8fafc", border: "1px solid #f1f5f9" }}>
                <Box sx={{ width: 52, height: 52, borderRadius: "14px", bgcolor: "#ef4444", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ModeEditIcon sx={{ fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: "#1e293b", fontSize: "0.95rem" }}>ต้องแก้ไข</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "#0f172a", fontSize: "1.1rem" }}>
                    {stats.needsFix} <Typography component="span" variant="caption" sx={{ color: "#64748b" }}>รายการ</Typography>
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, p: 2, borderRadius: 3, bgcolor: "#f8fafc", border: "1px solid #f1f5f9" }}>
                <Box sx={{ width: 52, height: 52, borderRadius: "50%", bgcolor: "#94a3b8", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ErrorOutlineIcon sx={{ fontSize: 32 }} />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: "#1e293b", fontSize: "0.95rem" }}>ยังไม่ส่ง</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "#0f172a", fontSize: "1.1rem" }}>
                    {stats.unsubmitted} <Typography component="span" variant="caption" sx={{ color: "#64748b" }}>รายการ</Typography>
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* ตารางข้อมูลและการค้นหา */}
        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, bgcolor: "#ffffff", border: "1px solid #e2e8f0" }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#1e293b", mb: 2 }}>
            เอกสาร รายชื่อนักศึกษา
          </Typography>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center", mb: 3 }}>
            <TextField
              size="small"
              placeholder="ค้นหาชื่อ หรือ รหัส..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              sx={{
                width: { xs: "100%", sm: 200 },
                "& .MuiOutlinedInput-root": { borderRadius: "20px", bgcolor: "#f8fafc" },
              }}
            />

            <Box>
              <Typography variant="caption" sx={{ display: "block", color: "#64748b", mb: 0.3, fontSize: "0.7rem" }}>ปีการศึกษา</Typography>
              <Select
                size="small"
                value={academicYear}
                onChange={(e) => {
                  setAcademicYear(e.target.value);
                  setPage(1);
                }}
                sx={{ minWidth: 95, borderRadius: "20px", height: 38, bgcolor: "#f8fafc", fontSize: "0.85rem" }}
              >
                <MenuItem value="ทั้งหมด">ทั้งหมด</MenuItem>
                <MenuItem value={getCurrentYear().toString()}>{getCurrentYear()}</MenuItem>
                <MenuItem value={(getCurrentYear() - 1).toString()}>{getCurrentYear() - 1}</MenuItem>
                <MenuItem value={(getCurrentYear() - 2).toString()}>{getCurrentYear() - 2}</MenuItem>
              </Select>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ display: "block", color: "#64748b", mb: 0.3, fontSize: "0.7rem" }}>สถานะ</Typography>
              <Select
                size="small"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                sx={{ minWidth: 100, borderRadius: "20px", height: 38, bgcolor: "#f8fafc", fontSize: "0.85rem" }}
              >
                <MenuItem value="ทั้งหมด">ทั้งหมด</MenuItem>
                <MenuItem value="ผ่าน">ผ่าน</MenuItem>
                <MenuItem value="รอตรวจสอบ">รอตรวจสอบ</MenuItem>
                <MenuItem value="ต้องแก้ไข">ต้องแก้ไข</MenuItem>
                <MenuItem value="ยังไม่ส่ง">ยังไม่ส่ง</MenuItem>
              </Select>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ display: "block", color: "#64748b", mb: 0.3, fontSize: "0.7rem" }}>ประเภทเอกสาร</Typography>
              <Select
                size="small"
                value={docTypeFilter}
                onChange={(e) => {
                  setDocTypeFilter(e.target.value);
                  setPage(1);
                }}
                sx={{ minWidth: 110, borderRadius: "20px", height: 38, bgcolor: "#f8fafc", fontSize: "0.85rem" }}
              >
                <MenuItem value="ทั้งหมด">ทั้งหมด</MenuItem>
                <MenuItem value="01">BA Co-op 01</MenuItem>
                <MenuItem value="02-1">BA Co-op 02-1</MenuItem>
                <MenuItem value="02-2">BA Co-op 02-2</MenuItem>
                <MenuItem value="04">BA Co-op 04</MenuItem>
                <MenuItem value="05">BA Co-op 05</MenuItem>
              </Select>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ display: "block", color: "#64748b", mb: 0.3, fontSize: "0.7rem" }}>วันที่ส่ง</Typography>
              <TextField
                size="small"
                placeholder="วว/ดด/ปป → วว/ดด/ปป"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarTodayIcon sx={{ fontSize: 16, color: "#94a3b8" }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  width: { xs: "100%", sm: 190 },
                  "& .MuiOutlinedInput-root": { borderRadius: "20px", bgcolor: "#f8fafc", height: 38 },
                }}
              />
            </Box>

            <Button
              variant="outlined"
              onClick={handleSearch}
              startIcon={<FilterAltIcon sx={{ fontSize: 16 }} />}
              sx={{
                borderRadius: "20px",
                borderColor: "#cbd5e1",
                color: "#475569",
                height: 38,
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.85rem",
                mt: { xs: 0, sm: 2.2 },
                "&:hover": { borderColor: "#94a3b8", bgcolor: "#f8fafc" },
              }}
            >
              ค้นหา
            </Button>

            <Button
              variant="contained"
              onClick={handleClearFilters}
              sx={{
                borderRadius: "20px",
                bgcolor: "#005a48",
                color: "#fff",
                height: 38,
                px: 3,
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.85rem",
                boxShadow: "none",
                mt: { xs: 0, sm: 2.2 },
                "&:hover": { bgcolor: "#004235", boxShadow: "none" },
              }}
            >
              ล้างค่า
            </Button>
          </Box>

          {/* ตารางแสดงข้อมูล */}
          <TableContainer sx={{ borderRadius: 2, border: "1px solid #f1f5f9" }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#eff2fe" }}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selectedIds.length > 0 && selectedIds.length < paginatedData.length}
                      checked={paginatedData.length > 0 && selectedIds.length === paginatedData.length}
                      onChange={handleSelectAll}
                      size="small"
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#64748b", fontSize: "0.78rem" }}>ชื่อ-นามสกุล ▾</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#64748b", fontSize: "0.78rem" }}>รหัสนักศึกษา ▾</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#64748b", fontSize: "0.78rem" }}>จำนวนเอกสาร ▾</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#64748b", fontSize: "0.78rem" }}>วันที่ส่ง ▾</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: "#64748b", fontSize: "0.78rem" }}>สถานะ ▾</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: "#64748b", fontSize: "0.78rem" }}>ดำเนินการ</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <CircularProgress size={32} sx={{ color: "#00796b" }} />
                    </TableCell>
                  </TableRow>
                ) : paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 5, color: "#94a3b8" }}>
                      ไม่พบข้อมูลที่ตรงกับเงื่อนไข
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((row) => {
                    const isSelected = selectedIds.includes(row.id);
                    return (
                      <TableRow key={row.id} hover selected={isSelected} sx={{ "& td": { py: 1.2 } }}>
                        <TableCell padding="checkbox">
                          <Checkbox checked={isSelected} onChange={() => handleSelectOne(row.id)} size="small" />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, color: "#334155", fontSize: "0.85rem" }}>{row.name}</TableCell>
                        <TableCell sx={{ color: "#64748b", fontSize: "0.85rem" }}>{row.studentId}</TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                            <DocIcon sx={{ fontSize: 18, color: "#10b981" }} />
                            <Typography variant="body2" sx={{ color: "#334155", fontSize: "0.85rem", fontWeight: 700 }}>
                              {row.docCount} ฉบับ
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: "#1e293b", fontWeight: 600, fontSize: "0.82rem" }}>
                            {row.date}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#94a3b8", display: "block" }}>
                            {row.time}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">{renderStatusBadge(row.status)}</TableCell>
                        <TableCell align="center">
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleOpenReview(row)}
                            sx={{
                              borderRadius: "16px",
                              borderColor: "#cbd5e1",
                              color: "#475569",
                              fontSize: "0.75rem",
                              px: 1.8,
                              py: 0.2,
                              textTransform: "none",
                              "&:hover": { borderColor: "#94a3b8", bgcolor: "#f8fafc" },
                            }}
                          >
                            {row.status === "ผ่าน" ? "ดูรายละเอียด" : "ตรวจสอบ"}
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
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2.5, flexWrap: "wrap", gap: 1 }}>
            <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
              {filteredData.length > 0 ? `${paginatedData.length} / ${filteredData.length} รายการ` : "0 รายการ"}
            </Typography>

            <Pagination
              count={Math.ceil(filteredData.length / rowsPerPage) || 1}
              page={page}
              onChange={(e, val) => setPage(val)}
              shape="rounded"
              size="small"
              sx={{
                "& .MuiPaginationItem-root": { borderRadius: "6px", fontWeight: 600, fontSize: "0.8rem" },
                "& .Mui-selected": { bgcolor: "#00423b !important", color: "#fff" },
              }}
            />
          </Box>
        </Paper>

        {/* =================================================================== */}
        {/* MODAL ตรวจสอบเอกสารสหกิจศึกษา (ตรวจแยกรายฉบับ) */}
        {/* =================================================================== */}
        <Dialog
          open={reviewOpen}
          onClose={handleCloseReview}
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
          {/* Header Bar สีเขียวเข้มพร้อมปุ่มปิด กากบาท X */}
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
              ตรวจสอบเอกสารสหกิจศึกษา
            </Typography>
            <IconButton onClick={handleCloseReview} sx={{ color: "#ffffff", p: 0.5 }}>
              <CloseIcon sx={{ fontSize: 26 }} />
            </IconButton>
          </Box>

          {/* เนื้อหา Modal แบ่งซ้าย-ขวา */}
          <Box sx={{ p: 3, overflowY: "auto", flexGrow: 1, bgcolor: "#f8fafc" }}>
            <Grid container spacing={3}>
              {/* 🟢 ฝั่งซ้าย: ตัวแสดงเอกสารจริง พร้อมปุ่ม Zoom และ Pagination เอกสาร */}
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
                          title="Document PDF Preview"
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
                            onError={(e) => {
                              console.error("❌ โหลดรูปภาพไม่สำเร็จจาก URL:", e.target.src);
                              e.target.style.display = "none";
                              const fallbackBox = document.getElementById("img-fallback-box");
                              if (fallbackBox) fallbackBox.style.display = "flex";
                            }}
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

                          {/* กล่องแสดงแทนกรณีที่รูปภาพในโฟลเดอร์ uploads หายไปหรือโหลดไม่ได้ */}
                          <Box
                            id="img-fallback-box"
                            sx={{
                              display: "none",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              textAlign: "center",
                              p: 3,
                            }}
                          >
                            <DocIcon sx={{ fontSize: 60, color: "#94a3b8", mb: 1 }} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#475569", mb: 0.5 }}>
                              ไม่สามารถแสดงตัวอย่างภาพได้
                            </Typography>
                            <Typography variant="caption" sx={{ color: "#64748b", mb: 2 }}>
                              ไฟล์อาจถูกลบออกจากการรีสตาร์ตของเซิร์ฟเวอร์ หรือชื่อไฟล์ผิดพลาด
                            </Typography>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => window.open(currentActiveDoc.fileFullUrl, "_blank")}
                              sx={{
                                borderRadius: "8px",
                                color: "#1b6957",
                                borderColor: "#1b6957",
                                textTransform: "none",
                                fontWeight: 600,
                              }}
                            >
                              เปิดดูไฟล์โดยตรง
                            </Button>
                          </Box>
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

                  {/* แถบเครื่องมือควบคุมใต้พรีวิวรูปภาพ */}
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
                      &lt; {currentDocIndex + 1} / {STANDARD_DOC_CATEGORIES.length} &gt;
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

              {/* 🟢 ฝั่งขวา: รายละเอียดเอกสาร ข้อมูลนักศึกษา และฟอร์มผลการตรวจสอบ */}
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
                  {/* หัวข้อชื่อเอกสาร */}
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

                  {/* การ์ดข้อมูลนักศึกษา (ดึงจาก OCR / File โดยตรง) */}
                  <Box sx={{ bgcolor: "#f8fafc", borderRadius: "12px", border: "1px solid #f1f5f9", overflow: "hidden" }}>
                    <Box sx={{ bgcolor: "#f1f8f5", py: 1.2, px: 2, display: "flex", alignItems: "center", gap: 1 }}>
                      <DocIcon sx={{ fontSize: 20, color: "#1b6957" }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#134e4a" }}>
                        ข้อมูลนักศึกษา
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
                          <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>ระดับการศึกษา</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: "#334155" }}>{displayDegree}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>สาขา</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: "#334155" }}>{displayBranch}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>เบอร์โทรศัพท์</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: "#334155" }}>{displayPhone}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>อีเมล</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: "#334155" }}>{displayEmail}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>วันที่อัปโหลด</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: "#334155" }}>{uploadDate}</Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  </Box>

                  {/* การ์ดผลการตรวจสอบ (เฉพาะเอกสารใบนี้) */}
                  <Box sx={{ bgcolor: "#f8fafc", borderRadius: "12px", border: "1px solid #f1f5f9", overflow: "hidden" }}>
                    <Box sx={{ bgcolor: "#f1f8f5", py: 1.2, px: 2, display: "flex", alignItems: "center", gap: 1 }}>
                      <ModeEditIcon sx={{ fontSize: 18, color: "#1b6957" }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#134e4a" }}>
                        ผลการตรวจสอบ ({activeCategory.label})
                      </Typography>
                    </Box>

                    <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
                      {/* ปุ่มเลือก ผ่าน / ไม่ผ่าน ของเอกสารฉบับนี้ */}
                      <Box sx={{ display: "flex", gap: 2 }}>
                        {/* ปุ่มผ่าน */}
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
                            transition: "all 0.2s",
                            boxShadow: currentDocReview.decision === "passed" ? "0 4px 12px rgba(22, 163, 74, 0.3)" : "none",
                            bgcolor: currentDocReview.decision === "passed" ? "#16a34a !important" : "#f1f5f9 !important",
                            color: currentDocReview.decision === "passed" ? "#ffffff !important" : "#64748b !important",
                            border: currentDocReview.decision === "passed" ? "2px solid #15803d" : "1px solid #cbd5e1",
                            "&:hover": {
                              bgcolor: currentDocReview.decision === "passed" ? "#15803d !important" : "#e2e8f0 !important",
                            },
                          }}
                        >
                          ผ่าน
                        </Button>

                        {/* ปุ่มไม่ผ่าน */}
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
                            transition: "all 0.2s",
                            boxShadow: currentDocReview.decision === "failed" ? "0 4px 12px rgba(220, 38, 38, 0.3)" : "none",
                            bgcolor: currentDocReview.decision === "failed" ? "#dc2626 !important" : "#f1f5f9 !important",
                            color: currentDocReview.decision === "failed" ? "#ffffff !important" : "#64748b !important",
                            border: currentDocReview.decision === "failed" ? "2px solid #b91c1c" : "1px solid #cbd5e1",
                            "&:hover": {
                              bgcolor: currentDocReview.decision === "failed" ? "#b91c1c !important" : "#e2e8f0 !important",
                            },
                          }}
                        >
                          ไม่ผ่าน
                        </Button>
                      </Box>

                      {/* สถานะแจ้งเตือนชัดเจน */}
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
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 700,
                            color: currentDocReview.decision === "passed" ? "#15803d" : "#b91c1c",
                          }}
                        >
                          {currentDocReview.decision === "passed"
                            ? `สถานะ: อนุมัติเอกสารฉบับนี้`
                            : `สถานะ: เอกสารฉบับนี้ไม่ผ่าน (กรุณาระบุเหตุผลด้านล่าง)`}
                        </Typography>
                      </Box>

                      {/* เหตุผลที่ไม่ผ่าน (กรณีไม่ผ่าน) */}
                      {currentDocReview.decision === "failed" && (
                        <Box sx={{ mt: 0.5, bgcolor: "#fff", p: 1.5, borderRadius: "10px", border: "1px solid #fed7aa" }}>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: "#c2410c", display: "block", mb: 0.5 }}>
                            ระบุเหตุผลที่ไม่ผ่าน:
                          </Typography>
                          <Grid container spacing={1}>
                            <Grid item xs={6} sm={3}>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    size="small"
                                    color="error"
                                    checked={currentDocReview.reasons.incomplete || false}
                                    onChange={(e) =>
                                      updateCurrentDocReview("reasons", {
                                        ...currentDocReview.reasons,
                                        incomplete: e.target.checked,
                                      })
                                    }
                                  />
                                }
                                label={<Typography variant="caption" sx={{ fontWeight: 600 }}>เอกสารไม่ครบ</Typography>}
                              />
                            </Grid>
                            <Grid item xs={6} sm={3}>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    size="small"
                                    color="error"
                                    checked={currentDocReview.reasons.mismatch || false}
                                    onChange={(e) =>
                                      updateCurrentDocReview("reasons", {
                                        ...currentDocReview.reasons,
                                        mismatch: e.target.checked,
                                      })
                                    }
                                  />
                                }
                                label={<Typography variant="caption" sx={{ fontWeight: 600 }}>ข้อมูลไม่ตรง</Typography>}
                              />
                            </Grid>
                            <Grid item xs={6} sm={3}>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    size="small"
                                    color="error"
                                    checked={currentDocReview.reasons.noSignature || false}
                                    onChange={(e) =>
                                      updateCurrentDocReview("reasons", {
                                        ...currentDocReview.reasons,
                                        noSignature: e.target.checked,
                                      })
                                    }
                                  />
                                }
                                label={<Typography variant="caption" sx={{ fontWeight: 600 }}>ไม่มีลายเซ็น</Typography>}
                              />
                            </Grid>
                            <Grid item xs={6} sm={3}>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    size="small"
                                    color="error"
                                    checked={currentDocReview.reasons.noDate || false}
                                    onChange={(e) =>
                                      updateCurrentDocReview("reasons", {
                                        ...currentDocReview.reasons,
                                        noDate: e.target.checked,
                                      })
                                    }
                                  />
                                }
                                label={<Typography variant="caption" sx={{ fontWeight: 600 }}>ไม่มีวันที่</Typography>}
                              />
                            </Grid>
                          </Grid>
                        </Box>
                      )}

                      {/* กล่องข้อเสนอแนะเพิ่มเติม */}
                      <Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: "#64748b" }}>
                            ข้อเสนอแนะเพิ่มเติม (สำหรับฉบับนี้)
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                            {(currentDocReview.customRemark || "").length}/250
                          </Typography>
                        </Box>
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          placeholder={
                            currentDocReview.decision === "passed"
                              ? "ระบุข้อเสนอแนะเพิ่มเติม (ถ้ามี)..."
                              : "กรุณาระบุรายละเอียดที่ต้องแก้ไขสำหรับฉบับนี้..."
                          }
                          value={currentDocReview.customRemark || ""}
                          inputProps={{ maxLength: 250 }}
                          onChange={(e) => updateCurrentDocReview("customRemark", e.target.value)}
                          sx={{
                            bgcolor: "#ffffff",
                            "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: "0.88rem" },
                          }}
                        />
                      </Box>

                      {/* ปุ่มนำทาง ย้อนกลับ - ถัดไป (หน้าสุดท้ายจะเปลี่ยนเป็นปุ่มบันทึกผลแทนปุ่มถัดไป) */}
                      <Box sx={{ display: "flex", gap: 1.5, mt: 1 }}>
                        <Button
                          variant="outlined"
                          disabled={currentDocIndex === 0}
                          startIcon={<SkipPreviousIcon />}
                          onClick={() => {
                            setZoomLevel(1);
                            setCurrentDocIndex((prev) => Math.max(0, prev - 1));
                          }}
                          sx={{
                            flex: 1,
                            borderRadius: "10px",
                            borderColor: "#cbd5e1",
                            color: "#475569",
                            fontWeight: 700,
                            py: 1.1,
                            "&:hover": { borderColor: "#94a3b8", bgcolor: "#f8fafc" },
                          }}
                        >
                          ย้อนกลับ
                        </Button>

                        {/* ✅ สลับปุ่ม ถัดไป / บันทึกผล ตามหน้าเอกสาร */}
                        {!isLastDocument ? (
                          <Button
                            variant="contained"
                            endIcon={<SkipNextIcon />}
                            onClick={() => {
                              setZoomLevel(1);
                              setCurrentDocIndex((prev) => Math.min(STANDARD_DOC_CATEGORIES.length - 1, prev + 1));
                            }}
                            sx={{
                              flex: 1,
                              borderRadius: "10px",
                              bgcolor: "#1b6957",
                              color: "#ffffff",
                              fontWeight: 700,
                              py: 1.1,
                              boxShadow: "none",
                              "&:hover": { bgcolor: "#134e4a", boxShadow: "none" },
                            }}
                          >
                            ถัดไป
                          </Button>
                        ) : (
                          <Button
                            variant="contained"
                            disabled={actionLoading}
                            onClick={handleSaveReview}
                            sx={{
                              flex: 1,
                              borderRadius: "10px",
                              bgcolor: "#00796b",
                              color: "#ffffff",
                              fontWeight: 800,
                              py: 1.1,
                              boxShadow: "none",
                              "&:hover": {
                                bgcolor: "#00695c",
                                boxShadow: "none",
                              },
                            }}
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

export default AdminDocumentManagement;