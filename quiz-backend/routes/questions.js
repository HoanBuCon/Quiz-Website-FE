const express = require('express');
const router = express.Router();

// GET /info/:email - In ra terminal thông tin user (username, email, password)
router.get('/info/:email', async (req, res) => {
  const prisma = req.prisma;
  const email = req.params.email;
  const user = await prisma.user.findFirst({ where: { email } });
  if (!user) return res.status(404).json({ message: 'User not found' });
  // In ra terminal thông tin user
  console.log(`User info for '${email}':`, {
    name: user.name,
    email: user.email,
    passwordHash: user.passwordHash
  });
  res.json({ name: user.name, email: user.email, passwordHash: user.passwordHash });
});

// GET /by-email/:email - In ra terminal danh sách câu hỏi của user
router.get('/by-email/:email', async (req, res) => {
  const prisma = req.prisma;
  const email = req.params.email;
  // Truy vấn user
  const user = await prisma.user.findFirst({ where: { email } });
  if (!user) return res.status(404).json({ message: 'User not found' });
  // Truy vấn câu hỏi
  const questions = await prisma.question.findMany({ where: { userId: user.id } });
  // In ra terminal
  console.log(`Questions for email '${email}':`, questions);
  res.json({ count: questions.length });
});

module.exports = router;

// Nếu chạy trực tiếp file này bằng node, tự động truy vấn thông tin user với email cố định
if (require.main === module) {
  (async () => {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const email = 'saygex69@gmail.com'; // Thay bằng email bạn muốn truy vấn
    try {
      const user = await prisma.user.findFirst({ where: { email } });
      if (!user) {
        console.log('User not found');
        process.exit(1);
      }
      console.log('User info:', {
        name: user.name,
        email: user.email,
        passwordHash: user.passwordHash
      });
      const questions = await prisma.question.findMany({ where: { userId: user.id } });
      console.log(`Questions for email '${email}':`, questions);
    } catch (err) {
      console.error('Error:', err);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  })();
}
