const express = require('express');
const { authRequired } = require('../middleware/auth');
const router = express.Router();

// List classes: mine or public
router.get('/', authRequired, async (req, res) => {
  const prisma = req.prisma;
  const mine = req.query.mine === 'true';
  const where = mine ? { ownerId: req.user.id } : { isPublic: true };
  const classes = await prisma.class.findMany({ where, include: { quizzes: true } });
  res.json(classes);
});

// Create class
router.post('/', authRequired, async (req, res) => {
  const prisma = req.prisma;
  const { name, description, isPublic } = req.body || {};
  if (!name) return res.status(400).json({ message: 'Name is required' });
  const cls = await prisma.class.create({ data: { name, description, isPublic: !!isPublic, ownerId: req.user.id } });
  res.status(201).json(cls);
});

// Update class
router.put('/:id', authRequired, async (req, res) => {
  const prisma = req.prisma;
  const id = req.params.id;
  const found = await prisma.class.findUnique({ where: { id } });
  if (!found || found.ownerId !== req.user.id) return res.status(404).json({ message: 'Not found' });
  const { name, description, isPublic } = req.body || {};
  const cls = await prisma.class.update({ where: { id }, data: { name, description, isPublic } });
  res.json(cls);
});

// Delete class (cascades to quizzes/questions)
router.delete('/:id', authRequired, async (req, res) => {
  const prisma = req.prisma;
  const id = req.params.id;
  const found = await prisma.class.findUnique({ where: { id } });
  if (!found || found.ownerId !== req.user.id) return res.status(404).json({ message: 'Not found' });
  await prisma.class.delete({ where: { id } });
  res.status(204).end();
});

module.exports = router;

