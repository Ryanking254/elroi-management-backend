const prisma = require('../lib/prisma');

async function updateCurrency(req, res) {
  try {
    const { currency } = req.body;
    const allowed = ['KES', 'GBP', 'USD'];

    if (!allowed.includes(currency)) {
      return res.status(400).json({ message: 'Currency must be KES, GBP or USD' });
    }

    const shop = await prisma.shop.update({
      where: { id: req.user.shopId },
      data: { currency },
    });

    res.json(shop);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update currency' });
  }
}

async function getShop(req, res) {
  try {
    const shop = await prisma.shop.findUnique({
      where: { id: req.user.shopId },
    });
    res.json(shop);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch shop' });
  }
}

module.exports = { updateCurrency, getShop };