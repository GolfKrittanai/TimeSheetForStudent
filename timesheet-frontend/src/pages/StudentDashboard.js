// src/pages/StudentDashboard.js
import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  Grid,
  useMediaQuery,
  useTheme,
  CircularProgress,
} from "@mui/material";
import {
  Description as DescriptionIcon,
  AccessTime as AccessTimeIcon,
  Lock as LockIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import {
  createTimeSheet,
  checkTimesheetExists,
} from "../services/timesheetService";
import { getUserDocumentHistory } from "../services/documentScanService";

const THEME_GREEN = "#1b6957";
const THEME_HOVER = "#134e4a";
const LIGHT_MINT = "#bfe3db";

function StudentDashboard() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [loading, setLoading] = useState(true);
  const [isStep2Passed, setIsStep2Passed] = useState(false);
  const [passedCount, setPassedCount] = useState(0);

  const [loadingCreate, setLoadingCreate] = useState(false);
  const [timesheetExists, setTimesheetExists] = useState(false);

  const [formData, setFormData] = useState({
    date: "",
    checkInTime: "",
    checkOutTime: "",
    activity: "",
  });
  const [formErrors, setFormErrors] = useState({});

  // 🟢 ตรวจสอบสถานะขั้นตอนที่ 2
  const checkStep2Status = useCallback(async () => {
    try {
      setLoading(true);
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = storedUser.id || storedUser.userId || 1;

      const res = await getUserDocumentHistory(userId);
      const historyData = Array.isArray(res)
        ? res
        : res?.data || res?.documents || [];

      // ตรวจสอบเอกสารตอบกลับ หน้า 1 และ หน้า 2
      const targetDocs = [
        "เอกสารตอบกลับ (หน้า 1)",
        "เอกสารตอบกลับ (หน้า 2)",
      ];

      const passedDocs = historyData.filter((item) => {
        const status = String(item.status || "").trim().toLowerCase();
        const isPassedStatus = status === "passed" || status === "สำเร็จ";
        const isTargetCat = targetDocs.some(
          (target) => item.docCategory && item.docCategory.includes(target)
        );
        return isPassedStatus && isTargetCat;
      });

      // นับหมวดหมู่ที่ผ่าน (ไม่ซ้ำกัน)
      const uniquePassedCategories = new Set(
        passedDocs.map((item) => item.docCategory)
      );

      setPassedCount(uniquePassedCategories.size);

      // ต้องผ่านครบทั้ง 2 หน้า (หน้า 1 และ หน้า 2)
      if (uniquePassedCategories.size >= 2) {
        setIsStep2Passed(true);
      } else {
        setIsStep2Passed(false);
      }
    } catch (err) {
      console.error("Error checking step 2 status:", err);
      setIsStep2Passed(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStep2Status();
  }, [checkStep2Status]);

  useEffect(() => {
    const checkExistence = async () => {
      if (!formData.date || !token) {
        setTimesheetExists(false);
        return;
      }

      try {
        const exists = await checkTimesheetExists(formData.date, token);
        setTimesheetExists(exists);
      } catch (error) {
        console.error("Error checking timesheet existence:", error);
        setTimesheetExists(false);
      }
    };
    if (isStep2Passed) {
      checkExistence();
    }
  }, [formData.date, token, isStep2Passed]);

  const validateForm = () => {
    const errors = {};
    if (!formData.date) errors.date = "กรุณาระบุวันที่";
    if (!formData.checkInTime) errors.checkInTime = "กรุณาระบุเวลาเข้า";
    if (!formData.checkOutTime) errors.checkOutTime = "กรุณาระบุเวลาออก";
    if (!formData.activity) errors.activity = "กรุณาระบุกิจกรรม";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (timesheetExists) {
      Swal.fire({
        title: "แจ้งเตือน",
        text: "คุณได้บันทึกกิจกรรมสำหรับวันที่นี้ไปแล้ว",
        icon: "warning",
        confirmButtonColor: THEME_GREEN,
      });
      return;
    }

    setLoadingCreate(true);
    try {
      const payload = {
        date: formData.date,
        checkInTime: formData.checkInTime,
        checkOutTime: formData.checkOutTime,
        activity: formData.activity,
      };

      await createTimeSheet(payload, token);
      setFormData({
        date: "",
        checkInTime: "",
        checkOutTime: "",
        activity: "",
      });

      Swal.fire({
        title: "สำเร็จ",
        text: "บันทึกกิจกรรมเรียบร้อยแล้ว",
        icon: "success",
        confirmButtonColor: THEME_GREEN,
      });
      setTimesheetExists(true);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "ไม่สามารถบันทึกกิจกรรมได้";

      Swal.fire({
        title: "เกิดข้อผิดพลาด",
        text: errorMessage,
        icon: "error",
        confirmButtonColor: THEME_GREEN,
      });
    } finally {
      setLoadingCreate(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        bgcolor: "#f4f6f8",
        height: isSmallScreen ? "auto" : "100vh",
        maxHeight: isSmallScreen ? "none" : "100vh",
        overflow: isSmallScreen ? "auto" : "hidden",
        fontFamily: '"Kanit", sans-serif',
      }}
    >
      <Sidebar />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: isSmallScreen ? 2 : 3,
          mt: isSmallScreen ? 5 : 0,
          maxWidth: 1400,
          mx: "auto",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
          height: isSmallScreen ? "auto" : "100vh",
        }}
      >
        {/* หัวข้อด้านบน */}
        <Box sx={{ mb: 2, flexShrink: 0 }}>
          <Typography
            variant="h4"
            sx={{ fontWeight: 800, color: "#134e4a", letterSpacing: -0.5, fontSize: "1.75rem" }}
          >
            ระบบบันทึกกิจกรรมนักศึกษา
          </Typography>
          <Typography variant="body2" sx={{ color: "#00796b", fontWeight: 600, mt: 0.3 }}>
            ระบบบันทึกกิจกรรมระหว่างสหกิจศึกษา
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", flexGrow: 1 }}>
            <CircularProgress color="success" />
          </Box>
        ) : !isStep2Passed ? (
          /* 🔴 กรณีขั้นตอนที่ 2 ยังไม่ผ่าน */
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 3,
              border: "1px solid #fca5a5",
              bgcolor: "#fef2f2",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              my: "auto",
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                bgcolor: "#fee2e2",
                color: "#dc2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2,
              }}
            >
              <LockIcon sx={{ fontSize: 32 }} />
            </Box>

            <Typography
              variant="h6"
              sx={{ fontWeight: 800, color: "#991b1b", mb: 1, fontSize: "1.2rem" }}
            >
              คุณยังไม่ผ่านขั้นตอนที่ 2
            </Typography>

            <Typography
              variant="body2"
              sx={{ color: "#7f1d1d", mb: 3, maxWidth: 600, fontSize: "0.9rem", lineHeight: 1.6 }}
            >
              การจะเข้าใช้งานระบบบันทึกกิจกรรมนักศึกษาได้ คุณต้องผ่านการตรวจสอบเอกสารในขั้นตอนที่ 2 (จัดเตรียมเอกสารให้สถานประกอบการ) ให้เรียบร้อยก่อน <br />
              (ผ่านการตรวจสอบแล้ว <strong>{passedCount}/2</strong> ฉบับ)
            </Typography>

            <Button
              variant="contained"
              onClick={() => navigate("/student/step2-dashboard")}
              sx={{
                bgcolor: "#dc2626",
                color: "#ffffff",
                fontWeight: 700,
                borderRadius: 2,
                px: 3.5,
                py: 1,
                fontSize: "0.9rem",
                boxShadow: "none",
                "&:hover": { bgcolor: "#b91c1c" },
              }}
            >
              ไปยังขั้นตอนที่ 2 จัดเตรียมเอกสาร
            </Button>
          </Paper>
        ) : (
          /* 🟢 กรณีผ่านขั้นตอนที่ 2 แล้ว แสดงฟอร์มบันทึกกิจกรรม */
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              flexGrow: 1,
              minHeight: 0, // ป้องกัน Flexbox Overflow
              gap: 1.5,
              mb: 1,
            }}
          >
            {/* แบนเนอร์: บันทึกกิจกรรมนักศึกษา */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: "18px",
                bgcolor: "#e8f5e9",
                border: "1px solid #c8e6c9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 2.5,
                flexShrink: 0,
              }}
            >
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  borderRadius: "14px",
                  bgcolor: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                }}
              >
                <DescriptionIcon sx={{ fontSize: 28, color: THEME_GREEN }} />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#134e4a", fontSize: "1.05rem" }}>
                  บันทึกกิจกรรมนักศึกษา
                </Typography>
                <Typography variant="caption" sx={{ color: "#52796f", fontSize: "0.82rem", fontWeight: 600 }}>
                  เพิ่มกิจกรรมระหว่างสหกิจ
                </Typography>
              </Box>
            </Paper>

            {/* หัวข้อก่อนถึงฟอร์ม */}
            {/* <Typography variant="h6" sx={{ fontWeight: 800, color: "#134e4a", fontSize: "1.1rem", flexShrink: 0 }}>
              บันทึกกิจกรรมระหว่างสหกิจ
            </Typography> */}

            {/* การ์ดฟอร์ม CREATE NEW */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.5, sm: 3 },
                borderRadius: "24px",
                bgcolor: "#ffffff",
                border: "1px solid #e2e8f0",
                display: "flex",
                flexDirection: "column",
                flexGrow: 1,
                minHeight: 0,
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  textAlign: "center",
                  fontWeight: 900,
                  color: THEME_GREEN,
                  letterSpacing: 0.5,
                  mb: 2,
                  fontSize: "1.35rem",
                  flexShrink: 0,
                }}
              >
                CREATE NEW
              </Typography>

              <Box
                component="form"
                onSubmit={handleSubmit}
                noValidate
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  flexGrow: 1,
                  minHeight: 0,
                }}
              >
                <Grid container spacing={2.5} sx={{ mb: 2, flexShrink: 0 }}>
                  {/* โปรดระบุวันที่ */}
                  <Grid item xs={12} md={4}>
                    <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, mb: 0.6, display: "block", fontSize: "0.82rem" }}>
                      โปรดระบุวันที่
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      error={Boolean(formErrors.date)}
                      helperText={formErrors.date}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "12px",
                          bgcolor: "#ffffff",
                        },
                      }}
                    />
                  </Grid>

                  {/* โปรดระบุ : เวลาเข้า */}
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, mb: 0.6, display: "block", fontSize: "0.82rem" }}>
                      โปรดระบุ : เวลาเข้า
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      type="time"
                      name="checkInTime"
                      value={formData.checkInTime}
                      onChange={handleInputChange}
                      error={Boolean(formErrors.checkInTime)}
                      helperText={formErrors.checkOutTime}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "12px",
                          bgcolor: "#ffffff",
                        },
                      }}
                    />
                  </Grid>

                  {/* โปรดระบุ : เวลาออก */}
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, mb: 0.6, display: "block", fontSize: "0.82rem" }}>
                      โปรดระบุ : เวลาออก
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      type="time"
                      name="checkOutTime"
                      value={formData.checkOutTime}
                      onChange={handleInputChange}
                      error={Boolean(formErrors.checkOutTime)}
                      helperText={formErrors.checkOutTime}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "12px",
                          bgcolor: "#ffffff",
                        },
                      }}
                    />
                  </Grid>
                </Grid>

                {/* โปรดระบุกิจกรรมหรืองานที่ได้รับมอบหมาย - ให้ขยายเต็มพื้นที่ที่เหลือ */}
                <Box
                  sx={{
                    mb: 2,
                    display: "flex",
                    flexDirection: "column",
                    flexGrow: 1,
                    minHeight: 0,
                  }}
                >
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, mb: 0.6, display: "block", fontSize: "0.82rem", flexShrink: 0 }}>
                    โปรดระบุกิจกรรมหรืองานที่ได้รับมอบหมาย
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    name="activity"
                    placeholder="กิจกรรม"
                    value={formData.activity}
                    onChange={handleInputChange}
                    error={Boolean(formErrors.activity)}
                    helperText={formErrors.activity}
                    sx={{
                      flexGrow: 1,
                      display: "flex",
                      flexDirection: "column",
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "14px",
                        bgcolor: "#ffffff",
                        height: "100%",
                        alignItems: "flex-start",
                      },
                      "& .MuiInputBase-input": {
                        height: "100% !important",
                        overflowY: "auto",
                      },
                    }}
                  />
                </Box>

                {/* ปุ่มบันทึก & ปุ่มประวัติ */}
                <Box sx={{ flexShrink: 0 }}>
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={loadingCreate || timesheetExists}
                    sx={{
                      bgcolor: THEME_GREEN,
                      color: "#ffffff",
                      py: 1.2,
                      borderRadius: "12px",
                      fontWeight: 800,
                      fontSize: "0.95rem",
                      textTransform: "none",
                      boxShadow: "none",
                      mb: 1.2,
                      "&:hover": { bgcolor: THEME_HOVER, boxShadow: "none" },
                    }}
                  >
                    {timesheetExists
                      ? "บันทึกเรียบร้อยแล้ววันนี้"
                      : loadingCreate
                      ? "กำลังบันทึก..."
                      : "บันทึก"}
                  </Button>

                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<AccessTimeIcon sx={{ fontSize: 18 }} />}
                    onClick={() => navigate("/student/timesheet-history")}
                    sx={{
                      bgcolor: LIGHT_MINT,
                      color: "#134e4a",
                      py: 1.1,
                      borderRadius: "12px",
                      fontWeight: 700,
                      fontSize: "0.92rem",
                      textTransform: "none",
                      boxShadow: "none",
                      "&:hover": { bgcolor: "#a7d7cd", boxShadow: "none" },
                    }}
                  >
                    ประวัติการบันทึก
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default StudentDashboard;