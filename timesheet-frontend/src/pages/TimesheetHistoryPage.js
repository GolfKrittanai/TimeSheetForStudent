import React, { useEffect, useState } from "react";
import { formatInTimeZone } from "date-fns-tz";
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  Tooltip,
  IconButton,
  useMediaQuery,
  useTheme,
  Button,
  styled,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import {
  getMyTimeSheets,
  deleteTimeSheet,
  updateTimeSheet,
} from "../services/timesheetService";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";
import Sidebar from "../components/Sidebar";

const StyledTextField = styled(TextField)(({ theme }) => ({
    "& .MuiInputBase-root": {
      fontFamily: '"Didonesque", sans-serif',
      borderRadius: theme.spacing(2),
      backgroundColor: "#fafafa",
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
    "& .MuiInputLabel-root": {
      "&.Mui-focused": {
        color: "#00796b",
      },
    },
  }));

function TimesheetHistoryPage() {
  const { token, user } = useAuth();
  const [timeSheets, setTimeSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingEdit, setLoadingEdit] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [editErrors, setEditErrors] = useState({});

  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState(null);

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getMyTimeSheets(token);
      setTimeSheets(res.data);
    } catch {
      Swal.fire("ผิดพลาด", "ไม่สามารถโหลด Timesheet ได้", "error");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleViewOpen = (timesheet) => {
    setViewData(timesheet);
    setViewOpen(true);
  };

  const handleViewClose = () => {
    setViewOpen(false);
    setViewData(null);
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
      Swal.fire({
        title: "บันทึกสำเร็จ",
        text: "แก้ไข TimeSheet เรียบร้อยแล้ว",
        icon: "success",
        confirmButtonColor: "#00796b",
      });
    } catch {
      Swal.fire({
        title: "ผิดพลาด",
        text: "ไม่สามารถแก้ไข TimeSheet ได้",
        icon: "error",
        confirmButtonColor: "#00796b",
      });
    } finally {
      setLoadingEdit(false);
    }
  };

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
        Swal.fire({
          title: "ลบสำเร็จ",
          text: "TimeSheet ได้ถูกลบแล้ว",
          icon: "success",
          confirmButtonColor: "#00796b",
        });
      } catch {
        Swal.fire({
          title: "ผิดพลาด",
          text: "ไม่สามารถลบ Timesheet ได้",
          icon: "error",
          confirmButtonColor: "#00796b",
        });
      }
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
          minHeight: "90vh",
          backgroundColor: "#f5f7fa",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          fontFamily: '"Didonesque", sans-serif',
        }}
      >
        <Typography
          variant={isSmallScreen ? "h5" : "h4"}
          sx={{
            fontWeight: "700",
            color: "#00796b",
            mt: 4,
            mb: 4,
            textAlign: "center",
            letterSpacing: 1,
            fontFamily: '"Didonesque", sans-serif',
          }}
        >
          Timesheet History
        </Typography>

        <Paper
          elevation={4}
          sx={{
            width: "100%",
            borderRadius: 3,
            p: isSmallScreen ? 1 : 2,
            backgroundColor: "#fff",
            boxShadow: "0 8px 24px rgba(0,102,204,0.15)",
            overflowX: "auto",
            fontFamily: '"Didonesque", sans-serif',
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
                      {formatInTimeZone(
                        t.checkInTime,
                        "Asia/Bangkok",
                        "HH:mm"
                      )}
                    </TableCell>
                    <TableCell sx={{ fontSize: isSmallScreen ? 12 : 14 }}>
                      {formatInTimeZone(
                        t.checkOutTime,
                        "Asia/Bangkok",
                        "HH:mm"
                      )}
                    </TableCell>
                    <TableCell
                      sx={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
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
                          <EditIcon
                            fontSize={isSmallScreen ? "small" : "medium"}
                          />
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
              <StyledTextField
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
              <StyledTextField
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
              <StyledTextField
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
              <StyledTextField
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
    </Box>
  );
}

export default TimesheetHistoryPage;