// src/routes/reportRoutes.js
const express = require("express");
const path = require("path");
const router = express.Router();

// ปรับ path prisma ตามโปรเจกต์ของคุณ (utils/prismaClient.js)
const prisma = require("../prismaClient");

// auth middleware (ถ้า path ต่างจากนี้ปรับให้ตรงโปรเจกต์)
const { authenticateToken } = require("../middleware/authMiddleware");

// libs สำหรับ export
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");

// ฟอนต์ไทย (วาง THSarabunNew.ttf ไว้ที่ src/fonts/)
const thaiFontPath = path.join(__dirname, "../fonts/THSarabunNew.ttf");

/* -------------------------
 * Utils
 * ------------------------*/
const fmtSemester = (sem) => {
  if (!sem) return "ทั้งหมด";
  if (String(sem) === "3") return "3 (ฤดูร้อน)";
  if (String(sem) === "ทั้งหมด") return "ทั้งหมด";
  return String(sem);
};
const fmtYear = (y) => (y ? String(y) : "ทั้งหมด");

function toThaiDatetime(d = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  const dt = new Date(d);
  const dd = pad(dt.getDate());
  const mm = pad(dt.getMonth() + 1);
  const yyyy = dt.getFullYear() + 543; // พ.ศ.
  const hh = pad(dt.getHours());
  const min = pad(dt.getMinutes());
  return `${dd}/${mm}/${yyyy} ${hh}:${min} น.`;
}

/* -------------------------
 * Build where จาก query
 * ------------------------*/
function buildStudentWhere(q) {
  const where = { role: "student" };

  if (q.semester) where.semester = String(q.semester);
  if (q.academicYear) where.academicYear = String(q.academicYear);
  if (q.course) where.course = String(q.course);

  if (q.studentId) where.studentId = { contains: String(q.studentId) };
  if (q.companyName) where.companyName = { contains: String(q.companyName) };
  if (q.internPosition) where.internPosition = { contains: String(q.internPosition) };
  if (q.branch) where.branch = { contains: String(q.branch) }; // เผื่ออนาคตอยากกรองสาขา

  return where;
}

const studentSelect = {
  studentId: true,
  fullName: true,
  companyName: true,
  internPosition: true,
  branch: true,
  course: true,
  semester: true,
  academicYear: true,
};

/* -------------------------
 * Preview (ตารางหน้า FE)
 * ------------------------*/
router.get("/students", authenticateToken, async (req, res) => {
  try {
    const where = buildStudentWhere(req.query);
    const list = await prisma.user.findMany({
      where,
      select: studentSelect,
      orderBy: [{ studentId: "asc" }],
      take: 200,
    });
    return res.json(list);
  } catch (err) {
    console.error("preview students error:", err);
    return res.status(500).json({ message: "โหลดตัวอย่างไม่สำเร็จ" });
  }
});

/* -------------------------
 * Export (PDF / Excel)
 * ------------------------*/
router.post("/students/export", authenticateToken, async (req, res) => {
  try {
    const { format = "pdf" } = req.body || {};
    const where = buildStudentWhere(req.body || {});
    const list = await prisma.user.findMany({
      where,
      select: studentSelect,
      orderBy: [{ studentId: "asc" }],
    });

    if (!list.length) {
      return res.status(404).json({ message: "ไม่พบข้อมูลตามเงื่อนไข" });
    }

    const filters = {
      semester: fmtSemester(req.body?.semester),
      academicYear: fmtYear(req.body?.academicYear),
      course: req.body?.course || "ทั้งหมด",
      companyName: req.body?.companyName || "ทั้งหมด",
      internPosition: req.body?.internPosition || "ทั้งหมด",
      generatedAt: new Date(),
    };

    if (String(format).toLowerCase() === "xlsx") {
      return exportStudentsXlsx(list, filters, res);
    }
    return exportStudentsPdf(list, filters, res);
  } catch (err) {
    console.error("export students error:", err);
    return res.status(500).json({ message: "ส่งออกไฟล์ไม่สำเร็จ" });
  }
});

/* =========================================================
 * Excel Export (ฟอร์แมตใช้งานจริง: หัวรายงาน/Freeze/AutoFilter)
 * ========================================================= */
function exportStudentsXlsx(list, filters, res) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("รายชื่อนักศึกษา");

  const title = "รายชื่อนักศึกษา (ฝึกงาน)";
  const subTitle = `ปีการศึกษา: ${filters.academicYear}   |   ภาคเรียน: ${filters.semester}`;
  const meta = `สร้างเมื่อ: ${toThaiDatetime(filters.generatedAt)}`;

  ws.mergeCells("A1:H1");
  ws.getCell("A1").value = title;
  ws.getCell("A1").font = { name: "TH Sarabun New", size: 18, bold: true };
  ws.getCell("A1").alignment = { horizontal: "center" };

  ws.mergeCells("A2:H2");
  ws.getCell("A2").value = subTitle;
  ws.getCell("A2").font = { name: "TH Sarabun New", size: 14 };
  ws.getCell("A2").alignment = { horizontal: "center" };

  ws.mergeCells("A3:H3");
  ws.getCell("A3").value = meta;
  ws.getCell("A3").font = { name: "TH Sarabun New", size: 12, color: { argb: "FF607D8B" } };
  ws.getCell("A3").alignment = { horizontal: "center" };

  ws.addRow([
    "ลำดับ",
    "รหัสประจำตัว",
    "ชื่อ-นามสกุล",
    "ชื่อสถานประกอบการ",
    "ตำแหน่งฝึกงาน",
    "หลักสูตร(ปี)",
    "สาขา",
    "ปี/ภาค",
  ]);
  const headerRow = ws.getRow(4);
  headerRow.font = { name: "TH Sarabun New", size: 12, bold: true };
  headerRow.alignment = { horizontal: "center", vertical: "middle" };
  headerRow.height = 22;

  list.forEach((it, idx) => {
    ws.addRow([
      idx + 1,
      it.studentId || "-",
      it.fullName || "-",
      it.companyName || "-",
      it.internPosition || "-",
      it.course || "-",
      it.branch || "-",
      `${it.academicYear || "-"} / ${fmtSemester(it.semester)}`,
    ]);
  });

  const widths = [8, 16, 28, 28, 18, 12, 16, 18];
  widths.forEach((w, i) => (ws.getColumn(i + 1).width = w));

  const lastRow = ws.lastRow.number;
  for (let r = 4; r <= lastRow; r++) {
    const row = ws.getRow(r);
    row.font = { name: "TH Sarabun New", size: 12 };
    row.alignment = { vertical: "middle" };
    row.height = 20;

    for (let c = 1; c <= 8; c++) {
      const cell = row.getCell(c);
      cell.border = {
        top: { style: "thin", color: { argb: "FFCFD8DC" } },
        left: { style: "thin", color: { argb: "FFCFD8DC" } },
        bottom: { style: "thin", color: { argb: "FFCFD8DC" } },
        right: { style: "thin", color: { argb: "FFCFD8DC" } },
      };
    }
    if (r % 2 === 0) {
      row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF6FAF9" } };
    }
  }

  ws.views = [{ state: "frozen", ySplit: 4 }];
  ws.autoFilter = { from: "A4", to: `H${lastRow}` };
  ["A", "B", "F", "G", "H"].forEach((col) => {
    for (let r = 4; r <= lastRow; r++) {
      ws.getCell(`${col}${r}`).alignment = { horizontal: "center", vertical: "middle" };
    }
  });

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", 'attachment; filename="students.xlsx"');
  wb.xlsx.write(res).then(() => res.end());
}

/* =========================================================
 * PDF Export (A4 landscape, เต็มหน้า, กันซ้อนทับ, ellipsis)
 * ========================================================= */
function exportStudentsPdf(list, filters, res) {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="students.pdf"');

  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 32 });
  doc.pipe(res);

  try {
    doc.registerFont("THSarabun", thaiFontPath);
    doc.font("THSarabun");
  } catch (_) {
    // ถ้าไม่มีไฟล์ฟอนต์ จะ fallback เป็น default
  }

  const pageW = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // สัดส่วนคอลัมน์รวม 1.00 (กินเต็มความกว้าง)
  const cols = [
    { key: "idx",            label: "ลำดับ",              w: 0.06, align: "center" },
    { key: "studentId",      label: "รหัสประจำตัว",        w: 0.12, align: "center" },
    { key: "fullName",       label: "ชื่อ-นามสกุล",         w: 0.18, align: "left"   },
    { key: "companyName",    label: "ชื่อสถานประกอบการ",    w: 0.28, align: "left"   },
    { key: "internPosition", label: "ตำแหน่งฝึกงาน",       w: 0.12, align: "left"   },
    { key: "branch",         label: "สาขา",                w: 0.14, align: "center" },
    { key: "course",         label: "หลักสูตร(ปี)",         w: 0.10, align: "center" },
  ];
  cols.forEach((c) => (c.px = Math.round(c.w * pageW)));
  const tableWidth = cols.reduce((s, c) => s + c.px, 0);

  // helpers
  const fitText = (text, width, fontSize = 12) => {
    if (text == null) return "-";
    const t = String(text);
    if (doc.widthOfString(t, { font: "THSarabun", size: fontSize }) <= width) return t;
    let out = t;
    while (
      out.length &&
      doc.widthOfString(out + "…", { font: "THSarabun", size: fontSize }) > width
    ) {
      out = out.slice(0, -1);
    }
    return out ? out + "…" : t;
  };

  const drawHeader = () => {
    doc.font("THSarabun").fontSize(20).text("รายชื่อนักศึกษา (ฝึกงาน)", { align: "center" });
    doc.moveDown(0.2);
    doc
      .fontSize(12)
      .fillColor("#455a64")
      .text(`ปีการศึกษา: ${filters.academicYear}   |   ภาคเรียน: ${filters.semester}`, {
        align: "center",
      })
      .fillColor("black");
    doc.moveDown(0.1);
    doc
      .fontSize(10)
      .fillColor("#607d8b")
      .text(`สร้างเมื่อ: ${toThaiDatetime(filters.generatedAt)}`, { align: "center" })
      .fillColor("black");
    doc.moveDown(0.5);
  };

  const drawTableHeader = (x, y) => {
    const h = 26;
    doc.save();
    doc.rect(x, y, tableWidth, h).fill("#eef3f7").restore();
    doc.lineWidth(0.8).rect(x, y, tableWidth, h).stroke("#cfd8dc");

    let cx = x;
    cols.forEach((c) => {
      doc.fontSize(13).font("THSarabun").text(c.label, cx + 5, y + 6, {
        width: c.px - 10,
        align: c.align,
      });
      cx += c.px;
    });
    return y + h;
  };

  const drawRow = (x, y, data, idx) => {
    const h = 24;
    if (idx % 2 === 1) {
      doc.save();
      doc.rect(x, y, tableWidth, h).fill("#f7fbfa").restore();
    }
    doc.lineWidth(0.5).rect(x, y, tableWidth, h).stroke("#e0e0e0");

    const row = {
      idx: idx + 1,
      studentId: data.studentId || "-",
      fullName: fitText(data.fullName || "-", cols[2].px - 10),
      companyName: fitText(data.companyName || "-", cols[3].px - 10),
      internPosition: fitText(data.internPosition || "-", cols[4].px - 10),
      branch: fitText(data.branch || "-", cols[5].px - 10),
      course: fitText(data.course || "-", cols[6].px - 10),
    };

    let cx = x;
    cols.forEach((c) => {
      doc.fontSize(12).font("THSarabun").text(String(row[c.key]), cx + 5, y + 5, {
        width: c.px - 10,
        align: c.align,
      });
      cx += c.px;
    });
    return y + h;
  };

  const addFooter = () => {
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      const pageNum = i + 1;
      doc
        .fontSize(10)
        .fillColor("#607d8b")
        .text(
          `หน้า ${pageNum} / ${range.count}`,
          doc.page.margins.left,
          doc.page.height - doc.page.margins.bottom + 8,
          { width: pageW, align: "right" }
        )
        .fillColor("black");
    }
  };

  // ==== render ====
  const startX = doc.page.margins.left;
  let y = doc.page.margins.top;

  drawHeader();
  y = doc.y;                      // อัปเดต y หลังวาดหัวรายงาน (กันทับ)
  y = drawTableHeader(startX, y); // แล้วค่อยวาดหัวตาราง

  const rowHeight = 24;
  const bottomLimit = doc.page.height - doc.page.margins.bottom - 36;

  list.forEach((item, i) => {
    if (y + rowHeight > bottomLimit) {
      doc.addPage();
      y = doc.page.margins.top;
      drawHeader();
      y = doc.y;                      // อัปเดต y หลังหัวรายงานทุกหน้า
      y = drawTableHeader(startX, y);
    }
    y = drawRow(startX, y, item, i);
  });

  addFooter();
  doc.end();
}

module.exports = router;
