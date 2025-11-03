/**
 * Script migration: Convert base64 images to file URLs
 * 
 * Chuyển đổi tất cả ảnh base64 trong database sang file storage
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

// Đảm bảo thư mục uploads tồn tại
const uploadsDir = path.join(__dirname, '../public/uploads/images');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Convert base64 string to image file
 */
function saveBase64ToFile(base64String, filename) {
  try {
    // Extract base64 data (remove "data:image/...;base64," prefix)
    const matches = base64String.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
      console.log('❌ Invalid base64 format');
      return null;
    }

    const extension = matches[1]; // png, jpg, jpeg, gif, etc.
    const data = matches[2];
    const buffer = Buffer.from(data, 'base64');

    // Generate unique filename
    const timestamp = Date.now();
    const finalFilename = `${filename}-${timestamp}.${extension}`;
    const filepath = path.join(uploadsDir, finalFilename);

    // Save file
    fs.writeFileSync(filepath, buffer);
    
    // Return URL
    return `/uploads/images/${finalFilename}`;
  } catch (error) {
    console.error('❌ Error saving base64 to file:', error);
    return null;
  }
}

/**
 * Check if string is base64 image
 */
function isBase64Image(str) {
  if (!str || typeof str !== 'string') return false;
  return str.startsWith('data:image/');
}

/**
 * Main migration function
 */
async function migrateImages() {
  console.log('🚀 Starting image migration...\n');

  try {
    // Get all questions
    const questions = await prisma.question.findMany({
      where: {
        OR: [
          { questionImage: { startsWith: 'data:image/' } },
          { optionImages: { not: null } }
        ]
      }
    });

    console.log(`📊 Found ${questions.length} questions with images\n`);

    let migratedCount = 0;
    let errorCount = 0;

    for (const question of questions) {
      console.log(`\n📝 Processing Question ID: ${question.id}`);
      
      let needsUpdate = false;
      let updatedQuestionImage = question.questionImage;
      let updatedOptionImages = question.optionImages;

      // Migrate question image
      if (isBase64Image(question.questionImage)) {
        console.log('  🔄 Migrating question image...');
        const url = saveBase64ToFile(question.questionImage, `question-${question.id}`);
        if (url) {
          updatedQuestionImage = url;
          needsUpdate = true;
          console.log(`  ✅ Saved to: ${url}`);
          console.log(`  📉 Size reduced: ${question.questionImage.length} → ${url.length} bytes`);
        } else {
          console.log('  ❌ Failed to migrate question image');
          errorCount++;
        }
      }

      // Migrate option images
      if (updatedOptionImages) {
        try {
          const optionImagesArray = JSON.parse(updatedOptionImages);
          let optionImagesModified = false;

          for (let i = 0; i < optionImagesArray.length; i++) {
            if (isBase64Image(optionImagesArray[i])) {
              console.log(`  🔄 Migrating option ${i + 1} image...`);
              const url = saveBase64ToFile(optionImagesArray[i], `question-${question.id}-option-${i}`);
              if (url) {
                optionImagesArray[i] = url;
                optionImagesModified = true;
                console.log(`  ✅ Saved to: ${url}`);
              } else {
                console.log(`  ❌ Failed to migrate option ${i + 1} image`);
                errorCount++;
              }
            }
          }

          if (optionImagesModified) {
            updatedOptionImages = JSON.stringify(optionImagesArray);
            needsUpdate = true;
          }
        } catch (error) {
          console.log('  ❌ Error parsing option images:', error.message);
          errorCount++;
        }
      }

      // Update database
      if (needsUpdate) {
        try {
          await prisma.question.update({
            where: { id: question.id },
            data: {
              questionImage: updatedQuestionImage,
              optionImages: updatedOptionImages
            }
          });
          migratedCount++;
          console.log('  💾 Database updated successfully');
        } catch (error) {
          console.log('  ❌ Failed to update database:', error.message);
          errorCount++;
        }
      }
    }

    console.log('\n\n' + '='.repeat(60));
    console.log('✅ MIGRATION COMPLETED!');
    console.log('='.repeat(60));
    console.log(`📊 Total questions processed: ${questions.length}`);
    console.log(`✅ Successfully migrated: ${migratedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Fatal error during migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateImages();
