const express = require("express");
const path = require("path");
const router = express.Router();
const prisma = require("../prismaClient");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");
const thaiFontPath = path.join(__dirname, "../fonts/THSarabunNew.ttf");
const { authenticateToken } = require("../middleware/authMiddleware");
const logger = require("../logger/logger"); // ✅ เพิ่ม logger

// 🔹 ฟังก์ชันดึงข้อมูล timesheet
const fetchTimesheetData = async ({
  startDate,
  endDate,
  isAdmin,
  userId,
  startStudentId,
  endStudentId,
}) => {
  const dateFilter = {
    gte: new Date(startDate),
    lte: new Date(endDate),
  };

  let userIds = [];

  if (isAdmin) {
    if (startStudentId && endStudentId) {
      const users = await prisma.user.findMany({
        where: {
          studentId: {
            gte: startStudentId,
            lte: endStudentId,
          },
        },
        select: { id: true },
      });
      userIds = users.map((u) => u.id);
    } else {
      const users = await prisma.user.findMany({ select: { id: true } });
      userIds = users.map((u) => u.id);
    }
  } else {
    userIds = [userId];
  }

  const timesheets = await prisma.timesheet.findMany({
    where: {
      date: dateFilter,
      userId: { in: userIds },
    },
    include: { user: { select: { studentId: true } } },
    orderBy: { date: "asc" },
  });

  return timesheets.map((t) => ({
    date: t.date,
    studentId: t.user.studentId,
    hours: ((new Date(t.checkOutTime) - new Date(t.checkInTime)) / 3600000).toFixed(2),
    activity: t.activity || "",
  }));
};

// 🔹 GET preview
router.get("/timesheets", authenticateToken, async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    const { startDate, endDate, startStudentId, endStudentId } = req.query;

    if (!startDate || !endDate) {
      logger.warn("⚠️ Preview: ไม่ระบุวันที่ startDate หรือ endDate");
      return res.status(400).json({ message: "กรุณาระบุช่วงวันที่" });
    }

    const data = await fetchTimesheetData({
      startDate,
      endDate,
      isAdmin: role === "admin",
      userId,
      startStudentId,
      endStudentId,
    });

    logger.info(`👁️‍🗨️ Preview โดย ${role} ID ${userId}, วันที่ ${startDate} ถึง ${endDate}, จำนวน: ${data.length}`);
    res.json(data);
  } catch (error) {
    logger.error(`❌ Error preview timesheet: ${error.message}`);
    res.status(500).json({ message: "เกิดข้อผิดพลาด" });
  }
});

// 🔹 POST export
router.post("/export", authenticateToken, async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    let { startDate, endDate, startStudentId, endStudentId, format } = req.body;

    if (!startDate || !endDate) {
      logger.warn("⚠️ Export: ไม่ระบุวันที่ startDate หรือ endDate");
      return res.status(400).json({ message: "กรุณาระบุช่วงวันที่" });
    }

    if (!["pdf", "excel"].includes(format)) {
      logger.warn(`⚠️ Export: รูปแบบไฟล์ไม่ถูกต้อง: ${format}`);
      return res.status(400).json({ message: "รูปแบบไฟล์ไม่ถูกต้อง" });
    }

    if (role !== "admin") {
      startStudentId = null;
      endStudentId = null;
    }

    const data = await fetchTimesheetData({
      startDate,
      endDate,
      isAdmin: role === "admin",
      userId,
      startStudentId,
      endStudentId,
    });

    logger.info(`📤 Export โดย ${role} ID ${userId}, type: ${format}, วันที่: ${startDate} - ${endDate}, จำนวน: ${data.length}`);

    if (format === "pdf") {
      const doc = new PDFDocument();
      const buffers = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfData = Buffer.concat(buffers);
        res.writeHead(200, {
          "Content-Length": Buffer.byteLength(pdfData),
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename=timesheet_${startDate}_${endDate}.pdf`,
        }).end(pdfData);
      });

      doc.registerFont("THSarabun", thaiFontPath);
      doc.font("THSarabun").fontSize(18).text("รายงาน Timesheet", { align: "center" });
      doc.moveDown();

      data.forEach((item) => {
        doc.fontSize(12).text(
          `วันที่: ${item.date.toISOString().slice(0, 10)} | รหัสนักศึกษา: ${item.studentId} | ชั่วโมง: ${item.hours} | กิจกรรม: ${item.activity}`
        );
      });

      doc.end();
    } else if (format === "excel") {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Timesheet Report");

      worksheet.columns = [
        { header: "วันที่", key: "date", width: 15 },
        { header: "รหัสนักศึกษา", key: "studentId", width: 15 },
        { header: "จำนวนชั่วโมง", key: "hours", width: 10 },
        { header: "กิจกรรม", key: "activity", width: 30 },
      ];

      data.forEach((item) => {
        worksheet.addRow({
          date: item.date.toISOString().slice(0, 10),
          studentId: item.studentId,
          hours: item.hours,
          activity: item.activity,
        });
      });

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename=timesheet_${startDate}_${endDate}.xlsx`);
      await workbook.xlsx.write(res);
      res.end();
    }
  } catch (error) {
    logger.error(`❌ Export error: ${error.message}`);
    res.status(500).json({ message: "เกิดข้อผิดพลาด" });
  }
});

module.exports = router;
