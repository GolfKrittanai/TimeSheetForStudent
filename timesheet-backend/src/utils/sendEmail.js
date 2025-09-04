const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1. สร้าง Transporter (กำหนดค่าการเชื่อมต่อ SMTP)
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // 2. กำหนดรายละเอียดอีเมล
  const mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to: options.email,
    subject: options.subject,
    html: options.message,
  };

  // 3. ส่งอีเมล
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;