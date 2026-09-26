// routes/userRoutes.js (แก้ไขแล้ว)

const express = require("express");
const router = express.Router();

const prisma = require("../prismaClient");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/authMiddleware");

// ดึงรายชื่อผู้ใช้ทั้งหมด (Admin และ Teacher)
// ✅ เปลี่ยน authorizeRoles เป็น 'admin', 'teacher'
router.get(
  "/students",
  authenticateToken,
  authorizeRoles("admin", "teacher"),
  async (req, res) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          studentId: true,
          fullName: true,
          role: true,
          createdAt: true,
          // ✅ Fields สำหรับ AdminDashboard
          course: true,
          branch: true,
          semester: true,
          academicYear: true,
          companyName: true,
          internPosition: true,
          email: true,
          phone: true,
          // ✅ ดึงรายการเอกสารสแกนตาม Relation ใน schema.prisma
          documentScans: true,
          _count: {
            select: {
              timesheet: true, // แก้ไข: จาก 'timesheets' เป็น 'timesheet' เพื่อแก้ PrismaClientValidationError
            },
          },
        },
        orderBy: {
          studentId: "asc",
        },
      });
      res.json(users);
    } catch (error) {
      console.error("โหลด students error:", error);
      res
        .status(500)
        .json({
          message: "เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้",
          error: error.message,
        });
    }
  }
);

// แก้ไขข้อมูลผู้ใช้ (Admin และ Teacher)
// ✅ เปลี่ยน authorizeRoles เป็น 'admin', 'teacher' และเพิ่ม Security Check
router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("admin", "teacher"),
  async (req, res) => {
    const { id } = req.params;
    const {
      fullName,
      studentId,
      role,
      course,
      branch,
      semester,
      academicYear,
      companyName,
      internPosition,
      email,
      phone,
    } = req.body;

    // เพิ่ม 'teacher' เข้าใน validRoles
    const validRoles = ["student", "admin", "teacher"];

    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ message: "บทบาทไม่ถูกต้อง" });
    }

    // ป้องกันการแก้ไขบทบาทของ Admin คนปัจจุบันเป็นอย่างอื่น ถ้ามี Admin เหลือคนเดียว
    if (role && req.user.id === Number(id) && role !== "admin") {
      const adminCount = await prisma.user.count({ where: { role: "admin" } });
      if (adminCount <= 1) {
        return res
          .status(403)
          .json({ message: "ไม่สามารถเปลี่ยนบทบาทของ Admin คนสุดท้ายได้" });
      }
    }

    try {
      const updatedUser = await prisma.user.update({
        where: { id: Number(id) },
        data: {
          fullName,
          studentId,
          role,
          course,
          branch,
          semester,
          academicYear,
          companyName,
          internPosition,
          email,
          phone,
        },
        select: { id: true, fullName: true, role: true, studentId: true },
      });
      res.json(updatedUser);
    } catch (error) {
      if (error.code === "P2002") {
        // Unique constraint violation (studentId)
        return res
          .status(409)
          .json({ message: "รหัสประจำตัวนี้ถูกใช้งานแล้ว" });
      }
      console.error("อัปเดตผู้ใช้ error:", error);
      res
        .status(500)
        .json({
          message: "เกิดข้อผิดพลาดในการอัปเดตข้อมูลผู้ใช้",
          error: error.message,
        });
    }
  }
);

// ลบผู้ใช้ (Admin และ Teacher)
// ✅ เปลี่ยน authorizeRoles เป็น 'admin', 'teacher' และเพิ่ม Security Check
router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("admin", "teacher"),
  async (req, res) => {
    const userId = Number(req.params.id);

    // ป้องกัน Admin ลบตัวเอง
    if (req.user.id === userId) {
      // ตรวจสอบว่ามี Admin คนอื่นเหลืออยู่หรือไม่
      const adminCount = await prisma.user.count({ where: { role: "admin" } });
      if (req.user.role === "admin" && adminCount <= 1) {
        return res
          .status(403)
          .json({ message: "ไม่สามารถลบ Admin คนสุดท้ายได้" });
      }
    }

    try {
      await prisma.user.delete({ where: { id: userId } });
      res.json({ message: "ลบผู้ใช้เรียบร้อย" });
    } catch (error) {
      if (error.code === "P2025") {
        return res.status(404).json({ message: "ไม่พบผู้ใช้ที่ต้องการลบ" });
      }
      console.error("ลบผู้ใช้ error:", error);
      res
        .status(500)
        .json({ message: "เกิดข้อผิดพลาดในการลบผู้ใช้", error: error.message });
    }
  }
);

// ดึงข้อมูลสรุปสำหรับ Admin Dashboard (Admin และ Teacher)
// ✅ เปลี่ยน authorizeRoles เป็น 'admin', 'teacher'
router.get(
  "/admin/summary",
  authenticateToken,
  authorizeRoles("admin", "teacher"),
  async (req, res) => {
    try {
      const studentCount = await prisma.user.count({
        where: { role: "student" },
      });
      const timesheetCount = await prisma.timesheet.count();

      res.json({
        totalStudents: studentCount,
        totalTimesheets: timesheetCount,
      });
    } catch (error) {
      console.error("โหลด summary error:", error);
      res
        .status(500)
        .json({ message: "ไม่สามารถดึงข้อมูลสรุปได้", error: error.message });
    }
  }
);

// ดึง Timesheet ของนักศึกษาคนใดคนหนึ่ง (Admin และ Teacher)
// ✅ เปลี่ยน authorizeRoles เป็น 'admin', 'teacher'
router.get(
  "/students/:id/timesheets",
  authenticateToken,
  authorizeRoles("admin", "teacher"),
  async (req, res) => {
    const userId = Number(req.params.id);
    try {
      const student = await prisma.user.findUnique({
        where: { id: userId },
        select: { studentId: true, fullName: true, companyName: true }, // ดึงข้อมูลครบ
      });

      if (!student) {
        return res.status(404).json({ message: "ไม่พบนักศึกษา" });
      }

      const timesheets = await prisma.timesheet.findMany({
        where: { userId },
        orderBy: { date: "desc" },
      }); // ✅ ส่ง Object ที่มีคีย์ชัดเจน: student และ timesheets

      res.json({ student, timesheets });
    } catch (error) {
      console.error("โหลด timesheets ของนักศึกษา error:", error);
      res
        .status(500)
        .json({
          message: "ไม่สามารถดึงข้อมูล Timesheet ได้",
          error: error.message,
        });
    }
  }
);

module.exports = router;