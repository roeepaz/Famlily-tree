import { PrismaClient, KinshipDesignation } from '@prisma/client';
import { autoLinkRelationships } from '../src/controllers/profileController';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function run() {
  console.log('--- STARTING RELATIONSHIP AUTO-LINK TEST ---');

  // 1. Create a temporary family tree
  const tree = await prisma.familyTree.create({
    data: { name: 'Test Auto-Link Tree' }
  });
  console.log(`Created tree: ${tree.id}`);

  try {
    // ----------------------------------------------------
    // TEST 1: Parent Auto-Linking (Sibling and Other Parent)
    // ----------------------------------------------------
    console.log('\n--- Running TEST 1: Parent Auto-Linking ---');
    const userA = await prisma.profile.create({
      data: { id: randomUUID(), firstName: 'Alice', lastName: 'Smith', isActive: true, treeId: tree.id }
    });

    const siblingS = await prisma.profile.create({
      data: { id: randomUUID(), firstName: 'Sam', lastName: 'Smith', isActive: false, treeId: tree.id }
    });

    const parentPlaceholder = await prisma.profile.create({
      data: { id: randomUUID(), firstName: 'Parent of', lastName: 'Smith', isActive: false, treeId: tree.id }
    });

    await prisma.relationship.create({
      data: { personId: userA.id, relativeId: parentPlaceholder.id, kinshipType: KinshipDesignation.PARENT, isPending: false }
    });

    await prisma.relationship.create({
      data: { personId: siblingS.id, relativeId: parentPlaceholder.id, kinshipType: KinshipDesignation.PARENT, isPending: false }
    });

    const motherMarie = await prisma.profile.create({
      data: { id: randomUUID(), firstName: 'Marie', lastName: 'Smith', isActive: false, treeId: tree.id }
    });

    await prisma.relationship.create({
      data: { personId: userA.id, relativeId: motherMarie.id, kinshipType: KinshipDesignation.PARENT, isPending: false }
    });

    await autoLinkRelationships(userA.id, motherMarie.id, KinshipDesignation.PARENT);

    const samMarieRel = await prisma.relationship.findFirst({
      where: { personId: siblingS.id, relativeId: motherMarie.id, kinshipType: KinshipDesignation.PARENT }
    });
    if (samMarieRel) {
      console.log('✅ SUCCESS: Sam is automatically linked to Marie as parent!');
    } else {
      throw new Error('❌ FAILURE: Sam is NOT linked to Marie!');
    }

    const spouseRel = await prisma.relationship.findFirst({
      where: {
        OR: [
          { personId: motherMarie.id, relativeId: parentPlaceholder.id, kinshipType: KinshipDesignation.SPOUSE },
          { personId: parentPlaceholder.id, relativeId: motherMarie.id, kinshipType: KinshipDesignation.SPOUSE }
        ]
      }
    });
    if (spouseRel) {
      console.log('✅ SUCCESS: Marie is automatically linked to Parent Placeholder as spouse!');
    } else {
      throw new Error('❌ FAILURE: Marie and Parent Placeholder are NOT linked as spouses!');
    }

    // ----------------------------------------------------
    // TEST 2: Child Auto-Linking (Spouse linking)
    // ----------------------------------------------------
    console.log('\n--- Running TEST 2: Child Auto-Linking ---');
    const fatherBob = await prisma.profile.create({
      data: { id: randomUUID(), firstName: 'Bob', lastName: 'Smith', isActive: true, treeId: tree.id }
    });

    const motherAnna = await prisma.profile.create({
      data: { id: randomUUID(), firstName: 'Anna', lastName: 'Smith', isActive: true, treeId: tree.id }
    });

    // Bob and Anna are spouses
    await prisma.relationship.create({
      data: { personId: fatherBob.id, relativeId: motherAnna.id, kinshipType: KinshipDesignation.SPOUSE, isPending: false }
    });

    // Add child Charlie to Bob
    const childCharlie = await prisma.profile.create({
      data: { id: randomUUID(), firstName: 'Charlie', lastName: 'Smith', isActive: false, treeId: tree.id }
    });

    await prisma.relationship.create({
      data: { personId: fatherBob.id, relativeId: childCharlie.id, kinshipType: KinshipDesignation.CHILD, isPending: false }
    });

    // Auto-link child
    await autoLinkRelationships(fatherBob.id, childCharlie.id, KinshipDesignation.CHILD);

    // Verify Charlie has Anna as parent
    const charlieAnnaRel = await prisma.relationship.findFirst({
      where: {
        personId: childCharlie.id,
        relativeId: motherAnna.id,
        kinshipType: KinshipDesignation.PARENT
      }
    });
    if (charlieAnnaRel) {
      console.log('✅ SUCCESS: Charlie is automatically linked to Anna (Bob\'s spouse) as parent!');
    } else {
      throw new Error('❌ FAILURE: Charlie is NOT linked to Anna!');
    }

    // ----------------------------------------------------
    // TEST 3: Spouse Auto-Linking (Children linking)
    // ----------------------------------------------------
    console.log('\n--- Running TEST 3: Spouse Auto-Linking ---');
    const fatherDavid = await prisma.profile.create({
      data: { id: randomUUID(), firstName: 'David', lastName: 'Jones', isActive: true, treeId: tree.id }
    });

    const childEmily = await prisma.profile.create({
      data: { id: randomUUID(), firstName: 'Emily', lastName: 'Jones', isActive: false, treeId: tree.id }
    });

    // Emily is David's child
    await prisma.relationship.create({
      data: { personId: fatherDavid.id, relativeId: childEmily.id, kinshipType: KinshipDesignation.CHILD, isPending: false }
    });

    // David adds spouse Fiona
    const spouseFiona = await prisma.profile.create({
      data: { id: randomUUID(), firstName: 'Fiona', lastName: 'Jones', isActive: false, treeId: tree.id }
    });

    await prisma.relationship.create({
      data: { personId: fatherDavid.id, relativeId: spouseFiona.id, kinshipType: KinshipDesignation.SPOUSE, isPending: false }
    });

    // Auto-link spouse
    await autoLinkRelationships(fatherDavid.id, spouseFiona.id, KinshipDesignation.SPOUSE);

    // Verify Emily has Fiona as parent
    const emilyFionaRel = await prisma.relationship.findFirst({
      where: {
        personId: childEmily.id,
        relativeId: spouseFiona.id,
        kinshipType: KinshipDesignation.PARENT
      }
    });
    if (emilyFionaRel) {
      console.log('✅ SUCCESS: Emily is automatically linked to Fiona (David\'s new spouse) as parent!');
    } else {
      throw new Error('❌ FAILURE: Emily is NOT linked to Fiona!');
    }

  } catch (error) {
    console.error('Test failed with error:', error);
  } finally {
    console.log('\nCleaning up database...');
    // Delete all relationships in this tree
    await prisma.relationship.deleteMany({
      where: {
        person: { treeId: tree.id }
      }
    });
    // Delete all profiles in this tree
    await prisma.profile.deleteMany({
      where: { treeId: tree.id }
    });
    // Delete tree
    await prisma.familyTree.delete({
      where: { id: tree.id }
    });
    console.log('Cleaned up.');
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
