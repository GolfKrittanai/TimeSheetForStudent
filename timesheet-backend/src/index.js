require("dotenv").config();
const express = require("express");
const cors = require("cors");

const profileRoutes = require("./routes/profileRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const timesheetRoutes = require("./routes/timesheetRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

// ตั้งค่า CORS สำหรับการเชื่อมต่อจาก frontend
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://timesheetforstudent-front.onrender.com'  // สำหรับ production
    : 'http://localhost:3000',//ำหรับ development
  methods: 'GET,POST,PUT,DELETE',
  allowedHeaders: 'Content-Type,Authorization',
};
// เพิ่ม route นี้เข้าไปในไฟล์ index.js (backend)
app.get("/", (req, res) => {
  res.send("Backend is working properly.");
});


app.use(cors(corsOptions));  // ใช้ CORS กับการตั้งค่าที่กำหนด

app.use(express.json());

// ใช้ routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/timesheets", timesheetRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/admin", adminRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
