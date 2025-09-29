// timesheet-backend/src/utils/emailTemplates.js
function buildResetPasswordEmail({
    fullName = "",
    resetURL,
    brandName = "TIMESHEET",
    // รูปหัวอีเมลจาก public ฝั่ง FE (Vercel)
    heroImage = `${process.env.FRONTEND_ORIGIN || "https://time-sheet-for-student.vercel.app"}/email/ResetPassword.png`,
    supportUrl = "https://time-sheet-for-student.vercel.app/help",
}) {
    const safeName = fullName || "ผู้ใช้งาน";

    const brandGreen = "#0B7A6B";
    const pageBg = "#F5F7F7";
    const textMuted = "#5A6970";
    const cardShadow = "0 6px 24px rgba(0,0,0,.08)";
    const radius = "14px";

    const html = `<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${brandName} - เปลี่ยนรหัสผ่าน</title>
  <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    @media screen { body,table,td,a { font-family: 'Kanit', Arial, Tahoma, sans-serif !important; } }
    a { text-decoration: none; }
  </style>
</head>
<body style="margin:0;padding:0;background:${pageBg};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">ลิงก์สำหรับเปลี่ยนรหัสผ่านในระบบ ${brandName}</div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${pageBg};">
    <tr>
      <td align="center" style="padding:28px 12px;">
        <!-- Card -->
        <table role="presentation" width="640" cellspacing="0" cellpadding="0" border="0"
               style="max-width:640px;width:100%;background:#FFFFFF;border-radius:${radius};box-shadow:${cardShadow};overflow:hidden;">

          <!-- HERO: รูปเต็มความกว้าง (ไม่มีพื้น/ไม่มีแถวชื่อแบรนด์) -->
          <tr>
            <td style="padding:0;line-height:0;">
              <img src="${heroImage}" alt="" width="640"
                   style="display:block;width:100%;max-width:640px;height:auto;border:0;outline:none;text-decoration:none;">
            </td>
          </tr>

          <tr>
            <td style="background:#FFFFFF;text-align:center;padding:18px 28px 10px 28px;">
              <div
                style="
                  font-family:'Kanit', Arial, Tahoma, sans-serif;
                  font-weight:1200;
                  font-size:32px;
                  letter-spacing:5px;
                  color:#0B7A6B;  /* ใช้สีแบรนด์ */
                  text-transform:uppercase;
                ">
                ${brandName}
              </div>
            </td>
          </tr>

          <!-- CONTENT -->
          <tr>
            <td style="padding:22px 28px 8px 28px;color:#293135;">
              <p style="margin:0 0 8px 0;font-weight:700;">เรียน คุณ ${safeName}</p>
              <p style="margin:0 0 18px 0;line-height:1.7;color:${textMuted}">
                เราได้รับคำขอรีเซ็ตรหัสผ่านสำหรับบัญชีของคุณในระบบ ${brandName}
                หากเป็นคำขอของคุณ กรุณากดปุ่มด้านล่างเพื่อเปลี่ยนรหัสผ่านใหม่
              </p>

              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto 12px auto;">
                <tr>
                  <td bgcolor="${brandGreen}" style="border-radius:10px;text-align:center;">
                    <a href="${resetURL}" target="_blank" rel="noopener"
                       style="display:inline-block;padding:12px 24px;font-weight:700;color:#FFFFFF;border-radius:10px;">
                      คลิกที่นี่
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:8px 0 6px 0;font-size:13px;color:${textMuted};text-align:center;">
                หรือคัดลอกลิงก์ด้านล่างแล้ววางในเบราว์เซอร์
              </p>
              <p style="margin:0 0 10px 0;font-size:12px;word-break:break-all;text-align:center;">
                <a href="${resetURL}" target="_blank" rel="noopener" style="color:${brandGreen};text-decoration:underline;">
                  ${resetURL}
                </a>
              </p>

              <hr style="border:none;height:1px;background:#ECF1EF;margin:20px 0;">
              <p style="margin:0 0 6px 0;font-size:13px;line-height:1.6;color:${textMuted}">
                หากคุณไม่ได้ร้องขอ สามารถละเว้นอีเมลฉบับนี้ได้
              </p>
              <p style="margin:0 0 6px 0;font-size:13px;line-height:1.6;color:${textMuted}">
                ต้องการความช่วยเหลือ? ไปที่ศูนย์ช่วยเหลือ:
                <a href="${supportUrl}" target="_blank" rel="noopener" style="color:${brandGreen};text-decoration:underline;">
                  ${supportUrl}
                </a>
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:12px 28px 24px 28px;text-align:center;color:${textMuted};font-size:13px;">
              © ${new Date().getFullYear()} ${brandName}
            </td>
          </tr>
        </table>
        <!-- /Card -->
      </td>
    </tr>
  </table>
</body>
</html>`;

    const text = [
        `เปลี่ยนรหัสผ่านในระบบ ${brandName}`,
        ``,
        `เรียน คุณ ${safeName}`,
        `เราได้รับคำขอรีเซ็ตรหัสผ่านของคุณ หากเป็นคำขอของคุณให้เปิดลิงก์นี้:`,
        `${resetURL}`,
        ``,
        `หากคุณไม่ได้ร้องขอ สามารถละเว้นอีเมลฉบับนี้ได้`,
        `ศูนย์ช่วยเหลือ: ${supportUrl}`,
        `© ${new Date().getFullYear()} ${brandName}`,
    ].join("\n");

    return { html, text, subject: `เปลี่ยนรหัสผ่านในระบบ ${brandName}` };
}

module.exports = { buildResetPasswordEmail };
