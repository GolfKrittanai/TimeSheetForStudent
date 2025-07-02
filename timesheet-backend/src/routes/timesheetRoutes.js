const express = require('express');
const router = express.Router();

const prisma = require('../prismaClient');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// นักศึกษาดู Timesheet ของตัวเอง
router.get('/', authenticateToken, authorizeRoles('student'), async (req, res) => {
  try {
    const timesheets = await prisma.timeSheet.findMany({
      where: { userId: req.user.id },
      orderBy: { date: 'desc' },
    });
    res.json(timesheets);
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการโหลด Timesheet', error });
  }
});

// นักศึกษาบันทึก Timesheet
router.post('/', authenticateToken, authorizeRoles('student'), async (req, res) => {
  const { date, checkInTime, checkOutTime, activity } = req.body;

  try {
    const checkInDateTime = new Date(`${date}T${checkInTime}:00`);
    const checkOutDateTime = new Date(`${date}T${checkOutTime}:00`);

    const newTimesheet = await prisma.timeSheet.create({
      data: {
        userId: req.user.id,
        date: new Date(date),
        checkInTime: checkInDateTime,
        checkOutTime: checkOutDateTime,
        activity,
      },
    });
    res.status(201).json(newTimesheet);
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการบันทึก Timesheet', error });
  }
});

// นักศึกษาลบ Timesheet ของตัวเอง
router.delete('/:id', authenticateToken, authorizeRoles('student'), async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const timesheet = await prisma.timeSheet.findUnique({ where: { id } });
    if (!timesheet || timesheet.userId !== req.user.id) {
      return res.status(404).json({ message: 'ไม่พบ Timesheet หรือไม่มีสิทธิ์ลบ' });
    }

    await prisma.timeSheet.delete({ where: { id } });
    res.json({ message: 'ลบ Timesheet เรียบร้อย' });
  } catch (error) {
    console.error('ลบ Timesheet error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบ Timesheet', error });
  }
});

// นักศึกษาแก้ไข Timesheet ของตัวเอง
router.put('/:id', authenticateToken, authorizeRoles('student'), async (req, res) => {
  const { id } = req.params;
  const { date, checkInTime, checkOutTime, activity } = req.body;

  try {
    // Step 1: หา timesheet ที่ user เป็นเจ้าของ
    const timesheet = await prisma.timeSheet.findUnique({
      where: { id: Number(id) },
    });

    if (!timesheet || timesheet.userId !== req.user.id) {
      return res.status(404).json({ message: 'ไม่พบ Timesheet หรือไม่มีสิทธิ์แก้ไข' });
    }

    // Step 2: แปลงเวลารวมวันที่ก่อน update
    const checkInDateTime = new Date(`${date}T${checkInTime}:00`);
    const checkOutDateTime = new Date(`${date}T${checkOutTime}:00`);

    // Step 3: อัพเดตข้อมูล
    const updated = await prisma.timeSheet.update({
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
    res.status(500).json({ message: 'แก้ไข Timesheet ไม่สำเร็จ', error });
  }
});

module.exports = router;
