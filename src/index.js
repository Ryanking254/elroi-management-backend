require('dotenv').config();
const express = require('express');
const cors = require('cors');

const categoriesRouter = require('./routes/categories');
const itemsRouter = require('./routes/items');
const movementsRouter = require('./routes/movements');
const reportsRouter = require('./routes/reports');
const invitationsRouter = require('./routes/invitations');
const shopRouter = require('./routes/shop');
const authRouter = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Elroi Inventory API is running' });
});

// API routes
app.use('/api/categories', categoriesRouter);
app.use('/api/items', itemsRouter);
app.use('/api/movements', movementsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/invitations', invitationsRouter);
app.use('/api/team', invitationsRouter);
app.use('/api/shop', shopRouter);
app.use('/api/auth', authRouter);

// 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Elroi Inventory API running on http://localhost:${PORT}`);
});
