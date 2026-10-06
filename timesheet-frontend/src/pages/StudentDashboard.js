// src/pages/StudentDashboard.js
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  Grid,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Description as DescriptionIcon,
  AccessTime as AccessTimeIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import {
  createTimeSheet,
  checkTimesheetExists,
} from "../services/timesheetService";

const THEME_GREEN = "#1b6957";
const THEME_HOVER = "#134e4a";
const LIGHT_MINT = "#bfe3db";

function StudentDashboard() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [loadingCreate, setLoadingCreate] = useState(false);
  const [timesheetExists, setTimesheetExists] = useState(false);

  const [formData, setFormData] = useState({
    date: "",
    checkInTime: "",
    checkOutTime: "",
    activity: "",
  });
  const [formErrors, setFormErrors] = useState({});

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
    checkExistence();
  }, [formData.date, token]);

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
            sx={{ fontWeight: 800, color: "#134e4a", letterSpacing: -0.5 }}
          >
            ระบบบันทึกกิจกรรมนักศึกษา
          </Typography>
          <Typography variant="body2" sx={{ color: "#00796b", fontWeight: 600, mt: 0.5 }}>
            ระบบบันทึกกิจกรรมระหว่างสหกิจศึกษา
          </Typography>
        </Box>

        {/* แบนเนอร์: บันทึกกิจกรรมนักศึกษา */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 2.8 },
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
              width: 50,
              height: 50,
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
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#134e4a", fontSize: "1.05rem" }}>
              บันทึกกิจกรรมนักศึกษา
            </Typography>
            <Typography variant="caption" sx={{ color: "#52796f", fontSize: "0.82rem", fontWeight: 600 }}>
              เพิ่มกิจกรรมระหว่างสหกิจ
            </Typography>
          </Box>
        </Paper>

        {/* หัวข้อก่อนถึงฟอร์ม */}
        <Typography variant="h6" sx={{ fontWeight: 800, color: "#134e4a", mb: 2 }}>
          บันทึกกิจกรรมระหว่างสหกิจ
        </Typography>

        {/* การ์ดฟอร์ม CREATE NEW */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 4 },
            borderRadius: "24px",
            bgcolor: "#ffffff",
            border: "1px solid #e2e8f0",
          }}
        >
          <Typography
            variant="h5"
            sx={{
              textAlign: "center",
              fontWeight: 900,
              color: THEME_GREEN,
              letterSpacing: 0.5,
              mb: 3.5,
            }}
          >
            CREATE NEW
          </Typography>

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
              {/* โปรดระบุวันที่ */}
              <Grid item xs={12} md={4}>
                <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, mb: 0.6, display: "block" }}>
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
                <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, mb: 0.6, display: "block" }}>
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
                  helperText={formErrors.checkInTime}
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
                <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, mb: 0.6, display: "block" }}>
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

            {/* โปรดระบุกิจกรรมหรืองานที่ได้รับมอบหมาย */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, mb: 0.6, display: "block" }}>
                โปรดระบุกิจกรรมหรืองานที่ได้รับมอบหมาย
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={5}
                name="activity"
                placeholder="กิจกรรม"
                value={formData.activity}
                onChange={handleInputChange}
                error={Boolean(formErrors.activity)}
                helperText={formErrors.activity}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "14px",
                    bgcolor: "#ffffff",
                  },
                }}
              />
            </Box>

            {/* ปุ่มบันทึก */}
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
                mb: 1.5,
                "&:hover": { bgcolor: THEME_HOVER, boxShadow: "none" },
              }}
            >
              {timesheetExists
                ? "บันทึกเรียบร้อยแล้ววันนี้"
                : loadingCreate
                ? "กำลังบันทึก..."
                : "บันทึก"}
            </Button>

            {/* ปุ่มประวัติการบันทึก */}
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
        </Paper>
      </Box>
    </Box>
  );
}

export default StudentDashboard;