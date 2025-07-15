import React, { useEffect, useState } from "react";
import { formatInTimeZone } from "date-fns-tz";
import Navbar from "../components/Navbar";
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Paper,
  Tooltip,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccessTime as AccessTimeIcon,
} from "@mui/icons-material";

import {
  getMyTimeSheets,
  createTimeSheet,
  deleteTimeSheet,
  updateTimeSheet,
} from "../services/timesheetService";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";

function StudentDashboard() {
  // รวมวันที่ (YYYY-MM-DD) กับเวลา (HH:mm) ให้เป็น ISO string พร้อม timezone +07:00
  const combineDateTime = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return null;
    return `${dateStr}T${timeStr}:00+07:00`;
  };

  // เพิ่ม state สำหรับดูรายละเอียดกิจกรรม
  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState(null);

  const handleViewOpen = (timesheet) => {
    setViewData(timesheet);
    setViewOpen(true);
  };

  const handleViewClose = () => {
    setViewOpen(false);
    setViewData(null);
  };

  const { token, user } = useAuth();
  const [timeSheets, setTimeSheets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [loadingEdit, setLoadingEdit] = useState(false);

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getMyTimeSheets(token);
      console.log("TimeSheets from API:", res.data);
      setTimeSheets(res.data);
    } catch {
      Swal.fire("ผิดพลาด", "ไม่สามารถโหลด Timesheet ได้", "error");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "คุณแน่ใจหรือไม่?",
      text: "คุณต้องการลบ TimeSheet นี้ใช่หรือไม่",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ใช่, ลบเลย!",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#00796b",
    });

    if (result.isConfirmed) {
      try {
        await deleteTimeSheet(id, token);
        setTimeSheets((prev) => prev.filter((t) => t.id !== id));
        Swal.fire("ลบสำเร็จ", "TimeSheet ได้ถูกลบแล้ว", "success");
      } catch {
        Swal.fire("ผิดพลาด", "ไม่สามารถลบ TimeSheet ได้", "error");
      }
    }
  };

  const [formData, setFormData] = useState({
    date: "",
    checkInTime: "",
    checkOutTime: "",
    activity: "",
  });
  const [formErrors, setFormErrors] = useState({});

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

    try {
      const payload = {
        date: formData.date,
        checkInTime: formData.checkInTime,
        checkOutTime: formData.checkOutTime,
        activity: formData.activity,
      };

      await createTimeSheet(payload, token);
      await fetchData();
      setFormData({
        date: "",
        checkInTime: "",
        checkOutTime: "",
        activity: "",
      });
      Swal.fire("สำเร็จ", "เพิ่ม TimeSheet เรียบร้อยแล้ว", "success");
    } catch {
      Swal.fire("ผิดพลาด", "ไม่สามารถเพิ่ม TimeSheet ได้", "error");
    }
  };

  const handleEditOpen = (timesheet) => {
    setEditData({
      id: timesheet.id,
      date: timesheet.date.slice(0, 10),
      checkInTime: timesheet.checkInTime.slice(11, 16),
      checkOutTime: timesheet.checkOutTime.slice(11, 16),
      activity: timesheet.activity || "",
    });
    setEditOpen(true);
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setEditData(null);
    setEditErrors({});
  };

  const [editErrors, setEditErrors] = useState({});

  const validateEditForm = () => {
    const errors = {};
    if (!editData.date) errors.date = "กรุณาเลือกวันที่";
    if (!editData.checkInTime) errors.checkInTime = "กรุณากรอกเวลาเข้า";
    if (!editData.checkOutTime) errors.checkOutTime = "กรุณากรอกเวลาออก";
    if (!editData.activity) errors.activity = "กรุณากรอกกิจกรรม";
    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateEditForm()) return;

    setLoadingEdit(true);
    try {
      const payload = {
        date: editData.date,
        checkInTime: editData.checkInTime,
        checkOutTime: editData.checkOutTime,
        activity: editData.activity,
      };

      await updateTimeSheet(editData.id, payload, token);
      await fetchData();
      handleEditClose();
      Swal.fire("บันทึกสำเร็จ", "แก้ไข TimeSheet เรียบร้อยแล้ว", "success");
    } catch {
      Swal.fire("ผิดพลาด", "ไม่สามารถแก้ไข TimeSheet ได้", "error");
    }
    setLoadingEdit(false);
  };

  return (
    <>
      <Navbar />
      <Box
        sx={{
          minHeight: "90vh",
          backgroundColor: "#f5f7fa",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          pt: isSmallScreen ? 3 : 6,
          px: 2,
          pb: 6,
          maxWidth: 850,
          mx: "auto",
          fontFamily: '"Didonesque", sans-serif', // เพิ่มฟอนต์ที่ต้องการ
        }}
      >
        <Typography
          variant={isSmallScreen ? "h5" : "h4"}
          sx={{
            fontWeight: "700",
            color: "#00796b",
            mb: 4,
            textAlign: "center",
            letterSpacing: 1,
            fontFamily: '"Didonesque", sans-serif', // เพิ่มฟอนต์ที่ต้องการ
          }}
        >
          TimeSheet ของ {user?.fullName}
        </Typography>

        {/* ฟอร์มเพิ่ม Timesheet */}
        <Paper
          elevation={4}
          sx={{
            width: "100%",
            mb: 5,
            p: isSmallScreen ? 2 : 4,
            borderRadius: 3,
            backgroundColor: "#fff",
            boxShadow: "0 8px 24px rgba(0,102,204,0.15)",
            fontFamily: '"Didonesque", sans-serif', // เพิ่มฟอนต์ที่ต้องการ
          }}
        >
          <Typography
            variant="h6"
            sx={{ mb: 3, fontWeight: 600, color: "#737070" }}
          >
            เพิ่ม Timesheet ใหม่
          </Typography>
          <form onSubmit={handleSubmit} noValidate>
            <TextField
              label="วันที่"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleInputChange}
              error={Boolean(formErrors.date)}
              helperText={formErrors.date}
              InputProps={{
                sx: {
                  mb: 3,
                  mr: 2,
                  fontFamily: '"Didonesque", sans-serif',
                  borderRadius: 2,
                  bgcolor: "#fafafa",
                  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#ccc" },
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
              label="เวลาเข้า"
              name="checkInTime"
              type="time"
              value={formData.checkInTime}
              onChange={handleInputChange}
              error={Boolean(formErrors.checkInTime)}
              helperText={formErrors.checkInTime}
              InputProps={{
                sx: {
                  mb: 3,
                  mr: 2,
                  fontFamily: '"Didonesque", sans-serif',
                  borderRadius: 2,
                  bgcolor: "#fafafa",
                  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#ccc" },
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
              label="เวลาออก"
              name="checkOutTime"
              type="time"
              value={formData.checkOutTime}
              onChange={handleInputChange}
              error={Boolean(formErrors.checkOutTime)}
              helperText={formErrors.checkOutTime}
              InputProps={{
                sx: {
                  mb: 3,
                  fontFamily: '"Didonesque", sans-serif',
                  borderRadius: 2,
                  bgcolor: "#fafafa",
                  "& .MuiSelect-select": {
                    color: "#00796b", // สีตัวอักษร
                  },
                  "& .MuiSelect-icon": {
                    color: "#00796b", // เปลี่ยนสีของ arrow
                  },
                  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#ccc" },
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
              label="กิจกรรม"
              name="activity"
              fullWidth
              multiline
              rows={3}
              value={formData.activity}
              onChange={handleInputChange}
              error={Boolean(formErrors.activity)}
              helperText={formErrors.activity}
              InputProps={{
                sx: {
                  mb: 3,
                  fontFamily: '"Didonesque", sans-serif',
                  borderRadius: 2,
                  bgcolor: "#fafafa",
                  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#ccc" },
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
                    color: "#00796b", // สีเขียวเมื่อกรอบได้รับการโฟกัส
                  },
                },
              }}
            />
            <Button
              variant="contained"
              type="submit"
              fullWidth
              sx={{
                textTransform: "none",
                backgroundColor: "#00796b",
                "&:hover": {
                  backgroundColor: "#024f46",
                  boxShadow: "0 6px 20px rgba(0,74,153,0.3)",
                },
                py: 1.5,
                fontWeight: "700",
                fontSize: 16,
              }}
              startIcon={<AccessTimeIcon />}
            >
              บันทึก TimeSheet
            </Button>
          </form>
        </Paper>

        {/* ตาราง Timesheet */}
        <Paper
          elevation={4}
          sx={{
            width: "100%",
            borderRadius: 3,
            p: isSmallScreen ? 1 : 2,
            backgroundColor: "#fff",
            boxShadow: "0 8px 24px rgba(0,102,204,0.15)",
            overflowX: "auto",
            fontFamily: '"Didonesque", sans-serif', // เพิ่มฟอนต์ที่ต้องการ
          }}
        >
          {loading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: 200,
              }}
            >
              <CircularProgress size={48} color="success" />
            </Box>
          ) : timeSheets.length === 0 ? (
            <Typography
              sx={{ textAlign: "center", color: "text.disabled", py: 8 }}
              variant="subtitle1"
            >
              ยังไม่มี TimeSheet
            </Typography>
          ) : (
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <Typography
                  variant="h6"
                  sx={{ mb: 1, fontWeight: 600, color: "#737070" }}
                >
                  ประวัติ TimeSheet
                </Typography>
                <TableRow sx={{ bgcolor: "#00796b" }}>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      color: "#ffffff",
                      fontSize: isSmallScreen ? 12 : 14,
                    }}
                  >
                    วันที่
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      color: "#ffffff",
                      fontSize: isSmallScreen ? 12 : 14,
                    }}
                  >
                    เวลาเข้า
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      color: "#ffffff",
                      fontSize: isSmallScreen ? 12 : 14,
                    }}
                  >
                    เวลาออก
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      color: "#ffffff",
                      fontSize: isSmallScreen ? 12 : 14,
                      whiteSpace: "nowrap",
                      maxWidth: 200,
                    }}
                  >
                    กิจกรรม
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      color: "#ffffff",
                      minWidth: 100,
                      fontSize: isSmallScreen ? 12 : 14,
                    }}
                  >
                    จัดการ
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {timeSheets.map((t) => (
                  <TableRow
                    key={t.id}
                    hover
                    onClick={() => handleViewOpen(t)}
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell sx={{ fontSize: isSmallScreen ? 12 : 14 }}>
                      {new Date(t.date).toLocaleDateString("th-TH")}
                    </TableCell>
                    <TableCell sx={{ fontSize: isSmallScreen ? 12 : 14 }}>
                      {new Date(
                        new Date(t.checkInTime).getTime() - 7 * 60 * 60 * 1000
                      ).toLocaleTimeString("th-TH", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })}
                    </TableCell>
                    <TableCell sx={{ fontSize: isSmallScreen ? 12 : 14 }}>
                      {new Date(
                        new Date(t.checkOutTime).getTime() - 7 * 60 * 60 * 1000
                      ).toLocaleTimeString("th-TH", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })}
                    </TableCell>

                    <TableCell
                      sx={{
                        whiteSpace: "nowrap", // แสดงเป็นบรรทัดเดียว
                        overflow: "hidden", // ซ่อนข้อความที่เกิน
                        textOverflow: "ellipsis", // แสดง "..." แทนข้อความที่ถูกตัด
                        maxWidth: 200,
                        fontSize: isSmallScreen ? 12 : 14,
                      }}
                    >
                      {t.activity}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="แก้ไข">
                        <IconButton
                          sx={{ color: "#00796b" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditOpen(t);
                          }}
                          size={isSmallScreen ? "small" : "medium"}
                        >
                          <EditIcon fontSize={isSmallScreen ? "small" : "medium"} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="ลบ">
                        <IconButton
                          sx={{ color: "error.main" }}
                          onClick={async (e) => {
                            e.stopPropagation();
                            await handleDelete(t.id);
                          }}
                          size={isSmallScreen ? "small" : "medium"}
                        >
                          <DeleteIcon fontSize={isSmallScreen ? "small" : "medium"} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>

                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Paper>
        <Dialog
          open={viewOpen}
          onClose={handleViewClose}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: "bold", color: "#00796b" }}>
            รายละเอียดกิจกรรม
          </DialogTitle>
          <DialogContent dividers>
            <Typography variant="subtitle1" sx={{ whiteSpace: "pre-wrap" }}>
              {viewData?.activity || "ไม่มีข้อมูลกิจกรรม"}
            </Typography>
          </DialogContent>
          <Box sx={{ display: "flex", justifyContent: "flex-end", p: 2 }}>
            <Button
              onClick={handleViewClose}
              sx={{ textTransform: "none", color: "#00796b" }}
            >
              ปิด
            </Button>
          </Box>
        </Dialog>
        {/* Dialog แก้ไข Timesheet */}
        <Dialog
          open={editOpen}
          onClose={handleEditClose}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: "bold", color: "#00796b" }}>
            แก้ไข TimeSheet
          </DialogTitle>
          <DialogContent dividers>
            <Box
              component="form"
              noValidate
              autoComplete="off"
              onSubmit={handleEditSubmit}
              sx={{
                "& .MuiTextField-root": {
                  my: 1,
                },
              }}
            >
              <TextField
                label="วันที่"
                name="date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={editData?.date || ""}
                onChange={handleEditChange}
                error={Boolean(editErrors.date)}
                helperText={editErrors.date}
              />
              <TextField
                label="เวลาเข้า"
                name="checkInTime"
                type="time"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={editData?.checkInTime || ""}
                onChange={handleEditChange}
                error={Boolean(editErrors.checkInTime)}
                helperText={editErrors.checkInTime}
              />
              <TextField
                label="เวลาออก"
                name="checkOutTime"
                type="time"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={editData?.checkOutTime || ""}
                onChange={handleEditChange}
                error={Boolean(editErrors.checkOutTime)}
                helperText={editErrors.checkOutTime}
              />
              <TextField
                label="กิจกรรม"
                name="activity"
                fullWidth
                multiline
                rows={3}
                value={editData?.activity || ""}
                onChange={handleEditChange}
                error={Boolean(editErrors.activity)}
                helperText={editErrors.activity}
              />
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                <Button
                  onClick={handleEditClose}
                  color="success"
                  sx={{ mr: 2, textTransform: "none" }}
                  disabled={loadingEdit}
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  sx={{
                    textTransform: "none",
                    backgroundColor: "#00796b",
                    "&:hover": {
                      backgroundColor: "#024f46",
                      boxShadow: "0 6px 20px rgba(0,74,153,0.3)",
                    },
                  }}
                  disabled={loadingEdit}
                >
                  {loadingEdit ? "กำลังบันทึก..." : "บันทึก"}
                </Button>
              </Box>
            </Box>
          </DialogContent>
        </Dialog>
      </Box>
    </>
  );
}

export default StudentDashboard;
