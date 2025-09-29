// timesheet-backend/src/utils/emailTemplates.js
function buildResetPasswordEmail({
  fullName = "",
  resetURL,
  brandName = "TIMESHEET",
  heroImage = "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200&auto=format&fit=crop",
  supportUrl = "#",
}) {
  const safeName = fullName || "ผู้ใช้งาน";
  const btnColor = "#0b7a6b";

  const html = `<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>เปลี่ยนรหัสผ่าน - ${brandName}</title>
<link href="https://fonts.googleapis.com/css2?family=Kanit:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
body{margin:0;background:#f3f6f5;color:#293135;font-family:'Kanit',Arial,Tahoma,sans-serif;}
a{color:${btnColor}}
.card{max-width:640px;margin:24px auto;background:#fff;border-radius:14px;box-shadow:0 6px 24px rgba(0,0,0,.08);overflow:hidden}
.card-header{background:#e9f3f1;text-align:center;padding:28px 20px 18px}
.brand{font-size:28px;font-weight:800;letter-spacing:4px;color:${btnColor};margin:8px 0 0}
.hero{width:100%;display:block;max-height:220px;object-fit:cover}
.content{padding:28px 28px 18px}
.greeting{margin:0 0 4px;font-weight:700}
.note{margin:10px 0 22px;line-height:1.7;color:#516069}
.btn{background:${btnColor};color:#fff !important;display:inline-block;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:700}
.divider{height:1px;background:#ecf1ef;margin:24px 0}
.muted{color:#78848a;font-size:13px;line-height:1.6}
.center{text-align:center}
@media (max-width:480px){.content{padding:20px 18px 14px}.brand{font-size:24px;letter-spacing:3px}}
</style>
</head>
<body>
  <div class="card">
    <div class="card-header">
      <img src="${heroImage}" alt="" class="hero">
      <div class="brand">${brandName}</div>
    </div>
    <div class="content">
      <p class="greeting">เรียน คุณ ${safeName}</p>
      <p class="note">
        เราได้รับคำขอรีเซ็ตรหัสผ่านสำหรับบัญชีของคุณในระบบ ${brandName}<br>
        หากเป็นคำขอของคุณ กรุณากดปุ่มด้านล่างเพื่อเปลี่ยนรหัสผ่านใหม่
      </p>
      <p class="center"><a class="btn" href="${resetURL}" target="_blank" rel="noopener">เปลี่ยนรหัสผ่าน</a></p>
      <p class="muted center" style="margin:8px 0 6px;">หรือคัดลอกลิงก์ด้านล่างแล้ววางในเบราว์เซอร์</p>
      <p class="center" style="font-size:12px;word-break:break-all;margin:0 0 4px;">
        <a href="${resetURL}" target="_blank" rel="noopener">${resetURL}</a>
      </p>
      <div class="divider"></div>
      <p class="muted">
        หากคุณไม่ได้ร้องขอ สามารถละเว้นอีเมลฉบับนี้ได้<br>
        ต้องการความช่วยเหลือ? ไปที่ศูนย์ช่วยเหลือ: <a href="${supportUrl}" target="_blank" rel="noopener">${supportUrl}</a>
      </p>
    </div>
  </div>
  <p class="muted center" style="margin:10px 0;">© ${new Date().getFullYear()} ${brandName}</p>
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
    `© ${new Date().getFullYear()} ${brandName}`,
  ].join("\n");

  return { html, text, subject: `เปลี่ยนรหัสผ่านในระบบ ${brandName}` };
}

module.exports = { buildResetPasswordEmail };
