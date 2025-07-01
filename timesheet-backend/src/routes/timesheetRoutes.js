const express = require('express');
const {
  getTimesheets,
  createTimesheet,
  updateTimesheet,
  deleteTimesheet,
} = require('../controllers/timesheetController');

const { authenticateToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

const router = express.Router();

// 🔐 ต้อง login ก่อนทุก endpoint
router.use(authenticateToken);

// 🔹 STUDENT: ดู / เพิ่มของตัวเอง
router.get('/', authorizeRoles('STUDENT', 'ADMIN'), getTimesheets);
router.post('/', authorizeRoles('STUDENT'), createTimesheet);

// 🔹 ADMIN: แก้ไข / ลบ timesheet ของใครก็ได้
router.put('/:id', authorizeRoles('ADMIN'), updateTimesheet);
router.delete('/:id', authorizeRoles('ADMIN'), deleteTimesheet);

module.exports = router;
