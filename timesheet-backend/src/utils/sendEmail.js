// timesheet-backend/src/utils/sendEmail.js
const nodemailer = require('nodemailer');

/**
 * ส่งอีเมลแบบยืดหยุ่น
 * @param {Object} opts
 * @param {string} opts.to        - อีเมลผู้รับ
 * @param {string} opts.subject   - หัวข้อ
 * @param {string} [opts.html]    - เนื้อหา HTML
 * @param {string} [opts.text]    - เนื้อหาแบบตัวหนังสือ (fallback)
 * @param {string} [opts.from]    - ใช้แทนค่า default ใน env ได้
 */
async function sendEmail({ to, subject, html, text, from }) {
  const port = Number(process.env.EMAIL_PORT) || 587;
  const isSecure = port === 465; // 465 = SMTPS

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port,
    secure: isSecure,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: from || `"Timesheet system" <${process.env.EMAIL_USERNAME}>`,
    to,
    subject,
    html,
    text,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (err) {
    // log แล้วโยนต่อให้ controller จัดการ
    console.error('sendEmail error:', err);
    throw err;
  }
}

module.exports = sendEmail;
