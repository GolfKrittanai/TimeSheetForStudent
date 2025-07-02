import React, { useEffect, useState } from 'react';
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
} from '@mui/material';
import { getStudentTimesheetById } from '../services/adminService';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

function StudentTimesheetView() {
  const { id } = useParams();
  const { token } = useAuth();

  const [data, setData] = useState([]);
  const [studentInfo, setStudentInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimesheet = async () => {
      try {
        const res = await getStudentTimesheetById(id, token);
        setData(res.data.timesheets || []);
        setStudentInfo(res.data.student || null);
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
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: '#f4f6f8',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'start',
          px: 2,
          py: 4,
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 1000 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 'bold',
              mb: 2,
              color: '#333',
              textAlign: 'center',
            }}
          >
            ข้อมูล TimeSheet ของนักศึกษา
          </Typography>

          {studentInfo && (
            <Typography
              variant="h6"
              sx={{ color: '#555', textAlign: 'center', mb: 3 }}
            >
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
            <Paper
              elevation={1}
              sx={{
                overflowX: 'auto',
                borderRadius: 2,
                border: '1px solid #e0e0e0',
                backgroundColor: '#fff',
              }}
            >
              <Table>
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>วันที่</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>เวลาเข้า</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>เวลาออก</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>กิจกรรม</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.map((t) => (
                    <TableRow key={t.id} hover>
                      <TableCell>
                        {new Date(t.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(t.checkInTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>
                        {new Date(t.checkOutTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'pre-line' }}>
                        {t.activity}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          )}
        </Box>
      </Box>
    </>
  );
}

export default StudentTimesheetView;
