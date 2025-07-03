// routes/adminRoutes.js (หรือชื่อไฟล์ที่คุณใช้)
const express = require('express');
const router = express.Router();

const prisma = require('../prismaClient');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// ดึงรายชื่อนักศึกษาทั้งหมด (admin เท่านั้น)
router.get('/students', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        studentId: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
      orderBy: { studentId: 'asc' },
    });
    res.json(users);
  } catch (error) {
    console.error('โหลด students error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้', error: error.message });
  }
});

// แก้ไขข้อมูลนักศึกษา (admin เท่านั้น)
router.put('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;
  const { fullName, studentId, role } = req.body;

  const validRoles = ['student', 'admin'];
  if (role && !validRoles.includes(role)) {
    return res.status(400).json({ message: 'Role ไม่ถูกต้อง' });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: { fullName, studentId, role },
    });
    res.json(updatedUser);
  } catch (error) {
    console.error('แก้ไขข้อมูล user error:', error);
    res.status(500).json({ message: 'แก้ไขข้อมูลไม่สำเร็จ', error: error.message });
  }
});

// ลบผู้ใช้ (admin เท่านั้น)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.user.delete({ where: { id: Number(id) } });
    res.json({ message: 'ลบผู้ใช้สำเร็จ' });
  } catch (error) {
    console.error('ลบ user error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message });
  }
});

// สรุปข้อมูล (admin เท่านั้น)
router.get('/admin/summary', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const studentCount = await prisma.user.count({ where: { role: 'student' } });
    const timesheetCount = await prisma.timesheet.count();

    res.json({
      totalStudents: studentCount,
      totalTimesheets: timesheetCount,
    });
  } catch (error) {
    console.error('โหลด summary error:', error);
    res.status(500).json({ message: 'ไม่สามารถดึงข้อมูลสรุปได้', error: error.message });
  }
});

// ดึง Timesheet ของนักศึกษาคนใดคนหนึ่ง (admin เท่านั้น)
router.get('/students/:id/timesheets', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const userId = Number(req.params.id);
  try {
    const student = await prisma.user.findUnique({
      where: { id: userId },
      select: { studentId: true, fullName: true },
    });

    if (!student) {
      return res.status(404).json({ message: 'ไม่พบนักศึกษา' });
    }

    const timesheets = await prisma.timesheet.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });

    res.json({ student, timesheets });
  } catch (error) {
    console.error('โหลด Timesheet นักศึกษา error:', error);
    res.status(500).json({ message: 'ไม่สามารถโหลด Timesheet ได้', error: error.message });
  }
});



module.exports = router;
