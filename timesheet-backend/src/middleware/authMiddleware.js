const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token ไม่ถูกต้อง' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token หมดอายุหรือไม่ถูกต้อง' });
    req.user = user; // user = { id, role }
    next();
  });
}

function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'ไม่ได้รับสิทธิ์เข้าใช้งาน' });
    }
    next();
  };
}

module.exports = { authenticateToken, authorizeRoles };
