const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authRequired } = require('../middleware/auth');
const jwt = require('jsonwebtoken');

const isProd = process.env.NODE_ENV === 'production';
// Local dev: quiz-backend/public/chatbox/uploads
// Production (cPanel): public_html/chatbox/uploads
const baseChatUploadDir = isProd
  ? path.join(__dirname, '../../public_html/chatbox/uploads')
  : path.join(__dirname, '../public/chatbox/uploads');

// Ensure base dirs exist
for (const sub of ['', '/images', '/videos', '/files']) {
  const dir = path.join(baseChatUploadDir, sub);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Multer storage config: decide subfolder by mimetype
const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    let sub = 'files';
    if (file.mimetype.startsWith('image/')) sub = 'images';
    else if (file.mimetype.startsWith('video/')) sub = 'videos';
    cb(null, path.join(baseChatUploadDir, sub));
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path
      .basename(file.originalname, ext)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);
    cb(null, `${nameWithoutExt}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    // Allow images, videos, and common docs
    const ok =
      file.mimetype.startsWith('image/') ||
      file.mimetype.startsWith('video/') ||
      [
        'application/pdf',
        'application/zip',
        'application/x-zip-compressed',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'application/json',
      ].includes(file.mimetype);
    if (ok) cb(null, true);
    else cb(new Error('Loại tệp không được hỗ trợ'), false);
  },
});

// Build public URL for saved file relative to root (Apache/Dev serve)
function buildPublicUrl(filename, mimetype) {
  const sub = mimetype.startsWith('image/')
    ? 'images'
    : mimetype.startsWith('video/')
    ? 'videos'
    : 'files';
  return `/chatbox/uploads/${sub}/${filename}`;
}

// List recent messages (public for all authenticated users)
router.get('/messages', authRequired, async (req, res) => {
  const prisma = req.prisma;
  const limit = Math.min(Number(req.query.limit || 50), 200);
  const before = req.query.before ? new Date(req.query.before) : null;
  const where = before ? { createdAt: { lt: before } } : {};
  const messages = await prisma.chatMessage.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  res.json(messages.reverse());
});

// Post a message (text + optional attachment)
router.post(
  '/messages',
  authRequired,
  upload.single('attachment'),
  async (req, res) => {
    const prisma = req.prisma;
    const { content } = req.body || {};
    if (!content && !req.file) {
      return res.status(400).json({ message: 'Nội dung trống' });
    }

    let attachmentUrl = null;
    let attachmentType = null;

    if (req.file) {
      attachmentUrl = buildPublicUrl(req.file.filename, req.file.mimetype);
      if (req.file.mimetype.startsWith('image/')) attachmentType = 'image';
      else if (req.file.mimetype.startsWith('video/')) attachmentType = 'video';
      else attachmentType = 'file';
    }

    const created = await prisma.chatMessage.create({
      data: {
        userId: req.user.id,
        content: content || null,
        attachmentUrl,
        attachmentType,
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    // Broadcast to SSE listeners
    try { broadcastMessage(created); } catch (_) {}

    res.status(201).json(created);
  }
);

// Delete a message (only owner can delete)
router.delete('/messages/:id', authRequired, async (req, res) => {
  const prisma = req.prisma;
  const id = req.params.id;
  const msg = await prisma.chatMessage.findUnique({ where: { id } });
  if (!msg) return res.status(404).json({ message: 'Không tìm thấy' });
  if (msg.userId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });

  // Try delete file if exists
  if (msg.attachmentUrl && msg.attachmentUrl.includes('/chatbox/uploads/')) {
    try {
      const rel = msg.attachmentUrl.split('/chatbox/uploads/').pop();
      const filePath = path.join(baseChatUploadDir, rel);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (e) {
      console.error('Failed to delete chat attachment:', e);
    }
  }

  await prisma.chatMessage.delete({ where: { id } });
  res.status(204).end();
});

// ===== SSE clients store (in-memory per process) =====
const sseClients = new Set(); // each item: { res, userId }

// SSE: stream new messages only when they arrive
router.get('/stream', (req, res) => {
  // Auth via query token to support EventSource
  const token = req.query.token;
  if (!token || typeof token !== 'string') {
    return res.status(401).end();
  }
  try {
    const secret = process.env.JWT_SECRET || (process.env.NODE_ENV !== 'production' ? 'devsecret' : null);
    if (!secret) return res.status(500).end();
    const payload = jwt.verify(token, secret, { algorithms: ['HS256'] });
    const userId = payload.sub;

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Register client
    const client = { res, userId };
    sseClients.add(client);

    // Initial comment to establish stream
    res.write(':ok\n\n');

    // Keep-alive pings
    const ping = setInterval(() => {
      try { res.write('event: ping\ndata: {}\n\n'); } catch (_) {}
    }, 25000);

    req.on('close', () => {
      clearInterval(ping);
      sseClients.delete(client);
      try { res.end(); } catch (_) {}
    });
  } catch (_e) {
    return res.status(401).end();
  }
});

// Helper to broadcast a new message to SSE clients
function broadcastMessage(msg) {
  const payload = JSON.stringify(msg);
  for (const { res } of sseClients) {
    try {
      res.write(`event: message\n`);
      res.write(`data: ${payload}\n\n`);
    } catch (_e) {
      // ignore broken pipe, will be cleaned up on close
    }
  }
}

module.exports = router;
