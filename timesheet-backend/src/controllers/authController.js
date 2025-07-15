const prisma = require('../prismaClient');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken');
const logger = require('../logger/logger'); // ✅

/** ✅ REGISTER */
async function register(req, res) {
  const { studentId, fullName, password, email, phone, address, role = 'student' } = req.body;

  if (!studentId || !fullName || !password || !email || !phone || !address) {
    logger.warn('⚠️ Register: ข้อมูลไม่ครบ');
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { studentId } });
    if (existingUser) {
      logger.warn(`⚠️ Register: รหัสนักศึกษา ${studentId} ซ้ำ`);
      return res.status(400).json({ message: 'รหัสนักศึกษานี้มีในระบบแล้ว' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        studentId,
        fullName,
        email,
        phone,
        address,
        passwordHash,
        role,
      },
    });

    logger.info(`✅ Register success: ${studentId} (${fullName})`);

    return res.status(201).json({
      user: {
        id: user.id,
        studentId: user.studentId,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error(`❌ Register error: ${error.message}`);
    return res.status(500).json({
      message: 'เกิดข้อผิดพลาดในการลงทะเบียน',
      error: error.message,
    });
  }
}

/** ✅ LOGIN */
async function login(req, res) {
  const { studentId, password } = req.body;

  if (!studentId || !password) {
    logger.warn('⚠️ Login: ไม่กรอก studentId หรือ password');
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบ' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { studentId } });
    if (!user) {
      logger.warn(`⚠️ Login fail: ไม่พบ ${studentId}`);
      return res.status(401).json({ message: 'รหัสนักศึกษาหรือรหัสผ่านไม่ถูกต้อง' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      logger.warn(`⚠️ Login fail: รหัสผ่านไม่ถูกต้อง สำหรับ ${studentId}`);
      return res.status(401).json({ message: 'รหัสนักศึกษาหรือรหัสผ่านไม่ถูกต้อง' });
    }

    const token = generateToken({ id: user.id, role: user.role });

    logger.info(`✅ Login success: ${studentId}`);

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        studentId: user.studentId,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error(`❌ Login error: ${error.message}`);
    return res.status(500).json({
      message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ',
      error: error.message,
    });
  }
}

module.exports = { register, login };
