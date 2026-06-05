import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function syncUsers() {
  console.log('Syncing existing auth.users to public.profiles...');
  
  try {
    // Get all users from auth.users who don't have a profile in public.profiles
    const missingUsers = await prisma.$queryRawUnsafe<any[]>(`
      SELECT id, email, raw_user_meta_data
      FROM auth.users
      WHERE id NOT IN (SELECT id FROM public.profiles)
    `);

    console.log(`Found ${missingUsers.length} users in auth.users without a database profile.`);

    for (const user of missingUsers) {
      const meta = user.raw_user_meta_data || {};
      const firstName = meta.first_name || 'First Name';
      const lastName = meta.last_name || 'Last Name';
      const familyBranch = meta.family_branch_name || `${lastName} Family`;
      const phone = meta.phone || null;
      const location = meta.location || null;
      const avatarUrl = meta.avatar_url || null;
      const birthDate = meta.birth_date ? new Date(meta.birth_date) : null;
      const birthYear = birthDate ? birthDate.getFullYear() : null;

      // 1. Create a new family tree
      const treeName = familyBranch;
      const tree = await prisma.familyTree.create({
        data: {
          name: treeName,
        }
      });

      // 2. Create the profile
      await prisma.profile.create({
        data: {
          id: user.id,
          email: user.email,
          firstName: firstName,
          lastName: lastName,
          isActive: true,
          treeId: tree.id,
          familyBranchName: familyBranch,
          phone,
          location,
          avatarUrl,
          birthDate,
          birthYear,
        }
      });

      console.log(`Successfully created profile and tree for user: ${user.email} (${user.id})`);
    }

    console.log('Sync complete.');
  } catch (error: any) {
    console.error('Error during sync:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

syncUsers();
