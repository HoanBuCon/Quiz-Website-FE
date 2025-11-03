/**
 * Script to migrate base64 images to file storage
 * Usage: node scripts/migrate-images.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'images');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * Check if string is base64 image data
 */
function isBase64Image(str) {
  if (!str || typeof str !== 'string') return false;
  return str.startsWith('data:image/');
}

/**
 * Convert base64 to file and return URL
 */
function saveBase64ToFile(base64Data, prefix = 'img') {
  try {
    // Extract mime type and base64 string
    const matches = base64Data.match(/^data:image\/([a-z]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      console.error('Invalid base64 format');
      return null;
    }

    const extension = matches[1];
    const base64Content = matches[2];
    
    // Generate unique filename
    const filename = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;
    const filepath = path.join(uploadDir, filename);
    
    // Write file
    const buffer = Buffer.from(base64Content, 'base64');
    fs.writeFileSync(filepath, buffer);
    
    // Return URL path
    return `/uploads/images/${filename}`;
  } catch (error) {
    console.error('Error saving base64 to file:', error);
    return null;
  }
}

/**
 * Migrate a single question's images
 */
async function migrateQuestionImages(question) {
  let updated = false;
  const updateData = {};

  // Migrate questionImage
  if (isBase64Image(question.questionImage)) {
    console.log(`  Migrating questionImage for question ${question.id}...`);
    const url = saveBase64ToFile(question.questionImage, `q${question.id}`);
    if (url) {
      updateData.questionImage = url;
      updated = true;
      console.log(`    ✓ Saved as: ${url}`);
    }
  }

  // Migrate optionImages (JSON array)
  if (question.optionImages) {
    try {
      // Prisma returns parsed JSON, not string
      const optionImages = Array.isArray(question.optionImages) 
        ? question.optionImages 
        : JSON.parse(question.optionImages);
      let optionImagesUpdated = false;

      for (let i = 0; i < optionImages.length; i++) {
        if (isBase64Image(optionImages[i])) {
          console.log(`  Migrating optionImage[${i}] for question ${question.id}...`);
          const url = saveBase64ToFile(optionImages[i], `q${question.id}-opt${i}`);
          if (url) {
            optionImages[i] = url;
            optionImagesUpdated = true;
            console.log(`    ✓ Saved as: ${url}`);
          }
        }
      }

      if (optionImagesUpdated) {
        updateData.optionImages = JSON.stringify(optionImages);
        updated = true;
      }
    } catch (error) {
      console.error(`  Error parsing optionImages for question ${question.id}:`, error.message);
    }
  }

  // Update database if needed
  if (updated) {
    await prisma.question.update({
      where: { id: question.id },
      data: updateData
    });
    return true;
  }

  return false;
}

/**
 * Main migration function
 */
async function main() {
  console.log('🔄 Starting image migration...\n');

  try {
    // Get all questions
    const questions = await prisma.question.findMany({
      select: {
        id: true,
        questionImage: true,
        optionImages: true,
        question: true
      }
    });

    console.log(`📊 Found ${questions.length} questions to check\n`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const question of questions) {
      // Check if question needs migration
      let needsMigration = isBase64Image(question.questionImage);
      
      // Check optionImages array for base64
      if (!needsMigration && question.optionImages) {
        const optionImages = Array.isArray(question.optionImages) 
          ? question.optionImages 
          : [];
        needsMigration = optionImages.some(img => isBase64Image(img));
      }

      if (needsMigration) {
        console.log(`📝 Question ${question.id}: "${question.question?.substring(0, 50)}..."`);
        const migrated = await migrateQuestionImages(question);
        if (migrated) {
          migratedCount++;
          console.log(`  ✅ Migrated\n`);
        }
      } else {
        skippedCount++;
      }
    }

    console.log('\n✨ Migration complete!');
    console.log(`  ✅ Migrated: ${migratedCount} questions`);
    console.log(`  ⏭️  Skipped: ${skippedCount} questions (already using URLs)`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
main();
