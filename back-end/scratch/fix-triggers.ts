import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAndFixTrigger() {
  console.log('Checking if auth trigger exists...\n');

  // 1. Check if the trigger function exists
  try {
    const funcs = await prisma.$queryRawUnsafe<any[]>(`
      SELECT routine_name FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_name = 'handle_new_user_fusing_registration'
    `);
    
    if (funcs.length > 0) {
      console.log('✅ Trigger function "handle_new_user_fusing_registration" exists.');
    } else {
      console.log('❌ Trigger function NOT found. Re-deploying...');
    }
  } catch (e: any) {
    console.log('⚠️  Could not check function:', e.message);
  }

  // 2. Check if trigger is bound to auth.users
  try {
    const triggers = await prisma.$queryRawUnsafe<any[]>(`
      SELECT trigger_name, event_manipulation, action_statement
      FROM information_schema.triggers
      WHERE event_object_schema = 'auth'
      AND event_object_table = 'users'
    `);
    
    if (triggers.length > 0) {
      console.log('✅ Triggers on auth.users:');
      triggers.forEach(t => {
        console.log(`   - ${t.trigger_name} (${t.event_manipulation})`);
      });
    } else {
      console.log('❌ No triggers found on auth.users. Re-deploying...');
    }
  } catch (e: any) {
    console.log('⚠️  Could not check triggers:', e.message);
  }

  // 3. Re-deploy the trigger function and binding (idempotent - uses CREATE OR REPLACE)
  console.log('\nRe-deploying trigger to be safe...');

  const createFunctionSql = `
    CREATE OR REPLACE FUNCTION public.handle_new_user_fusing_registration()
    RETURNS TRIGGER AS $$
    DECLARE
      old_id UUID;
      new_tree_id UUID;
    BEGIN
      -- Find placeholder
      SELECT id INTO old_id FROM public.profiles WHERE email = NEW.email AND is_active = false LIMIT 1;

      IF old_id IS NOT NULL THEN
        -- 1. Clear the email on the old profile to avoid unique constraint violation when inserting the new profile
        UPDATE public.profiles SET email = NULL WHERE id = old_id;
        
        -- 2. Insert the new active profile with the new auth ID (NEW.id)
        INSERT INTO public.profiles (
          id, tree_id, email, first_name, last_name, is_active, created_at,
          family_branch_name, phone, location, avatar_url, birth_date, birth_year
        )
        VALUES (
          NEW.id,
          (SELECT tree_id FROM public.profiles WHERE id = old_id),
          NEW.email,
          COALESCE(NEW.raw_user_meta_data->>'first_name', (SELECT first_name FROM public.profiles WHERE id = old_id)),
          COALESCE(NEW.raw_user_meta_data->>'last_name', (SELECT last_name FROM public.profiles WHERE id = old_id)),
          true,
          NOW(),
          COALESCE(NEW.raw_user_meta_data->>'family_branch_name', (SELECT family_branch_name FROM public.profiles WHERE id = old_id)),
          COALESCE(NEW.raw_user_meta_data->>'phone', (SELECT phone FROM public.profiles WHERE id = old_id)),
          COALESCE(NEW.raw_user_meta_data->>'location', (SELECT location FROM public.profiles WHERE id = old_id)),
          COALESCE(NEW.raw_user_meta_data->>'avatar_url', (SELECT avatar_url FROM public.profiles WHERE id = old_id)),
          CASE WHEN NEW.raw_user_meta_data->>'birth_date' IS NOT NULL THEN (NEW.raw_user_meta_data->>'birth_date')::timestamp WITH time zone ELSE (SELECT birth_date FROM public.profiles WHERE id = old_id) END,
          CASE WHEN NEW.raw_user_meta_data->>'birth_date' IS NOT NULL THEN EXTRACT(YEAR FROM (NEW.raw_user_meta_data->>'birth_date')::timestamp WITH time zone)::integer ELSE (SELECT birth_year FROM public.profiles WHERE id = old_id) END
        );

        -- 3. Update all referencing tables to point to the new ID
        UPDATE public.relationships SET person_id = NEW.id WHERE person_id = old_id;
        UPDATE public.relationships SET relative_id = NEW.id WHERE relative_id = old_id;
        UPDATE public.posts SET author_id = NEW.id WHERE author_id = old_id;
        UPDATE public.heritage_vault SET created_by = NEW.id WHERE created_by = old_id;
        
        -- 4. Delete the old placeholder profile
        DELETE FROM public.profiles WHERE id = old_id;
      ELSE
        -- Fresh signup: provision new FamilyTree & create the active profile
        new_tree_id = gen_random_uuid();
        
        INSERT INTO public.family_trees (id, name)
        VALUES (
          new_tree_id, 
          COALESCE(NEW.raw_user_meta_data->>'family_branch_name', COALESCE(NEW.raw_user_meta_data->>'last_name', 'User') || ' Family')
        );

        INSERT INTO public.profiles (
          id, email, first_name, last_name, is_active, tree_id, 
          avatar_url, phone, location, family_branch_name, birth_date, birth_year, created_at
        )
        VALUES (
          NEW.id, 
          NEW.email, 
          COALESCE(NEW.raw_user_meta_data->>'first_name', 'First Name'), 
          COALESCE(NEW.raw_user_meta_data->>'last_name', 'Last Name'),
          true,
          new_tree_id,
          NEW.raw_user_meta_data->>'avatar_url',
          NEW.raw_user_meta_data->>'phone',
          NEW.raw_user_meta_data->>'location',
          COALESCE(NEW.raw_user_meta_data->>'family_branch_name', COALESCE(NEW.raw_user_meta_data->>'last_name', 'User') || ' Family'),
          CASE WHEN NEW.raw_user_meta_data->>'birth_date' IS NOT NULL THEN (NEW.raw_user_meta_data->>'birth_date')::timestamp WITH time zone ELSE NULL END,
          CASE WHEN NEW.raw_user_meta_data->>'birth_date' IS NOT NULL THEN EXTRACT(YEAR FROM (NEW.raw_user_meta_data->>'birth_date')::timestamp WITH time zone)::integer ELSE NULL END,
          NOW()
        );
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;
  
  await prisma.$executeRawUnsafe(createFunctionSql);
  console.log('✅ Trigger function deployed.');

  // Drop and recreate trigger binding
  await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS trigger_on_auth_registration ON auth.users;`);
  await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS execution_on_supabase_auth_user_created ON auth.users;`);
  await prisma.$executeRawUnsafe(`
    CREATE TRIGGER execution_on_supabase_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_fusing_registration();
  `);
  console.log('✅ Trigger bound to auth.users.');

  // Also re-deploy the calculate_inferred_network function
  console.log('\nRe-deploying calculate_inferred_network function...');
  const crawlerSql = `
    CREATE OR REPLACE FUNCTION public.calculate_inferred_network(viewer_uuid UUID, boundary_limit INT DEFAULT 3)
    RETURNS TABLE (target_profile_id UUID, path_distance INT) AS $$
    DECLARE
        target_tree_id UUID;
    BEGIN
        SELECT tree_id INTO target_tree_id FROM public.profiles WHERE id = viewer_uuid;
        RETURN QUERY
        WITH RECURSIVE graph_crawler AS (
            SELECT 
                CASE 
                    WHEN person_id = viewer_uuid THEN relative_id
                    ELSE person_id
                END AS next_hop,
                1 AS separation_degree
            FROM public.relationships
            WHERE (person_id = viewer_uuid OR relative_id = viewer_uuid)
              AND is_pending = false
            UNION
            SELECT 
                CASE 
                    WHEN r.person_id = gc.next_hop THEN r.relative_id
                    ELSE r.person_id
                END AS next_hop,
                gc.separation_degree + 1
            FROM public.relationships r
            INNER JOIN graph_crawler gc ON r.person_id = gc.next_hop OR r.relative_id = gc.next_hop
            INNER JOIN public.profiles p ON (
                CASE 
                    WHEN r.person_id = gc.next_hop THEN r.relative_id
                    ELSE r.person_id
                END
            ) = p.id
            WHERE gc.separation_degree < boundary_limit
              AND p.tree_id = target_tree_id
              AND r.is_pending = false
        )
        SELECT DISTINCT next_hop, separation_degree FROM graph_crawler;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;
  await prisma.$executeRawUnsafe(crawlerSql);
  console.log('✅ calculate_inferred_network function deployed.');

  console.log('\n🎉 Everything is ready. Register a new account and you should receive a confirmation email from Supabase.');
  await prisma.$disconnect();
}

checkAndFixTrigger().catch(e => {
  console.error('Error:', e.message);
  prisma.$disconnect();
});
