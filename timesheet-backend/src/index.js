// timesheet-backend/src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Routes
const profileRoutes = require('./routes/profileRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const timesheetRoutes = require('./routes/timesheetRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reportRoutes = require('./routes/reportRoutes');
const documentRoutes = require('./routes/documentRoutes');

const app = express();

/* ------------------------------- CORS SETUP ------------------------------- */
const allowList = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // อนุญาต no-origin เช่น <img src="...">, curl, postman
    if (!origin) return callback(null, true);
    
    // หากอนุญาตทั้งหมดใน dev หรือระบุ origin ตรงใน allowList
    if (allowList.length === 0 || allowList.includes(origin) || allowList.includes('*')) {
      return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};

// วาง CORS สำหรับ API General
app.use(cors(corsOptions));

/* ------------------------------ BODY PARSERS ------------------------------ */
app.use(express.json());

/* ---------------------------- STATIC FILES ------------------------------- */
// 🟢 แก้ไข: ชี้ถอยหลัง 1 ชั้น (../uploads) ให้ตรงกับโฟลเดอร์ที่ multer บันทึกไฟล์จริง
const uploadsPath = path.join(__dirname, '../uploads');

// ตรวจสอบและสร้างโฟลเดอร์อัตโนมัติหากยังไม่มี (ป้องกัน Error บน Render)
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

app.use('/uploads', cors(), express.static(uploadsPath));

/* --------------------------------- ROUTES -------------------------------- */
app.use('/api/reports', reportRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/timesheets', timesheetRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/documents', documentRoutes);

/* -------------------------------- START ---------------------------------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

/* ------------------------------- CRON JOBS -------------------------------- */
require('./cron/cronJob');