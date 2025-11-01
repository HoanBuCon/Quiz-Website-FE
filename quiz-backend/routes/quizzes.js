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
  
  // Build nested structure for each quiz (support composite questions with subQuestions)
  const quizzesWithNested = quizzes.map(quiz => {
    const allQs = quiz.questions;
    const byParent = new Map();
    for (const q of allQs) {
      const pid = q.parentId || null;
      if (!byParent.has(pid)) byParent.set(pid, []);
      byParent.get(pid).push(q);
    }
    const roots = (byParent.get(null) || []).map(p => ({ 
      ...p, 
      subQuestions: (byParent.get(p.id) || []) 
    }));
    
    return { ...quiz, questions: roots };
  });
  
  res.json(quizzesWithNested);
});

// Create quiz with questions (supports composite and drag)
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
    }
  });

  // Create questions (including composite children)
  const createOne = async (tx, q, parentId = null) => {
    const created = await tx.question.create({
      data: {
        quizId: quiz.id,
        parentId: parentId,
        question: q.question,
        type: q.type,
        options: q.options ? q.options : null,
        correctAnswers: q.correctAnswers || [],
        explanation: q.explanation || null,
        questionImage: q.questionImage || null,
        optionImages: q.optionImages || null,
      }
    });
    if (q.type === 'composite' && Array.isArray(q.subQuestions)) {
      for (const cq of q.subQuestions) {
        await createOne(tx, cq, created.id);
      }
    }
  };

  await prisma.$transaction(async (tx) => {
    for (const q of (questions || [])) {
      await createOne(tx, q, null);
    }
  });

  const withQuestions = await prisma.quiz.findUnique({ where: { id: quiz.id }, include: { questions: true } });
  res.status(201).json(withQuestions);
});

// Update quiz (and replace questions; supports composite and drag)
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
      // Replace questions: delete then recreate (including children)
      await tx.question.deleteMany({ where: { quizId: id } });
      const createOne = async (q, parentId = null) => {
        const created = await tx.question.create({
          data: {
            quizId: id,
            parentId,
            question: q.question,
            type: q.type,
            options: q.options ? q.options : null,
            correctAnswers: q.correctAnswers || [],
            explanation: q.explanation || null,
            questionImage: q.questionImage || null,
            optionImages: q.optionImages || null,
          }
        });
        if (q.type === 'composite' && Array.isArray(q.subQuestions)) {
          for (const cq of q.subQuestions) {
            await createOne(cq, created.id);
          }
        }
      };
      for (const q of questions) {
        await createOne(q, null);
      }
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

// Get quiz by ID or shortId (supports public/share) and return nested structure
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

    // Build nested structure: parents first, attach children as subQuestions
    const allQs = quiz.questions;
    const byParent = new Map();
    for (const q of allQs) {
      const pid = q.parentId || null;
      if (!byParent.has(pid)) byParent.set(pid, []);
      byParent.get(pid).push(q);
    }
    const roots = (byParent.get(null) || []).map(p => ({ ...p, subQuestions: (byParent.get(p.id) || []) }));

    const payload = { ...quiz, questions: roots };
    res.json(payload);
  } catch (e) {
    console.error('Error fetching quiz', e);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;

