
const jwt = require('jsonwebtoken');
const { readData, sanitizeUser } = require('./data-store');

module.exports = async function authMiddleware(req, res, next) {
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
      return res.status(401).json({ error: 'User tidak ditemukan.' });
    }

    req.user = sanitizeUser(user);
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token tidak valid.' });
  }
};
