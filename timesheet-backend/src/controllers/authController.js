const prisma = require('../prismaClient');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken');

// REGISTER CONTROLLER
async function register(req, res) {
  const { studentId, fullName, password } = req.body;

  if (!studentId || !fullName || !password) {
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบ' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { studentId } });
    if (existingUser) {
      return res.status(400).json({ message: 'รหัสนักศึกษานี้มีในระบบแล้ว' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        studentId,
        fullName,
        passwordHash,
        role: 'student',
      },
    });

    //const token = generateToken({ id: user.id, role: user.role });

    return res.status(201).json({
      user: {
        id: user.id,
        studentId: user.studentId,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลงทะเบียน', error: error.message });
  }
}

// LOGIN CONTROLLER
async function login(req, res) {
  const { studentId, password } = req.body;

  if (!studentId || !password) {
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบ' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { studentId } });
    if (!user) {
      return res.status(401).json({ message: 'รหัสนักศึกษาหรือรหัสผ่านไม่ถูกต้อง' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'รหัสนักศึกษาหรือรหัสผ่านไม่ถูกต้อง' });
    }

    const token = generateToken({ id: user.id, role: user.role });

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        studentId: user.studentId,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ', error: error.message });
  }
}

module.exports = { register, login };
