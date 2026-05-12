
const express = require('express');
const auth = require('./auth-middleware');
const requireRole = require('./require-role');
const { readData, writeData, generateId, normalizePhone } = require('./data-store');

const router = express.Router();

router.use(auth);
router.use(requireRole('owner'));

function formatMonthKey(dateInput) {
  const date = new Date(dateInput);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

router.get('/dashboard', async (_req, res) => {
  try {
    const data = await readData();
    const orders = data.orders || [];
    const customers = (data.users || []).filter((user) => user.role === 'customer');
    const completedOrders = orders.filter((order) => order.status === 'done');
    const activeOrders = orders.filter((order) => ['pending', 'process'].includes(order.status));
    const revenue = completedOrders.reduce((sum, order) => sum + order.total, 0);
    const averageOrderValue = completedOrders.length ? Math.round(revenue / completedOrders.length) : 0;

    const monthlyMap = new Map();
    for (let i = 5; i >= 0; i -= 1) {
      const now = new Date();
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthlyMap.set(formatMonthKey(date), {
        label: date.toLocaleDateString('id-ID', { month: 'short' }),
        key: formatMonthKey(date),
        revenue: 0,
        orders: 0
      });
    }

    completedOrders.forEach((order) => {
      const monthKey = formatMonthKey(order.createdAt);
      if (monthlyMap.has(monthKey)) {
        const item = monthlyMap.get(monthKey);
        item.revenue += order.total;
        item.orders += 1;
      }
    });

    const productCounter = new Map();
    orders.forEach((order) => {
      order.items.forEach((item) => {
        const current = productCounter.get(item.id) || { id: item.id, name: item.name, qty: 0, revenue: 0, emoji: item.emoji };
        current.qty += item.qty;
        current.revenue += item.price * item.qty;
        productCounter.set(item.id, current);
      });
    });

    const topProducts = [...productCounter.values()]
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    const latestOrders = [...orders]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 8);

    res.json({
      stats: {
        revenue,
        totalOrders: orders.length,
        activeOrders: activeOrders.length,
        customers: customers.length,
        averageOrderValue
      },
      monthlyRevenue: [...monthlyMap.values()],
      topProducts,
      latestOrders
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Gagal mengambil dashboard.' });
  }
});

router.get('/orders', async (req, res) => {
  try {
    const data = await readData();
    let orders = [...(data.orders || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (req.query.status && req.query.status !== 'all') {
      orders = orders.filter((item) => item.status === req.query.status);
    }
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Gagal mengambil order admin.' });
  }
});

router.patch('/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body || {};
    const allowedStatus = ['pending', 'process', 'done', 'cancel'];
    if (!allowedStatus.includes(status)) {
      return res.status(400).json({ error: 'Status tidak valid.' });
    }

    const data = await readData();
    const order = data.orders.find((item) => item.id === req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order tidak ditemukan.' });
    }

    order.status = status;
    if (status === 'done') {
      order.paymentStatus = order.paymentMethod === 'cod' ? 'paid' : 'paid';
    }
    if (status === 'cancel') {
      order.paymentStatus = 'cancelled';
    }
    order.timeline = order.timeline || [];
    order.timeline.push({
      label: `Status diubah ke ${status}`,
      at: new Date().toISOString()
    });

    await writeData(data);
    res.json({ message: 'Status order diperbarui.', order });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Gagal memperbarui status order.' });
  }
});

router.get('/customers', async (_req, res) => {
  try {
    const data = await readData();
    const customers = (data.users || [])
      .filter((user) => user.role === 'customer')
      .map((user) => ({
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        phone: user.phone,
        createdAt: user.createdAt
      }));

    res.json({ customers });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Gagal mengambil data customer.' });
  }
});

router.get('/products', async (_req, res) => {
  try {
    const data = await readData();
    res.json({ products: data.products || [] });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Gagal mengambil produk admin.' });
  }
});

router.post('/products', async (req, res) => {
  try {
    const {
      name = '',
      category = 'atk',
      price = 0,
      desc = '',
      badge = '',
      img = '',
      emoji = '📦'
    } = req.body || {};

    if (!name.trim() || !Number(price)) {
      return res.status(400).json({ error: 'Nama dan harga produk wajib diisi.' });
    }

    const data = await readData();
    const nextId = Math.max(0, ...(data.products || []).map((item) => Number(item.id) || 0)) + 1;

    const product = {
      id: nextId,
      name: name.trim(),
      category,
      price: Number(price),
      desc: desc.trim(),
      badge: badge.trim() || null,
      img: img.trim(),
      emoji: emoji.trim() || '📦'
    };

    data.products.push(product);
    await writeData(data);

    res.status(201).json({ message: 'Produk berhasil ditambahkan.', product });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Gagal menambah produk.' });
  }
});

router.patch('/products/:id', async (req, res) => {
  try {
    const data = await readData();
    const product = data.products.find((item) => String(item.id) === String(req.params.id));

    if (!product) {
      return res.status(404).json({ error: 'Produk tidak ditemukan.' });
    }

    const payload = req.body || {};
    product.name = payload.name?.trim() || product.name;
    product.category = payload.category || product.category;
    product.price = Number(payload.price) || product.price;
    product.desc = payload.desc?.trim() ?? product.desc;
    product.badge = typeof payload.badge === 'string' ? (payload.badge.trim() || null) : product.badge;
    product.img = typeof payload.img === 'string' ? payload.img.trim() : product.img;
    product.emoji = typeof payload.emoji === 'string' ? (payload.emoji.trim() || '📦') : product.emoji;

    await writeData(data);
    res.json({ message: 'Produk berhasil diperbarui.', product });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Gagal mengubah produk.' });
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    const data = await readData();
    const before = data.products.length;
    data.products = data.products.filter((item) => String(item.id) !== String(req.params.id));

    if (data.products.length === before) {
      return res.status(404).json({ error: 'Produk tidak ditemukan.' });
    }

    await writeData(data);
    res.json({ message: 'Produk berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Gagal menghapus produk.' });
  }
});

router.get('/settings', async (_req, res) => {
  try {
    const data = await readData();
    res.json({ settings: data.settings || {} });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Gagal mengambil settings.' });
  }
});

router.patch('/settings/payment', async (req, res) => {
  try {
    const payload = req.body || {};
    const data = await readData();
    data.settings = data.settings || {};
    data.settings.payment = data.settings.payment || {};

    data.settings.payment.defaultMethod = payload.defaultMethod || data.settings.payment.defaultMethod || 'manual_wallet';
    data.settings.payment.walletType = payload.walletType || '';
    data.settings.payment.walletNumber = payload.walletNumber || '';
    data.settings.payment.walletHolder = payload.walletHolder || '';
    data.settings.payment.qrisImageUrl = payload.qrisImageUrl || '';
    data.settings.payment.instructions = payload.instructions || '';
    data.settings.payment.paypalEnabled = Boolean(payload.paypalEnabled);
    data.settings.payment.paypalClientId = payload.paypalClientId || '';
    data.settings.payment.paypalSecret = payload.paypalSecret || '';
    data.settings.payment.currency = payload.currency || 'IDR';

    await writeData(data);
    res.json({ message: 'Pengaturan payment berhasil disimpan.', payment: data.settings.payment });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Gagal menyimpan payment settings.' });
  }
});

module.exports = router;
