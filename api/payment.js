
const express = require('express');
const { readData } = require('./data-store');

const router = express.Router();

router.get('/public-config', async (_req, res) => {
  try {
    const data = await readData();
    const payment = data.settings?.payment || {};

    const methods = [
      {
        id: 'manual_wallet',
        label: payment.walletType ? `${payment.walletType} / QRIS Owner` : 'Transfer Wallet / QRIS',
        enabled: true,
        description: 'Customer akan menerima instruksi transfer ke wallet owner.'
      },
      {
        id: 'cod',
        label: 'COD (Bayar di Tempat)',
        enabled: true,
        description: 'Cocok untuk area dekat / pengantaran lokal.'
      }
    ];

    if (payment.paypalEnabled && payment.paypalClientId) {
      methods.push({
        id: 'paypal',
        label: 'PayPal',
        enabled: true,
        description: 'Gateway online untuk kartu dan saldo PayPal.'
      });
    }

    res.json({
      payment: {
        defaultMethod: payment.defaultMethod || 'manual_wallet',
        methods: methods.filter((item) => item.enabled),
        walletType: payment.walletType || '',
        walletHolder: payment.walletHolder || '',
        hasWalletNumber: Boolean(payment.walletNumber),
        qrisImageUrl: payment.qrisImageUrl || '',
        instructions: payment.instructions || ''
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Gagal mengambil konfigurasi payment.' });
  }
});

module.exports = router;
