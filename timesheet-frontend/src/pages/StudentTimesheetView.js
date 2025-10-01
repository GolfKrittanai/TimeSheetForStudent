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
  useTheme,
  useMediaQuery,
  styled,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  Pagination,
  TablePagination,
} from "@mui/material";

import { getStudentTimesheetById } from "../services/adminService";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";
import { formatInTimeZone } from "date-fns-tz";
import { format } from "date-fns";
import { th } from "date-fns/locale";

// Styled components (คงเดิม)
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

// Styled TextField สำหรับ Filter (คงเดิม)
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

// ฟังก์ชันคำนวณชั่วโมงทำงาน (คงเดิม)
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
  const totalHours = diffMs / (1000 * 60 * 60);
  return Math.floor(totalHours);
};

function StudentTimesheetView() {
  const { id } = useParams();
  const { token } = useAuth();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [studentInfo, setStudentInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState(null);

  // ✅ ดึงข้อมูลโดยใช้คีย์ที่ถูกต้อง (companyName, fullName, studentId)
  const companyName = studentInfo?.companyName || "ไม่ระบุ";
  const fullName = studentInfo?.fullName || "กำลังโหลด...";
  const studentId = studentInfo?.studentId || "กำลังโหลด...";

  const fetchTimesheet = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getStudentTimesheetById(id, token);

      // ✅ ดึง student info จากคีย์ 'student' ใน res.data
      setStudentInfo(res.data.student || null);

      const sortedTimesheets =
        res.data.timesheets.sort(
          // ดึง timesheets จากคีย์ 'timesheets'
          (a, b) => new Date(b.date) - new Date(a.date)
        ) || [];

      setData(sortedTimesheets);
      setFilteredData(sortedTimesheets);
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

  // ฟังก์ชันจัดการ Filter (คงเดิม)
  const handleFilter = () => {
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    if (start && end && start > end) {
      Swal.fire("ผิดพลาด", "วันที่เริ่มต้นต้องมาก่อนวันที่สิ้นสุด", "warning");
      return;
    }

    const newFiltered = data.filter((t) => {
      const timeSheetDate = new Date(t.date.slice(0, 10));
      const matchStart = start ? timeSheetDate >= start : true;
      const matchEnd = end ? timeSheetDate <= end : true;
      return matchStart && matchEnd;
    });
    setFilteredData(newFiltered);
    setPage(0);
  };

  // ฟังก์ชันล้างค่า Filter (คงเดิม)
  const handleResetFilter = () => {
    setStartDate("");
    setEndDate("");
    setFilteredData(data);
    setPage(0);
  };

  // ฟังก์ชันเปิด Popup กิจกรรม (คงเดิม)
  const handleViewOpen = (timesheet) => {
    setViewData(timesheet);
    setViewOpen(true);
  };

  // ฟังก์ชันปิด Popup กิจกรรม (คงเดิม)
  const handleViewClose = () => {
    setViewOpen(false);
    setViewData(null);
  };

  // ฟังก์ชันจัดการการเปลี่ยนหน้า/rows per page (คงเดิม)
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // คำนวณข้อมูลที่แสดงผลในหน้าปัจจุบัน (คงเดิม)
  const visibleTimeSheets = filteredData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box sx={{ display: "flex" }}>
      <Sidebar />
      <Box
        sx={{
          flexGrow: 1,
          p: isSmallScreen ? 2 : 4,
          mt: isSmallScreen ? 5 : 0,
          minHeight: "90vh",
          backgroundColor: "#f5f7fa",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          fontFamily: '"Kanit", sans-serif',
        }}
      >
        <Box sx={{ flexGrow: 1, width: "100%" }}>
          {/* ส่วนหัวข้อใหม่ (ใช้ข้อมูลจาก studentInfo) */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              mb: 1,
            }}
          >
            <Typography
              variant={isSmallScreen ? "h6" : "h5"}
              sx={{
                fontWeight: "bold",
                mt: 2,
                mr: 1, // มีระยะห่างเล็กน้อย
                color: "#00796b",
                textAlign: "center",
              }}
            >
              Timesheet Details
            </Typography>
            <Box
              sx={{
                bgcolor: "#e0f2f1", // สีพื้นหลังอ่อนๆ
                color: "#00796b", // สีตัวอักษร
                fontWeight: "bold",
                borderRadius: 6,
                mt: 2,
                px: 1.5, // padding ซ้ายขวา
                py: 0.5, // padding บนล่าง
                fontSize: isSmallScreen ? 14 : 18, // ขนาดตัวอักษร
                display: "inline-flex", // เพื่อให้ Box จัดเรียงแบบ inline กับ Typography
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              STUDENT
            </Box>
          </Box>
          {/* ✅ ปรับสไตล์ของสถานประกอบการและชื่อนักศึกษา */}
          <Typography
            variant={isSmallScreen ? "subtitle2" : "subtitle1"}
            sx={{ color: "#757575", textAlign: "center", mb: 0, fontSize: 26 }} // ปรับสี
          >
            สถานประกอบการ : {companyName}{" "}
            {/* ใช้ companyNameToDisplay */}
          </Typography>
          <Typography
            variant={isSmallScreen ? "subtitle2" : "subtitle1"}
            sx={{ color: "#757575", textAlign: "center", mb: 3, fontSize: 18 }} // ปรับสี
          >
            {fullName} (รหัส {studentId})
          </Typography>
          {/* สิ้นสุดส่วนหัวข้อใหม่ */}

          {/* ส่วน Filter Section (คงเดิม) */}
          <Paper
            elevation={2}
            sx={{
              width: "100%",
              borderRadius: 2,
              p: 2,
              mb: 3,
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
                flexDirection: "row",
                gap: 1,
                mt: isSmallScreen ? 1 : 0,
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
          {/* สิ้นสุดส่วน Filter Section */}

          {loading ? (
            <Box sx={{ textAlign: "center", mt: 4 }}>
              <CircularProgress size={48} color="success" />
            </Box>
          ) : filteredData.length === 0 ? (
            <Typography align="center" color="text.secondary" sx={{ mt: 4 }}>
              {!startDate && !endDate && data.length === 0
                ? "ยังไม่มีข้อมูล TimeSheet"
                : "ไม่พบข้อมูล TimeSheet ในช่วงวันที่ที่เลือก"}
            </Typography>
          ) : (
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
              <Table sx={{ minWidth: isSmallScreen ? 550 : 650 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#00796b" }}>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        color: "#ffffff",
                        fontSize: isSmallScreen ? 12 : 14,
                        minWidth: 50,
                        textAlign: "center",
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
                        textAlign: "center",
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
                        textAlign: "center",
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
                        textAlign: "center",
                      }}
                    >
                      เวลาออก
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        color: "#ffffff",
                        fontSize: isSmallScreen ? 12 : 14,
                        width: "auto",
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
                        textAlign: "center",
                      }}
                    >
                      ชั่วโมงการทำงาน
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visibleTimeSheets.map((t, index) => {
                    // ดึงเฉพาะ HH:mm สำหรับการคำนวณชั่วโมง
                    const checkInTimeForCalc = t.checkInTime
                      ? t.checkInTime.slice(11, 16)
                      : null;
                    const checkOutTimeForCalc = t.checkOutTime
                      ? t.checkOutTime.slice(11, 16)
                      : null;

                    // ใช้ formatInTimeZone สำหรับแสดงผล HH:mm
                    const checkInTimeOnly = t.checkInTime
                      ? formatInTimeZone(t.checkInTime, "Asia/Bangkok", "HH:mm")
                      : null;
                    const checkOutTimeOnly = t.checkOutTime
                      ? formatInTimeZone(
                          t.checkOutTime,
                          "Asia/Bangkok",
                          "HH:mm"
                        )
                      : null;

                    const workingHours = calculateWorkingHours(
                      checkInTimeForCalc,
                      checkOutTimeForCalc
                    );
                    const isApproved = t.status === "Approved";

                    return (
                      <TableRow
                        key={t._id || t.id}
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
                          {page * rowsPerPage + index + 1}
                        </TableCell>
                        <TableCell
                          sx={{
                            fontSize: isSmallScreen ? 12 : 14,
                            whiteSpace: "nowrap",
                            textAlign: "center",
                          }}
                        >
                          {format(new Date(t.date), "dd MMM yyyy", {
                            locale: th,
                          })}
                        </TableCell>
                        <GreenTableCell
                          sx={{
                            fontSize: isSmallScreen ? 12 : 14,
                            whiteSpace: "nowrap",
                            textAlign: "center",
                          }}
                        >
                          {checkInTimeOnly || "-"}
                        </GreenTableCell>
                        <RedTableCell
                          sx={{
                            fontSize: isSmallScreen ? 12 : 14,
                            whiteSpace: "nowrap",
                            textAlign: "center",
                          }}
                        >
                          {checkOutTimeOnly || "-"}
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
                            color: isApproved ? "#00796b" : "text.primary",
                          }}
                        >
                          {workingHours}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {/* ส่วน Pagination (คงเดิม) */}
              {filteredData.length > 0 && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    py: 1,
                    px: 2,
                    fontFamily: '"Kanit", sans-serif',
                  }}
                >
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={filteredData.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage=""
                    labelDisplayedRows={() => ""}
                    sx={{
                      width: "auto",
                      overflow: "hidden",
                      "& .MuiTablePagination-toolbar": {
                        padding: 0,
                        minHeight: "auto",
                        "& .MuiTablePagination-actions": {
                          display: "none",
                        },
                        "& .MuiTablePagination-spacer": {
                          display: "none",
                        },
                        "& .MuiTablePagination-displayedRows": {
                          display: "none",
                        },
                        "& .MuiTablePagination-selectRoot": {
                          margin: 0,
                          "& .MuiTablePagination-select": {
                            fontFamily: '"Kanit", sans-serif',
                            fontSize: 14,
                            fontWeight: 500,
                          },
                        },
                      },
                    }}
                  />
                  <Pagination
                    count={Math.ceil(filteredData.length / rowsPerPage)}
                    page={page + 1}
                    onChange={(event, value) =>
                      handleChangePage(event, value - 1)
                    }
                    variant="outlined"
                    shape="rounded"
                    sx={{
                      "& .MuiPaginationItem-root": {
                        fontFamily: '"Kanit", sans-serif',
                        fontWeight: 500,
                        borderRadius: "50%",
                      },
                      "& .MuiPaginationItem-root.Mui-selected": {
                        backgroundColor: "#00796b",
                        color: "white",
                        fontWeight: 700,
                        borderRadius: "50%",
                        "&:hover": {
                          backgroundColor: "#024f46",
                          color: "white",
                        },
                      },
                    }}
                  />
                </Box>
              )}
            </Paper>
          )}
        </Box>
      </Box>

      {/* Popup (Dialog) สำหรับแสดงรายละเอียดกิจกรรม (คงเดิม) */}
      <Dialog open={viewOpen} onClose={handleViewClose} maxWidth="sm" fullWidth>
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
    </Box>
  );
}

export default StudentTimesheetView;
