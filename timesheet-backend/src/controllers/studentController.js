const prisma = require('../prismaClient');
const bcrypt = require('bcryptjs');

async function registerStudent(req, res) {
  const { studentId, fullName, password } = req.body;

  if (!studentId || !fullName || !password) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { studentId } });
    if (existing) {
      return res.status(400).json({ message: 'Student ID already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        studentId,
        fullName,
        password: hashedPassword,
        role: 'STUDENT',
      },
    });

    res.status(201).json({ message: 'Student registered', userId: user.id });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

async function updateStudent(req, res) {
  const userId = Number(req.params.id);
  if (userId !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden: cannot update other user' });
  }

  const { fullName, password } = req.body;

  try {
    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (password) updateData.password = await bcrypt.hash(password, 10);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    res.json({ message: 'User updated', user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

async function deleteStudent(req, res) {
  const userId = Number(req.params.id);
  if (userId !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden: cannot delete other user' });
  }

  try {
    await prisma.user.delete({ where: { id: userId } });
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

async function getAllStudents(req, res) {
  try {
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: { id: true, studentId: true, fullName: true },
    });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

async function adminDeleteStudent(req, res) {
  const userId = Number(req.params.id);
  try {
    await prisma.user.delete({ where: { id: userId } });
    res.json({ message: 'Student deleted by admin' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  registerStudent,
  updateStudent,
  deleteStudent,
  getAllStudents,
  adminDeleteStudent,
};
