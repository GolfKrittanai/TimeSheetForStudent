const prisma = require('../prismaClient');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/jwtUtils');

async function login(req, res) {
  const { studentId, password } = req.body;

  if (!studentId || !password) {
    return res.status(400).json({ message: 'studentId and password required' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { studentId } });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = generateToken({ id: user.id, role: user.role, studentId: user.studentId });

    res.json({
      token,
      user: {
        id: user.id,
        studentId: user.studentId,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { login };
