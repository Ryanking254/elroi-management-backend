const { v4: uuidv4 } = require('uuid');
const prisma = require('../lib/prisma');

async function create(req, res) {
  try {
    const { email, role = 'staff' } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const invitation = await prisma.invitation.create({
      data: {
        email: email.toLowerCase().trim(),
        role,
        token,
        shopId: req.user.shopId,
        invitedById: req.user.id,
        expiresAt,
      },
    });

    // In production you would send an email here
    res.status(201).json({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      token: invitation.token,
      expiresAt: invitation.expiresAt,
      inviteLink: `${process.env.FRONTEND_URL || 'http://localhost:8081'}/invite/${token}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create invitation' });
  }
}

async function getTeam(req, res) {
  try {
    const users = await prisma.user.findMany({
      where: { shopId: req.user.shopId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch team' });
  }
}

module.exports = { create, getTeam };
