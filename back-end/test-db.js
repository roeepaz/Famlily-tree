const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Attempting to connect to database...");
    const count = await prisma.profile.count();
    console.log(`Success! Total profiles: ${count}`);
  } catch (error) {
    console.error("Failed to connect to database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
