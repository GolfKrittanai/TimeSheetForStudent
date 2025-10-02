
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  TextField,
  Paper,
  useMediaQuery,
  useTheme,
  styled,
} from "@mui/material";

import {
  AccessTime as AccessTimeIcon,
} from "@mui/icons-material";
import dayjs from "dayjs";

import {
  createTimeSheet,
  checkTimesheetExists,
} from "../services/timesheetService";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";
import Sidebar from "../components/Sidebar";

const StyledTextField = styled(TextField)(({ theme }) => ({
  "& .MuiInputBase-root": {
    fontFamily: '"Kanit", sans-serif',
    borderRadius: theme.spacing(2),
    backgroundColor: "#fafafa",
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "#ccc",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "#00423b",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "#00423b",
      boxShadow: "0 0 5px 0 #00423b",
    },
  },
  "& .MuiInputLabel-root": {
    "&.Mui-focused": {
      color: "#00423b",
    },
  },
}));

function StudentDashboard() {
  const { token, user } = useAuth();
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [timesheetExists, setTimesheetExists] = useState(false); 

  const [formData, setFormData] = useState({
    date: "",
    checkInTime: "",
    checkOutTime: "",
    activity: "",
  });
  const [formErrors, setFormErrors] = useState({});

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const drawerWidth = 240;

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
    if (!formData.date) errors.date = "กรุณาเลือกวันที่";
    if (!formData.checkInTime) errors.checkInTime = "กรุณากรอกเวลาเข้า";
    if (!formData.checkOutTime) errors.checkOutTime = "กรุณากรอกเวลาออก";
    if (!formData.activity) errors.activity = "กรุณากรอกกิจกรรม";
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
            title: "ผิดพลาด",
            text: "คุณได้บันทึก Timesheet สำหรับวันที่นี้ไปแล้ว",
            icon: "warning",
            confirmButtonColor: "#00423b",
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
        text: "เพิ่ม TimeSheet เรียบร้อยแล้ว",
        icon: "success",
        confirmButtonColor: "#00423b",
      });
      setTimesheetExists(true); 

    } catch (error) {
      const errorMessage = error.response?.data?.message || "ไม่สามารถเพิ่ม TimeSheet ได้";
      
      if (error.response && error.response.status === 409) {
         Swal.fire({
            title: "ไม่สามารถเพิ่ม TimeSheet ได้",
            text: errorMessage,
            icon: "warning",
            confirmButtonColor: "#00423b",
         });
         setTimesheetExists(true);
      } else {
         Swal.fire({
            title: "ไม่สามารถเพิ่ม TimeSheet ได้",
            text: errorMessage,
            icon: "error",
            confirmButtonColor: "#00423b",
         });
      }
    } finally {
      setLoadingCreate(false);
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: isSmallScreen ? 2 : 4,
          mt: isSmallScreen ? 5 : 0,
          minHeight: "100vh",
          backgroundColor: "#f5f7fa",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          fontFamily: '"Kanit", sans-serif',
        }}
      >
        <Typography
          variant={isSmallScreen ? "h5" : "h3"}
          sx={{
            fontWeight: "700",
            color: "#00796b",
            mt: 4,
            mb: 4,
            textAlign: "center",
            letterSpacing: 1,
            fontFamily: '"Kanit", sans-serif',
          }}
        >
        TIMESHEET
        </Typography>

        <Paper
          elevation={4}
          sx={{
            width: "100%",
            mb: 5,
            p: isSmallScreen ? 2 : 4,
            borderRadius: 3,
            backgroundColor: "#fff",
            boxShadow: "0 8px 24px rgba(0,102,204,0.15)",
            fontFamily: '"Kanit", sans-serif',
          }}
        >
          <Typography
            variant="h6"
            sx={{ mb: 3, fontWeight: 600, color: "#737070" }}
          >
            เพิ่ม Timesheet ใหม่
          </Typography>
          <form onSubmit={handleSubmit} noValidate>
            <StyledTextField
              label="วันที่"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleInputChange}
              error={Boolean(formErrors.date)}
              helperText={formErrors.date}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />
            <Box
              sx={{
                display: "flex",
                flexDirection: isSmallScreen ? "column" : "row",
                gap: 2,
                mb: 2,
              }}
            >
              <StyledTextField
                label="เวลาเข้า"
                name="checkInTime"
                type="time"
                value={formData.checkInTime}
                onChange={handleInputChange}
                error={Boolean(formErrors.checkInTime)}
                helperText={formErrors.checkInTime}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              
              <StyledTextField
                label="เวลาออก"
                name="checkOutTime"
                type="time"
                value={formData.checkOutTime}
                onChange={handleInputChange}
                error={Boolean(formErrors.checkOutTime)}
                helperText={formErrors.checkOutTime}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <StyledTextField
              label="กิจกรรม"
              name="activity"
              fullWidth
              multiline
              rows={6}
              value={formData.activity}
              onChange={handleInputChange}
              error={Boolean(formErrors.activity)}
              helperText={formErrors.activity}
              sx={{ mb: 2 }}
            />
            <Button
              variant="contained"
              type="submit"
              fullWidth
              disabled={loadingCreate || timesheetExists} 
              sx={{
                textTransform: "none",
                backgroundColor: "#01645a",
                "&:hover": {
                  backgroundColor: "#00796b",
                  boxShadow: "0 6px 20px rgba(103, 116, 129, 0.3)",
                },
                py: 1.5,
                fontWeight: "700",
                fontSize: 16,
              }}
              startIcon={<AccessTimeIcon />}
            >
              {timesheetExists 
                ? "มีรายการบันทึกแล้ววันนี้" 
                : (loadingCreate ? "กำลังบันทึก..." : "บันทึก TimeSheet")
              }
            </Button>
          </form>
        </Paper>
      </Box>
    </Box>
  );
}

export default StudentDashboard;