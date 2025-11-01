const express = require('express');
const { authRequired } = require('../middleware/auth');
const router = express.Router();

// Start session (optional; client can also just submit)
router.post('/start', authRequired, async (req, res) => {
  const prisma = req.prisma;
  const { quizId } = req.body || {};
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, include: { questions: true } });
  if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
  res.json({ quizId: quiz.id, totalQuestions: quiz.questions.length });
});

// Submit answers and score server-side
router.post('/submit', authRequired, async (req, res) => {
  const prisma = req.prisma;
  const { quizId, answers, timeSpent } = req.body || {};
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, include: { questions: true } });
  if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
  const questions = quiz.questions;
  const userAnswers = answers || {}; // map questionId -> string[]

  let score = 0;
  for (const q of questions) {
    const ans = Array.isArray(userAnswers[q.id]) ? userAnswers[q.id] : [];
    if (q.type === 'text') {
      const ua = (ans[0] || '').trim().toLowerCase();
      const correct = (q.correctAnswers || []).some(c => (c || '').trim().toLowerCase() === ua);
      if (correct) score += 1;
    } else {
      const correctArr = q.correctAnswers || [];
      const ok = ans.length === correctArr.length && correctArr.every(a => ans.includes(a));
      if (ok) score += 1;
    }
  }

  const session = await prisma.quizSession.create({
    data: {
      quizId: quiz.id,
      userId: req.user.id,
      score,
      totalQuestions: questions.length,
      timeSpent: Number(timeSpent || 0),
      answers: userAnswers,
    }
  });

  res.status(201).json({
    sessionId: session.id,
    score,
    totalQuestions: questions.length,
    percentage: Math.round((score / questions.length) * 100)
  });
});

// Get my results for a quiz
router.get('/by-quiz/:quizId', authRequired, async (req, res) => {
  const prisma = req.prisma;
  const quizId = req.params.quizId;
  const sessions = await prisma.quizSession.findMany({ where: { quizId, userId: req.user.id }, orderBy: { completedAt: 'desc' } });
  res.json(sessions);
});

module.exports = router;

