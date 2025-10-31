const express = require('express');
const { authRequired } = require('../middleware/auth');
const router = express.Router();

// Get quizzes by class
router.get('/by-class/:classId', authRequired, async (req, res) => {
  const prisma = req.prisma;
  const classId = req.params.classId;
  // Allow owner or public class
  const cls = await prisma.class.findUnique({ where: { id: classId } });
  if (!cls) return res.status(404).json({ message: 'Class not found' });
  if (!cls.isPublic && cls.ownerId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
  const quizzes = await prisma.quiz.findMany({ where: { classId }, include: { questions: true } });
  res.json(quizzes);
});

// Create quiz with questions
router.post('/', authRequired, async (req, res) => {
  const prisma = req.prisma;
  const { classId, title, description, published, questions } = req.body || {};
  if (!classId || !title) return res.status(400).json({ message: 'classId and title are required' });
  const cls = await prisma.class.findUnique({ where: { id: classId } });
  if (!cls || cls.ownerId !== req.user.id) return res.status(404).json({ message: 'Class not found' });
  const quiz = await prisma.quiz.create({
    data: {
      title,
      description,
      published: !!published,
      classId,
      ownerId: req.user.id,
      questions: {
        create: (questions || []).map(q => ({
          question: q.question,
          type: q.type,
          options: q.options ? q.options : null,
          correctAnswers: q.correctAnswers || [],
          explanation: q.explanation || null,
          questionImage: q.questionImage || null,
          optionImages: q.optionImages || null
        }))
      }
    },
    include: { questions: true }
  });
  res.status(201).json(quiz);
});

// Update quiz (and replace questions)
router.put('/:id', authRequired, async (req, res) => {
  const prisma = req.prisma;
  const id = req.params.id;
  const found = await prisma.quiz.findUnique({ where: { id }, include: { questions: true } });
  if (!found || found.ownerId !== req.user.id) return res.status(404).json({ message: 'Not found' });
  const { title, description, published, questions } = req.body || {};
  const updated = await prisma.$transaction(async (tx) => {
    // Update quiz fields
    const qz = await tx.quiz.update({ where: { id }, data: { title, description, published } });
    if (Array.isArray(questions)) {
      // Replace questions: delete then recreate
      await tx.question.deleteMany({ where: { quizId: id } });
      await tx.question.createMany({
        data: questions.map(q => ({
          id: undefined,
          quizId: id,
          question: q.question,
          type: q.type,
          options: q.options ? q.options : null,
          correctAnswers: q.correctAnswers || [],
          explanation: q.explanation || null,
          questionImage: q.questionImage || null,
          optionImages: q.optionImages || null
        }))
      });
    }
    return tx.quiz.findUnique({ where: { id }, include: { questions: true } });
  });
  res.json(updated);
});

// Delete quiz
router.delete('/:id', authRequired, async (req, res) => {
  const prisma = req.prisma;
  const id = req.params.id;
  const found = await prisma.quiz.findUnique({ where: { id } });
  if (!found || found.ownerId !== req.user.id) return res.status(404).json({ message: 'Not found' });
  await prisma.quiz.delete({ where: { id } });
  res.status(204).end();
});

module.exports = router;

