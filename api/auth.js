
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { readData, writeData, normalizePhone, generateId, sanitizeUser } = require('./data-store');

const router = express.Router();

function signUser(user) {
  return jwt.sign(
    { userId: user.id, role: user.role, username: user.username, email: user.email },
    process.env.JWT_SECRET || 'aldimarket_dev_secret',
    { expiresIn: '7d' }
  );
}

router.post('/register', async (req, res) => {
  try {
    const {
      firstName = '',
      lastName = '',
      username = '',
      email = '',
      phone = '',
      password = ''
    } = req.body || {};

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const phoneNormalized = normalizePhone(cleanPhone);
    const fullName = `${firstName}`.trim() + (lastName ? ` ${lastName.trim()}` : '');

    if (!firstName.trim() || !cleanUsername || !cleanPhone || !password) {
      return res.status(400).json({ error: 'Nama depan, username, nomor telepon, dan password wajib diisi.' });
    }

    if (cleanUsername.length < 4) {
      return res.status(400).json({ error: 'Username minimal 4 karakter.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password minimal 8 karakter.' });
    }

    const data = await readData();

    const usernameExists = data.users.some((user) => user.username.toLowerCase() === cleanUsername.toLowerCase());
    if (usernameExists) {
      return res.status(409).json({ error: 'Username sudah dipakai.' });
    }

    if (cleanEmail) {
      const emailExists = data.users.some((user) => (user.email || '').toLowerCase() === cleanEmail);
      if (emailExists) {
        return res.status(409).json({ error: 'Email sudah terdaftar.' });
      }
    }

    const phoneExists = data.users.some((user) => user.phoneNormalized === phoneNormalized);
    if (phoneExists) {
      return res.status(409).json({ error: 'Nomor telepon sudah terdaftar.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = {
      id: generateId('USR'),
      username: cleanUsername,
      name: fullName || cleanUsername,
      email: cleanEmail,
      phone: cleanPhone,
      phoneNormalized,
      role: 'customer',
      passwordHash,
      createdAt: new Date().toISOString()
    };

    data.users.push(newUser);
    await writeData(data);

    const token = signUser(newUser);

    res.status(201).json({
      message: 'Registrasi berhasil.',
      token,
      user: sanitizeUser(newUser)
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Gagal registrasi.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { identifier = '', password = '' } = req.body || {};
    const loginId = String(identifier).trim();
    const loginLower = loginId.toLowerCase();
    const loginPhone = normalizePhone(loginId);

    if (!loginId || !password) {
      return res.status(400).json({ error: 'Identifier dan password wajib diisi.' });
    }

    const data = await readData();
    const user = data.users.find((item) => {
      return (
        item.username.toLowerCase() === loginLower ||
        (item.email || '').toLowerCase() === loginLower ||
        item.phoneNormalized === loginPhone
      );
    });

    if (!user) {
      return res.status(404).json({ error: 'Akun tidak ditemukan.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Password salah.' });
    }

    const token = signUser(user);

    res.json({
      message: 'Login berhasil.',
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Gagal login.' });
  }
});

router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: 'Token tidak ditemukan.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'aldimarket_dev_secret');
    const data = await readData();
    const user = data.users.find((item) => item.id === decoded.userId);

    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan.' });
    }

    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    res.status(401).json({ error: 'Token tidak valid.' });
  }
});

module.exports = router;
