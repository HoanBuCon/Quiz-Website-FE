/**
 * Script to normalize all existing emails in the database to lowercase
 * 
 * This script will:
 * 1. Find all users with uppercase characters in their email
 * 2. Update them to lowercase
 * 3. Find all password reset records with uppercase emails
 * 4. Update them to lowercase
 * 
 * Usage: node scripts/normalize-emails.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function normalizeEmails() {
  console.log('🔄 Starting email normalization...\n');

  try {
    // Step 1: Get all users
    console.log('📋 Fetching all users...');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
      }
    });
    console.log(`Found ${users.length} users\n`);

    // Step 2: Find users with uppercase emails
    const usersToUpdate = users.filter(user => {
      const normalized = user.email.toLowerCase().trim();
      return user.email !== normalized;
    });

    console.log(`📝 Found ${usersToUpdate.length} users with non-lowercase emails`);

    if (usersToUpdate.length === 0) {
      console.log('✅ No users need email normalization');
    } else {
      // Step 3: Update users one by one to handle potential conflicts
      let updatedCount = 0;
      let skippedCount = 0;
      const errors = [];

      for (const user of usersToUpdate) {
        const oldEmail = user.email;
        const newEmail = oldEmail.toLowerCase().trim();

        try {
          // Check if normalized email already exists
          const existing = await prisma.user.findUnique({
            where: { email: newEmail }
          });

          if (existing && existing.id !== user.id) {
            console.log(`⚠️  Skipping ${oldEmail} -> ${newEmail} (already exists)`);
            skippedCount++;
            errors.push({
              oldEmail,
              newEmail,
              reason: 'Email already exists in database'
            });
            continue;
          }

          // Update the email
          await prisma.user.update({
            where: { id: user.id },
            data: { email: newEmail }
          });

          console.log(`✅ Updated: ${oldEmail} -> ${newEmail}`);
          updatedCount++;
        } catch (error) {
          console.error(`❌ Error updating ${oldEmail}:`, error.message);
          errors.push({
            oldEmail,
            newEmail,
            reason: error.message
          });
          skippedCount++;
        }
      }

      console.log(`\n📊 User emails update summary:`);
      console.log(`   ✅ Successfully updated: ${updatedCount}`);
      console.log(`   ⚠️  Skipped: ${skippedCount}`);

      if (errors.length > 0) {
        console.log('\n⚠️  Errors/Conflicts:');
        errors.forEach(err => {
          console.log(`   - ${err.oldEmail} -> ${err.newEmail}: ${err.reason}`);
        });
      }
    }

    // Step 4: Normalize PasswordReset emails
    console.log('\n📋 Fetching all password reset records...');
    const passwordResets = await prisma.passwordReset.findMany({
      select: {
        id: true,
        email: true,
      }
    });
    console.log(`Found ${passwordResets.length} password reset records\n`);

    const resetsToUpdate = passwordResets.filter(reset => {
      const normalized = reset.email.toLowerCase().trim();
      return reset.email !== normalized;
    });

    console.log(`📝 Found ${resetsToUpdate.length} password resets with non-lowercase emails`);

    if (resetsToUpdate.length === 0) {
      console.log('✅ No password reset records need email normalization');
    } else {
      let resetUpdatedCount = 0;

      for (const reset of resetsToUpdate) {
        const oldEmail = reset.email;
        const newEmail = oldEmail.toLowerCase().trim();

        try {
          await prisma.passwordReset.update({
            where: { id: reset.id },
            data: { email: newEmail }
          });

          console.log(`✅ Updated password reset: ${oldEmail} -> ${newEmail}`);
          resetUpdatedCount++;
        } catch (error) {
          console.error(`❌ Error updating password reset ${oldEmail}:`, error.message);
        }
      }

      console.log(`\n📊 Password reset emails update summary:`);
      console.log(`   ✅ Successfully updated: ${resetUpdatedCount}`);
    }

    console.log('\n✨ Email normalization completed successfully!');
  } catch (error) {
    console.error('\n❌ Fatal error during normalization:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
normalizeEmails()
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
