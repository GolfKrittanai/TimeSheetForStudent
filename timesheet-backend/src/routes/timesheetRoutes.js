const express = require('express');
const router = express.Router();

const prisma = require('../prismaClient');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const logger = require('../logger/logger'); // ✅ เพิ่มตรงนี้

// ✅ ดึง Timesheet ของผู้ใช้ที่เข้าสู่ระบบ (เฉพาะนักศึกษา)
router.get('/', authenticateToken, authorizeRoles('student'), async (req, res) => {
  try {
    const timesheets = await prisma.timesheet.findMany({
      where: { userId: req.user.id },
      orderBy: { date: 'desc' },
    });

    logger.info(`📄 ผู้ใช้ ${req.user.id} ดึง Timesheet ${timesheets.length} รายการ`);
    res.json(timesheets);
  } catch (error) {
    logger.error(`❌ ดึง Timesheet ล้มเหลว: ${error.message}`);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการโหลด Timesheet', error: error.message });
  }
});

// ✅ เพิ่ม Timesheet
router.post('/', authenticateToken, authorizeRoles('student'), async (req, res) => {
  const { date, checkInTime, checkOutTime, activity } = req.body;

  try {
    const checkInDateTime = new Date(`${date}T${checkInTime}:00`);
    const checkOutDateTime = new Date(`${date}T${checkOutTime}:00`);

    const newTimesheet = await prisma.timesheet.create({
      data: {
        userId: req.user.id,
        date: new Date(date),
        checkInTime: checkInDateTime,
        checkOutTime: checkOutDateTime,
        activity,
      },
    });

    logger.info(`➕ ผู้ใช้ ${req.user.id} เพิ่ม Timesheet วันที่ ${date}`);
    res.status(201).json(newTimesheet);
  } catch (error) {
    logger.error(`❌ เพิ่ม Timesheet ล้มเหลว: ${error.message}`);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการบันทึก Timesheet', error: error.message });
  }
});

// ✅ ลบ Timesheet
router.delete('/:id', authenticateToken, authorizeRoles('student'), async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const timesheet = await prisma.timesheet.findUnique({ where: { id } });

    if (!timesheet || timesheet.userId !== req.user.id) {
      logger.warn(`⚠️ ผู้ใช้ ${req.user.id} พยายามลบ Timesheet ID ${id} ที่ไม่ได้เป็นเจ้าของ`);
      return res.status(403).json({ message: 'ไม่พบ Timesheet หรือคุณไม่มีสิทธิ์ลบ' });
    }

    await prisma.timesheet.delete({ where: { id } });

    logger.info(`🗑️ ผู้ใช้ ${req.user.id} ลบ Timesheet ID ${id}`);
    res.json({ message: 'ลบ Timesheet เรียบร้อย' });
  } catch (error) {
    logger.error(`❌ ลบ Timesheet ล้มเหลว: ${error.message}`);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบ Timesheet', error: error.message });
  }
});

// ✅ แก้ไข Timesheet
router.put('/:id', authenticateToken, authorizeRoles('student'), async (req, res) => {
  const { id } = req.params;
  const { date, checkInTime, checkOutTime, activity } = req.body;

  try {
    const timesheet = await prisma.timesheet.findUnique({
      where: { id: Number(id) },
    });

    if (!timesheet || timesheet.userId !== req.user.id) {
      logger.warn(`⚠️ ผู้ใช้ ${req.user.id} พยายามแก้ไข Timesheet ID ${id} ที่ไม่ได้เป็นเจ้าของ`);
      return res.status(403).json({ message: 'ไม่พบ Timesheet หรือคุณไม่มีสิทธิ์แก้ไข' });
    }

    const checkInDateTime = new Date(`${date}T${checkInTime}:00`);
    const checkOutDateTime = new Date(`${date}T${checkOutTime}:00`);

    const updated = await prisma.timesheet.update({
      where: { id: Number(id) },
      data: {
        date: new Date(date),
        checkInTime: checkInDateTime,
        checkOutTime: checkOutDateTime,
        activity,
      },
    });

    logger.info(`✏️ ผู้ใช้ ${req.user.id} แก้ไข Timesheet ID ${id}`);
    res.json(updated);
  } catch (error) {
    logger.error(`❌ แก้ไข Timesheet ล้มเหลว: ${error.message}`);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการแก้ไข Timesheet', error: error.message });
  }
});

module.exports = router;
