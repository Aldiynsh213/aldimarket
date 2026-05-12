
const fs = require('fs/promises');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'storage', 'app-data.json');

async function ensureStore() {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch (error) {
    throw new Error('File data tidak ditemukan. Jalankan ulang proyek atau kembalikan storage/app-data.json.');
  }
}

async function readData() {
  await ensureStore();
  const raw = await fs.readFile(DATA_FILE, 'utf8');
  return JSON.parse(raw);
}

async function writeData(data) {
  await ensureStore();
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  return data;
}

function normalizePhone(phone = '') {
  return String(phone)
    .replace(/\D/g, '')
    .replace(/^0/, '62')
    .replace(/^62/, '62');
}

function generateId(prefix = 'ID') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

function buildPaymentInstructions(paymentSettings, order) {
  const instructions = [];
  const method = order.paymentMethod;

  if (method === 'cod') {
    instructions.push('Pembayaran dilakukan saat barang diterima (COD).');
  }

  if (method === 'manual_wallet') {
    if (paymentSettings.walletType && paymentSettings.walletNumber) {
      instructions.push(`Transfer ke ${paymentSettings.walletType} atas nama ${paymentSettings.walletHolder || 'Owner'}: ${paymentSettings.walletNumber}.`);
    }
    if (paymentSettings.qrisImageUrl) {
      instructions.push(`QRIS tersedia di dashboard owner / URL: ${paymentSettings.qrisImageUrl}`);
    }
  }

  if (!instructions.length) {
    instructions.push(paymentSettings.instructions || 'Owner belum melengkapi instruksi pembayaran.');
  }

  return instructions;
}

module.exports = {
  readData,
  writeData,
  normalizePhone,
  generateId,
  sanitizeUser,
  buildPaymentInstructions
};
