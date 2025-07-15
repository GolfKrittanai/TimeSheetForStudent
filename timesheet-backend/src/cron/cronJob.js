const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const prisma = require('../prismaClient');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const logger = require('../logger/logger'); // ✅ เพิ่ม logger

// 🔹 ฟังก์ชันสร้าง PDF รายงาน
async function generatePDFReport(data, filePath) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 30, size: 'A4' });
        const writeStream = fs.createWriteStream(filePath);
        doc.pipe(writeStream);

        doc.registerFont('THSarabun', path.join(__dirname, '../fonts/THSarabunNew.ttf'));
        doc.font('THSarabun');

        doc.fontSize(18).text('รายงาน Timesheet ประจำวันที่ ' + new Date().toLocaleDateString(), { align: 'center' });
        doc.moveDown();

        data.forEach(item => {
            doc.fontSize(14).text(
                `วันที่: ${item.date.toISOString().slice(0, 10)} | รหัสนักศึกษา: ${item.studentId} | ชั่วโมง: ${item.hours} | กิจกรรม: ${item.activity}`
            );
        });

        doc.end();

        writeStream.on('finish', () => {
            logger.info(`✅ สร้าง PDF เสร็จสมบูรณ์: ${filePath}`);
            resolve();
        });
        writeStream.on('error', (err) => {
            logger.error(`❌ สร้าง PDF ล้มเหลว: ${err.message}`);
            reject(err);
        });
    });
}

// 🔹 ฟังก์ชันสร้าง Excel รายงาน
async function generateExcelReport(data, filePath) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Timesheet Report');

    sheet.columns = [
        { header: 'วันที่', key: 'date', width: 15 },
        { header: 'รหัสนักศึกษา', key: 'studentId', width: 20 },
        { header: 'จำนวนชั่วโมง', key: 'hours', width: 15 },
        { header: 'กิจกรรม', key: 'activity', width: 40 },
    ];

    data.forEach(item => {
        sheet.addRow({
            date: item.date.toISOString().slice(0, 10),
            studentId: item.studentId,
            hours: item.hours,
            activity: item.activity,
        });
    });

    await workbook.xlsx.writeFile(filePath);
    logger.info(`✅ สร้าง Excel เสร็จสมบูรณ์: ${filePath}`);
}

// 🔹 ฟังก์ชันส่งอีเมล
async function sendEmailWithAttachment(filePath, filename) {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    await transporter.sendMail({
        from: `"TimeSheet Bot" <${process.env.EMAIL_USER}>`,
        to: process.env.ADMIN_EMAIL,
        subject: "รายงาน TimeSheet ประจำวันที่ " + new Date().toLocaleDateString(),
        text: "กรุณาตรวจสอบไฟล์แนบรายงาน TimeSheet",
        attachments: [
            {
                filename,
                path: filePath,
            },
        ],
    });

    logger.info(`📧 ส่งอีเมลแนบไฟล์สำเร็จ: ${filename}`);
}

// 🔹 ตั้งเวลา cron job ทุกวัน 19:00 น.
cron.schedule("0 19 * * *", async () => {
    const now = new Date();
    logger.info("🕖 เริ่ม Cron Job รายงาน TimeSheet เวลา 19:00");

    try {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

        const timesheets = await prisma.timesheet.findMany({
            where: {
                date: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
            include: {
                user: { select: { studentId: true } },
            },
        });

        if (timesheets.length === 0) {
            logger.warn("⚠️ ไม่มีข้อมูล Timesheet สำหรับวันนี้");
            return;
        }

        const data = timesheets.map(t => ({
            date: t.date,
            studentId: t.user.studentId,
            hours: ((t.checkOutTime.getTime() - t.checkInTime.getTime()) / (1000 * 60 * 60)).toFixed(2),
            activity: t.activity || "",
        }));

        const dateString = today.toISOString().slice(0, 10);
        const pdfPath = path.join(__dirname, `timesheet_report_${dateString}.pdf`);
        const excelPath = path.join(__dirname, `timesheet_report_${dateString}.xlsx`);

        await generatePDFReport(data, pdfPath);
        await generateExcelReport(data, excelPath);

        await sendEmailWithAttachment(pdfPath, `timesheet_report_${dateString}.pdf`);
        await sendEmailWithAttachment(excelPath, `timesheet_report_${dateString}.xlsx`);

        logger.info("✅ Cron Job เสร็จสมบูรณ์: รายงานส่งเรียบร้อย");
    } catch (error) {
        logger.error(`❌ เกิดข้อผิดพลาดใน Cron Job: ${error.message}`);
    }
});
