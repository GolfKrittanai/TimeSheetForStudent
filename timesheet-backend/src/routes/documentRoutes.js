const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const upload = require('../middleware/uploadMiddleware');
const { authenticateToken } = require('../middleware/authMiddleware');

// Route อัปโหลดและสแกนเอกสาร (POST)
// สลับตำแหน่ง upload.single('file') ขึ้นก่อน
router.post('/upload-scan', upload.single('file'), authenticateToken, documentController.scanAndSaveDocument);

// Route ดึงประวัติการสแกนเอกสาร (GET)
router.get('/history/:userId', authenticateToken, documentController.getUserDocumentHistory);

// Route ยกเลิกเอกสารและลบไฟล์ (DELETE)
router.delete('/cancel/:id', authenticateToken, documentController.cancelDocument);

// Route ดึงเอกสารทุกคน สำหรับ admin/อาจารย์ตรวจสอบ (GET)
router.get('/admin/all', authenticateToken, documentController.getAllDocumentsForReview);

// Route บันทึกผลตรวจสอบเอกสาร ผ่าน/ไม่ผ่าน (PUT)
router.put('/review/:id', authenticateToken, documentController.reviewDocument);

module.exports = router;