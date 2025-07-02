const express = require('express');
const router = express.Router();

const prisma = require('../prismaClient');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// นักศึกษาดู Timesheet ของตัวเอง
router.get('/', authenticateToken, authorizeRoles('student'), async (req, res) => {
  try {
    const timesheets = await prisma.timeSheet.findMany({
      where: { userId: req.user.id },
      orderBy: { date: 'desc' }, // เรียงวันที่ล่าสุดก่อน
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


module.exports = router;
