import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
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
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { getStudentTimesheetById, updateStudentTimesheetById, deleteStudentTimesheetById } from '../services/adminService';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';

function StudentTimesheetView() {
  const { id } = useParams();
  const { token } = useAuth();

  const [data, setData] = useState([]);
  const [studentInfo, setStudentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState({
    id: '',
    date: '',
    checkInTime: '',
    checkOutTime: '',
    activity: '',
  });

  const fetchTimesheet = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getStudentTimesheetById(id, token);
      setData(res.data.timesheets || []);
      setStudentInfo(res.data.student || null);
    } catch (err) {
      Swal.fire('ผิดพลาด', 'โหลดข้อมูล Timesheet ไม่สำเร็จ', 'error');
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
      checkInTime: timesheet.checkInTime.slice(11, 16),
      checkOutTime: timesheet.checkOutTime.slice(11, 16),
      activity: timesheet.activity,
    });
    setEditOpen(true);
  };

  const handleEditClose = () => {
    setEditOpen(false);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSave = async () => {
    try {
      const checkIn = new Date(`${editData.date}T${editData.checkInTime}:00`);
      const checkOut = new Date(`${editData.date}T${editData.checkOutTime}:00`);
      await updateStudentTimesheetById(editData.id, {
        date: editData.date,
        checkInTime: checkIn.toISOString(),
        checkOutTime: checkOut.toISOString(),
        activity: editData.activity,
      }, token);

      Swal.fire('สำเร็จ', 'แก้ไข Timesheet เรียบร้อยแล้ว', 'success');
      setEditOpen(false);
      fetchTimesheet();
    } catch {
      Swal.fire('ผิดพลาด', 'ไม่สามารถแก้ไข Timesheet ได้', 'error');
    }
  };

  const handleDelete = async (timesheetId) => {
    const result = await Swal.fire({
      title: 'คุณแน่ใจหรือไม่?',
      text: 'คุณต้องการลบ TimeSheet นี้ใช่หรือไม่',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ใช่, ลบเลย!',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
    });

    if (result.isConfirmed) {
      try {
        await deleteStudentTimesheetById(timesheetId, token);
        setData((prev) => prev.filter((t) => t.id !== timesheetId));
        Swal.fire('ลบสำเร็จ', 'TimeSheet ได้ถูกลบแล้ว', 'success');
      } catch {
        Swal.fire('ผิดพลาด', 'ไม่สามารถลบ Timesheet ได้', 'error');
      }
    }
  };

  return (
    <>
      <Navbar />
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f4f6f8', display: 'flex', justifyContent: 'center', alignItems: 'start', px: 2, py: 4 }}>
        <Box sx={{ width: '100%', maxWidth: 1000 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: '#333', textAlign: 'center' }}>
            ข้อมูล TimeSheet ของนักศึกษา
          </Typography>

          {studentInfo && (
            <Typography variant="h6" sx={{ color: '#555', textAlign: 'center', mb: 3 }}>
              {studentInfo.fullName} (รหัส {studentInfo.studentId})
            </Typography>
          )}

          {loading ? (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <CircularProgress size={48} />
            </Box>
          ) : data.length === 0 ? (
            <Typography align="center" color="text.secondary" sx={{ mt: 4 }}>
              ยังไม่มีข้อมูล TimeSheet
            </Typography>
          ) : (
            <Paper elevation={1} sx={{ overflowX: 'auto', borderRadius: 2, border: '1px solid #e0e0e0', backgroundColor: '#fff' }}>
              <Table>
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>วันที่</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>เวลาเข้า</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>เวลาออก</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>กิจกรรม</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', minWidth: 100 }}>จัดการ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.map((t) => (
                    <TableRow key={t.id} hover>
                      <TableCell>{new Date(t.date).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(t.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</TableCell>
                      <TableCell>{new Date(t.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</TableCell>
                      <TableCell sx={{ whiteSpace: 'pre-line' }}>{t.activity}</TableCell>
                      <TableCell>
                        <Tooltip title="แก้ไข">
                          <IconButton color="primary" size="small" onClick={() => handleEditOpen(t)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="ลบ">
                          <IconButton color="error" size="small" onClick={() => handleDelete(t.id)}>
                            <DeleteIcon />
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
          <Dialog open={editOpen} onClose={handleEditClose} maxWidth="sm" fullWidth>
            <DialogTitle>แก้ไข Timesheet</DialogTitle>
            <DialogContent>
              <TextField label="วันที่" name="date" type="date" fullWidth value={editData.date} onChange={handleEditChange} sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} />
              <TextField label="เวลาเข้า" name="checkInTime" type="time" fullWidth value={editData.checkInTime} onChange={handleEditChange} sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} />
              <TextField label="เวลาออก" name="checkOutTime" type="time" fullWidth value={editData.checkOutTime} onChange={handleEditChange} sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} />
              <TextField label="กิจกรรม" name="activity" fullWidth multiline rows={3} value={editData.activity} onChange={handleEditChange} />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleEditClose}>ยกเลิก</Button>
              <Button variant="contained" onClick={handleEditSave}>บันทึก</Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Box>
    </>
  );
}

export default StudentTimesheetView;
