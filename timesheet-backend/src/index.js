require("dotenv").config();
const express = require("express");
const cors = require("cors");

const profileRoutes = require("./routes/profileRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const timesheetRoutes = require("./routes/timesheetRoutes");
const adminRoutes = require("./routes/adminRoutes"); // ✅ ต้องเพิ่ม

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/timesheets", timesheetRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/admin", adminRoutes); // ✅ เพิ่มตรงนี้ให้ถูก path

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
