const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const upload = require('../middleware/uploadMiddleware');

// Import แบบ Destructuring ให้ตรงกับ module.exports เดิม
const { authenticateToken } = require('../middleware/authMiddleware');

// Route อัปโหลดและสแกนเอกสาร (POST)
router.post('/upload-scan', authenticateToken, upload.single('file'), documentController.scanAndSaveDocument);

// Route ดึงประวัติการสแกนเอกสาร (GET)
router.get('/history/:userId', authenticateToken, documentController.getUserDocumentHistory);

// ใน documentRoutes.js
router.delete('/cancel/:id', authenticateToken, documentController.cancelDocument);

// Route ดึงเอกสารทุกคน สำหรับ admin/อาจารย์ตรวจสอบ (GET)
router.get('/admin/all', authenticateToken, documentController.getAllDocumentsForReview);

// Route บันทึกผลตรวจสอบเอกสาร ผ่าน/ไม่ผ่าน (PUT)
router.put('/review/:id', authenticateToken, documentController.reviewDocument);

module.exports = router;