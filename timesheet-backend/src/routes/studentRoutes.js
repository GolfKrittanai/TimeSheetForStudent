const express = require('express');
const {
  registerStudent,
  updateStudent,
  deleteStudent,
  getAllStudents,
  adminDeleteStudent,
} = require('../controllers/studentController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.post('/register', registerStudent);

router.use(authenticateToken);

router.get('/', authorizeRoles('ADMIN'), getAllStudents);
router.delete('/:id', authorizeRoles('ADMIN'), adminDeleteStudent);

router.put('/:id', authorizeRoles('STUDENT'), updateStudent);
router.delete('/:id', authorizeRoles('STUDENT'), deleteStudent);

module.exports = router;
