import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress } from '@mui/material';
import { getStudentTimesheetById } from '../services/adminService';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

function StudentTimesheetView() {
  const { id } = useParams();
  const { token } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimesheet = async () => {
      try {
        const res = await getStudentTimesheetById(id, token);
        setData(res.data);
      } catch (err) {
        alert('โหลดข้อมูล Timesheet ไม่สำเร็จ');
      } finally {
        setLoading(false);
      }
    };
    fetchTimesheet();
  }, [id, token]);

  return (
    <>
      <Navbar />
      <Box sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Timesheet ของนักศึกษารหัส {id}
        </Typography>

        {loading ? (
          <CircularProgress />
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>วันที่</TableCell>
                <TableCell>เวลาเข้า</TableCell>
                <TableCell>เวลาออก</TableCell>
                <TableCell>กิจกรรม</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{new Date(t.date).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(t.checkInTime).toLocaleTimeString()}</TableCell>
                  <TableCell>{new Date(t.checkOutTime).toLocaleTimeString()}</TableCell>
                  <TableCell>{t.activity}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Box>
    </>
  );
}

export default StudentTimesheetView;
