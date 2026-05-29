import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  console.log('Syncing missing profiles from auth.users...');
  
  try {
    // 1. Fetch all users from auth.users
    const authUsers: any[] = await prisma.$queryRawUnsafe(`
      SELECT id, email, raw_user_meta_data FROM auth.users;
    `);
    
    console.log(`Found ${authUsers.length} user(s) in auth.users.`);

    for (const authUser of authUsers) {
      // 2. Check if profile exists
      const existingProfile = await prisma.profile.findUnique({
        where: { id: authUser.id }
      });

      if (!existingProfile) {
        console.log(`Profile missing for auth user ${authUser.email} (${authUser.id}). Recreating...`);
        
        // 3. Create a FamilyTree for this user
        const meta = authUser.raw_user_meta_data || {};
        const firstName = meta.first_name || 'First';
        const lastName = meta.last_name || 'User';
        const familyName = meta.family_branch_name || `${lastName} Family`;

        const tree = await prisma.familyTree.create({
          data: {
            name: familyName
          }
        });

        // 4. Create the profile
        await prisma.profile.create({
          data: {
            id: authUser.id,
            email: authUser.email,
            firstName: firstName,
            lastName: lastName,
            familyBranchName: familyName,
            phone: meta.phone || null,
            location: meta.location || null,
            isActive: true,
            treeId: tree.id
          }
        });
        
        console.log(`Profile created for ${authUser.email} and linked to family tree "${familyName}".`);
      } else {
        console.log(`Profile already exists for ${authUser.email}.`);
      }
    }
    
    console.log('Profile synchronization complete!');
  } catch (error) {
    console.error('Error during profile synchronization:', error);
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
