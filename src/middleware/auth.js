const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

async function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization;

    // Try real token first
    if (header && header.startsWith('Bearer ')) {
      try {
        const token = header.slice(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
        if (user) {
          req.user = user;
          return next();
        }
      } catch (tokenErr) {
        // ignore invalid token and fall back to dev user
      }
    }

    // ========== DEVELOPMENT FALLBACK ==========
    // 1. Ensure a shop exists
    let shop = await prisma.shop.findFirst();
    if (!shop) {
      shop = await prisma.shop.create({
        data: { name: 'Elroi Shop' },
      });
      console.log('Created default shop:', shop.id);
    }

    // 2. Find owner by email first (more reliable)
    let owner = await prisma.user.findUnique({
      where: { email: 'owner@elroi.com' },
    });

    if (owner) {
      // Make sure the existing user is linked to the shop and is owner
      if (owner.shopId !== shop.id || owner.role !== 'owner') {
        owner = await prisma.user.update({
          where: { id: owner.id },
          data: {
            shopId: shop.id,
            role: 'owner',
            name: owner.name || 'Alex Owner',
          },
        });
        console.log('Updated existing owner to current shop');
      }
    } else {
      // Create new owner
      owner = await prisma.user.create({
        data: {
          email: 'owner@elroi.com',
          name: 'Alex Owner',
          role: 'owner',
          shopId: shop.id,
        },
      });
      console.log('Created default owner');
    }

    req.user = owner;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({
      message: 'Auth error',
      detail: err.message,
    });
  }
}

module.exports = authMiddleware;