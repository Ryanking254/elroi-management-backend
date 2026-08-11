const prisma = require('../lib/prisma');

async function getAll(req, res) {
  try {
    const { type, start, end, limit } = req.query;

    const where = { shopId: req.user.shopId };

    if (type) where.type = type;
    if (start || end) {
      where.date = {};
      if (start) where.date.gte = new Date(start);
      if (end) {
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);
        where.date.lte = endDate;
      }
    }

    const movements = await prisma.stockMovement.findMany({
      where,
      include: {
        item: { select: { id: true, name: true } },
        performedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { date: 'desc' },
      take: limit ? Number(limit) : undefined,
    });

    res.json(movements);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch movements' });
  }
}

module.exports = { getAll };
