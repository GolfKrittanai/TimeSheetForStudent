import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  CircularProgress,
  Paper,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import TimeSheetForm from './TimeSheetForm';
import TimeSheetEditDialog from './TimeSheetEditDialog';
import {
  getMyTimeSheets,
  deleteTimeSheet,
  updateTimeSheet,
} from '../services/timesheetService';

function StudentDashboard() {
  const { token, user } = useAuth();
  const [timeSheets, setTimeSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getMyTimeSheets(token);
      setTimeSheets(res.data);
    } catch {
      alert('โหลด TimeSheet ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('ต้องการลบ TimeSheet นี้ใช่หรือไม่?')) return;
    try {
      await deleteTimeSheet(id, token);
      setTimeSheets(prev => prev.filter(t => t.id !== id));
    } catch {
      alert('ลบไม่สำเร็จ');
    }
  };

  const handleEditOpen = (timesheet) => {
    setEditData(timesheet);
    setEditOpen(true);
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setEditData(null);
  };

  const handleEditSave = async (values, resetLoading) => {
    try {
      await updateTimeSheet(editData.id, values, token);
      alert('แก้ไข TimeSheet สำเร็จ');
      await fetchData();
      handleEditClose();
    } catch {
      alert('แก้ไขไม่สำเร็จ');
    }
    resetLoading(false);
  };

  return (
    <>
      <Navbar />
      <Box sx={{ p: 4, maxWidth: 900, mx: 'auto' }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{ fontWeight: 'bold', color: '#1976d2' }}
        >
          TimeSheet ของ {user?.fullName}
        </Typography>

        {/* ฟอร์มเพิ่ม Timesheet */}
        <Paper sx={{ p: 3, mb: 4, boxShadow: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'medium' }}>
            เพิ่ม TimeSheet ใหม่
          </Typography>
          <TimeSheetForm token={token} fetchData={fetchData} />
        </Paper>

        <Typography
          variant="h6"
          sx={{ mb: 2, fontWeight: 'medium', color: '#555' }}
        >
          รายการ TimeSheet
        </Typography>

        {loading ? (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : timeSheets.length === 0 ? (
          <Typography sx={{ mt: 4, textAlign: 'center', color: '#888' }}>
            ยังไม่มี TimeSheet
          </Typography>
        ) : (
          <Paper sx={{ overflowX: 'auto', boxShadow: 3 }}>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>วันที่</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>เวลาเข้า</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>เวลาออก</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>กิจกรรม</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', minWidth: 140 }}>
                    จัดการ
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {timeSheets.map((t) => (
                  <TableRow key={t.id} hover>
                    <TableCell>{new Date(t.date).toLocaleDateString()}</TableCell>
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
                    <TableCell sx={{ whiteSpace: 'pre-line' }}>{t.activity}</TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => handleEditOpen(t)}
                        sx={{ mr: 1, textTransform: 'none' }}
                      >
                        แก้ไข
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => handleDelete(t.id)}
                        sx={{ textTransform: 'none' }}
                      >
                        ลบ
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}

        <TimeSheetEditDialog
          open={editOpen}
          onClose={handleEditClose}
          initialData={editData}
          onSave={handleEditSave}
        />
      </Box>
    </>
  );
}

export default StudentDashboard;
