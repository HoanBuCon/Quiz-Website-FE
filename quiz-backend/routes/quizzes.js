const express = require('express');
const { authRequired } = require('../middleware/auth');
const router = express.Router();

// Get quizzes by class
router.get('/by-class/:classId', authRequired, async (req, res) => {
  const prisma = req.prisma;
  const classId = req.params.classId;
  const cls = await prisma.class.findUnique({ where: { id: classId } });
  if (!cls) return res.status(404).json({ message: 'Class not found' });

  const isOwner = cls.ownerId === req.user.id;
  const hasPublicItem = await prisma.publicItem.findFirst({ where: { targetType: 'class', targetId: classId } });
  const isPublic = !!cls.isPublic || !!hasPublicItem; // accept legacy flag OR new table
  const hasShared = await prisma.sharedAccess.findFirst({ where: { userId: req.user.id, targetType: 'class', targetId: classId } });
  if (!isOwner && !isPublic && !hasShared) return res.status(403).json({ message: 'Forbidden' });

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
    await tx.quiz.update({ where: { id }, data: { title, description, published } });

    // sync PublicItem when published provided
    if (typeof published === 'boolean') {
      if (published) {
        await tx.publicItem.upsert({
          where: { targetType_targetId: { targetType: 'quiz', targetId: id } },
          create: { targetType: 'quiz', targetId: id },
          update: {},
        });
      } else {
        await tx.publicItem.deleteMany({ where: { targetType: 'quiz', targetId: id } });
      }
    }

    if (Array.isArray(questions)) {
      // Replace questions: delete then recreate
      await tx.question.deleteMany({ where: { quizId: id } });
      await tx.question.createMany({
        data: questions.map(q => ({
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

// Get quiz by ID or shortId (supports public/share)
router.get('/:id', authRequired, async (req, res) => {
  const prisma = req.prisma;
  const id = req.params.id;
  try {
    let quiz = await prisma.quiz.findUnique({ where: { id }, include: { questions: true, class: true } });
    if (!quiz) {
      const { buildShortId } = require('../utils/share');
      const all = await prisma.quiz.findMany({ include: { questions: true, class: true } });
      quiz = all.find(q => buildShortId(q.id) === id);
    }
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const isOwner = quiz.ownerId === req.user.id;
    const quizPublic = await prisma.publicItem.findFirst({ where: { targetType: 'quiz', targetId: quiz.id } });
    const classPublic = await prisma.publicItem.findFirst({ where: { targetType: 'class', targetId: quiz.classId } });
    const hasQuizShared = await prisma.sharedAccess.findFirst({ where: { userId: req.user.id, targetType: 'quiz', targetId: quiz.id } });
    const hasClassShared = await prisma.sharedAccess.findFirst({ where: { userId: req.user.id, targetType: 'class', targetId: quiz.classId } });
    
    // Also check legacy isPublic flag on class
    const isClassPublicLegacy = quiz.class.isPublic;

    if (!isOwner && !quizPublic && !classPublic && !isClassPublicLegacy && !hasQuizShared && !hasClassShared) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    res.json(quiz);
  } catch (e) {
    console.error('Error fetching quiz', e);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;

