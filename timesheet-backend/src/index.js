require("dotenv").config();
const express = require("express");
const cors = require("cors");

const profileRoutes = require("./routes/profileRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const timesheetRoutes = require("./routes/timesheetRoutes");
const adminRoutes = require("./routes/adminRoutes"); // ✅ ต้องเพิ่ม

const app = express();

// CORS Configuration: อนุญาตให้ frontend ที่ deploy บน Render สามารถเข้าถึง API
const corsOptions = {
  origin: "https://timesheetforstudent-front.onrender.com",  // URL ของ frontend ที่ deploy บน Render
  methods: "GET,POST,PUT,DELETE",  // วิธีการที่อนุญาตให้ frontend ใช้
  allowedHeaders: "Content-Type,Authorization",  // หัวข้อที่อนุญาต
};

// ใช้ CORS กับการตั้งค่าที่กำหนด
app.use(cors(corsOptions));

app.use(express.json());

// ใช้ routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/timesheets", timesheetRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/admin", adminRoutes); // ✅ เพิ่มตรงนี้ให้ถูก path

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
