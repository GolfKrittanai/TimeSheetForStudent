const express = require('express');
const router = express.Router();

const prisma = require('../prismaClient');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// ดึงรายชื่อนักศึกษาทั้งหมด (admin เท่านั้น)
// ดึงผู้ใช้ทั้งหมด (admin เท่านั้น)
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
      orderBy: { studentId: 'asc' }, // เรียงจากรหัสนักศึกษา น้อย → มาก
    });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้', error });
  }
});


// แก้ไขข้อมูลนักศึกษา (admin เท่านั้น)
router.put('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;
  const { fullName, studentId, role } = req.body;

  // ตรวจสอบ role ว่าอยู่ใน enum ที่กำหนด
  const validRoles = ['student', 'admin'];
  if (role && !validRoles.includes(role)) {
    return res.status(400).json({ message: 'Role ไม่ถูกต้อง' });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: {
        fullName,
        studentId,
        role,
      },
    });
    res.json(updatedUser);
  } catch (error) {
    console.error('แก้ไขข้อมูล user error:', error);
    res.status(500).json({ message: 'แก้ไขข้อมูลไม่สำเร็จ', error });
  }
});

// ลบผู้ใช้ (admin เท่านั้น)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.user.delete({ where: { id: Number(id) } });
    res.json({ message: 'ลบผู้ใช้สำเร็จ' });
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error });
  }
});

// routes/userRoutes.js
router.get('/admin/summary', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const studentCount = await prisma.user.count({ where: { role: 'student' } });
    const timesheetCount = await prisma.timeSheet.count();

    res.json({
      totalStudents: studentCount,
      totalTimesheets: timesheetCount,
    });
  } catch (error) {
    res.status(500).json({ message: 'ไม่สามารถดึงข้อมูลสรุปได้', error });
  }
});

router.get('/students/:id/timesheets', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const userId = Number(req.params.id);
  try {
    const timesheets = await prisma.timeSheet.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });
    res.json(timesheets);
  } catch (error) {
    res.status(500).json({ message: 'ไม่สามารถโหลด Timesheet ได้', error });
  }
});



module.exports = router;
