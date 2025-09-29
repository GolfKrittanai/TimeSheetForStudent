const prisma = require('../prismaClient');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

// ✅ REGISTER
async function register(req, res) {
  const {
    studentId,
    fullName,
    password,
    email,
    phone,
    role = 'student',
    course,
    semester,
    academicYear,
    companyName,
    internPosition,
    profileImage,
  } = req.body;


  if (!studentId || !fullName || !password || !email || !phone) {
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
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
        email,
        phone,
        passwordHash,
        role,
        course,
        semester,
        academicYear,
        companyName,
        internPosition,
        profileImage,
      },
    });

    return res.status(201).json({
      user: {
        id: user.id,
        studentId: user.studentId,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        course: user.course,
        semester: user.semester,
        academicYear: user.academicYear,
        companyName: user.companyName,
        internPosition: user.internPosition,
        profileImage: user.profileImage,
      },
    });

  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      message: 'เกิดข้อผิดพลาดในการลงทะเบียน',
      error: error.message,
    });
  }
}

// ✅ LOGIN
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
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ',
      error: error.message,
    });
  }
}
// ✅ FORGOT PASSWORD
async function forgotPassword(req, res) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'กรุณากรอกอีเมล' });
  }

  try {
    // ✅ เปลี่ยนจาก findUnique เป็น findFirst
    const user = await prisma.user.findFirst({ where: { email } });

    if (!user) {
      // ✅ ส่งสถานะ 404 (Not Found) และข้อความแจ้งเตือนที่ชัดเจน
      return res.status(404).json({ message: 'ไม่พบอีเมลนี้ในระบบ' });
    }

    // ... โค้ดส่วนที่เหลือเหมือนเดิม ...
    const resetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const passwordResetExpires = new Date(Date.now() + 3600000);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken, passwordResetExpires },
    });

    const resetURL = `http://localhost:3000/reset-password?token=${resetToken}`;

    await sendEmail({
      email: user.email,
      subject: 'Timesheet: ลิงก์สำหรับรีเซ็ตรหัสผ่าน',
      message: `คลิกที่ลิงก์นี้เพื่อรีเซ็ตรหัสผ่าน: ${resetURL}`,
    });

    res.status(200).json({ message: 'ส่งคำขอรีเซ็ตรหัสผ่านไปที่อีเมลของคุณแล้ว' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดำเนินการ' });
  }
}

// ✅ RESET PASSWORD
async function resetPassword(req, res) {
  // รับ Token จาก URL parameter หรือ body
  // โดยปกติจะส่งมาทาง query parameter (reset-password?token=xxxx)
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: 'Token หรือรหัสผ่านไม่ถูกต้อง' });
  }

  try {
    const passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken,
        passwordResetExpires: {
          gt: new Date(), // ตรวจสอบว่า Token ยังไม่หมดอายุ
        },
      },
    });

    if (!user) {
      return res.status(400).json({ message: 'Token ไม่ถูกต้องหรือหมดอายุแล้ว' });
    }

    // Hash รหัสผ่านใหม่
    const newPasswordHash = await bcrypt.hash(password, 10);

    // อัปเดตรหัสผ่านและลบ Token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    res.status(200).json({ message: 'รีเซ็ตรหัสผ่านสำเร็จ' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน' });
  }
}

module.exports = { register, login, forgotPassword, resetPassword };
