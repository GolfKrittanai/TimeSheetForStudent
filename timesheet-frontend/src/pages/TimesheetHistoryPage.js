import React, { useEffect, useState } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { format } from "date-fns";
import { th } from "date-fns/locale";
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
  TablePagination,
  Pagination,
} from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
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
    fontFamily: '"Kanit", sans-serif',
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

const GreenTableCell = styled(TableCell)(({ theme }) => ({
  color: "#00796b",
  backgroundColor: "#fff",
  fontWeight: "bold",
  borderRight: "1px solid #fff",
}));

const RedTableCell = styled(TableCell)(({ theme }) => ({
  color: theme.palette.error.main,
  backgroundColor: "#fff",
  fontWeight: "bold",
  borderRight: "1px solid #fff",
}));

function TimesheetHistoryPage() {
  const { token, user } = useAuth();
  const [timeSheets, setTimeSheets] = useState([]);
  const [filteredTimeSheets, setFilteredTimeSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [editErrors, setEditErrors] = useState({});

  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState(null);

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getMyTimeSheets(token);
      setTimeSheets(res.data);
      setFilteredTimeSheets(res.data);
    } catch {
      Swal.fire("ผิดพลาด", "ไม่สามารถโหลด Timesheet ได้", "error");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFilter = () => {
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    if (start && end && start > end) {
      Swal.fire("ผิดพลาด", "วันที่เริ่มต้นต้องมาก่อนวันที่สิ้นสุด", "warning");
      return;
    }

    const newFiltered = timeSheets.filter((t) => {
      const timeSheetDate = new Date(t.date.slice(0, 10));
      const matchStart = start ? timeSheetDate >= start : true;
      const matchEnd = end ? timeSheetDate <= end : true;
      return matchStart && matchEnd;
    });
    setFilteredTimeSheets(newFiltered);
  };

  const handleResetFilter = () => {
    setStartDate("");
    setEndDate("");
    setFilteredTimeSheets(timeSheets);
  };

  const calculateWorkingHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;

    const [inHour, inMinute] = checkIn.split(":").map(Number);
    const [outHour, outMinute] = checkOut.split(":").map(Number);

    const inDate = new Date();
    inDate.setHours(inHour, inMinute, 0);

    const outDate = new Date();
    outDate.setHours(outHour, outMinute, 0);

    if (outDate < inDate) {
      outDate.setDate(outDate.getDate() + 1);
    }

    const diffMs = outDate.getTime() - inDate.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60));
  };

  const handleViewOpen = (timesheet) => {
    setViewData(timesheet);
    setViewOpen(true);
  };

  const handleViewClose = () => {
    setViewOpen(false);
    setViewData(null);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // รีเซ็ตกลับไปหน้าแรกเมื่อเปลี่ยน rows per page
  };

  const visibleTimeSheets = filteredTimeSheets.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleEditOpen = (timesheet) => {
    const formattedCheckIn = timesheet.checkInTime.slice(11, 16);
    const formattedCheckOut = timesheet.checkOutTime.slice(11, 16);
    setEditData({
      id: timesheet.id,
      date: timesheet.date.slice(0, 10),
      checkInTime: formattedCheckIn,
      checkOutTime: formattedCheckOut,
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
        setFilteredTimeSheets((prev) => prev.filter((t) => t.id !== id));
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
    <Box sx={{ display: "flex" }}>
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
          variant={isSmallScreen ? "h5" : "h4"}
          sx={{
            fontWeight: "700",
            color: "#00796b",
            mt: 3,
            mb: 3,
            textAlign: "center",
            letterSpacing: 1,
            fontFamily: '"Kanit", sans-serif',
          }}
        >
          Timesheet History
        </Typography>

        {/* Filter Section */}
        <Paper
          elevation={2}
          sx={{
            width: "100%",
            borderRadius: 2,
            p: 2,
            mb: 2,
            display: "flex",
            flexDirection: isSmallScreen ? "column" : "row",
            justifyContent: isSmallScreen ? "flex-start" : "space-between",
            gap: 2,
            alignItems: "center",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: isSmallScreen ? "column" : "row",
              gap: 2,
              width: isSmallScreen ? "100%" : "auto",
            }}
          >
            <StyledTextField
              label="วันที่เริ่มต้น"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              sx={{ flex: 1, minWidth: 50 }}
            />
            <StyledTextField
              label="วันที่สิ้นสุด"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              sx={{ flex: 1, minWidth: 50 }}
            />
          </Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row", // ปุ่มจะอยู่ข้างกันเสมอ
              gap: 1, // ช่องว่างระหว่างปุ่ม
              mt: isSmallScreen ? 1 : 0, // เว้นระยะด้านบนถ้าเป็นจอเล็ก
            }}
          >
            <Button
              variant="contained"
              onClick={handleFilter}
              sx={{
                height: 40,
                width: 150,
                textTransform: "none",
                borderRadius: 2,
                backgroundColor: "#00796b",
                "&:hover": { backgroundColor: "#024f46" },
              }}
            >
              ค้นหา
            </Button>
            <Button
              variant="outlined"
              onClick={handleResetFilter}
              sx={{
                height: 40,
                width: 150,
                textTransform: "none",
                color: "#00796b",
                borderRadius: 2,
                borderColor: "#00796b",
                "&:hover": {
                  borderColor: "#024f46",
                  backgroundColor: "#f0f7f6",
                },
              }}
            >
              ล้างค่า
            </Button>
          </Box>
        </Paper>

        <Paper
          elevation={4}
          sx={{
            width: "100%",
            borderRadius: 3,
            p: isSmallScreen ? 1 : 2,
            backgroundColor: "#fff",
            boxShadow: "0 8px 24px rgba(0,102,204,0.15)",
            overflowX: "auto",
            fontFamily: '"Kanit", sans-serif',
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
          ) : filteredTimeSheets.length === 0 ? (
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
                      minWidth: 50,
                      textAlign: "center", // จัดกึ่งกลาง
                    }}
                  >
                    ลำดับ
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      color: "#ffffff",
                      fontSize: isSmallScreen ? 12 : 14,
                      whiteSpace: "nowrap",
                      textAlign: "center", // จัดกึ่งกลาง
                    }}
                  >
                    วันที่
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      color: "#ffffff",
                      fontSize: isSmallScreen ? 12 : 14,
                      whiteSpace: "nowrap",
                      textAlign: "center", // จัดกึ่งกลาง
                    }}
                  >
                    เวลาเข้า
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      color: "#ffffff",
                      fontSize: isSmallScreen ? 12 : 14,
                      whiteSpace: "nowrap",
                      textAlign: "center", // จัดกึ่งกลาง
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
                    }}
                  >
                    กิจกรรม
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      color: "#ffffff",
                      fontSize: isSmallScreen ? 12 : 14,
                      whiteSpace: "nowrap",
                      textAlign: "center", // จัดกึ่งกลาง
                    }}
                  >
                    ชั่วโมงการทำงาน
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      color: "#ffffff",
                      minWidth: 100,
                      fontSize: isSmallScreen ? 12 : 14,
                      textAlign: "center", // จัดกึ่งกลาง
                    }}
                  >
                    จัดการ
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {/* เปลี่ยนมาใช้ visibleTimeSheets ที่ถูกแบ่งหน้าแล้ว */}
                {visibleTimeSheets.map((t, index) => (
                  <TableRow
                    key={t.id}
                    hover
                    onClick={() => handleViewOpen(t)}
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell
                      sx={{
                        fontSize: isSmallScreen ? 12 : 14,
                        textAlign: "center",
                      }}
                    >
                      {/* แก้ไขการแสดงลำดับที่: (หน้าปัจจุบัน * รายการต่อหน้า) + index + 1 */}
                      {page * rowsPerPage + index + 1}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontSize: isSmallScreen ? 12 : 14,
                        whiteSpace: "nowrap",
                        textAlign: "center",
                      }}
                    >
                      {format(new Date(t.date), "dd MMM yyyy", { locale: th })}
                    </TableCell>
                    <GreenTableCell
                      sx={{
                        fontSize: isSmallScreen ? 12 : 14,
                        whiteSpace: "nowrap",
                        textAlign: "center",
                      }}
                    >
                      {t.checkInTime.slice(11, 16)}
                    </GreenTableCell>
                    <RedTableCell
                      sx={{
                        fontSize: isSmallScreen ? 12 : 14,
                        whiteSpace: "nowrap",
                        textAlign: "center",
                      }}
                    >
                      {t.checkOutTime.slice(11, 16)}
                    </RedTableCell>
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
                    <TableCell
                      sx={{
                        fontSize: isSmallScreen ? 12 : 14,
                        fontWeight: "bold",
                        textAlign: "center",
                      }}
                    >
                      {calculateWorkingHours(
                        t.checkInTime.slice(11, 16),
                        t.checkOutTime.slice(11, 16)
                      )}
                    </TableCell>
                    <TableCell sx={{ textAlign: "center" }}>
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
          {filteredTimeSheets.length > 0 && (
            // ✅ ใช้ Box เป็นตัวจัดการ Pagination แทน TablePagination
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between", // แยกซ้าย (Status) และขวา (Pagination)
                alignItems: "center",
                py: 1, // Padding แนวตั้ง
                px: 2, // Padding แนวนอน
                fontFamily: '"Kanit", sans-serif',
                // Note: เราจะใช้ rowsPerPage ที่ตั้งค่าไว้ก่อนหน้า (สมมติว่าเป็น 10)
              }}
            >
              {/* 1. ส่วนซ้าย: ข้อความสถานะ "1-10 จาก 11" */}
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={filteredTimeSheets.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage} // 💡 ต้องมีตัวนี้ด้วย
                labelRowsPerPage="" // ✅ ซ่อน Label "รายการต่อหน้า:"
                labelDisplayedRows={() => ""} // ✅ ซ่อนข้อความสถานะ "1-10 จาก 11"
                sx={{
                  // กำหนดความกว้างให้พอดีกับเนื้อหา
                  width: "auto",
                  overflow: "hidden", // ซ่อนส่วนที่อาจจะล้นออกไป

                  "& .MuiTablePagination-toolbar": {
                    padding: 0,
                    minHeight: "auto", // ลดความสูงไม่ให้กินพื้นที่มากเกินไป

                    // ซ่อนส่วนประกอบที่ไม่ต้องการ
                    "& .MuiTablePagination-actions": {
                      display: "none", // ✅ ซ่อนปุ่มลูกศร (< >)
                    },
                    "& .MuiTablePagination-spacer": {
                      display: "none", // ✅ ซ่อน Spacer
                    },
                    "& .MuiTablePagination-displayedRows": {
                      display: "none", // ✅ ซ่อนข้อความสถานะ
                    },

                    // จัด Select ให้อยู่ชิดซ้าย
                    "& .MuiTablePagination-selectRoot": {
                      margin: 0,

                      // Style Select Dropdown
                      "& .MuiTablePagination-select": {
                        fontFamily: '"Kanit", sans-serif',
                        fontSize: 14,
                        fontWeight: 500,
                      },
                    },
                  },
                }}
              />
              {/* 2. ส่วนขวา: ปุ่มตัวเลข Pagination */}
              <Pagination
                count={Math.ceil(filteredTimeSheets.length / rowsPerPage)} // จำนวนหน้าทั้งหมด
                page={page + 1} // หน้าปัจจุบัน (ต้องเริ่มจาก 1 สำหรับ Pagination)
                onChange={(event, value) => handleChangePage(event, value - 1)} // ปรับค่ากลับเป็น Index 0
                variant="outlined"
                shape="rounded"
                sx={{
                  "& .MuiPaginationItem-root": {
                    fontFamily: '"Kanit", sans-serif',
                    fontWeight: 500,
                    borderRadius: "50%",
                  },
                  // ✅ เพิ่ม Style สำหรับปุ่มที่ถูกเลือก (Active Page)
                  "& .MuiPaginationItem-root.Mui-selected": {
                    backgroundColor: "#00796b", // สีพื้นหลัง: เขียว
                    color: "white", // สีตัวอักษร: ขาว
                    fontWeight: 700,
                    borderRadius: "50%",
                    // ทำให้สีไม่เปลี่ยนกลับเมื่อชี้เม้าส์
                    "&:hover": {
                      backgroundColor: "#024f46", // สีเข้มขึ้นเมื่อ hover (ตามสไตล์ที่คุณชอบ)
                      color: "white",
                    },
                  },
                }}
              />
            </Box>
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
          sx={{ "& .MuiDialog-paper": { borderRadius: 6, maxWidth: 500 } }}
        >
          <DialogTitle
            sx={{
              fontWeight: "bold",
              color: "#00796b",
              textAlign: "center",
              mt: 2,
              mb: 0,
            }}
          >
            แก้ไข TimeSheet
          </DialogTitle>
          <Box
            sx={{
              width: "80%",
              height: "2px",
              backgroundColor: "#00796b",
              mx: "auto",
              mt: 0,
              mb: 2,
            }}
          />
          <DialogContent>
            <Box
              component="form"
              noValidate
              autoComplete="off"
              onSubmit={handleEditSubmit}
              sx={{
                maxWidth: 450,
                mx: "auto",
                "& .MuiTextField-root": {
                  my: 1,
                },
              }}
            >
              <StyledTextField
                label="วันที่"
                name="date"
                type="date"
                value={editData?.date || ""}
                onChange={handleEditChange}
                disabled={true}
                error={Boolean(editErrors.date)}
                helperText={editErrors.date}
                fullWidth
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
              />
              <StyledTextField
                label="เวลาเข้า"
                name="checkInTime"
                type="time"
                fullWidth
                value={editData?.checkInTime || ""}
                onChange={handleEditChange}
                error={Boolean(editErrors.checkInTime)}
                helperText={editErrors.checkInTime}
                InputLabelProps={{ shrink: true }}
                inputProps={{ step: 300 }}
              />
              <StyledTextField
                label="เวลาออก"
                name="checkOutTime"
                type="time"
                fullWidth
                value={editData?.checkOutTime || ""}
                onChange={handleEditChange}
                error={Boolean(editErrors.checkOutTime)}
                helperText={editErrors.checkOutTime}
                InputLabelProps={{ shrink: true }}
                inputProps={{ step: 300 }}
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
