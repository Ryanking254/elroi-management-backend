const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

async function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization;

    if (header && header.startsWith('Bearer ')) {
      const token = header.slice(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      if (user) {
        req.user = user;
        return next();
      }
    }

    return res.status(401).json({ message: 'Unauthorized – please login' });
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized – please login' });
  }
}

module.exports = authMiddleware;