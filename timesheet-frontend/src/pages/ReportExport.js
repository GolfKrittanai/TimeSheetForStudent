import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Stack,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  CircularProgress,
  Paper,
} from "@mui/material";
import Swal from "sweetalert2";
import axios from "axios";
import Sidebar from "../components/Sidebar"; // ✅ import Sidebar component

const API_URL = process.env.REACT_APP_API;

function ReportExport({ user }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startStudentId, setStartStudentId] = useState("");
  const [endStudentId, setEndStudentId] = useState("");
  const [previewData, setPreviewData] = useState([]);
  const [format, setFormat] = useState("pdf");
  const [loading, setLoading] = useState(false);

  const isAdmin = user?.role === "admin";

  const fetchPreview = async () => {
    if (!startDate || !endDate) {
      Swal.fire({
        title: "แจ้งเตือน",
        text: "กรุณาเลือกช่วงวันที่",
        icon: "warning",
        confirmButtonColor: "#00796b",
      });
      return;
    }
    setLoading(true);
    try {
      const params = {
        startDate,
        endDate,
        ...(isAdmin && startStudentId && endStudentId
          ? { startStudentId, endStudentId }
          : {}),
      };

      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/reports/timesheets`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });

      setPreviewData(res.data || []);
      if (!res.data || res.data.length === 0) {
        Swal.fire({
          title: "ไม่มีข้อมูล",
          text: "ไม่มี timesheet ในช่วงวันที่ที่คุณเลือก",
          icon: "warning",
          confirmButtonColor: "#00796b",
        });
      }
    } catch (err) {
      Swal.fire({
        title: "ผิดพลาด",
        text: "โหลดตัวอย่างข้อมูลไม่สำเร็จ",
        icon: "error",
        confirmButtonColor: "#00796b",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!startDate || !endDate) {
      Swal.fire({
        title: "แจ้งเตือน",
        text: "กรุณาเลือกช่วงวันที่",
        icon: "warning",
        confirmButtonColor: "#00796b",
      });
      return;
    }
    setLoading(true);
    try {
      const body = {
        startDate,
        endDate,
        format: String(format).toLowerCase(), // กันพิมพ์ใหญ่/เล็ก
        ...(isAdmin && startStudentId && endStudentId
          ? { startStudentId, endStudentId }
          : {}),
      };

      const token = localStorage.getItem("token");
      const response = await axios.post(`${API_URL}/reports/export`, body, {
        responseType: "blob",
        headers: { Authorization: `Bearer ${token}` },
      });

      const blob = new Blob([response.data], {
        type:
          body.format === "pdf"
            ? "application/pdf"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `timesheet_${startDate}_${endDate}.${
        body.format === "pdf" ? "pdf" : "xlsx"
      }`;
      link.click();
    } catch (err) {
      Swal.fire({
        title: "ผิดพลาด",
        text: "โหลดตัวอย่างข้อมูลไม่สำเร็จ",
        icon: "error",
        confirmButtonColor: "#00796b",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1, // ✅ เพิ่ม flex-grow เพื่อให้ Box ขยายเต็มพื้นที่ที่เหลือ
          p: 4,
          mt: 5,
          minHeight: "90vh",
          backgroundColor: "#f5f7fa",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          fontFamily: '"Didonesque", sans-serif',
          // ❌ ลบ mx และ maxWidth ออก
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: "700",
            color: "#00796b",
            mb: 4,
            textAlign: "center",
            letterSpacing: 1,
            fontFamily: '"Didonesque", sans-serif', // เพิ่มฟอนต์ที่ต้องการที่นี่
          }}
        >
          ส่งออกรายงาน Timesheet
        </Typography>
        <Paper
          elevation={4}
          sx={{
            width: "100%",
            mb: 5,
            p: 4,
            borderRadius: 3,
            backgroundColor: "#fff",
            boxShadow: "0 8px 24px rgba(0,102,204,0.15)",
          }}
        >
          <Stack spacing={3}>
            <TextField
              label="วันที่เริ่มต้น"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputProps={{
                sx: {
                  mb: 1,
                  fontFamily: '"Didonesque", sans-serif',
                  borderRadius: 2,
                  bgcolor: "#fafafa",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#ccc",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#00796b",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#00796b",
                    boxShadow: "0 0 5px 0 #00796b",
                  },
                },
              }}
              InputLabelProps={{
                shrink: true,
                sx: {
                  color: "",
                  "&.Mui-focused": {
                    color: "#00796b", // สีเขียวเมื่อกรอบได้รับการโฟกัส
                  },
                },
              }}
            />
            <TextField
              label="วันที่สิ้นสุด"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputProps={{
                sx: {
                  mb: 1,
                  fontFamily: '"Didonesque", sans-serif',
                  borderRadius: 2,
                  bgcolor: "#fafafa",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#ccc",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#00796b",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#00796b",
                    boxShadow: "0 0 5px 0 #00796b",
                  },
                },
              }}
              InputLabelProps={{
                shrink: true,
                sx: {
                  color: "",
                  "&.Mui-focused": {
                    color: "#00796b",
                  },
                },
              }}
            />
            {isAdmin && (
              <>
                <TextField
                  label="รหัสนักศึกษาเริ่มต้น"
                  value={startStudentId}
                  onChange={(e) => setStartStudentId(e.target.value)}
                  InputProps={{
                    sx: {
                      mb: 1,
                      fontFamily: '"Didonesque", sans-serif',
                      borderRadius: 2,
                      bgcolor: "#fafafa",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#ccc",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#00796b",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#00796b",
                        boxShadow: "0 0 5px 0 #00796b",
                      },
                    },
                  }}
                  InputLabelProps={{
                    sx: {
                      color: "",
                      "&.Mui-focused": {
                        color: "#00796b",
                      },
                    },
                  }}
                />
                <TextField
                  label="รหัสนักศึกษาสิ้นสุด"
                  value={endStudentId}
                  onChange={(e) => setEndStudentId(e.target.value)}
                  InputProps={{
                    sx: {
                      mb: 1,
                      fontFamily: '"Didonesque", sans-serif',
                      borderRadius: 2,
                      bgcolor: "#fafafa",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#ccc",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#00796b",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#00796b",
                        boxShadow: "0 0 5px 0 #00796b",
                      },
                    },
                  }}
                  InputLabelProps={{
                    sx: {
                      color: "",
                      "&.Mui-focused": {
                        color: "#00796b",
                      },
                    },
                  }}
                />
              </>
            )}
            <FormControl fullWidth>
              <InputLabel id="format-select-label">รูปแบบไฟล์</InputLabel>
              <Select
                labelId="format-select-label"
                value={format}
                label="รูปแบบไฟล์"
                onChange={(e) => setFormat(e.target.value)}
                sx={{
                  fontFamily: '"Didonesque", sans-serif',
                  borderRadius: 2,
                  bgcolor: "#fafafa",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#ccc",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#00796b",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#00796b",
                    boxShadow: "0 0 5px 0 #00796b",
                  },
                }}
              >
                <MenuItem value="pdf">PDF</MenuItem>
                <MenuItem value="xlsx">Excel (XLSX)</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="contained"
              onClick={fetchPreview}
              disabled={loading}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                py: 1.5,
                fontWeight: "700",
                fontSize: 16,
                backgroundColor: "#00796b",
                "&:hover": {
                  backgroundColor: "#024f46",
                  boxShadow: "0 6px 20px rgba(0,74,153,0.3)",
                },
              }}
            >
              {loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                "แสดงตัวอย่าง"
              )}
            </Button>
          </Stack>
        </Paper>

        <Paper
          elevation={2}
          sx={{
            width: "100%",
            p: 2,
            borderRadius: 2,
            bgcolor: "#f9f9f9",
          }}
        >
          {previewData.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              ไม่มีข้อมูลแสดง
            </Typography>
          ) : (
            previewData.map((item, index) => (
              <Typography key={index} fontSize={14}>
                📅 {item.date.slice(0, 10)} | 🎓 {item.studentId} | 🕒{" "}
                {item.hours} ชม. | 📝 {item.activity}
              </Typography>
            ))
          )}
        </Paper>

        <Button
          variant="contained"
          color="primary"
          onClick={handleExport}
          disabled={loading}
          sx={{
            mt: 2,
            borderRadius: 2,
            textTransform: "none",
            py: 1.5,
            fontWeight: "700",
            fontSize: 16,
            backgroundColor: "#00796b",
            "&:hover": {
              backgroundColor: "#024f46",
              boxShadow: "0 6px 20px rgba(0,74,153,0.3)",
            },
          }}
        >
          {loading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            "ส่งออกไฟล์"
          )}
        </Button>
      </Box>
    </Box>
  );
}

export default ReportExport;