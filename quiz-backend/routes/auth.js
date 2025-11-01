const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

router.post('/signup', async (req, res) => {
  const prisma = req.prisma;
  const { email, password, name } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ message: 'Email already registered' });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, passwordHash, name } });
  const secret = process.env.JWT_SECRET || (process.env.NODE_ENV !== 'production' ? 'devsecret' : null);
  if (!secret) return res.status(500).json({ message: 'Server misconfigured' });
  const token = jwt.sign({ sub: user.id, email: user.email }, secret, { expiresIn: '7d' });
  res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

router.post('/login', async (req, res) => {
  const prisma = req.prisma;
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
  const secret = process.env.JWT_SECRET || (process.env.NODE_ENV !== 'production' ? 'devsecret' : null);
  if (!secret) return res.status(500).json({ message: 'Server misconfigured' });
  const token = jwt.sign({ sub: user.id, email: user.email }, secret, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

// Forgot password: return resetToken/resetLink (demo; normally email this)
router.post('/forgot', async (req, res) => {
  const prisma = req.prisma;
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ message: 'Email is required' });
  const user = await prisma.user.findUnique({ where: { email } });
  // Do not reveal whether user exists
  if (!user) return res.status(204).end();

  // In production, NEVER return reset tokens over the API
  if (process.env.NODE_ENV === 'production') {
    return res.status(204).end();
  }
  // Development-only helper: return token to ease local testing
  const secret = process.env.JWT_SECRET || 'devsecret';
  const resetToken = jwt.sign({ sub: user.id, email: user.email, type: 'reset' }, secret, { expiresIn: '15m' });
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetLink = `${frontendUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;
  res.json({ resetToken, resetLink });
});

// Reset password using reset token
router.post('/reset', async (req, res) => {
  const prisma = req.prisma;
  const { token, newPassword } = req.body || {};
  if (!token || !newPassword) return res.status(400).json({ message: 'Invalid payload' });
  try {
    const secret = process.env.JWT_SECRET || (process.env.NODE_ENV !== 'production' ? 'devsecret' : null);
    if (!secret) return res.status(500).json({ message: 'Server misconfigured' });
    const payload = jwt.verify(token, secret, { algorithms: ['HS256'] });
    if (payload.type !== 'reset') return res.status(400).json({ message: 'Invalid token type' });
    const userId = payload.sub;
    const hash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });
    res.status(204).end();
  } catch (e) {
    res.status(400).json({ message: 'Invalid or expired token' });
  }
});

module.exports = router;

