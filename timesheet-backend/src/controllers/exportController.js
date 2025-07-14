// src/controllers/exportController.js
exports.exportDailyForCron = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const where = {
      date: {
        gte: new Date(`${today}T00:00:00Z`),
        lte: new Date(`${today}T23:59:59Z`),
      },
    };

    const timesheets = await prisma.timeSheet.findMany({
      where,
      include: { student: true },
    });

    const formatted = timesheets.map((t) => ({
      studentId: t.user.studentId,   // ต้องมี studentId ใน model user ด้วย
      studentName: t.user.name,
      date: t.date.toISOString().split('T')[0],
      startTime: t.checkInTime,
      endTime: t.checkOutTime,
      activity: t.activity,
    }));


    const pdfFile = `exports/timesheet_${today}.pdf`;
    const excelFile = `exports/timesheet_${today}.xlsx`;

    await generatePDF(formatted, pdfFile);
    await generateExcel(formatted, excelFile);

    res.json({
      pdfPath: pdfFile,
      excelPath: excelFile,
    });
  } catch (error) {
    console.error('Export daily error:', error);
    res.status(500).json({ error: 'Daily export failed' });
  }
};
