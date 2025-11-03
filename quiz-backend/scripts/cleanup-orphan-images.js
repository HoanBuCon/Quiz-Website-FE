/**
 * Script xóa ảnh orphan (không được tham chiếu trong database)
 * Chạy: node scripts/cleanup-orphan-images.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const isProd = process.env.NODE_ENV === 'production';
const uploadDir = isProd 
  ? path.join(__dirname, '../../uploads/images')  // cPanel: public_html/uploads/images
  : path.join(__dirname, '../public/uploads/images');

async function cleanupOrphanImages() {
  console.log('🔍 Scanning for orphan images...\n');
  
  // 1. Lấy tất cả ảnh trong database
  const questions = await prisma.question.findMany({
    select: {
      questionImage: true,
      optionImages: true
    }
  });
  
  const usedImages = new Set();
  
  for (const q of questions) {
    // Thêm questionImage
    if (q.questionImage) {
      const filename = q.questionImage.split('/uploads/images/').pop();
      usedImages.add(filename);
    }
    
    // Thêm optionImages
    if (q.optionImages && typeof q.optionImages === 'object') {
      const images = Array.isArray(q.optionImages) 
        ? q.optionImages 
        : Object.values(q.optionImages);
      
      for (const imgUrl of images) {
        if (imgUrl && typeof imgUrl === 'string' && imgUrl.includes('/uploads/images/')) {
          const filename = imgUrl.split('/uploads/images/').pop();
          usedImages.add(filename);
        }
      }
    }
  }
  
  console.log(`✓ Found ${usedImages.size} images in database\n`);
  
  // 2. Lấy tất cả file trong thư mục uploads
  if (!fs.existsSync(uploadDir)) {
    console.log('❌ Upload directory not found!');
    return;
  }
  
  const allFiles = fs.readdirSync(uploadDir);
  console.log(`✓ Found ${allFiles.length} files in upload directory\n`);
  
  // 3. Xóa file không được tham chiếu
  let deletedCount = 0;
  let totalSize = 0;
  
  for (const filename of allFiles) {
    if (!usedImages.has(filename)) {
      const filePath = path.join(uploadDir, filename);
      const stats = fs.statSync(filePath);
      totalSize += stats.size;
      
      fs.unlinkSync(filePath);
      console.log(`🗑️  Deleted: ${filename} (${(stats.size / 1024).toFixed(2)} KB)`);
      deletedCount++;
    }
  }
  
  console.log('\n✅ Cleanup completed!');
  console.log(`   Deleted: ${deletedCount} files`);
  console.log(`   Freed: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  
  await prisma.$disconnect();
}

cleanupOrphanImages().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
