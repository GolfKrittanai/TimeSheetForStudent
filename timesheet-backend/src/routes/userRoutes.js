const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Admin ดึงรายชื่อนักศึกษาทั้งหมด
router.get('/students', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const students = await prisma.user.findMany({
      where: { role: 'student' },
      select: {
        id: true,
        studentId: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการโหลดข้อมูลนักศึกษา', error });
  }
});

// Admin ลบผู้ใช้
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const id = Number(req.params.id);
  try {
    await prisma.user.delete({ where: { id } });
    res.json({ message: 'ลบผู้ใช้สำเร็จ' });
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบผู้ใช้', error });
  }
});

// Student หรือ Admin ดูข้อมูลตัวเอง
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้', error });
  }
});

module.exports = router;
