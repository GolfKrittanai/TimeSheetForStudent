// src/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
// src/routes/exportRoutes.js
const { exportDailyForCron } = require('../controllers/exportController');


router.get('/export/daily', exportDailyForCron);

// ลบ Timesheet โดย admin
router.delete('/timesheet/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const id = Number(req.params.id);
  try {
    const timesheet = await prisma.timesheet.findUnique({ where: { id } });
    if (!timesheet) {
      return res.status(404).json({ message: 'ไม่พบ Timesheet' });
    }
    await prisma.timesheet.delete({ where: { id } });
    res.json({ message: 'ลบ Timesheet สำเร็จ' });
  } catch (error) {
    console.error('Admin ลบ Timesheet error:', error);
    res.status(500).json({ message: 'ลบ Timesheet ไม่สำเร็จ', error: error.message });
  }
});

// แก้ไข Timesheet โดย admin
router.put('/timesheet/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const id = Number(req.params.id);
  const { date, checkInTime, checkOutTime, activity } = req.body;

  try {
    const timesheet = await prisma.timesheet.findUnique({ where: { id } });
    if (!timesheet) {
      return res.status(404).json({ message: 'ไม่พบ Timesheet' });
    }

    const updated = await prisma.timesheet.update({
      where: { id },
      data: {
        date: new Date(date),                      // ✅ ยังคงใช้ date ธรรมดา
        checkInTime: new Date(checkInTime),        // ✅ ใช้ ISO string ที่ frontend ส่งมา
        checkOutTime: new Date(checkOutTime),
        activity,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Admin แก้ไข Timesheet error:', error);
    res.status(500).json({ message: 'แก้ไข Timesheet ไม่สำเร็จ', error: error.message });
  }
});


module.exports = router;
