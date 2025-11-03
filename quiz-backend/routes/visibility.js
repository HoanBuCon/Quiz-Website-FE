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

// Toggle share (enable/disable) for class/quiz - LOGIC MỚI GIỐNG PUBLIC/PRIVATE
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

  // ===== LOGIC MỚI - GIỐNG PUBLIC/PRIVATE =====
  if (targetType === 'class') {
    // ========== XỬ LÝ CLASS ==========
    
    if (enabled) {
      // ========== CASE 1: Enable Share Class ==========
      // → Class Shareable + TẤT CẢ Quiz Shareable
      
      console.log('[SHARE CASE 1] Enable Share Class: Setting ALL Quizzes to Shareable');
      
      // Step 1: Create ShareItem for Class
      await prisma.shareItem.upsert({
        where: { targetType_targetId: { targetType: 'class', targetId } },
        create: { targetType: 'class', targetId, ownerId: req.user.id },
        update: {},
      });
      
      // Step 2: Get ALL Quizzes in this Class
      const allQuizzes = await prisma.quiz.findMany({ 
        where: { classId: targetId },
        select: { id: true }
      });
      
      console.log(`Found ${allQuizzes.length} quizzes in class`);
      
      // Step 3: Create ShareItem for ALL Quizzes
      for (const quiz of allQuizzes) {
        await prisma.shareItem.upsert({
          where: { targetType_targetId: { targetType: 'quiz', targetId: quiz.id } },
          create: { targetType: 'quiz', targetId: quiz.id, ownerId: req.user.id },
          update: {},
        });
        
        console.log(`  Quiz ${quiz.id} → Shareable`);
      }
      
      console.log('[SHARE CASE 1] Complete: Class + ALL Quizzes are now Shareable');
      
    } else {
      // ========== CASE 3: Disable Share Class ==========
      // → Class Not Shareable + Quiz Shareable → Not Shareable + Quiz Not Shareable → giữ nguyên
      // → XÓA TẤT CẢ SharedAccess của class + các quiz shareable
      
      console.log('[SHARE CASE 3] Disable Share Class: Remove ShareItems + Remove ALL SharedAccess');
      
      // Step 1: Remove ALL SharedAccess for this Class
      await prisma.sharedAccess.deleteMany({
        where: { targetType: 'class', targetId }
      });
      console.log('  Removed all SharedAccess for class');
      
      // Step 2: Remove ShareItem for Class
      await prisma.shareItem.deleteMany({ 
        where: { targetType: 'class', targetId } 
      });
      
      // Step 2: Get ALL Quizzes and check if they are shareable
      const allQuizzes = await prisma.quiz.findMany({ 
        where: { classId: targetId },
        select: { id: true }
      });
      
      console.log(`Found ${allQuizzes.length} quizzes in class`);
      
      // Step 3: Only remove ShareItem for quizzes that are currently shareable
      for (const quiz of allQuizzes) {
        const shareItem = await prisma.shareItem.findFirst({
          where: { targetType: 'quiz', targetId: quiz.id }
        });
        
        if (shareItem) {
          // This quiz is Shareable → remove ShareItem + remove ALL SharedAccess
          await prisma.shareItem.deleteMany({ 
            where: { targetType: 'quiz', targetId: quiz.id } 
          });
          
          await prisma.sharedAccess.deleteMany({
            where: { targetType: 'quiz', targetId: quiz.id }
          });
          
          console.log(`  Quiz ${quiz.id}: Shareable → Not Shareable (ShareItem + SharedAccess removed)`);
        } else {
          // This quiz is already Not Shareable → keep as-is
          console.log(`  Quiz ${quiz.id}: Not Shareable → Keep Not Shareable`);
        }
      }
      
      console.log('[SHARE CASE 3] Complete: Class Not Shareable + ALL SharedAccess removed');
    }
    
  } else {
    // ========== XỬ LÝ QUIZ ==========
    
    // Get quiz info
    const quiz = await prisma.quiz.findUnique({ 
      where: { id: targetId },
      select: { id: true, classId: true }
    });
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    // Check if class is shareable
    const classShareItem = await prisma.shareItem.findFirst({
      where: { targetType: 'class', targetId: quiz.classId }
    });
    
    if (enabled) {
      // ========== CASE 2: Enable Share Quiz ==========
      // → Class Shareable + CHỈ Quiz này Shareable + Quiz khác giữ nguyên
      
      console.log('[SHARE CASE 2] Enable Share Quiz: Class Shareable + ONLY this Quiz Shareable');
      
      // Step 1: If Class is Not Shareable, make it Shareable
      if (!classShareItem) {
        await prisma.shareItem.upsert({
          where: { targetType_targetId: { targetType: 'class', targetId: quiz.classId } },
          create: { targetType: 'class', targetId: quiz.classId, ownerId: req.user.id },
          update: {},
        });
        
        console.log(`  Class ${quiz.classId}: Not Shareable → Shareable`);
      } else {
        console.log(`  Class ${quiz.classId}: Already Shareable`);
      }
      
      // Step 2: Make THIS Quiz Shareable
      await prisma.shareItem.upsert({
        where: { targetType_targetId: { targetType: 'quiz', targetId } },
        create: { targetType: 'quiz', targetId, ownerId: req.user.id },
        update: {},
      });
      
      console.log(`  Quiz ${targetId}: Not Shareable → Shareable`);
      console.log('[SHARE CASE 2] Complete: Class Shareable + ONLY this Quiz Shareable (others unchanged)');
      
    } else {
      // ========== CASE 4: Disable Share Quiz ==========
      // → CHỈ Quiz này Not Shareable + Class giữ nguyên Shareable
      // → XÓA TẤT CẢ SharedAccess của quiz này
      
      console.log('[SHARE CASE 4] Disable Share Quiz: Remove ShareItem + Remove SharedAccess for this Quiz');
      
      // Step 1: Remove ALL SharedAccess for THIS Quiz
      await prisma.sharedAccess.deleteMany({
        where: { targetType: 'quiz', targetId }
      });
      console.log(`  Removed all SharedAccess for quiz ${targetId}`);
      
      // Step 2: Remove ShareItem for THIS Quiz
      await prisma.shareItem.deleteMany({
        where: { targetType: 'quiz', targetId }
      });
      
      console.log(`  Quiz ${targetId}: Shareable → Not Shareable (ShareItem removed)`);
      console.log(`  Class ${quiz.classId}: Stays Shareable`);
      console.log('[SHARE CASE 4] Complete: ONLY this Quiz Not Shareable + SharedAccess removed');
    }
  }  res.json({ ok: true });
});

// Claim access by id or share code (adds to user's list without edit rights)
// LOGIC MỚI - SỬ DỤNG accessLevel:
// - Claim Class → tạo SharedAccess(class, accessLevel='full') → User có FULL quyền truy cập TẤT CẢ quiz
// - Claim Quiz → tạo SharedAccess(class, accessLevel='navigationOnly') + SharedAccess(quiz, accessLevel='full')
//              → User CHỈ truy cập quiz đó, class access chỉ để navigation/listing
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

  // ===== LOGIC MỚI =====
  if (targetType === 'class') {
    // CLAIM CLASS → Grant FULL access to CLASS (all quizzes)
    console.log(`[CLAIM CLASS] User ${req.user.id} claiming class ${targetId}`);
    
    // Step 0: Verify class is shareable (has ShareItem)
    const classShareItem = await prisma.shareItem.findFirst({
      where: { targetType: 'class', targetId }
    });
    
    if (!classShareItem) {
      console.log(`[CLAIM CLASS] REJECTED: Class ${targetId} is not shareable`);
      return res.status(403).json({ message: 'Lớp học không được chia sẻ hoặc đã bị khóa chia sẻ' });
    }
    
    // Step 1: Create SharedAccess for Class with FULL access
    await prisma.sharedAccess.upsert({
      where: { userId_targetType_targetId: { userId: req.user.id, targetType: 'class', targetId } },
      create: { userId: req.user.id, targetType: 'class', targetId, accessLevel: 'full' },
      update: { accessLevel: 'full' },
    });
    
    console.log(`[CLAIM CLASS] Complete: User has FULL access to class (all quizzes)`);
    
  } else {
    // CLAIM QUIZ → Grant navigationOnly access to CLASS + full access to THIS QUIZ
    console.log(`[CLAIM QUIZ] User ${req.user.id} claiming quiz ${targetId}`);
    
    // Step 0: Verify quiz is shareable (has ShareItem)
    const quizShareItem = await prisma.shareItem.findFirst({
      where: { targetType: 'quiz', targetId }
    });
    
    if (!quizShareItem) {
      console.log(`[CLAIM QUIZ] REJECTED: Quiz ${targetId} is not shareable`);
      return res.status(403).json({ message: 'Quiz không được chia sẻ hoặc đã bị khóa chia sẻ' });
    }
    
    // Get quiz's classId
    const quiz = await prisma.quiz.findUnique({
      where: { id: targetId },
      select: { classId: true }
    });
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    // Step 1: Create SharedAccess for CLASS with navigationOnly access
    await prisma.sharedAccess.upsert({
      where: { userId_targetType_targetId: { userId: req.user.id, targetType: 'class', targetId: quiz.classId } },
      create: { userId: req.user.id, targetType: 'class', targetId: quiz.classId, accessLevel: 'navigationOnly' },
      update: { accessLevel: 'navigationOnly' },
    });
    
    // Step 2: Create SharedAccess for THIS QUIZ with full access
    await prisma.sharedAccess.upsert({
      where: { userId_targetType_targetId: { userId: req.user.id, targetType: 'quiz', targetId } },
      create: { userId: req.user.id, targetType: 'quiz', targetId, accessLevel: 'full' },
      update: { accessLevel: 'full' },
    });
    
    console.log(`[CLAIM QUIZ] Complete: User has navigationOnly access to class + full access to this quiz only`);
  }

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

// Check if class or quiz is shareable (has ShareItem)
router.get('/share/status', authRequired, async (req, res) => {
  const prisma = req.prisma;
  const { targetType, targetId } = req.query;
  
  if (!['class', 'quiz'].includes(targetType)) {
    return res.status(400).json({ message: 'Invalid targetType' });
  }
  if (!targetId) {
    return res.status(400).json({ message: 'targetId required' });
  }

  const shareItem = await prisma.shareItem.findFirst({
    where: { targetType, targetId }
  });

  res.json({ isShareable: !!shareItem });
});

module.exports = router;