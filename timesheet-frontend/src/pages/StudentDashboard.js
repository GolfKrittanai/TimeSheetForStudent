import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import {
  Box,
  Typography,
  TextField,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  getMyTimeSheets,
  createTimeSheet,
  deleteTimeSheet,
  updateTimeSheet,
} from '../services/timesheetService';
import { useAuth } from '../context/AuthContext';

function StudentDashboard() {
  const { token, user } = useAuth();
  const [timeSheets, setTimeSheets] = useState([]);

  // สำหรับ dialog แก้ไข
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [loadingEdit, setLoadingEdit] = useState(false);

  // โหลด timesheets
  const fetchData = async () => {
    try {
      const res = await getMyTimeSheets(token);
      setTimeSheets(res.data);
    } catch (err) {
      alert('โหลด TimeSheet ไม่สำเร็จ');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ลบ timesheet
  const handleDelete = async (id) => {
    if (!window.confirm('ต้องการลบ TimeSheet นี้ใช่หรือไม่?')) return;

    try {
      await deleteTimeSheet(id, token);
      setTimeSheets((prev) => prev.filter((t) => t.id !== id));
    } catch {
      alert('ลบไม่สำเร็จ');
    }
  };

  // ฟอร์มบันทึก timesheet ใหม่
  const formik = useFormik({
    initialValues: {
      date: '',
      checkInTime: '',
      checkOutTime: '',
      activity: '',
    },
    validationSchema: Yup.object({
      date: Yup.string().required('กรุณาเลือกวันที่'),
      checkInTime: Yup.string().required('กรุณากรอกเวลาเข้า'),
      checkOutTime: Yup.string().required('กรุณากรอกเวลาออก'),
      activity: Yup.string().required('กรุณากรอกกิจกรรม'),
    }),
    onSubmit: async (values, { resetForm }) => {
      try {
        await createTimeSheet(values, token);
        fetchData();
        resetForm();
      } catch {
        alert('บันทึกไม่สำเร็จ');
      }
    },
  });

  // เปิด dialog แก้ไข พร้อมข้อมูลเดิม
  const handleEditOpen = (timesheet) => {
    setEditData(timesheet);
    setEditOpen(true);
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setEditData(null);
  };

  // ฟอร์มแก้ไข timesheet (enableReinitialize สำคัญ!)
  const editFormik = useFormik({
    enableReinitialize: true,
    initialValues: {
      date: editData ? editData.date.slice(0, 10) : '',
      checkInTime: editData ? editData.checkInTime.slice(11, 16) : '',
      checkOutTime: editData ? editData.checkOutTime.slice(11, 16) : '',
      activity: editData ? editData.activity || '' : '',
    },
    validationSchema: Yup.object({
      date: Yup.string().required('กรุณาเลือกวันที่'),
      checkInTime: Yup.string().required('กรุณากรอกเวลาเข้า'),
      checkOutTime: Yup.string().required('กรุณากรอกเวลาออก'),
      activity: Yup.string().required('กรุณากรอกกิจกรรม'),
    }),
    onSubmit: async (values) => {
      setLoadingEdit(true);
      try {
        await updateTimeSheet(editData.id, {
          date: values.date,
          checkInTime: values.checkInTime,
          checkOutTime: values.checkOutTime,
          activity: values.activity,
        }, token);
        await fetchData();
        handleEditClose();
      } catch {
        alert('แก้ไขไม่สำเร็จ');
      }
      setLoadingEdit(false);
    },
  });

  return (
    <>
      <Navbar />
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          TimeSheet ของ {user?.fullName}
        </Typography>

        <form onSubmit={formik.handleSubmit} style={{ marginBottom: '2rem' }}>
          <TextField
            label="วันที่"
            name="date"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={formik.values.date}
            onChange={formik.handleChange}
            error={formik.touched.date && Boolean(formik.errors.date)}
            helperText={formik.touched.date && formik.errors.date}
            sx={{ mb: 2 }}
          />
          <TextField
            label="เวลาเข้า"
            name="checkInTime"
            type="time"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={formik.values.checkInTime}
            onChange={formik.handleChange}
            error={formik.touched.checkInTime && Boolean(formik.errors.checkInTime)}
            helperText={formik.touched.checkInTime && formik.errors.checkInTime}
            sx={{ mb: 2 }}
          />
          <TextField
            label="เวลาออก"
            name="checkOutTime"
            type="time"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={formik.values.checkOutTime}
            onChange={formik.handleChange}
            error={formik.touched.checkOutTime && Boolean(formik.errors.checkOutTime)}
            helperText={formik.touched.checkOutTime && formik.errors.checkOutTime}
            sx={{ mb: 2 }}
          />
          <TextField
            label="กิจกรรม"
            name="activity"
            fullWidth
            multiline
            rows={3}
            value={formik.values.activity}
            onChange={formik.handleChange}
            error={formik.touched.activity && Boolean(formik.errors.activity)}
            helperText={formik.touched.activity && formik.errors.activity}
            sx={{ mb: 2 }}
          />

          <Button variant="contained" type="submit" fullWidth>
            บันทึก TimeSheet
          </Button>
        </form>

        <Typography variant="h6">รายการ TimeSheet</Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>วันที่</TableCell>
              <TableCell>เวลาเข้า</TableCell>
              <TableCell>เวลาออก</TableCell>
              <TableCell>กิจกรรม</TableCell>
              <TableCell>จัดการ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {timeSheets.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{new Date(t.date).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(t.checkInTime).toLocaleTimeString()}</TableCell>
                <TableCell>{new Date(t.checkOutTime).toLocaleTimeString()}</TableCell>
                <TableCell>{t.activity}</TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    onClick={() => handleEditOpen(t)}
                    sx={{ mr: 1 }}
                  >
                    แก้ไข
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => handleDelete(t.id)}
                  >
                    ลบ
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      <Dialog open={editOpen} onClose={handleEditClose}>
        <DialogTitle>แก้ไข TimeSheet</DialogTitle>
        <DialogContent>
          <form id="edit-timesheet-form" onSubmit={editFormik.handleSubmit} style={{ minWidth: 300 }}>
            <TextField
              label="วันที่"
              name="date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={editFormik.values.date}
              onChange={editFormik.handleChange}
              error={editFormik.touched.date && Boolean(editFormik.errors.date)}
              helperText={editFormik.touched.date && editFormik.errors.date}
              sx={{ mb: 2 }}
            />
            <TextField
              label="เวลาเข้า"
              name="checkInTime"
              type="time"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={editFormik.values.checkInTime}
              onChange={editFormik.handleChange}
              error={editFormik.touched.checkInTime && Boolean(editFormik.errors.checkInTime)}
              helperText={editFormik.touched.checkInTime && editFormik.errors.checkInTime}
              sx={{ mb: 2 }}
            />
            <TextField
              label="เวลาออก"
              name="checkOutTime"
              type="time"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={editFormik.values.checkOutTime}
              onChange={editFormik.handleChange}
              error={editFormik.touched.checkOutTime && Boolean(editFormik.errors.checkOutTime)}
              helperText={editFormik.touched.checkOutTime && editFormik.errors.checkOutTime}
              sx={{ mb: 2 }}
            />
            <TextField
              label="กิจกรรม"
              name="activity"
              fullWidth
              multiline
              rows={3}
              value={editFormik.values.activity}
              onChange={editFormik.handleChange}
              error={editFormik.touched.activity && Boolean(editFormik.errors.activity)}
              helperText={editFormik.touched.activity && editFormik.errors.activity}
              sx={{ mb: 2 }}
            />
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose} disabled={loadingEdit}>ยกเลิก</Button>
          <Button form="edit-timesheet-form" type="submit" variant="contained" disabled={loadingEdit}>
            {loadingEdit ? 'กำลังบันทึก...' : 'บันทึก'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default StudentDashboard;
