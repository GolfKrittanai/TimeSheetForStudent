const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const prisma = require('../prismaClient');
const nodemailer = require('nodemailer');
const cron = require('node-cron');

// ฟังก์ชันสร้าง PDF รายงาน
async function generatePDFReport(data, filePath) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 30, size: 'A4' });
        const writeStream = fs.createWriteStream(filePath);
        doc.pipe(writeStream);

        // 👇 ลงทะเบียนฟอนต์ไทย
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

        writeStream.on('finish', () => resolve());
        writeStream.on('error', (err) => reject(err));
    });
}

// ฟังก์ชันสร้าง Excel รายงาน
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
}

// ฟังก์ชันส่งอีเมลพร้อมไฟล์แนบ
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
}

// ตั้งเวลา cron job ทุกวัน 19:00 น.
cron.schedule("0 19 * * *", async () => {
    try {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

        // ดึงข้อมูล timesheet พร้อม user relation (ต้องแก้จาก student เป็น user ตาม schema)
        const timesheets = await prisma.timesheet.findMany({
            where: {
                date: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
            include: {
                user: {
                    select: { studentId: true },
                },
            },
        });

        if (timesheets.length === 0) {
            console.log("ไม่มีข้อมูล Timesheet วันนี้");
            return;
        }

        // แปลงข้อมูล พร้อมคำนวณชั่วโมงจาก checkInTime - checkOutTime
        const data = timesheets.map(t => ({
            date: t.date,
            studentId: t.user.studentId,
            hours: ((t.checkOutTime.getTime() - t.checkInTime.getTime()) / (1000 * 60 * 60)).toFixed(2),
            activity: t.activity || "",
        }));

        // สร้าง path ไฟล์
        const pdfPath = path.join(__dirname, `timesheet_report_${today.toISOString().slice(0, 10)}.pdf`);
        const excelPath = path.join(__dirname, `timesheet_report_${today.toISOString().slice(0, 10)}.xlsx`);

        // สร้างไฟล์รายงาน
        await generatePDFReport(data, pdfPath);
        await generateExcelReport(data, excelPath);

        // ส่งอีเมลพร้อมไฟล์แนบ
        await sendEmailWithAttachment(pdfPath, `timesheet_report_${today.toISOString().slice(0, 10)}.pdf`);
        await sendEmailWithAttachment(excelPath, `timesheet_report_${today.toISOString().slice(0, 10)}.xlsx`);

        console.log("ส่งอีเมลรายงาน PDF และ Excel เรียบร้อย");
    } catch (error) {
        console.error("Error cron job:", error);
    }
});
