import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function nukeAll() {
  console.log('🔥 Deleting ALL data from the database...\n');

  // 1. Delete all relationships
  const rels = await prisma.relationship.deleteMany({});
  console.log(`  Deleted ${rels.count} relationships.`);

  // 2. Delete all posts
  const posts = await prisma.post.deleteMany({});
  console.log(`  Deleted ${posts.count} posts.`);

  // 3. Delete all heritage vault entries
  const heritage = await prisma.heritageVault.deleteMany({});
  console.log(`  Deleted ${heritage.count} heritage events.`);

  // 4. Delete ALL profiles (including roeepaz15@gmail.com)
  const profiles = await prisma.profile.deleteMany({});
  console.log(`  Deleted ${profiles.count} profiles.`);

  // 5. Delete all family trees
  const trees = await prisma.familyTree.deleteMany({});
  console.log(`  Deleted ${trees.count} family trees.`);

  // 6. Delete ALL users from Supabase auth.users table
  try {
    const result = await prisma.$executeRawUnsafe(`DELETE FROM auth.users`);
    console.log(`  Deleted ${result} auth users from Supabase Auth.`);
  } catch (e: any) {
    console.log(`  ⚠️  Could not delete auth.users directly: ${e.message}`);
    console.log(`  → You may need to delete users manually from the Supabase Dashboard.`);
  }

  console.log('\n✅ Database fully wiped. You can register a fresh account now.');
  await prisma.$disconnect();
}

nukeAll().catch(e => {
  console.error('Error:', e.message);
  prisma.$disconnect();
});
