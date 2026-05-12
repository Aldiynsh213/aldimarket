
const express = require('express');
const { readData } = require('./data-store');

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const data = await readData();
    res.json({ products: data.products || [] });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Gagal mengambil produk.' });
  }
});

module.exports = router;
