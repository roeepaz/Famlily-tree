import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  console.log('Checking for unconfirmed users in auth.users...');
  
  try {
    // Confirm all registered users in auth.users by setting email_confirmed_at
    const result = await prisma.$executeRawUnsafe(`
      UPDATE auth.users 
      SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
      WHERE email_confirmed_at IS NULL;
    `);
    
    console.log(`Successfully confirmed ${result} user(s) in auth.users.`);
  } catch (error) {
    console.error('Error confirming users in auth.users:', error);
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
