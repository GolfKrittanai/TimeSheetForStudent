const express = require('express');
const router = express.Router();

const { register, login, forgotPassword, resetPassword } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.get('/reset-password', (req, res) => {
  res.redirect(`http://localhost:3000/reset-password?token=${req.query.token}`);
});

router.post('/reset-password', resetPassword);

module.exports = router;
