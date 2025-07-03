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
    // ดึงข้อมูลนักศึกษา
    const student = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        studentId: true,
        fullName: true,
      },
    });

    if (!student) {
      return res.status(404).json({ message: 'ไม่พบนักศึกษา' });
    }

    // ดึง Timesheet ของนักศึกษา
    const timesheets = await prisma.timeSheet.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });

    // ส่ง response กลับพร้อมข้อมูลนักศึกษา
    res.json({
      student,
      timesheets,
    });
  } catch (error) {
    res.status(500).json({ message: 'ไม่สามารถโหลด Timesheet ได้', error });
  }
});

// ลบ Timesheet โดย admin
router.delete('/admin/timesheet/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const id = Number(req.params.id);
  try {
    const timesheet = await prisma.timeSheet.findUnique({ where: { id } });

    if (!timesheet) {
      return res.status(404).json({ message: 'ไม่พบ Timesheet' });
    }

    await prisma.timeSheet.delete({ where: { id } });
    res.json({ message: 'ลบ Timesheet สำเร็จ' });
  } catch (error) {
    console.error('Admin ลบ Timesheet error:', error);
    res.status(500).json({ message: 'ลบ Timesheet ไม่สำเร็จ', error });
  }
});

// แก้ไข Timesheet โดย admin
router.put('/admin/timesheet/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const id = Number(req.params.id);
  const { date, checkInTime, checkOutTime, activity } = req.body;

  try {
    const timesheet = await prisma.timeSheet.findUnique({ where: { id } });

    if (!timesheet) {
      return res.status(404).json({ message: 'ไม่พบ Timesheet' });
    }

    const checkInDateTime = new Date(`${date}T${checkInTime}:00`);
    const checkOutDateTime = new Date(`${date}T${checkOutTime}:00`);

    const updated = await prisma.timeSheet.update({
      where: { id },
      data: {
        date: new Date(date),
        checkInTime: checkInDateTime,
        checkOutTime: checkOutDateTime,
        activity,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Admin แก้ไข Timesheet error:', error);
    res.status(500).json({ message: 'แก้ไข Timesheet ไม่สำเร็จ', error });
  }
});


module.exports = router;
