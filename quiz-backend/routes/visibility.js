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

  // ===== LOGIC MỚI - CHÍNH XÁC 100% =====
  if (targetType === 'class') {
    // ========== XỬ LÝ CLASS ==========
    
    if (enabled) {
      // ========== CASE 1: Class Private → Public ==========
      // → Class Public + TẤT CẢ Quiz Public
      
      console.log('[CASE 1] Class Private → Public: Setting ALL Quizzes to Public');
      
      // Step 1: Set Class to Public
      await prisma.class.update({ 
        where: { id: targetId }, 
        data: { isPublic: true } 
      });
      
      // Step 2: Add Class to PublicItem
      await prisma.publicItem.upsert({
        where: { targetType_targetId: { targetType: 'class', targetId } },
        create: { targetType: 'class', targetId },
        update: {},
      });
      
      // Step 3: Get ALL Quizzes in this Class
      const allQuizzes = await prisma.quiz.findMany({ 
        where: { classId: targetId },
        select: { id: true }
      });
      
      console.log(`Found ${allQuizzes.length} quizzes in class`);
      
      // Step 4: Set ALL Quizzes to Public (published: true)
      for (const quiz of allQuizzes) {
        await prisma.quiz.update({ 
          where: { id: quiz.id }, 
          data: { published: true } 
        });
        
        await prisma.publicItem.upsert({
          where: { targetType_targetId: { targetType: 'quiz', targetId: quiz.id } },
          create: { targetType: 'quiz', targetId: quiz.id },
          update: {},
        });
        
        console.log(`  Quiz ${quiz.id} → Public`);
      }
      
      console.log('[CASE 1] Complete: Class + ALL Quizzes are now Public');
      
    } else {
      // ========== CASE 3: Class Public → Private ==========
      // → Class Private + Quiz Public → Private + Quiz Private → giữ nguyên
      
      console.log('[CASE 3] Class Public → Private: Public Quizzes → Private, Private Quizzes → Keep');
      
      // Step 1: Set Class to Private
      await prisma.class.update({ 
        where: { id: targetId }, 
        data: { isPublic: false } 
      });
      
      // Step 2: Remove Class from PublicItem
      await prisma.publicItem.deleteMany({ 
        where: { targetType: 'class', targetId } 
      });
      
      // Step 3: Get ALL Quizzes with current published status
      const allQuizzes = await prisma.quiz.findMany({ 
        where: { classId: targetId },
        select: { id: true, published: true }
      });
      
      console.log(`Found ${allQuizzes.length} quizzes in class`);
      
      // Step 4: Only change PUBLIC Quizzes to Private (keep Private quizzes as-is)
      for (const quiz of allQuizzes) {
        if (quiz.published === true) {
          // This quiz is Public → change to Private
          await prisma.quiz.update({ 
            where: { id: quiz.id }, 
            data: { published: false } 
          });
          
          await prisma.publicItem.deleteMany({ 
            where: { targetType: 'quiz', targetId: quiz.id } 
          });
          
          console.log(`  Quiz ${quiz.id}: Public → Private`);
        } else {
          // This quiz is already Private → keep as-is
          console.log(`  Quiz ${quiz.id}: Private → Keep Private`);
        }
      }
      
      console.log('[CASE 3] Complete: Class Private, Public Quizzes → Private, Private Quizzes → Kept');
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
    
    // Get class current state
    const cls = await prisma.class.findUnique({
      where: { id: quiz.classId },
      select: { id: true, isPublic: true }
    });
    
    if (!cls) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    if (enabled) {
      // ========== CASE 2: Quiz Private → Public ==========
      // → Class Public + CHỈ Quiz này Public + Quiz khác giữ nguyên
      
      console.log('[CASE 2] Quiz Private → Public: Class Public + ONLY this Quiz Public');
      
      // Step 1: If Class is Private, make it Public
      if (!cls.isPublic) {
        await prisma.class.update({ 
          where: { id: quiz.classId }, 
          data: { isPublic: true } 
        });
        
        await prisma.publicItem.upsert({
          where: { targetType_targetId: { targetType: 'class', targetId: quiz.classId } },
          create: { targetType: 'class', targetId: quiz.classId },
          update: {},
        });
        
        console.log(`  Class ${quiz.classId}: Private → Public`);
      } else {
        console.log(`  Class ${quiz.classId}: Already Public`);
      }
      
      // Step 2: Set THIS Quiz to Public
      await prisma.quiz.update({ 
        where: { id: targetId }, 
        data: { published: true } 
      });
      
      await prisma.publicItem.upsert({
        where: { targetType_targetId: { targetType: 'quiz', targetId } },
        create: { targetType: 'quiz', targetId },
        update: {},
      });
      
      console.log(`  Quiz ${targetId}: Private → Public`);
      console.log('[CASE 2] Complete: Class Public + ONLY this Quiz Public (others unchanged)');
      
    } else {
      // ========== CASE 4: Quiz Public → Private ==========
      // → CHỈ Quiz này Private + Class giữ nguyên Public
      
      console.log('[CASE 4] Quiz Public → Private: ONLY this Quiz Private, Class stays Public');
      
      // Step 1: Set THIS Quiz to Private
      await prisma.quiz.update({ 
        where: { id: targetId }, 
        data: { published: false } 
      });
      
      // Step 2: Remove THIS Quiz from PublicItem
      await prisma.publicItem.deleteMany({ 
        where: { targetType: 'quiz', targetId } 
      });
      
      console.log(`  Quiz ${targetId}: Public → Private`);
      console.log(`  Class ${quiz.classId}: Stays Public`);
      console.log('[CASE 4] Complete: ONLY this Quiz Private, Class stays Public');
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