const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const bcrypt = require('bcrypt');
const { authenticateToken } = require('../middleware/authMiddleware');

// GET /api/profile - ดึงข้อมูลโปรไฟล์ของ user ที่ login อยู่
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        address: true,
      },
    });
    res.json(user);
  } catch (error) {
    console.error('โหลด profile error:', error);
    res.status(500).json({ message: 'โหลดข้อมูลโปรไฟล์ไม่สำเร็จ' });
  }
});

// PUT /api/profile - แก้ไขข้อมูลโปรไฟล์ของ user
router.put('/', authenticateToken, async (req, res) => {
  const { fullName, email, phone, address } = req.body;
  try {
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { fullName, email, phone, address },
    });
    res.json(updatedUser);
  } catch (error) {
    console.error('อัปเดต profile error:', error);
    res.status(500).json({ message: 'อัปเดตข้อมูลโปรไฟล์ไม่สำเร็จ' });
  }
});

// PUT /api/profile/change-password - เปลี่ยนรหัสผ่าน
router.put('/change-password', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบ' });
  }

  try {
    // ดึง hashed password ที่ชื่อ passwordHash ตาม schema
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    if (!user) {
      return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
    }

    if (!user.passwordHash) {
      return res.status(400).json({ message: 'ไม่มีรหัสผ่านในระบบ' });
    }

    // ตรวจสอบรหัสผ่านปัจจุบัน
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
    }

    // เข้ารหัสรหัสผ่านใหม่
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // อัปเดตรหัสผ่านใหม่
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });

    res.json({ message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
  } catch (error) {
    console.error('เปลี่ยนรหัสผ่านผิดพลาด:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน' });
  }
});

module.exports = router;
