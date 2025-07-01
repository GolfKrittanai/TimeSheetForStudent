const express = require('express');
const router = express.Router();

const prisma = require('../prismaClient');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// นักศึกษาดู Timesheet ของตัวเอง
router.get('/', authenticateToken, authorizeRoles('student'), async (req, res) => {
  const timesheets = await prisma.timeSheet.findMany({
    where: { userId: req.user.id },
  });
  res.json(timesheets);
});

// นักศึกษาบันทึก Timesheet
router.post('/', authenticateToken, authorizeRoles('student'), async (req, res) => {
  const { date, checkInTime, checkOutTime } = req.body;
  try {
    const newTimesheet = await prisma.timeSheet.create({
      data: {
        userId: req.user.id,
        date: new Date(date),
        checkInTime: new Date(checkInTime),
        checkOutTime: new Date(checkOutTime),
      },
    });
    res.status(201).json(newTimesheet);
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error });
  }
});

module.exports = router;
