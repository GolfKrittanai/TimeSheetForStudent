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
  useTheme,
  useMediaQuery,
} from "@mui/material";

import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";
import { getAllStudents } from "../../services/studentService";
import { getAllDocumentsForReview } from "../../services/documentScanService";

const BRAND_DARK = "#134e4a";
const THEME_GREEN = "#1b6957";
const THEME_HOVER = "#134e4a";

// นิยามการ Match หมวดหมู่เอกสารมาตรฐาน 4 รายการหลักของนักศึกษา
const STANDARD_DOC_CATEGORIES = [
  { key: "01", matchPattern: /(01|ใบขอความอนุเคราะห์|คำร้อง)/i },
  { key: "02-2", matchPattern: /(02-2|BA Co-op 02-2)/i },
  { key: "transcript", matchPattern: /(ผลการศึกษา|transcript)/i },
  { key: "reply", matchPattern: /(ตอบรับ|company-reply)/i },
];

const TOTAL_REQUIRED_DOCS = STANDARD_DOC_CATEGORIES.length;

function AdminStudentDocReviewList() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [loading, setLoading] = useState(true);
  const [dataList, setDataList] = useState([]);

  // ตัวกรองและการค้นหา
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ทั้งหมด");
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  // 🟢 ดึงข้อมูลจริงจากฐานข้อมูล
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

          // คัดเลือกเฉพาะเอกสารฉบับล่าสุดของแต่ละหมวด
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
          const uploadedCount = activeDocsList.length;

          // คำนวณสถานะภาพรวม
          let computedStatus = "รออัปโหลด";
          if (uploadedCount === 0) {
            computedStatus = "รออัปโหลด";
          } else {
            const hasFailed = activeDocsList.some(
              (d) => d.status === "failed" || d.status === "ไม่ผ่าน" || d.status === "ต้องแก้ไข"
            );
            const hasPending = activeDocsList.some(
              (d) => d.status === "pending" || d.status === "รอตรวจสอบ"
            );
            const isAllPassed =
              uploadedCount === TOTAL_REQUIRED_DOCS &&
              activeDocsList.every((d) => d.status === "passed" || d.status === "ผ่าน");

            if (hasFailed) computedStatus = "ต้องแก้ไข";
            else if (hasPending) computedStatus = "รอตรวจ";
            else if (isAllPassed) computedStatus = "ผ่านครบ";
            else computedStatus = "ยังส่งไม่ครบ";
          }

          const facultyBranch = `${s.faculty || "บริหารธุรกิจ"} / ${s.branch || "ระบบสารสนเทศ"}`;

          return {
            id: s.id,
            studentId: s.studentId || "-",
            name: s.fullName || "-",
            facultyBranch,
            docCount: `${uploadedCount}/${TOTAL_REQUIRED_DOCS}`,
            status: computedStatus,
          };
        });

      setDataList(formatted);
    } catch (err) {
      console.error("Error fetching students real data:", err);
      Swal.fire({
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถดึงข้อมูลนักศึกษาได้",
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

  // คำนวณสถิติ 4 ช่องด้านบนจากข้อมูลจริง
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

  // แสดงผลสถานะตามสีใน UI
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
          {/* การ์ด 1: รอตรวจ */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: "16px",
                bgcolor: "#ffffff",
                border: "1px solid #e2e8f0",
              }}
            >
              <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.85rem", fontWeight: 600 }}>
                รอตรวจ
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, color: "#1e293b", mt: 1 }}>
                {stats.pending}
              </Typography>
            </Paper>
          </Grid>

          {/* การ์ด 2: ผ่านครบ */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: "16px",
                bgcolor: "#ffffff",
                border: "1px solid #e2e8f0",
              }}
            >
              <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.85rem", fontWeight: 600 }}>
                ผ่านครบ
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, color: "#1e293b", mt: 1 }}>
                {stats.passed}
              </Typography>
            </Paper>
          </Grid>

          {/* การ์ด 3: ต้องแก้ไข */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: "16px",
                bgcolor: "#ffffff",
                border: "1px solid #e2e8f0",
              }}
            >
              <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.85rem", fontWeight: 600 }}>
                ต้องแก้ไข
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, color: "#1e293b", mt: 1 }}>
                {stats.needsFix}
              </Typography>
            </Paper>
          </Grid>

          {/* การ์ด 4: ยังส่งไม่ครบ */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: "16px",
                bgcolor: "#ffffff",
                border: "1px solid #e2e8f0",
              }}
            >
              <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.85rem", fontWeight: 600 }}>
                ยังส่งไม่ครบ
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, color: "#1e293b", mt: 1 }}>
                {stats.incomplete}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* การ์ดค้นหาและตารางรายชื่อ */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3.5 },
            borderRadius: "20px",
            bgcolor: "#ffffff",
            border: "1px solid #e2e8f0",
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#1e293b", mb: 2 }}>
            ค้นหาและกรอง
          </Typography>

          {/* ฟอร์มค้นหาและตัวกรอง */}
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-end",
              gap: 2,
              mb: 3,
              flexWrap: "wrap",
            }}
          >
            {/* ช่องค้นหา */}
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
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                    bgcolor: "#ffffff",
                  },
                }}
              />
            </Box>

            {/* ตัวเลือกสถานะ */}
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

            {/* ปุ่มค้นหา */}
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

          {/* ตารางแสดงรายชื่อนักศึกษา */}
          <TableContainer sx={{ border: "1px solid #f1f5f9", borderRadius: "10px", overflowX: "auto" }}>
            <Table size="medium">
              <TableHead sx={{ bgcolor: "#fafafa" }}>
                <TableRow>
                  <TableCell align="center" sx={{ fontWeight: 700, color: "#64748b", fontSize: "0.82rem", width: 70 }}>
                    ลำดับ
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#64748b", fontSize: "0.82rem" }}>
                    รหัสนักศึกษา
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#64748b", fontSize: "0.82rem" }}>
                    ชื่อ-นามสกุล
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#64748b", fontSize: "0.82rem" }}>
                    คณะ / สาขา
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: "#64748b", fontSize: "0.82rem" }}>
                    จำนวนเอกสาร
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: "#64748b", fontSize: "0.82rem" }}>
                    สถานะ
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: "#64748b", fontSize: "0.82rem", width: 140 }}>
                    ดำเนินการ
                  </TableCell>
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
                      sx={{
                        "&:last-child td, &:last-child th": { border: 0 },
                        "& td": { py: 1.6, fontSize: "0.88rem" },
                      }}
                    >
                      <TableCell align="center" sx={{ color: "#64748b" }}>
                        {(page - 1) * rowsPerPage + index + 1}
                      </TableCell>
                      <TableCell sx={{ color: "#334155" }}>
                        {row.studentId}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#334155" }}>
                        {row.name}
                      </TableCell>
                      <TableCell sx={{ color: "#64748b" }}>
                        {row.facultyBranch}
                      </TableCell>
                      <TableCell align="center" sx={{ color: "#334155", fontWeight: 600 }}>
                        {row.docCount}
                      </TableCell>
                      <TableCell align="center">
                        {renderStatusChip(row.status)}
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => navigate("/admin/document-management")}
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

          {/* Pagination ด้านล่าง */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mt: 2.5,
              flexWrap: "wrap",
              gap: 1.5,
            }}
          >
            <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
              {filteredData.length > 0
                ? `แสดง ${paginatedData.length} รายการจาก ${filteredData.length} รายการ`
                : "0 รายการ"}
            </Typography>

            <Pagination
              count={Math.ceil(filteredData.length / rowsPerPage) || 1}
              page={page}
              onChange={(e, val) => setPage(val)}
              shape="rounded"
              size="small"
              sx={{
                "& .MuiPaginationItem-root": {
                  borderRadius: "6px",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                },
                "& .Mui-selected": {
                  bgcolor: "#1b6957 !important",
                  color: "#fff",
                },
              }}
            />
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}

export default AdminStudentDocReviewList;