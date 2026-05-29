import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  console.log('Fetching users from auth.users...');
  try {
    const users = await prisma.$queryRawUnsafe(`
      SELECT id, email, confirmed_at, email_confirmed_at, created_at 
      FROM auth.users;
    `);
    console.log('Registered Auth Users:', JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error listing auth users:', error);
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
