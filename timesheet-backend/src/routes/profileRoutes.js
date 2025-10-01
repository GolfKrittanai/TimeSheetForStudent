// src/routes/profileRoutes.js
const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const { authenticateToken } = require("../middleware/authMiddleware");
const { createClient } = require("@supabase/supabase-js");

/* Supabase client */
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
const BUCKET = process.env.SUPABASE_BUCKET || "profile";

/* Multer memory storage */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /^image\/(png|jpe?g|webp)$/i.test(file.mimetype);
    cb(ok ? null : new Error("รองรับเฉพาะไฟล์ .jpg .jpeg .png .webp"), ok);
  },
});

/* PUT /api/profile/upload-avatar (Supabase) */
router.put(
  "/upload-avatar",
  authenticateToken,
  upload.single("profileImage"),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "กรุณาอัปโหลดไฟล์รูป" });

      const current = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { profileImage: true },
      });
      const oldUrl = current?.profileImage || "";

      const ext = (path.extname(req.file.originalname) || ".png").toLowerCase();
      const objectName = `profile/${req.user.id}_${Date.now()}${ext}`;

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(objectName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false,
        });
      if (upErr) {
        console.error("Supabase upload error:", upErr);
        return res.status(500).json({ message: "อัปโหลดไฟล์ไปที่ Storage ไม่สำเร็จ" });
      }

      const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${objectName}`;

      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: { profileImage: publicUrl },
        select: {
          id: true,
          role: true,
          fullName: true,
          studentId: true,
          email: true,
          phone: true,
          course: true,
          branch: true,             // << เพิ่ม branch
          semester: true,
          academicYear: true,
          companyName: true,
          internPosition: true,
          profileImage: true,
        },
      });

      // ลบรูปเก่าในบักเก็ต (ถ้าตรงบักเก็ตเดียวกัน)
      try {
        const base = `${process.env.SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`;
        if (oldUrl && oldUrl.startsWith(base)) {
          const oldObject = oldUrl.replace(base, "");
          await supabase.storage.from(BUCKET).remove([oldObject]);
        }
      } catch (rmErr) {
        console.warn("Remove old avatar failed:", rmErr?.message || rmErr);
      }

      return res.json({
        message: "อัปโหลดรูปโปรไฟล์สำเร็จ",
        profileImage: updatedUser.profileImage,
        user: updatedUser,
      });
    } catch (error) {
      console.error("อัปโหลดรูปโปรไฟล์ผิดพลาด:", error);
      return res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปโหลดรูปโปรไฟล์" });
    }
  }
);

/* GET /api/profile */
router.get("/", authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        role: true,
        fullName: true,
        studentId: true,
        email: true,
        phone: true,
        course: true,
        branch: true,            // << เพิ่ม branch
        semester: true,
        academicYear: true,
        companyName: true,
        internPosition: true,
        profileImage: true,
      },
    });
    return res.json(user);
  } catch (error) {
    console.error("โหลด profile error:", error);
    return res.status(500).json({ message: "โหลดข้อมูลโปรไฟล์ไม่สำเร็จ" });
  }
});

/* PUT /api/profile (update ฟิลด์ข้อความ) */
router.put("/", authenticateToken, async (req, res) => {
  const { fullName, email, phone, companyName, internPosition, branch } = req.body;
  const data = {};
  if (fullName !== undefined) data.fullName = fullName;
  if (email !== undefined) data.email = email;
  if (phone !== undefined) data.phone = phone;
  if (companyName !== undefined) data.companyName = companyName;
  if (internPosition !== undefined) data.internPosition = internPosition;
  if (branch !== undefined) data.branch = branch; // << รองรับ branch

  try {
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: {
        id: true,
        role: true,
        fullName: true,
        studentId: true,
        email: true,
        phone: true,
        course: true,
        branch: true,
        semester: true,
        academicYear: true,
        companyName: true,
        internPosition: true,
        profileImage: true,
      },
    });
    return res.json(updatedUser);
  } catch (error) {
    console.error("อัปเดต profile error:", error);
    return res.status(500).json({ message: "อัปเดตข้อมูลโปรไฟล์ไม่สำเร็จ" });
  }
});

/* PUT /api/profile/change-password */
router.put("/change-password", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบ" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    if (!user) return res.status(404).json({ message: "ไม่พบผู้ใช้" });
    if (!user.passwordHash)
      return res.status(400).json({ message: "ไม่มีรหัสผ่านในระบบ" });

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch)
      return res.status(400).json({ message: "รหัสผ่านปัจจุบันไม่ถูกต้อง" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });

    return res.json({ message: "เปลี่ยนรหัสผ่านสำเร็จ" });
  } catch (error) {
    console.error("เปลี่ยนรหัสผ่านผิดพลาด:", error);
    return res.status(500).json({ message: "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน" });
  }
});

module.exports = router;
