require('dotenv').config();
const express = require('express');
const cors = require('cors');

const profileRoutes = require('./routes/profileRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const timesheetRoutes = require('./routes/timesheetRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reportRoutes = require("./routes/reportRoutes");
const bodyParser = require("body-parser");

const app = express();

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// Routes
app.use("/api/reports", reportRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/timesheets', timesheetRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// ✅ เรียกใช้งาน cron job ที่ส่ง email เวลา 19:00 ทุกวัน
require('./cron/cronJob');
