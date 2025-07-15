const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const { exportDailyForCron } = require('../controllers/exportController');
const logger = require('../logger/logger'); // ✅ เพิ่ม logger

// 🔹 Cron Export API (ให้ cron job มาเรียก)
router.get('/export/daily', exportDailyForCron);

// 🔹 ลบ Timesheet โดย admin
router.delete('/timesheet/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const id = Number(req.params.id);
  const adminId = req.user.id;

  try {
    const timesheet = await prisma.timesheet.findUnique({ where: { id } });
    if (!timesheet) {
      logger.warn(`⚠️ Admin ${adminId} พยายามลบ Timesheet ที่ไม่พบ (id: ${id})`);
      return res.status(404).json({ message: 'ไม่พบ Timesheet' });
    }

    await prisma.timesheet.delete({ where: { id } });

    logger.info(`🗑️ Admin ${adminId} ลบ Timesheet (id: ${id}) เรียบร้อย`);
    res.json({ message: 'ลบ Timesheet สำเร็จ' });
  } catch (error) {
    logger.error(`❌ Admin ${adminId} ลบ Timesheet error: ${error.message}`);
    res.status(500).json({ message: 'ลบ Timesheet ไม่สำเร็จ', error: error.message });
  }
});

// 🔹 แก้ไข Timesheet โดย admin
router.put('/timesheet/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const id = Number(req.params.id);
  const adminId = req.user.id;
  const { date, checkInTime, checkOutTime, activity } = req.body;

  try {
    const timesheet = await prisma.timesheet.findUnique({ where: { id } });
    if (!timesheet) {
      logger.warn(`⚠️ Admin ${adminId} พยายามแก้ไข Timesheet ที่ไม่พบ (id: ${id})`);
      return res.status(404).json({ message: 'ไม่พบ Timesheet' });
    }

    const updated = await prisma.timesheet.update({
      where: { id },
      data: {
        date: new Date(date),
        checkInTime: new Date(checkInTime),
        checkOutTime: new Date(checkOutTime),
        activity,
      },
    });

    logger.info(`✏️ Admin ${adminId} แก้ไข Timesheet (id: ${id}) เรียบร้อย`);
    res.json(updated);
  } catch (error) {
    logger.error(`❌ Admin ${adminId} แก้ไข Timesheet error: ${error.message}`);
    res.status(500).json({ message: 'แก้ไข Timesheet ไม่สำเร็จ', error: error.message });
  }
});

module.exports = router;
