const express = require('express');
const { authRequired } = require('../middleware/auth');
const router = express.Router();

// Start session (optional; client can also just submit)
router.post('/start', authRequired, async (req, res) => {
  const prisma = req.prisma;
  const { quizId } = req.body || {};
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, include: { questions: true } });
  if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
  // Create a QuizAttempt to log that user started the quiz
  const attempt = await prisma.quizAttempt.create({
    data: {
      userId: req.user.id,
      quizId: quiz.id,
      startedAt: new Date(),
    },
  });
  res.json({ quizId: quiz.id, totalQuestions: quiz.questions.length, attemptId: attempt.id });
});

// Submit answers and score server-side (supports composite and drag)
router.post('/submit', authRequired, async (req, res) => {
  const prisma = req.prisma;
  const { quizId, answers, timeSpent, attemptId } = req.body || {};
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, include: { questions: true } });
  if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
  const allQs = quiz.questions;
  const userAnswers = answers || {}; // map questionId -> any

  // Build nested maps
  const childrenByParent = new Map();
  for (const q of allQs) {
    const pid = q.parentId || null;
    if (!childrenByParent.has(pid)) childrenByParent.set(pid, []);
    childrenByParent.get(pid).push(q);
  }
  const roots = childrenByParent.get(null) || [];

  // Define leaf questions list (exclude composite parent from scoring)
  const leafQuestions = [];
  for (const r of roots) {
    if (r.type === 'composite') {
      for (const c of (childrenByParent.get(r.id) || [])) leafQuestions.push(c);
    } else {
      leafQuestions.push(r);
    }
  }

  let score = 0;
  for (const q of leafQuestions) {
    const ans = userAnswers[q.id];
    if (q.type === 'text') {
      const ua = ((Array.isArray(ans) ? ans[0] : ans) || '').toString().trim().toLowerCase();
      const correct = (q.correctAnswers || []).some(c => (c || '').toString().trim().toLowerCase() === ua);
      if (correct) score += 1;
    } else if (q.type === 'drag') {
      // Expect answer as { [itemId]: targetId }
      const mapping = ans && typeof ans === 'object' ? ans : {};
      const correctMap = q.correctAnswers || {};
      
      // Lấy tất cả items từ question.options để kiểm tra đầy đủ
      const allItems = (q.options && q.options.items) ? q.options.items : [];
      
      // Kiểm tra từng item
      const ok = allItems.length > 0 && allItems.every(item => {
        const itemId = item.id;
        const userTargetId = mapping[itemId];
        const correctTargetId = correctMap[itemId];
        
        // Chuẩn hóa giá trị: undefined, null, '' đều được coi là "không thuộc nhóm nào"
        const normalizedUserTarget = userTargetId || undefined;
        const normalizedCorrectTarget = correctTargetId || undefined;
        
        return normalizedUserTarget === normalizedCorrectTarget;
      });
      
      if (ok) score += 1;
    } else {
      const arr = Array.isArray(ans) ? ans : [];
      const correctArr = q.correctAnswers || [];
      const ok = arr.length === correctArr.length && correctArr.every(a => arr.includes(a));
      if (ok) score += 1;
    }
  }

  const session = await prisma.quizSession.create({
    data: {
      quizId: quiz.id,
      userId: req.user.id,
      score,
      totalQuestions: leafQuestions.length,
      timeSpent: Number(timeSpent || 0),
      answers: userAnswers,
    }
  });

  // If an attemptId was provided, link it to this session and mark endedAt
  if (attemptId) {
    try {
      const attempt = await prisma.quizAttempt.findUnique({ where: { id: attemptId } });
      if (attempt && attempt.userId === req.user.id && attempt.quizId === quiz.id) {
        await prisma.quizAttempt.update({
          where: { id: attemptId },
          data: { endedAt: new Date(), quizSessionId: session.id },
        });
      }
    } catch (_) {}
  }

  res.status(201).json({
    sessionId: session.id,
    score,
    totalQuestions: leafQuestions.length,
    percentage: leafQuestions.length ? Math.round((score / leafQuestions.length) * 100) : 0
  });
});

// Mark attempt ended without submission (user left quiz page)
router.post('/attempt/end', authRequired, async (req, res) => {
  const prisma = req.prisma;
  const { attemptId } = req.body || {};
  if (!attemptId) return res.status(400).json({ message: 'Missing attemptId' });
  try {
    const attempt = await prisma.quizAttempt.findUnique({ where: { id: attemptId } });
    if (!attempt || attempt.userId !== req.user.id) return res.status(404).json({ message: 'Not found' });
    if (!attempt.endedAt) {
      await prisma.quizAttempt.update({ where: { id: attemptId }, data: { endedAt: new Date() } });
    }
    res.status(204).end();
  } catch (_e) {
    res.status(500).json({ message: 'Server error' });
  }
});
// Get my results for a quiz (privacy-safe: no answers payload)
router.get('/by-quiz/:quizId', authRequired, async (req, res) => {
  const prisma = req.prisma;
  const quizId = req.params.quizId;
  const sessions = await prisma.quizSession.findMany({
    where: { quizId, userId: req.user.id },
    orderBy: { completedAt: 'desc' },
    select: {
      id: true,
      quizId: true,
      score: true,
      totalQuestions: true,
      timeSpent: true,
      startedAt: true,
      completedAt: true,
      // answers is intentionally omitted
    }
  });
  res.json(sessions);
});

// Get a session by id (includes answers; only owner can access)
router.get('/:id', authRequired, async (req, res) => {
  const prisma = req.prisma;
  const id = req.params.id;
  const s = await prisma.quizSession.findUnique({ where: { id } });
  if (!s || s.userId !== req.user.id) return res.status(404).json({ message: 'Not found' });
  res.json(s);
});

module.exports = router;

