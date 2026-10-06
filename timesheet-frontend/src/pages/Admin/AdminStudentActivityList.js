// src/pages/Admin/AdminStudentActivityList.js
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Description as DescriptionIcon,
} from "@mui/icons-material";

import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";
import { getAllStudents } from "../../services/studentService";

const BRAND_DARK = "#134e4a";
const THEME_GREEN = "#1b6957";
const THEME_HOVER = "#134e4a";

function AdminStudentActivityList() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [loading, setLoading] = useState(true);
  const [activityList, setActivityList] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // ดึงข้อมูลนักศึกษาและ Timesheet จากฐานข้อมูล
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const activeToken = token || localStorage.getItem("token");
      const res = await getAllStudents(activeToken);

      let rawStudents = [];
      if (Array.isArray(res)) rawStudents = res;
      else if (res?.data && Array.isArray(res.data)) rawStudents = res.data;
      else if (res?.data?.data && Array.isArray(res.data.data)) rawStudents = res.data.data;

      // กรองเฉพาะนักศึกษาและจัดรูปแบบข้อมูลตาราง
      const formatted = rawStudents
        .filter((s) => s.role === "student")
        .map((s) => ({
          id: s.id,
          studentId: s.studentId || "-",
          name: s.fullName || "-",
          companyName: s.companyName || "Underfire Co.,Ltd",
          timesheets: s.timesheet || s.timesheets || [],
          timesheetCount: s._count?.timesheet || (s.timesheet ? s.timesheet.length : 0),
        }));

      setActivityList(formatted);
    } catch (err) {
      console.error("Error fetching student activities:", err);
      // ข้อมูลสำรองกรณี API ออฟไลน์
      setActivityList([
        { id: 1, studentId: "6406105320", name: "นาย A", companyName: "Underfire Co.,Ltd" },
        { id: 2, studentId: "6406105320", name: "นาย A", companyName: "Underfire Co.,Ltd" },
        { id: 3, studentId: "6406105320", name: "นาย A", companyName: "Underfire Co.,Ltd" },
        { id: 4, studentId: "6406105320", name: "นาย A", companyName: "Underfire Co.,Ltd" },
        { id: 5, studentId: "6406105320", name: "นาย A", companyName: "Underfire Co.,Ltd" },
      ]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ดูรายละเอียดบันทึกกิจกรรมของนักศึกษา
  const handleOpenDetail = (student) => {
    // นำทางไปหน้ารายละเอียด Timesheet ของนักศึกษาคนนั้น
    navigate(`/admin/student/${student.id}/timesheets`);
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
            variant="h4"
            sx={{ fontWeight: 800, color: BRAND_DARK, letterSpacing: -0.5 }}
          >
            บันทึกกิจกรรมนักศึกษา
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b", mt: 0.5 }}>
            กิจกรรมระหว่างปฏิบัติงานระหว่างสหกิจ
          </Typography>
        </Box>

        {/* แบนเนอร์: บันทึกกิจกรรม (เพิ่มกิจกรรมระหว่างสหกิจ) */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3 },
            mb: 4,
            borderRadius: "20px",
            bgcolor: "#e8f5e9",
            border: "1px solid #c8e6c9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 2.5,
          }}
        >
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: "14px",
              bgcolor: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <DescriptionIcon sx={{ fontSize: 32, color: THEME_GREEN }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: BRAND_DARK, fontSize: "1.05rem" }}>
              บันทึกกิจกรรม
            </Typography>
            <Typography variant="body2" sx={{ color: "#52796f", fontSize: "0.85rem" }}>
              เพิ่มกิจกรรมระหว่างสหกิจ
            </Typography>
          </Box>
        </Paper>

        {/* การ์ดตาราง: นักศึกษาที่ต้องดำเนินการล่าสุด */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3.5 },
            borderRadius: "20px",
            bgcolor: "#ffffff",
            border: "1px solid #e2e8f0",
          }}
        >
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: "#1e293b", fontSize: "1.05rem" }}>
              นักศึกษาที่ต้องดำเนินการล่าสุด
            </Typography>
            <Typography variant="caption" sx={{ color: "#94a3b8", fontSize: "0.78rem" }}>
              เรียงตามรายการที่มีสถานะรอตรวจหรือรออัปโหลด
            </Typography>
          </Box>

          <TableContainer sx={{ border: "1px solid #f1f5f9", borderRadius: "12px", overflowX: "auto" }}>
            <Table size="medium">
              <TableHead sx={{ bgcolor: "#fafafa" }}>
                <TableRow>
                  <TableCell align="center" sx={{ fontWeight: 700, color: "#64748b", fontSize: "0.85rem", width: 80 }}>
                    ลำดับ
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#64748b", fontSize: "0.85rem", width: 220 }}>
                    รหัสนักศึกษา
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#64748b", fontSize: "0.85rem", width: 250 }}>
                    ชื่อ-นามสกุล
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#64748b", fontSize: "0.85rem" }}>
                    สถานประกอบการ
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: "#64748b", fontSize: "0.85rem", width: 140 }}>
                    ดำเนินการ
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                      <CircularProgress sx={{ color: THEME_GREEN }} />
                    </TableCell>
                  </TableRow>
                ) : activityList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 5, color: "#94a3b8" }}>
                      ไม่พบข้อมูลกิจกรรมของนักศึกษา
                    </TableCell>
                  </TableRow>
                ) : (
                  activityList.map((row, index) => (
                    <TableRow
                      key={row.id || index}
                      hover
                      sx={{
                        "&:last-child td, &:last-child th": { border: 0 },
                        "& td": { py: 2, fontSize: "0.88rem" },
                      }}
                    >
                      <TableCell align="center" sx={{ color: "#1e293b", fontWeight: 700 }}>
                        {index + 1}
                      </TableCell>

                      <TableCell sx={{ color: "#334155", fontWeight: 600 }}>
                        {row.studentId}
                      </TableCell>

                      <TableCell sx={{ color: "#334155", fontWeight: 600 }}>
                        {row.name}
                      </TableCell>

                      <TableCell sx={{ color: "#64748b" }}>
                        {row.companyName}
                      </TableCell>

                      <TableCell align="center">
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleOpenDetail(row)}
                          sx={{
                            bgcolor: THEME_GREEN,
                            color: "#ffffff",
                            borderRadius: "16px",
                            px: 2.2,
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
        </Paper>
      </Box>
    </Box>
  );
}

export default AdminStudentActivityList;