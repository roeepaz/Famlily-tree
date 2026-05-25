const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const profiles = await prisma.profile.findMany({
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        is_active: true
      }
    });
    console.log("Current Profiles in Database:");
    console.log(JSON.stringify(profiles, null, 2));
  } catch (error) {
    console.error("Error reading profiles:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
