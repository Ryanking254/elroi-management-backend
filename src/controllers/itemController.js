const prisma = require('../lib/prisma');

async function getAll(req, res) {
  try {
    const items = await prisma.item.findMany({
      where: { shopId: req.user.shopId },
      include: { category: true },
      orderBy: { name: 'asc' },
    });
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch items' });
  }
}

async function getById(req, res) {
  try {
    const item = await prisma.item.findFirst({
      where: { id: req.params.id, shopId: req.user.shopId },
      include: { category: true },
    });
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch item' });
  }
}

async function create(req, res) {
  try {
    const { name, categoryId, costPrice, sellingPrice, currentStock, lowStockThreshold } = req.body;

    if (!name || costPrice === undefined || !categoryId) {
      return res.status(400).json({ message: 'name, categoryId and costPrice are required' });
    }

    const category = await prisma.category.findFirst({
      where: { id: categoryId, shopId: req.user.shopId },
    });
    if (!category) {
      return res.status(400).json({ message: 'Category not found' });
    }

    const item = await prisma.item.create({
      data: {
        name: name.trim(),
        categoryId,
        costPrice: Number(costPrice),
        sellingPrice: sellingPrice != null ? Number(sellingPrice) : null,
        currentStock: currentStock ? Number(currentStock) : 0,
        lowStockThreshold: lowStockThreshold ? Number(lowStockThreshold) : 5,
        shopId: req.user.shopId,
      },
      include: { category: true },
    });

    // If initial stock > 0, create an IN movement
    if (item.currentStock > 0) {
      await prisma.stockMovement.create({
        data: {
          itemId: item.id,
          type: 'IN',
          quantity: item.currentStock,
          unitCost: item.costPrice,
          totalCost: item.currentStock * item.costPrice,
          note: 'Initial stock',
          performedById: req.user.id,
          shopId: req.user.shopId,
        },
      });
    }

    res.status(201).json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create item' });
  }
}

async function update(req, res) {
  try {
    const { id } = req.params;
    const data = {};
    if (req.body.name) data.name = req.body.name.trim();
    if (req.body.costPrice != null) data.costPrice = Number(req.body.costPrice);
    if (req.body.sellingPrice != null) data.sellingPrice = Number(req.body.sellingPrice);
    if (req.body.lowStockThreshold != null) data.lowStockThreshold = Number(req.body.lowStockThreshold);
    if (req.body.categoryId) data.categoryId = req.body.categoryId;

    const result = await prisma.item.updateMany({
      where: { id, shopId: req.user.shopId },
      data,
    });

    if (result.count === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const item = await prisma.item.findUnique({
      where: { id },
      include: { category: true },
    });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update item' });
  }
}

async function adjustStock(req, res) {
  try {
    const { id } = req.params;
    const { type, quantity, note } = req.body; // type = IN | OUT

    if (!['IN', 'OUT'].includes(type) || !quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Valid type (IN/OUT) and positive quantity required' });
    }

    const item = await prisma.item.findFirst({
      where: { id, shopId: req.user.shopId },
    });
    if (!item) return res.status(404).json({ message: 'Item not found' });

    const qty = Number(quantity);
    const newStock = type === 'IN' ? item.currentStock + qty : item.currentStock - qty;

    if (newStock < 0) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    const [updatedItem, movement] = await prisma.$transaction([
      prisma.item.update({
        where: { id },
        data: { currentStock: newStock },
      }),
      prisma.stockMovement.create({
        data: {
          itemId: id,
          type: type === 'IN' ? 'IN' : 'ADJUST',
          quantity: type === 'IN' ? qty : -qty,
          unitCost: item.costPrice,
          totalCost: type === 'IN' ? qty * item.costPrice : 0,
          note: note || null,
          performedById: req.user.id,
          shopId: req.user.shopId,
        },
      }),
    ]);

    res.json({ item: updatedItem, movement });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to adjust stock' });
  }
}

async function recordSale(req, res) {
  try {
    const { id } = req.params;
    const { quantity, saleAmount, note } = req.body;

    if (!quantity || quantity <= 0 || saleAmount == null) {
      return res.status(400).json({ message: 'quantity and saleAmount are required' });
    }

    const item = await prisma.item.findFirst({
      where: { id, shopId: req.user.shopId },
    });
    if (!item) return res.status(404).json({ message: 'Item not found' });

    const qty = Number(quantity);
    if (item.currentStock < qty) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    const unitSalePrice = Number(saleAmount) / qty;
    const totalRevenue = Number(saleAmount);
    const totalCost = qty * item.costPrice;
    const profit = totalRevenue - totalCost;

    const [updatedItem, movement] = await prisma.$transaction([
      prisma.item.update({
        where: { id },
        data: { currentStock: item.currentStock - qty },
      }),
      prisma.stockMovement.create({
        data: {
          itemId: id,
          type: 'SALE',
          quantity: qty,
          unitCost: item.costPrice,
          unitSalePrice,
          totalRevenue,
          totalCost,
          profit,
          note: note || null,
          performedById: req.user.id,
          shopId: req.user.shopId,
        },
      }),
    ]);

    res.status(201).json({ item: updatedItem, movement });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to record sale' });
  }
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  adjustStock,
  recordSale,
};
