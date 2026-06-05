import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  console.log('--- Family Trees ---');
  const trees = await prisma.familyTree.findMany();
  console.log(JSON.stringify(trees, null, 2));

  console.log('\n--- Profiles ---');
  const profiles = await prisma.profile.findMany();
  console.log(JSON.stringify(profiles.map(p => ({
    id: p.id,
    email: p.email,
    name: `${p.firstName} ${p.lastName}`,
    isActive: p.isActive,
    treeId: p.treeId,
    familyBranchName: p.familyBranchName
  })), null, 2));

  console.log('\n--- Relationships ---');
  const rels = await prisma.relationship.findMany({
    include: {
      person: { select: { firstName: true, lastName: true } },
      relative: { select: { firstName: true, lastName: true } }
    }
  });
  console.log(JSON.stringify(rels.map(r => ({
    id: r.id,
    person: `${r.person.firstName} ${r.person.lastName} (${r.personId})`,
    relative: `${r.relative.firstName} ${r.relative.lastName} (${r.relativeId})`,
    type: r.kinshipType,
    isPending: r.isPending
  })), null, 2));
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
