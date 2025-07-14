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
} from "@mui/material";
import Swal from "sweetalert2";
import axios from "axios";
import Navbar from "../components/Navbar"; // ✅ Navbar ด้านบน

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
      Swal.fire("แจ้งเตือน", "กรุณาเลือกช่วงวันที่", "warning");
      return;
    }
    setLoading(true);
    try {
      let params = { startDate, endDate };
      if (isAdmin && startStudentId && endStudentId) {
        params.startStudentId = startStudentId;
        params.endStudentId = endStudentId;
      }

      const token = localStorage.getItem("token"); // ✅ เพิ่ม token
      const res = await axios.get("/api/reports/timesheets", {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setPreviewData(res.data);
    } catch (err) {
      Swal.fire("ผิดพลาด", "โหลดตัวอย่างข้อมูลไม่สำเร็จ", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!startDate || !endDate) {
      Swal.fire("แจ้งเตือน", "กรุณาเลือกช่วงวันที่", "warning");
      return;
    }
    setLoading(true);
    try {
      const body = {
        startDate,
        endDate,
        format,
      };
      if (isAdmin && startStudentId && endStudentId) {
        body.startStudentId = startStudentId;
        body.endStudentId = endStudentId;
      }

      const token = localStorage.getItem("token"); // ✅ เพิ่ม token
      const response = await axios.post("/api/reports/export", body, {
        responseType: "blob",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const blob = new Blob([response.data], {
        type:
          format === "pdf"
            ? "application/pdf"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `timesheet_${startDate}_${endDate}.${format === "pdf" ? "pdf" : "xlsx"}`;
      link.click();
    } catch (err) {
      Swal.fire("ผิดพลาด", "ส่งออกไฟล์ไม่สำเร็จ", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <Box p={3} maxWidth={700} mx="auto">
        <Typography variant="h5" mb={3} fontWeight={600}>
          ส่งออกรายงาน Timesheet
        </Typography>
        <Stack spacing={2}>
          <TextField
            label="วันที่เริ่มต้น"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="วันที่สิ้นสุด"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />

          {isAdmin && (
            <>
              <TextField
                label="รหัสนักศึกษา เริ่มต้น"
                value={startStudentId}
                onChange={(e) => setStartStudentId(e.target.value)}
              />
              <TextField
                label="รหัสนักศึกษา สิ้นสุด"
                value={endStudentId}
                onChange={(e) => setEndStudentId(e.target.value)}
              />
            </>
          )}

          <FormControl>
            <InputLabel shrink>เลือกรูปแบบ</InputLabel>
            <Select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              displayEmpty
            >
              <MenuItem value="pdf">PDF</MenuItem>
              <MenuItem value="excel">Excel</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            onClick={fetchPreview}
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={20} />
            ) : (
              "ดูตัวอย่างข้อมูล"
            )}
          </Button>

          <Box
            maxHeight={250}
            overflow="auto"
            border="1px solid #ccc"
            p={2}
            borderRadius={2}
            bgcolor="#f9f9f9"
          >
            {previewData.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                ไม่มีข้อมูลแสดง
              </Typography>
            ) : (
              previewData.map((item, index) => (
                <Typography key={index} fontSize={14}>
                  📅 {item.date.slice(0, 10)} | 🎓 {item.studentId} | 🕒 {item.hours} ชม. | 📝 {item.activity}
                </Typography>
              ))
            )}
          </Box>

          <Button
            variant="contained"
            color="primary"
            onClick={handleExport}
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "ส่งออกไฟล์"
            )}
          </Button>
        </Stack>
      </Box>
    </>
  );
}

export default ReportExport;
