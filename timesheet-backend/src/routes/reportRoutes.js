// reportRoutes.js
const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient"); // import prisma client
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");

// middleware สำหรับตรวจสอบ user และ role (สมมติ)
const authenticate = (req, res, next) => {
  // สมมติรับ user info จาก token
  // ตัวอย่าง
  req.user = {
    id: "S12345",
    role: "student", // หรือ "admin"
  };
  next();
};

// GET /api/reports/timesheets?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&startStudentId=&endStudentId=
// ดึงข้อมูล timesheet เพื่อ preview
router.get("/timesheets", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === "admin";
    const { startDate, endDate, startStudentId, endStudentId } = req.query;

    if (!startDate || !endDate)
      return res.status(400).json({ message: "กรุณาระบุช่วงวันที่" });

    let where = {
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    };

    if (isAdmin) {
      if (startStudentId && endStudentId) {
        where.studentId = {
          gte: startStudentId,
          lte: endStudentId,
        };
      }
    } else {
      where.studentId = userId;
    }

    const timesheets = await prisma.timesheet.findMany({
      where,
      orderBy: { date: "asc" },
    });

    res.json(timesheets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "เกิดข้อผิดพลาด" });
  }
});

// POST /api/reports/export
// ส่ง body: {startDate, endDate, startStudentId?, endStudentId?, format}
router.post("/export", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === "admin";
    const { startDate, endDate, startStudentId, endStudentId, format } = req.body;

    if (!startDate || !endDate)
      return res.status(400).json({ message: "กรุณาระบุช่วงวันที่" });

    let where = {
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    };

    if (isAdmin) {
      if (startStudentId && endStudentId) {
        where.studentId = {
          gte: startStudentId,
          lte: endStudentId,
        };
      }
    } else {
      where.studentId = userId;
    }

    const timesheets = await prisma.timesheet.findMany({
      where,
      orderBy: { date: "asc" },
    });

    if (format === "pdf") {
      // สร้าง PDF ด้วย pdfkit
      const doc = new PDFDocument();
      let buffers = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        let pdfData = Buffer.concat(buffers);
        res.writeHead(200, {
          "Content-Length": Buffer.byteLength(pdfData),
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename=timesheet_${startDate}_${endDate}.pdf`,
        }).end(pdfData);
      });

      doc.fontSize(20).text("Timesheet Report", { align: "center" });
      doc.moveDown();

      timesheets.forEach((ts) => {
        doc
          .fontSize(12)
          .text(
            `Date: ${ts.date.toISOString().slice(0, 10)} | StudentID: ${ts.studentId} | Hours: ${ts.hours} | Activity: ${ts.activity}`
          );
      });

      doc.end();
    } else if (format === "excel") {
      // สร้าง Excel ด้วย exceljs
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Timesheet Report");

      worksheet.columns = [
        { header: "Date", key: "date", width: 15 },
        { header: "Student ID", key: "studentId", width: 15 },
        { header: "Hours", key: "hours", width: 10 },
        { header: "Activity", key: "activity", width: 30 },
      ];

      timesheets.forEach((ts) => {
        worksheet.addRow({
          date: ts.date.toISOString().slice(0, 10),
          studentId: ts.studentId,
          hours: ts.hours,
          activity: ts.activity,
        });
      });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=timesheet_${startDate}_${endDate}.xlsx`
      );

      await workbook.xlsx.write(res);
      res.end();
    } else {
      res.status(400).json({ message: "Invalid format" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "เกิดข้อผิดพลาด" });
  }
});

module.exports = router;
