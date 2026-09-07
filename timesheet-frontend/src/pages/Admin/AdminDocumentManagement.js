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
  AccessTime as AccessTimeIcon,
  CancelOutlined as CancelOutlinedIcon,
} from "@mui/icons-material";

import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";
import { getAllStudents } from "../../services/studentService";
import { getUserDocumentHistory, reviewDocument } from "../../services/documentScanService";

const getCurrentYear = () => new Date().getFullYear() + 543;

// นิยามการ Match เอกสาร 5 ฉบับตาม docCategory จริงในฐานข้อมูล
const STANDARD_DOC_CATEGORIES = [
  { key: "01", matchPattern: /(01|ติดต่องาน)/i, label: "Co-op-01 ข้อมูลการติดต่อ" },
  { key: "02-1", matchPattern: /(02-1|ผู้ปกครอง)/i, label: "Co-op-02-1 หนังสือยินยอมผู้ปกครอง" },
  { key: "02-2", matchPattern: /(02-2|ใบสมัครงาน)/i, label: "Co-op-02-2 ใบสมัครสหกิจ" },
  { key: "04", matchPattern: /(04|ที่พัก|ที่อยู่)/i, label: "Co-op-04 เอกสารที่อยู่" },
  { key: "05", matchPattern: /(05|ผลการศึกษา|transcript)/i, label: "Co-op-05 เกรดเฉลี่ยสะสม (ฉบับชั่วคราว)" },
];

function AdminDocumentManagement() {
  const { token } = useAuth();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [loading, setLoading] = useState(true);
  const [dataList, setDataList] = useState([]);

  // States ฟิลเตอร์
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [academicYear, setAcademicYear] = useState("ทั้งหมด");
  const [statusFilter, setStatusFilter] = useState("ทั้งหมด");
  const [docTypeFilter, setDocTypeFilter] = useState("ทั้งหมด");
  const [dateRange, setDateRange] = useState("");

  // States ตารางและการแบ่งหน้า
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const [selectedIds, setSelectedIds] = useState([]);

  // States Modal ตรวจสอบเอกสาร
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDocsMap, setStudentDocsMap] = useState({});
  const [selectedDocKey, setSelectedDocKey] = useState("01");
  const [feedbackNote, setFeedbackNote] = useState("เอกสารสมบูรณ์");
  const [actionLoading, setActionLoading] = useState(false);

  // 🟢 ฟังก์ชันจัด URL ให้ชี้ไปยัง Path ไฟล์จริงบน Server
  const formatFileUrl = (url) => {
    if (!url) return null;
    let clean = String(url).trim();
    if (clean.startsWith("http://") || clean.startsWith("https://") || clean.startsWith("blob:") || clean.startsWith("data:")) {
      return clean;
    }
    clean = clean.replace(/\\/g, "/").replace(/^\/+/, "");
    if (!clean.startsWith("uploads/")) {
      clean = `uploads/${clean}`;
    }

    const RAW_API = process.env.REACT_APP_API || process.env.REACT_APP_API_URL || "http://localhost:5000";
    const BASE_HOST = RAW_API.replace(/\/api\/?.*$/, "").replace(/\/+$/, "");
    const fullUrl = `${BASE_HOST}/${clean}`;
    console.log("🔗 Image Full URL:", fullUrl);
    return fullUrl;
  };

  // ดึงข้อมูลนักศึกษาทั้งหมด
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const activeToken = token || localStorage.getItem("token");
      const res = await getAllStudents(activeToken);

      let rawStudents = [];
      if (Array.isArray(res)) rawStudents = res;
      else if (res?.data && Array.isArray(res.data)) rawStudents = res.data;
      else if (res?.data?.data && Array.isArray(res.data.data)) rawStudents = res.data.data;

      const formatted = rawStudents
        .filter((item) => item.role === "student")
        .map((s) => {
          const docs = Array.isArray(s.documents)
            ? s.documents
            : Array.isArray(s.DocumentScan)
            ? s.DocumentScan
            : Array.isArray(s.document_scan)
            ? s.document_scan
            : [];
          const docCount = docs.length;

          let computedStatus = "ยังไม่ส่ง";
          if (docCount > 0) {
            const hasFailed = docs.some(
              (d) => d.status === "failed" || d.status === "ไม่ผ่าน" || d.status === "ต้องแก้ไข"
            );
            const hasPending = docs.some(
              (d) => d.status === "pending" || d.status === "รอตรวจสอบ"
            );
            const isAllPassed = docs.every(
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

          const aiOcr = computedStatus === "ผ่าน" ? "100 %" : docCount > 0 ? "55 %" : "0 %";

          return {
            id: s.id,
            name: s.fullName || "-",
            studentId: s.studentId || "-",
            academicYear: s.academicYear ? s.academicYear.toString() : "",
            docCount: docCount,
            documents: docs,
            date: dateStr,
            time: timeStr,
            status: computedStatus,
            aiOcr: aiOcr,
          };
        });

      setDataList(formatted);
    } catch (err) {
      console.error("Error fetching students:", err);
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

  // ดึงประวัติไฟล์จริงของนักศึกษา
  const handleOpenReview = async (student) => {
    setSelectedStudent(student);
    setSelectedDocKey("01");
    setFeedbackNote("เอกสารสมบูรณ์");
    setReviewOpen(true);
    setReviewLoading(true);

    try {
      console.log("🔍 กำลังตรวจสอบนักศึกษา:", student);

      let rawHistory = [];
      try {
        const res = await getUserDocumentHistory(student.id);
        rawHistory = Array.isArray(res) ? res : res?.data || res?.documents || [];
      } catch (e) {
        console.warn("ดึงด้วย student.id ไม่สำเร็จ:", e);
      }

      if (!rawHistory || rawHistory.length === 0) {
        console.log("⚠️ ไม่พบเอกสารผ่าน student.id กำลังค้นหาสำรองผ่าน getAllDocumentsForReview...");
        try {
          const { getAllDocumentsForReview } = await import("../../services/documentScanService");
          const allDocsRes = await getAllDocumentsForReview();
          const allDocs = Array.isArray(allDocsRes) ? allDocsRes : allDocsRes?.data || [];
          
          console.log("📦 รายการเอกสารทั้งหมดในระบบ:", allDocs);

          rawHistory = allDocs.filter((doc) => {
            const ext = typeof doc.extractedData === "string" ? JSON.parse(doc.extractedData || "{}") : (doc.extractedData || {});
            const matchesUserId = doc.userId === student.id;
            const matchesStudentId = ext.studentId && student.studentId && ext.studentId.trim() === student.studentId.trim();
            const matchesName = ext.fullName && student.name && student.name.includes(ext.fullName);

            return matchesUserId || matchesStudentId || matchesName;
          });
        } catch (fallbackErr) {
          console.error("Fallback error:", fallbackErr);
        }
      }

      console.log("📄 รายการเอกสารที่แมปเจอกับนักศึกษาคนนี้:", rawHistory);

      const docsMap = {};
      STANDARD_DOC_CATEGORIES.forEach((cat) => {
        const matchedList = rawHistory.filter((doc) => {
          const catName = String(doc.docCategory || doc.name || "");
          return cat.matchPattern.test(catName);
        });

        if (matchedList.length > 0) {
          matchedList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          const latest = matchedList[0];
          console.log(`✅ พบเอกสารหมวด [${cat.key}]:`, latest);

          docsMap[cat.key] = {
            ...latest,
            fileFullUrl: formatFileUrl(latest.fileUrl),
          };
        } else {
          docsMap[cat.key] = null;
        }
      });

      setStudentDocsMap(docsMap);
    } catch (err) {
      console.error("❌ เกิดข้อผิดพลาดในการโหลดเอกสาร:", err);
      setStudentDocsMap({});
    } finally {
      setReviewLoading(false);
    }
  };

  const handleCloseReview = () => {
    setReviewOpen(false);
    setSelectedStudent(null);
    setStudentDocsMap({});
  };

  // บันทึกผลการตรวจเอกสาร (อนุมัติ / ส่งกลับแก้ไข)
  const handleReviewAction = async (actionStatus) => {
    const activeDoc = studentDocsMap[selectedDocKey];
    if (!activeDoc || !activeDoc.id) {
      Swal.fire({
        title: "ไม่พบเอกสาร",
        text: "นักศึกษายังไม่ได้อัปโหลดเอกสารในหมวดนี้ ไม่สามารถดำเนินการได้",
        icon: "warning",
        confirmButtonColor: "#00796b",
      });
      return;
    }

    try {
      setActionLoading(true);
      await reviewDocument(activeDoc.id, actionStatus, feedbackNote);
      
      Swal.fire({
        title: actionStatus === "passed" ? "อนุมัติสำเร็จ" : "ส่งกลับไปแก้ไขแล้ว",
        text: actionStatus === "passed" ? "อนุมัติเอกสารนี้เรียบร้อยแล้ว" : "ส่งข้อเสนอแนะให้นักศึกษาเรียบร้อยแล้ว",
        icon: actionStatus === "passed" ? "success" : "info",
        confirmButtonColor: actionStatus === "passed" ? "#10b981" : "#00796b",
      });

      handleCloseReview();
      fetchData();
    } catch (err) {
      console.error("Error updating review status:", err);
      Swal.fire({
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถอัปเดตสถานะเอกสารได้",
        icon: "error",
        confirmButtonColor: "#00796b",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const currentActiveDoc = studentDocsMap[selectedDocKey];
  const activeDocMeta = STANDARD_DOC_CATEGORIES.find((c) => c.key === selectedDocKey);

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
                <MenuItem value="BA Co-op 01">BA Co-op 01</MenuItem>
                <MenuItem value="BA Co-op 02-1">BA Co-op 02-1</MenuItem>
                <MenuItem value="BA Co-op 02-2">BA Co-op 02-2</MenuItem>
                <MenuItem value="BA Co-op 04">BA Co-op 04</MenuItem>
                <MenuItem value="BA Co-op 05">BA Co-op 05</MenuItem>
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
                  <TableCell align="center" sx={{ fontWeight: 700, color: "#64748b", fontSize: "0.78rem" }}>AI OCR ▾</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: "#64748b", fontSize: "0.78rem" }}>ดำเนินการ</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                      <CircularProgress size={32} sx={{ color: "#00796b" }} />
                    </TableCell>
                  </TableRow>
                ) : paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 5, color: "#94a3b8" }}>
                      ไม่พบข้อมูลที่ตรงกับเงื่อนไข
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((row) => {
                    const isSelected = selectedIds.includes(row.id);
                    return (
                      <TableRow key={row.id} hover selected={isSelected} sx={{ "& td": { py: 1.2 } }}>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={isSelected}
                            onChange={() => handleSelectOne(row.id)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, color: "#334155", fontSize: "0.85rem" }}>
                          {row.name}
                        </TableCell>
                        <TableCell sx={{ color: "#64748b", fontSize: "0.85rem" }}>{row.studentId}</TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                            <DocIcon sx={{ fontSize: 18, color: "#10b981" }} />
                            <Typography variant="body2" sx={{ color: "#334155", fontSize: "0.85rem" }}>
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
                          <Typography variant="body2" sx={{ fontWeight: 700, color: row.aiOcr.includes("100") ? "#16a34a" : "#64748b", fontSize: "0.85rem" }}>
                            {row.aiOcr}
                          </Typography>
                        </TableCell>
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
        {/* MODAL ตรวจสอบเอกสาร (Document Review Modal) */}
        {/* =================================================================== */}
        <Dialog
          open={reviewOpen}
          onClose={handleCloseReview}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: "24px",
              bgcolor: "#ffffff",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              maxHeight: "92vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            },
          }}
        >
          {/* Header Bar สีเขียวเข้มด้านบนของ Modal */}
          <Box
            sx={{
              bgcolor: "#1b6957",
              color: "#ffffff",
              py: 1.8,
              px: 3,
              fontWeight: 700,
              fontSize: "1rem",
              letterSpacing: 0.5,
              flexShrink: 0,
            }}
          >
            {activeDocMeta?.label || "Co-op-01 ใบสมัครสหกิจ"}
          </Box>

          {/* กล่องเนื้อหาด้านใน: มี Scrollbar */}
          <Box
            sx={{
              p: 3,
              overflowY: "auto",
              flexGrow: 1,
            }}
          >
            <Grid container spacing={3}>
              {/* 🟢 ฝั่งซ้าย: พรีวิวเอกสารจริง พร้อมกล่อง Fallback กรณีรูปบน Render ไม่แสดงผล */}
              <Grid item xs={12} md={7}>
                <Paper
                  variant="outlined"
                  sx={{
                    height: { xs: 450, md: 580 },
                    bgcolor: "#f8fafc",
                    borderColor: "#e2e8f0",
                    borderRadius: 2,
                    p: 1.5,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  {reviewLoading ? (
                    <Box sx={{ textAlign: "center" }}>
                      <CircularProgress size={36} sx={{ color: "#1b6957" }} />
                      <Typography variant="body2" sx={{ mt: 1.5, color: "#64748b" }}>
                        กำลังโหลดข้อมูลเอกสาร...
                      </Typography>
                    </Box>
                  ) : currentActiveDoc && currentActiveDoc.fileFullUrl ? (
                    currentActiveDoc.fileFullUrl.toLowerCase().includes(".pdf") ? (
                      <iframe
                        src={currentActiveDoc.fileFullUrl}
                        title="Document Preview"
                        width="100%"
                        height="100%"
                        style={{ border: "none", borderRadius: "4px" }}
                      />
                    ) : (
                      <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
                        <Box
                          component="img"
                          src={currentActiveDoc.fileFullUrl}
                          alt="เอกสาร"
                          onError={(e) => {
                            console.error("❌ โหลดรูปภาพไม่สำเร็จจาก URL:", e.target.src);
                            e.target.style.display = "none";
                            const fallbackBox = document.getElementById(`fallback-${selectedDocKey}`);
                            if (fallbackBox) fallbackBox.style.display = "flex";
                          }}
                          sx={{
                            maxWidth: "100%",
                            maxHeight: "100%",
                            objectFit: "contain",
                            display: "block",
                            margin: "auto",
                          }}
                        />

                        {/* กล่องแสดงแทนกรณีรูปภาพ 404 หรือไม่สามารถโหลดได้ */}
                        <Box
                          id={`fallback-${selectedDocKey}`}
                          sx={{
                            display: "none",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            textAlign: "center",
                            p: 3,
                          }}
                        >
                          <DocIcon sx={{ fontSize: 64, mb: 1, color: "#cbd5e1" }} />
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#334155", mb: 0.5 }}>
                            ไม่สามารถแสดงตัวอย่างรูปภาพได้
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#64748b", mb: 2, maxWidth: 350 }}>
                            ไฟล์อาจถูกลบอัตโนมัติจากการรีสตาร์ตของ Render หรือเส้นทาง Static File ยังไม่ได้เปิดใช้งาน
                          </Typography>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => window.open(currentActiveDoc.fileFullUrl, "_blank")}
                            sx={{
                              borderRadius: "16px",
                              borderColor: "#1b6957",
                              color: "#1b6957",
                              fontWeight: 600,
                              textTransform: "none",
                              "&:hover": { borderColor: "#134e4a", bgcolor: "#f0fdf4" },
                            }}
                          >
                            เปิดลิงก์ไฟล์โดยตรง
                          </Button>
                        </Box>
                      </Box>
                    )
                  ) : (
                    <Box sx={{ textAlign: "center", color: "#94a3b8", p: 3 }}>
                      <DocIcon sx={{ fontSize: 72, mb: 1, color: "#cbd5e1" }} />
                      <Typography variant="h6" sx={{ fontWeight: 700, color: "#64748b", mb: 0.5 }}>
                        ไม่มีเอกสารที่อัปโหลด
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                        นักศึกษายังไม่ได้อัปโหลดเอกสารหมวดนี้ ({activeDocMeta?.label})
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>

              {/* 🟢 ฝั่งขวา: รายละเอียดผู้ส่ง & เมนูเลือกเอกสาร */}
              <Grid item xs={12} md={5} sx={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <Box>
                  {/* ข้อมูลผู้ส่ง */}
                  <Typography variant="caption" sx={{ color: "#334155", fontWeight: 700, fontSize: "0.85rem" }}>
                    ผู้ส่ง <span style={{ color: "red" }}>*</span>
                  </Typography>
                  <Box
                    sx={{
                      bgcolor: "#f8fafc",
                      borderRadius: "14px",
                      p: 1.2,
                      px: 2,
                      color: "#475569",
                      fontWeight: 600,
                      fontSize: "0.95rem",
                      mb: 1.8,
                      mt: 0.5,
                      border: "1px solid #f1f5f9",
                    }}
                  >
                    {selectedStudent?.name || "-"}
                  </Box>

                  {/* รหัสนักศึกษา */}
                  <Typography variant="caption" sx={{ color: "#334155", fontWeight: 700, fontSize: "0.85rem" }}>
                    รหัสนักศึกษา
                  </Typography>
                  <Box
                    sx={{
                      bgcolor: "#f8fafc",
                      borderRadius: "14px",
                      p: 1.2,
                      px: 2,
                      color: "#475569",
                      fontWeight: 600,
                      fontSize: "0.95rem",
                      mb: 1.8,
                      mt: 0.5,
                      border: "1px solid #f1f5f9",
                    }}
                  >
                    {selectedStudent?.studentId || "-"}
                  </Box>

                  {/* วันที่ส่งเอกสาร */}
                  <Typography variant="caption" sx={{ color: "#334155", fontWeight: 700, fontSize: "0.85rem" }}>
                    วันที่ส่งเอกสาร
                  </Typography>
                  <Box
                    sx={{
                      bgcolor: "#f8fafc",
                      borderRadius: "14px",
                      p: 1.2,
                      px: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      color: "#475569",
                      fontWeight: 600,
                      fontSize: "0.95rem",
                      mb: 2.2,
                      mt: 0.5,
                      border: "1px solid #f1f5f9",
                    }}
                  >
                    <Typography variant="body2" sx={{ color: "#475569", fontWeight: 600 }}>
                      {selectedStudent?.date} {selectedStudent?.time}
                    </Typography>
                    <AccessTimeIcon sx={{ fontSize: 18, color: "#94a3b8" }} />
                  </Box>

                  {/* รายการเอกสาร 5 หมวด */}
                  <Typography variant="caption" sx={{ color: "#334155", fontWeight: 700, fontSize: "0.85rem", mb: 1, display: "block" }}>
                    เอกสาร
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2.5 }}>
                    {STANDARD_DOC_CATEGORIES.map((cat) => {
                      const isSelected = selectedDocKey === cat.key;
                      const hasUploaded = Boolean(studentDocsMap[cat.key]);

                      return (
                        <Box
                          key={cat.key}
                          onClick={() => setSelectedDocKey(cat.key)}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            bgcolor: isSelected ? "#bdd7d0" : "#d1e4de",
                            py: 0.8,
                            px: 1.8,
                            borderRadius: "10px",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            border: isSelected ? "1.5px solid #1b6957" : "1.5px solid transparent",
                            "&:hover": { bgcolor: "#b4d1c9" },
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                            <FileIcon sx={{ fontSize: 18, color: "#1b6957" }} />
                            <Typography variant="body2" sx={{ fontSize: "0.85rem", color: "#134e4a", fontWeight: isSelected ? 700 : 500 }}>
                              {cat.label}
                            </Typography>
                          </Box>

                          {/* ตรวจสอบว่ามีไฟล์จริงหรือไม่ */}
                          {hasUploaded ? (
                            <CheckCircleIcon sx={{ fontSize: 20, color: "#10b981" }} />
                          ) : (
                            <CancelOutlinedIcon sx={{ fontSize: 20, color: "#94a3b8" }} />
                          )}
                        </Box>
                      );
                    })}
                  </Box>

                  {/* กล่องข้อเสนอแนะ */}
                  <Typography variant="caption" sx={{ color: "#334155", fontWeight: 700, fontSize: "0.85rem", mb: 0.8, display: "block" }}>
                    ข้อเสนอแนะที่ตรวจพบ
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={2.5}
                    value={feedbackNote}
                    onChange={(e) => setFeedbackNote(e.target.value)}
                    sx={{
                      bgcolor: "#ffffff",
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "14px",
                        fontSize: "0.95rem",
                        color: "#166534",
                        fontWeight: 700,
                        textAlign: "center",
                      },
                    }}
                  />
                </Box>

                {/* แถบปุ่ม Action ด้านล่างสุด */}
                <Box sx={{ display: "flex", gap: 1.5, mt: 3 }}>
                  <Button
                    variant="contained"
                    disabled={actionLoading}
                    onClick={handleCloseReview}
                    sx={{
                      bgcolor: "#ef4444",
                      color: "#ffffff",
                      borderRadius: "10px",
                      px: 3,
                      py: 0.9,
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      boxShadow: "none",
                      "&:hover": { bgcolor: "#dc2626", boxShadow: "none" },
                    }}
                  >
                    ยกเลิก
                  </Button>

                  <Button
                    variant="contained"
                    disabled={actionLoading}
                    onClick={() => handleReviewAction("failed")}
                    sx={{
                      flexGrow: 1,
                      bgcolor: "#e2e8f0",
                      color: "#475569",
                      borderRadius: "10px",
                      py: 0.9,
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      boxShadow: "none",
                      "&:hover": { bgcolor: "#cbd5e1", boxShadow: "none" },
                    }}
                  >
                    {actionLoading ? "กำลังบันทึก..." : "บันทึกและส่งกลับไปแก้ไข"}
                  </Button>

                  <Button
                    variant="contained"
                    disabled={actionLoading}
                    onClick={() => handleReviewAction("passed")}
                    sx={{
                      bgcolor: "#16a34a",
                      color: "#ffffff",
                      borderRadius: "10px",
                      px: 3.5,
                      py: 0.9,
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      boxShadow: "none",
                      "&:hover": { bgcolor: "#15803d", boxShadow: "none" },
                    }}
                  >
                    {actionLoading ? "กำลังบันทึก..." : "อนุมัติ"}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Dialog>
      </Box>
    </Box>
  );
}

export default AdminDocumentManagement;