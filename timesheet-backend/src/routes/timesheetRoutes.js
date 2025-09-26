const express = require('express');
const router = express.Router();

const prisma = require('../prismaClient');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// ✅ ดึง Timesheet ของผู้ใช้ที่เข้าสู่ระบบ (เฉพาะนักศึกษา)
router.get('/', authenticateToken, authorizeRoles('student'), async (req, res) => {
  try {
    const timesheets = await prisma.timesheet.findMany({
      where: { userId: req.user.id },
      orderBy: { date: 'desc' },
    });
    res.json(timesheets);
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการโหลด Timesheet', error: error.message });
  }
});

// ✅ เพิ่ม Timesheet
router.post('/', authenticateToken, authorizeRoles('student'), async (req, res) => {
  const { date, checkInTime, checkOutTime, activity } = req.body;
  const userId = req.user.id; // ดึง userId จาก Token ที่ตรวจสอบแล้ว

  try {
    const existingTimesheet = await prisma.timesheet.findFirst({
      where: {
        userId: userId,
        // ใช้ date ที่ถูกส่งมาจาก frontend ในการค้นหา (Format: YYYY-MM-DD)
        date: new Date(date), 
      },
    });

    if (existingTimesheet) {
      return res.status(409).json({
        message: 'คุณได้บันทึก Timesheet ของวันนี้เรียบร้อยแล้ว',
      });
    }

    const checkInDateTime = new Date(`${date}T${checkInTime}:00`);
    const checkOutDateTime = new Date(`${date}T${checkOutTime}:00`);

    const newTimesheet = await prisma.timesheet.create({
      data: {
        userId: userId,
        date: new Date(date),
        checkInTime: checkInDateTime,
        checkOutTime: checkOutDateTime,
        activity,
      },
    });
    res.status(201).json(newTimesheet);
  } catch (error) {
    console.error('เพิ่ม Timesheet error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเพิ่ม Timesheet', error: error.message });
  }
});

// ✅ ลบ Timesheet
router.delete('/:id', authenticateToken, authorizeRoles('student'), async (req, res) => {
  const id = parseInt(req.params.id);

  console.log('ลบ Timesheet ID:', id, 'โดยผู้ใช้:', req.user);

  try {
    const timesheet = await prisma.timesheet.findUnique({ where: { id } });

    if (!timesheet || timesheet.userId !== req.user.id) {
      return res.status(403).json({ message: 'ไม่พบ Timesheet หรือคุณไม่มีสิทธิ์ลบ' });
    }

    await prisma.timesheet.delete({ where: { id } });

    res.json({ message: 'ลบ Timesheet เรียบร้อย' });
  } catch (error) {
    console.error('ลบ Timesheet error:', error);
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

    res.json(updated);
  } catch (error) {
    console.error('แก้ไข Timesheet error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการแก้ไข Timesheet', error: error.message });
  }
});

module.exports = router;
