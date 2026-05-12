
const express = require('express');
const auth = require('./auth-middleware');
const { readData, writeData, generateId, buildPaymentInstructions } = require('./data-store');

const router = express.Router();

router.get('/me', auth, async (req, res) => {
  try {
    const data = await readData();
    const orders = (data.orders || [])
      .filter((order) => order.userId === req.user.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Gagal mengambil pesanan.' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const {
      items = [],
      recipient = {},
      paymentMethod = 'manual_wallet'
    } = req.body || {};

    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: 'Keranjang kosong.' });
    }

    if (!recipient.name || !recipient.phone || !recipient.address) {
      return res.status(400).json({ error: 'Data pengiriman belum lengkap.' });
    }

    const data = await readData();
    const productMap = new Map((data.products || []).map((item) => [String(item.id), item]));

    const normalizedItems = [];
    let total = 0;

    for (const item of items) {
      const product = productMap.get(String(item.id));
      const qty = Number(item.qty) || 0;
      if (!product || qty <= 0) continue;

      const lineTotal = product.price * qty;
      total += lineTotal;

      normalizedItems.push({
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
        qty,
        emoji: product.emoji,
        img: product.img,
        badge: product.badge
      });
    }

    if (!normalizedItems.length) {
      return res.status(400).json({ error: 'Tidak ada item valid untuk diproses.' });
    }

    const order = {
      id: generateId('ORD'),
      paymentReference: generateId('PAY'),
      userId: req.user.id,
      userName: req.user.name,
      userPhone: req.user.phone,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pay_later' : 'waiting_payment',
      recipient: {
        name: recipient.name,
        phone: recipient.phone,
        address: recipient.address,
        city: recipient.city || '',
        post: recipient.post || ''
      },
      items: normalizedItems,
      total,
      status: 'pending',
      createdAt: new Date().toISOString(),
      timeline: [
        { label: 'Pesanan dibuat', at: new Date().toISOString() }
      ]
    };

    order.paymentInstructions = buildPaymentInstructions(data.settings?.payment || {}, order);

    data.orders.push(order);
    await writeData(data);

    res.status(201).json({
      message: 'Pesanan berhasil dibuat.',
      order
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Gagal membuat pesanan.' });
  }
});

module.exports = router;
