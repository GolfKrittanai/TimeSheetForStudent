const prisma = require('../prismaClient');

// 🔹 นักศึกษา: ดู timesheet ของตัวเอง
async function getTimesheets(req, res) {
  const userId = req.user.id;
  const role = req.user.role;

  try {
    if (role === 'ADMIN') {
      const all = await prisma.timeSheet.findMany({
        include: { user: true },
      });
      return res.json(all);
    }

    // STUDENT
    const studentSheets = await prisma.timeSheet.findMany({
      where: { userId },
    });
    return res.json(studentSheets);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

// 🔹 นักศึกษา: เพิ่มของตัวเอง
async function createTimesheet(req, res) {
  const { date, startTime, endTime, description } = req.body;
  const userId = req.user.id;

  if (!date || !startTime || !endTime) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  try {
    const timesheet = await prisma.timeSheet.create({
      data: {
        userId,
        date: new Date(date),
        startTime,
        endTime,
        description,
      },
    });

    res.status(201).json(timesheet);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

// 🔹 แอดมิน: แก้ไขข้อมูลของใครก็ได้
async function updateTimesheet(req, res) {
  const id = Number(req.params.id);
  const { date, startTime, endTime, description } = req.body;

  try {
    const updated = await prisma.timeSheet.update({
      where: { id },
      data: {
        ...(date && { date: new Date(date) }),
        ...(startTime && { startTime }),
        ...(endTime && { endTime }),
        ...(description && { description }),
      },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Update failed' });
  }
}

// 🔹 แอดมิน: ลบ timesheet ใดก็ได้
async function deleteTimesheet(req, res) {
  const id = Number(req.params.id);

  try {
    await prisma.timeSheet.delete({ where: { id } });
    res.json({ message: 'Timesheet deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Delete failed' });
  }
}

module.exports = {
  getTimesheets,
  createTimesheet,
  updateTimesheet,
  deleteTimesheet,
};
