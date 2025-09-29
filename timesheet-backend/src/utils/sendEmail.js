// timesheet-backend/src/utils/sendEmail.js
const nodemailer = require('nodemailer');

async function sendEmail({ to, subject, html, text, from }) {
  const apiKey = process.env.RESEND_API_KEY;

  // ---- ส่งผ่าน Resend (HTTPS) ก่อน ----
  if (apiKey) {
    const payload = {
      from: from || process.env.RESEND_FROM || 'Timesheet <onboarding@resend.dev>',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text: text || ' ',
    };

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const body = await res.text();
    if (!res.ok) throw new Error(`Resend error: ${res.status} ${body}`);
    return true;
  }

  // ---- Fallback: SMTP (ใช้ตอน local) ----
  const port = Number(process.env.EMAIL_PORT) || 587;
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.EMAIL_USERNAME, pass: process.env.EMAIL_PASSWORD },
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
  });

  await transporter.verify();
  return transporter.sendMail({
    from: from || `"Timesheet system" <${process.env.EMAIL_USERNAME}>`,
    to, subject, html, text,
  });
}

module.exports = sendEmail;
