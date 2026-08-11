const prisma = require('../lib/prisma');

async function getDaily(req, res) {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ message: 'start and end dates are required' });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);

    const sales = await prisma.stockMovement.findMany({
      where: {
        shopId: req.user.shopId,
        type: 'SALE',
        date: { gte: startDate, lte: endDate },
      },
      select: {
        date: true,
        totalRevenue: true,
        totalCost: true,
        profit: true,
      },
    });

    // Group by day
    const map = {};
    for (const s of sales) {
      const day = s.date.toISOString().slice(0, 10);
      if (!map[day]) {
        map[day] = { date: day, revenue: 0, cost: 0, profit: 0 };
      }
      map[day].revenue += s.totalRevenue || 0;
      map[day].cost += s.totalCost || 0;
      map[day].profit += s.profit || 0;
    }

    const result = Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to generate daily report' });
  }
}

async function getSummary(req, res) {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ message: 'start and end dates are required' });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);

    const aggregations = await prisma.stockMovement.aggregate({
      where: {
        shopId: req.user.shopId,
        type: 'SALE',
        date: { gte: startDate, lte: endDate },
      },
      _sum: {
        totalRevenue: true,
        totalCost: true,
        profit: true,
      },
      _count: true,
    });

    res.json({
      revenue: aggregations._sum.totalRevenue || 0,
      cost: aggregations._sum.totalCost || 0,
      profit: aggregations._sum.profit || 0,
      salesCount: aggregations._count,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to generate summary' });
  }
}

module.exports = { getDaily, getSummary };
