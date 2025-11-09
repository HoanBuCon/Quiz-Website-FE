console.log("Auth router loaded");
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { authRequired } = require('../middleware/auth');
const router = express.Router();

// Get current user info (consistent response shape)
router.get('/me', authRequired, async (req, res) => {
  const prisma = req.prisma;
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, name: true }
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/signup', async (req, res) => {
  const prisma = req.prisma;
  const { email, password, name } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
  const normalizedEmail = email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) return res.status(409).json({ message: 'Email already registered' });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email: normalizedEmail, passwordHash, name } });
  const secret = process.env.JWT_SECRET || (process.env.NODE_ENV !== 'production' ? 'devsecret' : null);
  if (!secret) return res.status(500).json({ message: 'Server misconfigured' });
  const token = jwt.sign({ sub: user.id, email: user.email }, secret, { expiresIn: '7d' });
  res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

router.post('/login', async (req, res) => {
  const prisma = req.prisma;
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
  const normalizedEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
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
  const normalizedEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
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

// ====== OTP-based Forgot/Reset Password ======
function buildTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 465);
  const secure = String(process.env.SMTP_SECURE || 'true') === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) throw new Error('SMTP not configured');
  const tls = { rejectUnauthorized: String(process.env.SMTP_TLS_REJECT_UNAUTHORIZED || 'true') !== 'false' };
  return nodemailer.createTransport({ host, port, secure, auth: { user, pass }, tls });
}

function genOtp() { return (Math.floor(100000 + Math.random() * 900000)).toString(); }

router.post('/forgot-otp', async (req, res) => {
  const prisma = req.prisma;
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ message: 'Email is required' });
  const normalizedEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) return res.status(404).json({ message: 'Email không tồn tại' });

  const throttleSec = Number(process.env.OTP_THROTTLE_SECONDS || 60);
  const ttlSec = Number(process.env.OTP_TTL_SECONDS || 600);

  // throttle: if a recent request within throttleSec exists, deny
  const recent = await prisma.passwordReset.findFirst({
    where: { email: normalizedEmail, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' }
  });
  if (recent) {
    const diff = Date.now() - new Date(recent.createdAt).getTime();
    if (diff < throttleSec * 1000) return res.status(429).json({ message: 'Vui lòng thử lại sau ít phút' });
  }

  const otp = genOtp();
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + ttlSec * 1000);

  try {
    const transporter = buildTransporter();
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;
    await transporter.sendMail({
      from,
      to: normalizedEmail,
      subject: 'Mã xác thực đặt lại mật khẩu (OTP)',
      text: `Mã OTP của bạn là: ${otp}. Mã sẽ hết hạn sau ${Math.round(ttlSec/60)} phút. Nếu bạn không yêu cầu, vui lòng bỏ qua email này.`,
      html: `<p>Mã OTP của bạn là: <b>${otp}</b></p><p>Mã sẽ hết hạn sau ${Math.round(ttlSec/60)} phút.</p>`
    });
    // Only persist after successful send
    await prisma.passwordReset.create({ data: { email: normalizedEmail, userId: user.id, otpHash, expiresAt } });
    return res.status(204).end();
  } catch (e) {
    console.error('Failed to send OTP email');
    return res.status(500).json({ message: 'Không gửi được email' });
  }
});

router.post('/reset-with-otp', async (req, res) => {
  const prisma = req.prisma;
  const { email, otp, newPassword } = req.body || {};
  if (!email || !otp || !newPassword) return res.status(400).json({ message: 'Thiếu dữ liệu' });
  const normalizedEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) return res.status(404).json({ message: 'Email không tồn tại' });

  const record = await prisma.passwordReset.findFirst({
    where: { email: normalizedEmail, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' }
  });
  if (!record) return res.status(400).json({ message: 'OTP không hợp lệ hoặc đã hết hạn' });
  const maxAttempts = Number(process.env.OTP_MAX_ATTEMPTS || 5);
  if (record.attempts >= maxAttempts) return res.status(429).json({ message: 'Quá số lần nhập OTP. Vui lòng yêu cầu mã mới.' });

  const ok = await bcrypt.compare(otp, record.otpHash);
  if (!ok) {
    await prisma.passwordReset.update({ where: { id: record.id }, data: { attempts: record.attempts + 1 } });
    return res.status(400).json({ message: 'OTP không đúng' });
  }

  const hash = await bcrypt.hash(newPassword, 10);
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: user.id }, data: { passwordHash: hash } });
    await tx.passwordReset.update({ where: { id: record.id }, data: { usedAt: new Date() } });
  });
  return res.status(204).end();
});

module.exports = router;
