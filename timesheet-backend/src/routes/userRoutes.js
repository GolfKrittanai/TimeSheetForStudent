const express = require('express');
const router = express.Router();

const prisma = require('../prismaClient');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// ดึงรายชื่อนักศึกษาทั้งหมด (admin เท่านั้น)
router.get('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      studentId: true,
      fullName: true,
      role: true,
      createdAt: true,
    },
  });
  res.json(users);
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

module.exports = router;
