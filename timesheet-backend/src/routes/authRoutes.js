const express = require('express');
const router = express.Router();

const { register, login, forgotPassword, resetPassword } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.get('/reset-password', (req, res) => {
  const base =
    process.env.RESET_PASSWORD_URL ||
    `${process.env.FRONTEND_URL || 'http://localhost:3000'}${process.env.RESET_PASSWORD_PATH || '/reset-password'}`;
  const url = `${base}?token=${encodeURIComponent(req.query.token || '')}`;
  res.redirect(url);
});


router.post('/reset-password', resetPassword);

module.exports = router;
