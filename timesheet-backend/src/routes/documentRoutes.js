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

module.exports = router;