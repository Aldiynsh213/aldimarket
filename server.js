
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./api/auth');
const productRoutes = require('./api/products');
const orderRoutes = require('./api/orders');
const adminRoutes = require('./api/admin');
const paymentRoutes = require('./api/payment');

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(['/storage', '/api/storage', '/node_modules'], (_req, res, next) => {
  res.status(403).json({ error: 'Akses ditolak.' });
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'Aldi Market API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);

app.use(express.static(path.join(__dirname, 'public'), { index: false }));

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Aldi Market running at http://localhost:${PORT}`);
});
