const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

async function signup(req, res) {
  try {
    const { name, email, password, shopName } = req.body;

    if (!email || !password || !shopName) {
      return res.status(400).json({ message: 'email, password and shopName are required' });
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const shop = await prisma.shop.create({
      data: {
        name: shopName.trim(),
        currency: 'KES', // default to Kenyan Shilling
      },
    });

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        name: name?.trim() || 'Owner',
        password: hashed,
        role: 'owner',
        shopId: shop.id,
      },
    });

    const token = jwt.sign(
      { userId: user.id, shopId: shop.id, role: user.role },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '30d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        shopId: shop.id,
        shopName: shop.name,
        currency: shop.currency,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Signup failed' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { shop: true },
    });

    if (!user || !user.password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user.id, shopId: user.shopId, role: user.role },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        shopId: user.shopId,
        shopName: user.shop?.name,
        currency: user.shop?.currency || 'KES',
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Login failed' });
  }
}

async function me(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { shop: true },
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      shopId: user.shopId,
      shopName: user.shop?.name,
      currency: user.shop?.currency || 'KES',
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
}

module.exports = { signup, login, me };