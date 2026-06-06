import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanDb() {
  console.log('🧹 Starting database clean-up...');

  // 1. List of public tables to clean
  const tables = [
    'event_poll_votes',
    'event_poll_options',
    'event_rsvps',
    'events',
    'reactions',
    'comments',
    'posts',
    'heritage_vault',
    'relationships',
    'profiles',
    'family_trees'
  ];

  console.log('🗑️  Wiping application tables in public schema...');
  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."${table}" CASCADE;`);
      console.log(`  ✅ Wiped table: ${table}`);
    } catch (error: any) {
      console.warn(`  ⚠️  TRUNCATE failed for table ${table}, trying DELETE: ${error.message}`);
      try {
        await prisma.$executeRawUnsafe(`DELETE FROM "public"."${table}";`);
        console.log(`  ✅ Deleted all rows from table: ${table}`);
      } catch (deleteError: any) {
        console.error(`  ❌ Failed to clean table ${table}: ${deleteError.message}`);
      }
    }
  }

  // 2. Clean auth.users (Supabase Auth schema)
  console.log('🗑️  Wiping auth.users in auth schema...');
  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE auth.users CASCADE;`);
    console.log(`  ✅ Wiped auth.users table.`);
  } catch (error: any) {
    console.warn(`  ⚠️  TRUNCATE failed for auth.users, trying DELETE: ${error.message}`);
    try {
      const result = await prisma.$executeRawUnsafe(`DELETE FROM auth.users;`);
      console.log(`  ✅ Wiped users from auth.users (Deleted count: ${result}).`);
    } catch (deleteError: any) {
      console.error(`  ❌ Failed to clean auth.users: ${deleteError.message}`);
    }
  }

  console.log('\n✨ Database is now completely clean!');
}

cleanDb()
  .catch((e) => {
    console.error('❌ Clean-db script failed:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
