const prisma = require('../lib/prisma');

async function getAll(req, res) {
  try {
    const categories = await prisma.category.findMany({
      where: { shopId: req.user.shopId },
      orderBy: { name: 'asc' },
    });
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
}

async function create(req, res) {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const existing = await prisma.category.findFirst({
      where: {
        shopId: req.user.shopId,
        name: name.trim(),
      },
    });

    if (existing) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        shopId: req.user.shopId,
      },
    });

    res.status(201).json(category);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create category' });
  }
}

async function update(req, res) {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const category = await prisma.category.updateMany({
      where: { id, shopId: req.user.shopId },
      data: { name: name?.trim() },
    });

    if (category.count === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const updated = await prisma.category.findUnique({ where: { id } });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update category' });
  }
}

async function remove(req, res) {
  try {
    const { id } = req.params;

    const result = await prisma.category.deleteMany({
      where: { id, shopId: req.user.shopId },
    });

    if (result.count === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete category' });
  }
}

module.exports = { getAll, create, update, remove };
