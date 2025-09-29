// timesheet-backend/src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Routes
const profileRoutes = require('./routes/profileRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const timesheetRoutes = require('./routes/timesheetRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();

/* ------------------------------- CORS SETUP ------------------------------- */
// อ่านโดเมนที่อนุญาตจาก env (คั่นด้วย comma)
const allowList = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// ฟังก์ชันตรวจ origin
const corsOptions = {
  origin: (origin, callback) => {
    // อนุญาต no-origin เช่น curl/postman หรือ health checks
    if (!origin) return callback(null, true);
    return callback(null, allowList.includes(origin));
  },
  credentials: true,                           // ถ้าต้องการส่งคุกกี้/Authorization header
  // methods: ['GET','HEAD','PUT','PATCH','POST','DELETE'],
  // allowedHeaders: ['Content-Type','Authorization'],
  // exposedHeaders: [], // ถ้าต้องการ expose header ให้ FE
};

// ต้องวาง cors ก่อน routes เสมอ
app.use(cors(corsOptions));

/* ------------------------------ BODY PARSERS ------------------------------ */
app.use(express.json());
// ถ้าใช้ express.json() แล้ว ไม่จำเป็นต้องใช้ body-parser ซ้ำ
// const bodyParser = require('body-parser');
// app.use(bodyParser.json());

/* --------------------------------- ROUTES -------------------------------- */
app.use('/api/reports', reportRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/timesheets', timesheetRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);

// ไฟล์อัปโหลด (รูปโปรไฟล์ ฯลฯ)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

/* -------------------------------- START ---------------------------------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

/* ------------------------------- CRON JOBS -------------------------------- */
require('./cron/cronJob');
