import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
  IconButton,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import {
  getStudentTimesheetById,
  updateStudentTimesheetById,
  deleteStudentTimesheetById,
} from "../services/adminService";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";

function StudentTimesheetView() {
  const { id } = useParams();
  const { token } = useAuth();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [data, setData] = useState([]);
  const [studentInfo, setStudentInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState({
    id: "",
    date: "",
    checkInTime: "",
    checkOutTime: "",
    activity: "",
  });
  const [saving, setSaving] = useState(false);

  const fetchTimesheet = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getStudentTimesheetById(id, token);
      setData(res.data.timesheets || []);
      setStudentInfo(res.data.student || null);
    } catch (err) {
      Swal.fire({
        title: "ผิดพลาด",
        text: "โหลดข้อมูล Timesheet ไม่สำเร็จ",
        icon: "error",
        confirmButtonColor: "#00796b",
      });
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    fetchTimesheet();
  }, [fetchTimesheet]);

  const handleEditOpen = (timesheet) => {
    setEditData({
      id: timesheet.id,
      date: timesheet.date.slice(0, 10),
      checkInTime: timesheet.checkInTime
        ? timesheet.checkInTime.slice(11, 16)
        : "",
      checkOutTime: timesheet.checkOutTime
        ? timesheet.checkOutTime.slice(11, 16)
        : "",
      activity: timesheet.activity,
    });
    setEditOpen(true);
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setSaving(false);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSave = async () => {
    const checkIn = new Date(`${editData.date}T${editData.checkInTime}:00`);
    const checkOut = new Date(`${editData.date}T${editData.checkOutTime}:00`);

    if (checkOut <= checkIn) {
      Swal.fire({
        title: "ผิดพลาด",
        text: "เวลาออกต้องมากกว่าเวลาเข้า",
        icon: "error",
        confirmButtonColor: "#00796b",
      });
      return;
    }

    setSaving(true);
    try {
      await updateStudentTimesheetById(
        editData.id,
        {
          date: editData.date,
          checkInTime: checkIn.toISOString(),
          checkOutTime: checkOut.toISOString(),
          activity: editData.activity,
        },
        token
      );
      Swal.fire({
        title: "สำเร็จ",
        text: "แก้ไข Timesheet เรียบร้อยแล้ว",
        icon: "success",
        confirmButtonColor: "#00796b",
      });
      setEditOpen(false);
      fetchTimesheet();
    } catch {
      Swal.fire({
        title: "ผิดพลาด",
        text: "ไม่สามารถแก้ไข Timesheet ได้",
        icon: "error",
        confirmButtonColor: "#00796b",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (timesheetId) => {
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
        await deleteStudentTimesheetById(timesheetId, token);
        setData((prev) => prev.filter((t) => t.id !== timesheetId));
        Swal.fire({
          title: "ลบสำเร็จ",
          text: "TimeSheet ได้ถูกลบแล้ว",
          icon: "success",
          confirmButtonColor: "#00796b",
        });
      } catch {
        Swal.fire({
          title: "ผิดพลาด",
          text: "ไม่สามารถลบ TimeSheet ได้",
          icon: "error",
          confirmButtonColor: "#00796b",
        });
      }
    }
  };

  return (
    <>
      <Navbar />
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: "#f4f6f8",
          display: "flex",
          justifyContent: "center",
          alignItems: "start",
          px: isSmallScreen ? 1 : 2,
          py: 4,
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 1000 }}>
          <Typography
            variant={isSmallScreen ? "h6" : "h5"}
            sx={{
              fontWeight: "bold",
              mb: 2,
              color: "#00796b",
              textAlign: "center",
            }}
          >
            ข้อมูล TimeSheet ของนักศึกษา
          </Typography>

          {studentInfo && (
            <Typography
              variant={isSmallScreen ? "subtitle1" : "h6"}
              sx={{ color: "#555", textAlign: "center", mb: 3 }}
            >
              {studentInfo.fullName} (รหัส {studentInfo.studentId})
            </Typography>
          )}

          {loading ? (
            <Box sx={{ textAlign: "center", mt: 4 }}>
              <CircularProgress size={48} />
            </Box>
          ) : data.length === 0 ? (
            <Typography align="center" color="text.secondary" sx={{ mt: 4 }}>
              ยังไม่มีข้อมูล TimeSheet
            </Typography>
          ) : (
            <Paper
              elevation={1}
              sx={{
                overflowX: "auto",
                overflowY: "auto",
                maxHeight: 500,
                borderRadius: 2,
                border: "1px solid #e0e0e0",
                backgroundColor: "#fff",
                scrollbarWidth: "thin",
                "&::-webkit-scrollbar": {
                  height: 8,
                  backgroundColor: "#f5f5f5",
                },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "#0066cc",
                  borderRadius: 4,
                },
              }}
            >
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#00796b" }}>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        minWidth: 120,
                        color: "#ffffff",
                      }}
                    >
                      วันที่
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        minWidth: 100,
                        color: "#ffffff",
                      }}
                    >
                      เวลาเข้า
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        minWidth: 100,
                        color: "#ffffff",
                      }}
                    >
                      เวลาออก
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        minWidth: 300,
                        color: "#ffffff",
                      }}
                    >
                      กิจกรรม
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        minWidth: 110,
                        color: "#ffffff",
                      }}
                    >
                      จัดการ
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.map((t) => (
                    <TableRow key={t.id} hover>
                      <TableCell>
                        {new Date(t.date).toLocaleDateString("th-TH", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        {t.checkInTime
                          ? new Date(
                              new Date(t.checkInTime).getTime() -
                                7 * 60 * 60 * 1000
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {t.checkOutTime
                          ? new Date(
                              new Date(t.checkOutTime).getTime() -
                                7 * 60 * 60 * 1000
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </TableCell>
                      <TableCell
                        sx={{
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                          maxWidth: 300,
                          fontSize: isSmallScreen ? 12 : 14,
                        }}
                      >
                        {t.activity}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="แก้ไข">
                          <IconButton
                            sx={{ color: "#00796b" }}
                            size={isSmallScreen ? "small" : "medium"}
                            onClick={() => handleEditOpen(t)}
                          >
                            <EditIcon
                              fontSize={isSmallScreen ? "small" : "medium"}
                            />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="ลบ">
                          <IconButton
                            color="error"
                            size={isSmallScreen ? "small" : "medium"}
                            onClick={() => handleDelete(t.id)}
                          >
                            <DeleteIcon
                              fontSize={isSmallScreen ? "small" : "medium"}
                            />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          )}

          {/* Dialog แก้ไข Timesheet */}
          <Dialog
            open={editOpen}
            onClose={handleEditClose}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>แก้ไข Timesheet</DialogTitle>
            <DialogContent>
              <TextField
                label="วันที่"
                name="date"
                type="date"
                fullWidth
                value={editData.date}
                onChange={handleEditChange}
                InputProps={{
                  sx: {
                    mt: 1,
                    mb: 2,
                    fontFamily: '"Kanit", sans-serif',
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
                    mt: 1,
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
                fullWidth
                value={editData.checkInTime}
                onChange={handleEditChange}
                InputProps={{
                  sx: {
                    mb: 2,
                    fontFamily: '"Kanit", sans-serif',
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
                label="เวลาออก"
                name="checkOutTime"
                type="time"
                fullWidth
                value={editData.checkOutTime}
                onChange={handleEditChange}
                InputProps={{
                  sx: {
                    mb: 2,
                    fontFamily: '"Kanit", sans-serif',
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
                label="กิจกรรม"
                name="activity"
                fullWidth
                multiline
                rows={3}
                value={editData.activity}
                onChange={handleEditChange}
                InputProps={{
                  sx: {
                    mb: 1,
                    fontFamily: '"Kanit", sans-serif',
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
            </DialogContent>
            <DialogActions>
              <Button
                onClick={handleEditClose}
                disabled={saving}
                color="success"
              >
                ยกเลิก
              </Button>
              <Button
                variant="contained"
                onClick={handleEditSave}
                disabled={saving}
                sx={{ textTransform: "none", backgroundColor: "#00796b" }}
              >
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Box>
    </>
  );
}

export default StudentTimesheetView;
