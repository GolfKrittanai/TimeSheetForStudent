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
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  getMyTimeSheets,
  createTimeSheet,
  deleteTimeSheet,
} from '../services/timesheetService';
import { useAuth } from '../context/AuthContext';

function StudentDashboard() {
  const { token, user } = useAuth();
  const [timeSheets, setTimeSheets] = useState([]);

  const fetchData = async () => {
    try {
      const res = await getMyTimeSheets(token); // ดึง TimeSheet ของตัวเอง
      setTimeSheets(res.data);
    } catch (err) {
      alert('โหลด TimeSheet ไม่สำเร็จ');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('ต้องการลบ TimeSheet นี้ใช่หรือไม่?')) return;

    try {
      await deleteTimeSheet(id, token);
      setTimeSheets((prev) => prev.filter((t) => t.id !== id));
    } catch {
      alert('ลบไม่สำเร็จ');
    }
  };

  const formik = useFormik({
    initialValues: {
      date: '',
      timeIn: '',
      timeOut: '',
      activity: '',
    },
    validationSchema: Yup.object({
      date: Yup.string().required('กรุณาเลือกวันที่'),
      timeIn: Yup.string().required('กรุณากรอกเวลาเข้า'),
      timeOut: Yup.string().required('กรุณากรอกเวลาออก'),
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

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <>
      <Navbar />
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          TimeSheet ของ {user?.name}
        </Typography>

        {/* ฟอร์มบันทึก TimeSheet */}
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
            name="timeIn"
            type="time"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={formik.values.timeIn}
            onChange={formik.handleChange}
            error={formik.touched.timeIn && Boolean(formik.errors.timeIn)}
            helperText={formik.touched.timeIn && formik.errors.timeIn}
            sx={{ mb: 2 }}
          />
          <TextField
            label="เวลาออก"
            name="timeOut"
            type="time"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={formik.values.timeOut}
            onChange={formik.handleChange}
            error={formik.touched.timeOut && Boolean(formik.errors.timeOut)}
            helperText={formik.touched.timeOut && formik.errors.timeOut}
            sx={{ mb: 2 }}
          />
          <TextField
            label="กิจกรรมที่ทำ"
            name="activity"
            fullWidth
            multiline
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

        {/* ตารางแสดง TimeSheet */}
        <Typography variant="h6">รายการ TimeSheet</Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>วันที่</TableCell>
              <TableCell>เวลาเข้า</TableCell>
              <TableCell>เวลาออก</TableCell>
              <TableCell>กิจกรรม</TableCell>
              <TableCell>ลบ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {timeSheets.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{t.date}</TableCell>
                <TableCell>{t.timeIn}</TableCell>
                <TableCell>{t.timeOut}</TableCell>
                <TableCell>{t.activity}</TableCell>
                <TableCell>
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
    </>
  );
}

export default StudentDashboard;
