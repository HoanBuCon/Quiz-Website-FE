const express = require('express');
const { authRequired } = require('../middleware/auth');
const router = express.Router();

// Toggle public listing for class/quiz
router.post('/public', authRequired, async (req, res) => {
  const prisma = req.prisma;
  const { targetType, targetId, enabled } = req.body || {};
  if (!['class', 'quiz'].includes(targetType)) return res.status(400).json({ message: 'Invalid targetType' });
  if (!targetId) return res.status(400).json({ message: 'targetId required' });

  // Verify ownership
  let ownerId = null;
  if (targetType === 'class') {
    const cls = await prisma.class.findUnique({ where: { id: targetId } });
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    ownerId = cls.ownerId;
  } else {
    const qz = await prisma.quiz.findUnique({ where: { id: targetId } });
    if (!qz) return res.status(404).json({ message: 'Quiz not found' });
    ownerId = qz.ownerId;
  }
  if (ownerId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });

  // ===== LOGIC MỚI: Xử lý theo yêu cầu =====
  if (targetType === 'class') {
    // ========== XỬ LÝ CLASS ==========
    
    if (enabled) {
      // CASE 1: Class Private → Public
      // → Class thành Public + TẤT CẢ Quiz thành Public
      
      // Step 1: Update class to Public
      await prisma.class.update({ 
        where: { id: targetId }, 
        data: { isPublic: true } 
      });
      
      // Step 2: Add class to PublicItem
      await prisma.publicItem.upsert({
        where: { targetType_targetId: { targetType: 'class', targetId } },
        create: { targetType: 'class', targetId },
        update: {},
      });
      
      // Step 3: Get ALL quizzes in this class
      const quizzes = await prisma.quiz.findMany({ 
        where: { classId: targetId },
        select: { id: true }
      });
      
      // Step 4: Set ALL quizzes to Public
      for (const quiz of quizzes) {
        await prisma.quiz.update({ 
          where: { id: quiz.id }, 
          data: { published: true } 
        });
        
        await prisma.publicItem.upsert({
          where: { targetType_targetId: { targetType: 'quiz', targetId: quiz.id } },
          create: { targetType: 'quiz', targetId: quiz.id },
          update: {},
        });
      }
      
    } else {
      // CASE 3: Class Public → Private
      // → Class thành Private + TẤT CẢ Quiz Public thành Private (Quiz Private giữ nguyên)
      
      // Step 1: Update class to Private
      await prisma.class.update({ 
        where: { id: targetId }, 
        data: { isPublic: false } 
      });
      
      // Step 2: Remove class from PublicItem
      await prisma.publicItem.deleteMany({ 
        where: { targetType: 'class', targetId } 
      });
      
      // Step 3: Get ALL quizzes in this class
      const quizzes = await prisma.quiz.findMany({ 
        where: { classId: targetId },
        select: { id: true, published: true }
      });
      
      // Step 4: Set ALL PUBLIC quizzes to Private (giữ nguyên quizzes đã Private)
      for (const quiz of quizzes) {
        if (quiz.published) {  // Chỉ xử lý quiz đang Public
          await prisma.quiz.update({ 
            where: { id: quiz.id }, 
            data: { published: false } 
          });
          
          await prisma.publicItem.deleteMany({ 
            where: { targetType: 'quiz', targetId: quiz.id } 
          });
        }
      }
    }
    
  } else {
    // ========== XỬ LÝ QUIZ ==========
    
    // Get quiz info
    const quiz = await prisma.quiz.findUnique({ 
      where: { id: targetId },
      select: { id: true, classId: true, published: true }
    });
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    // Get class info to check current state
    const cls = await prisma.class.findUnique({
      where: { id: quiz.classId },
      select: { isPublic: true }
    });
    
    if (enabled) {
      // CASE 2: Quiz Private → Public
      // → Class thành Public (nếu chưa) + CHỈ Quiz này thành Public (các quiz khác giữ Private)
      
      // Step 1: Make sure class is Public
      if (!cls?.isPublic) {
        await prisma.class.update({ 
          where: { id: quiz.classId }, 
          data: { isPublic: true } 
        });
        
        // Step 2: Add class to PublicItem
        await prisma.publicItem.upsert({
          where: { targetType_targetId: { targetType: 'class', targetId: quiz.classId } },
          create: { targetType: 'class', targetId: quiz.classId },
          update: {},
        });
      }
      
      // Step 3: Set this quiz to Public
      await prisma.quiz.update({ 
        where: { id: targetId }, 
        data: { published: true } 
      });
      
      // Step 4: Add quiz to PublicItem
      await prisma.publicItem.upsert({
        where: { targetType_targetId: { targetType: 'quiz', targetId } },
        create: { targetType: 'quiz', targetId },
        update: {},
      });
      
    } else {
      // CASE 4: Quiz Public → Private
      // → CHỈ Quiz này thành Private (Class giữ nguyên Public)
      
      // Step 1: Set this quiz to Private
      await prisma.quiz.update({ 
        where: { id: targetId }, 
        data: { published: false } 
      });
      
      // Step 2: Remove quiz from PublicItem
      await prisma.publicItem.deleteMany({ 
        where: { targetType: 'quiz', targetId } 
      });
      
      // Note: Class giữ nguyên trạng thái Public
    }
  }

  res.json({ ok: true });
});

// Toggle share (enable/disable) for class/quiz
router.post('/share', authRequired, async (req, res) => {
  const prisma = req.prisma;
  const { targetType, targetId, enabled } = req.body || {};
  if (!['class', 'quiz'].includes(targetType)) return res.status(400).json({ message: 'Invalid targetType' });
  if (!targetId) return res.status(400).json({ message: 'targetId required' });

  // Verify ownership
  let ownerId = null;
  if (targetType === 'class') {
    const cls = await prisma.class.findUnique({ where: { id: targetId } });
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    ownerId = cls.ownerId;
  } else {
    const qz = await prisma.quiz.findUnique({ where: { id: targetId } });
    if (!qz) return res.status(404).json({ message: 'Quiz not found' });
    ownerId = qz.ownerId;
  }
  if (ownerId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });

  if (enabled) {
    // Create if not exists
    await prisma.shareItem.upsert({
      where: { targetType_targetId: { targetType, targetId } },
      create: { targetType, targetId, ownerId: req.user.id },
      update: {},
    });
  } else {
    await prisma.shareItem.deleteMany({ where: { targetType, targetId } });
  }
  res.json({ ok: true });
});

// Claim access by id or share code (adds to user's list without edit rights)
router.post('/claim', authRequired, async (req, res) => {
  const prisma = req.prisma;
  const { classId, quizId, code } = req.body || {};

  let targetType = null;
  let targetId = null;

  if (code) {
    const share = await prisma.shareItem.findFirst({ where: { code } });
    if (!share) return res.status(404).json({ message: 'Share not found' });
    targetType = share.targetType;
    targetId = share.targetId;
  } else if (classId) {
    const cls = await prisma.class.findUnique({ where: { id: classId } });
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    const exists = await prisma.shareItem.findFirst({ where: { targetType: 'class', targetId: classId } });
    if (!exists) return res.status(403).json({ message: 'Class is not share-enabled' });
    targetType = 'class';
    targetId = classId;
  } else if (quizId) {
    const qz = await prisma.quiz.findUnique({ where: { id: quizId } });
    if (!qz) return res.status(404).json({ message: 'Quiz not found' });
    const exists = await prisma.shareItem.findFirst({ where: { targetType: 'quiz', targetId: quizId } });
    if (!exists) return res.status(403).json({ message: 'Quiz is not share-enabled' });
    targetType = 'quiz';
    targetId = quizId;
  } else {
    return res.status(400).json({ message: 'classId or quizId or code required' });
  }

  await prisma.sharedAccess.upsert({
    where: { userId_targetType_targetId: { userId: req.user.id, targetType, targetId } },
    create: { userId: req.user.id, targetType, targetId },
    update: {},
  });

  res.status(201).json({ targetType, targetId });
});

// Remove access for current user (class or quiz)
router.delete('/access', authRequired, async (req, res) => {
  const prisma = req.prisma;
  const { classId, quizId } = req.body || {};
  if (!classId && !quizId) return res.status(400).json({ message: 'classId or quizId required' });

  if (classId) {
    await prisma.sharedAccess.deleteMany({ where: { userId: req.user.id, targetType: 'class', targetId: classId } });
    return res.status(204).end();
  }

  if (quizId) {
    // Try to delete direct quiz access first
    const del = await prisma.sharedAccess.deleteMany({ where: { userId: req.user.id, targetType: 'quiz', targetId: quizId } });
    if (del.count > 0) return res.status(204).end();
    // If user has class-level share, simply ignore removal (or keep as future enhancement: hidden items)
    return res.status(204).end();
  }
});

// List public classes
router.get('/public/classes', authRequired, async (req, res) => {
  const prisma = req.prisma;
  const pub = await prisma.publicItem.findMany({ where: { targetType: 'class' } });
  const ids = pub.map(p => p.targetId);
  const classes = await prisma.class.findMany({ where: { id: { in: ids } }, include: { quizzes: true } });
  res.json(classes);
});

// List public quizzes
router.get('/public/quizzes', authRequired, async (req, res) => {
  const prisma = req.prisma;
  const pub = await prisma.publicItem.findMany({ where: { targetType: 'quiz' } });
  const ids = pub.map(p => p.targetId);
  const quizzes = await prisma.quiz.findMany({ where: { id: { in: ids } }, include: { questions: true, class: true } });
  res.json(quizzes);
});

// List all shared classes (share-enabled, for resolving short codes)
router.get('/shared/classes', authRequired, async (req, res) => {
  const prisma = req.prisma;
  const shared = await prisma.shareItem.findMany({ where: { targetType: 'class' } });
  const ids = shared.map(s => s.targetId);
  if (ids.length === 0) return res.json([]);
  const classes = await prisma.class.findMany({ where: { id: { in: ids } }, include: { quizzes: true } });
  res.json(classes);
});

// List all shared quizzes (share-enabled, for resolving short codes)
router.get('/shared/quizzes', authRequired, async (req, res) => {
  const prisma = req.prisma;
  const shared = await prisma.shareItem.findMany({ where: { targetType: 'quiz' } });
  const ids = shared.map(s => s.targetId);
  if (ids.length === 0) return res.json([]);
  const quizzes = await prisma.quiz.findMany({ where: { id: { in: ids } }, include: { questions: true, class: true } });
  res.json(quizzes);
});

module.exports = router;
