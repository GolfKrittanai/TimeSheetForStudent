import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Box, TextField, Button } from '@mui/material';

import { createTimeSheet } from '../services/timesheetService';

function TimeSheetForm({ token, fetchData }) {
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

  return (
    <Box
      component="form"
      onSubmit={formik.handleSubmit}
      sx={{
        '& .MuiTextField-root': { mb: 2 },
      }}
    >
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
      />

      <Button variant="contained" type="submit" fullWidth sx={{ mt: 1 }}>
        บันทึก TimeSheet
      </Button>
    </Box>
  );
}

export default TimeSheetForm;
