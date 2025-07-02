import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
} from '@mui/material';

function TimeSheetEditDialog({ open, onClose, initialData, onSave }) {
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      date: initialData ? initialData.date.slice(0, 10) : '',
      checkInTime: initialData ? initialData.checkInTime.slice(11, 16) : '',
      checkOutTime: initialData ? initialData.checkOutTime.slice(11, 16) : '',
      activity: initialData ? initialData.activity || '' : '',
    },
    validationSchema: Yup.object({
      date: Yup.string().required('กรุณาเลือกวันที่'),
      checkInTime: Yup.string().required('กรุณากรอกเวลาเข้า'),
      checkOutTime: Yup.string().required('กรุณากรอกเวลาออก'),
      activity: Yup.string().required('กรุณากรอกกิจกรรม'),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      await onSave(values, setLoading);
    },
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold', color: '#1976d2' }}>
        แก้ไข TimeSheet
      </DialogTitle>
      <DialogContent>
        <Box
          component="form"
          id="edit-timesheet-form"
          onSubmit={formik.handleSubmit}
          sx={{ mt: 1, '& .MuiTextField-root': { mb: 2 } }}
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
        </Box>
      </DialogContent>
      <DialogActions sx={{ pr: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading} sx={{ textTransform: 'none' }}>
          ยกเลิก
        </Button>
        <Button
          form="edit-timesheet-form"
          type="submit"
          variant="contained"
          disabled={loading}
          sx={{ textTransform: 'none' }}
        >
          {loading ? 'กำลังบันทึก...' : 'บันทึก'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default TimeSheetEditDialog;
