const express = require('express');
const { authRequired } = require('../middleware/auth');
const router = express.Router();

// List my files
router.get('/', authRequired, async (req, res) => {
  const prisma = req.prisma;
  const files = await prisma.uploadedFile.findMany({ where: { userId: req.user.id }, orderBy: { uploadedAt: 'desc' } });
  res.json(files);
});

// Upload (metadata + optional content base64 for .docx)
router.post('/', authRequired, async (req, res) => {
  const prisma = req.prisma;
  const { name, type, size, content } = req.body || {};
  if (!name || !type || typeof size !== 'number') return res.status(400).json({ message: 'Invalid payload' });
  const file = await prisma.uploadedFile.create({ data: { name, type, size, content: content || null, userId: req.user.id } });
  res.status(201).json(file);
});

// Delete file
router.delete('/:id', authRequired, async (req, res) => {
  const prisma = req.prisma;
  const id = req.params.id;
  const file = await prisma.uploadedFile.findUnique({ where: { id } });
  if (!file || file.userId !== req.user.id) return res.status(404).json({ message: 'Not found' });
  await prisma.uploadedFile.delete({ where: { id } });
  res.status(204).end();
});

module.exports = router;

