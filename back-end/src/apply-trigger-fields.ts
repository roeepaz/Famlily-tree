import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  console.log('Applying updated trigger with registration fields to database...');
  
  const createFunctionSql = `
    CREATE OR REPLACE FUNCTION public.handle_new_user_fusing_registration()
    RETURNS TRIGGER AS $$
    DECLARE
      old_id UUID;
      new_tree_id UUID;
    BEGIN
      -- Check if a placeholder profile exists
      -- Try to find by invite_id first, then email, then phone
      IF NEW.raw_user_meta_data->>'invite_id' IS NOT NULL AND NEW.raw_user_meta_data->>'invite_id' <> '' THEN
        BEGIN
          SELECT id INTO old_id FROM public.profiles
          WHERE id = (NEW.raw_user_meta_data->>'invite_id')::uuid AND is_active = false;
        EXCEPTION WHEN OTHERS THEN
          old_id := NULL;
        END;
      END IF;

      IF old_id IS NULL THEN
        SELECT id INTO old_id FROM public.profiles 
        WHERE (
          (email IS NOT NULL AND LOWER(email) = LOWER(NEW.email)) OR 
          (phone IS NOT NULL AND (
            regexp_replace(phone, '\D', '', 'g') = regexp_replace(NEW.phone, '\D', '', 'g') OR
            regexp_replace(phone, '\D', '', 'g') = regexp_replace(NEW.raw_user_meta_data->>'phone', '\D', '', 'g')
          ))
        ) AND is_active = false LIMIT 1;
      END IF;

      IF old_id IS NOT NULL THEN
        -- 1. Clear the email on the old profile to avoid unique constraint violation when inserting the new active profile
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
          COALESCE(
            NEW.raw_user_meta_data->>'first_name',
            NEW.raw_user_meta_data->>'given_name',
            split_part(NEW.raw_user_meta_data->>'name', ' ', 1),
            (SELECT first_name FROM public.profiles WHERE id = old_id)
          ),
          COALESCE(
            NEW.raw_user_meta_data->>'last_name',
            NEW.raw_user_meta_data->>'family_name',
            NULLIF(trim(both ' ' from replace(NEW.raw_user_meta_data->>'name', split_part(NEW.raw_user_meta_data->>'name', ' ', 1), '')), ''),
            (SELECT last_name FROM public.profiles WHERE id = old_id)
          ),
          true,
          NOW(),
          COALESCE(NEW.raw_user_meta_data->>'family_branch_name', (SELECT family_branch_name FROM public.profiles WHERE id = old_id)),
          COALESCE(NEW.raw_user_meta_data->>'phone', (SELECT phone FROM public.profiles WHERE id = old_id)),
          COALESCE(NEW.raw_user_meta_data->>'location', (SELECT location FROM public.profiles WHERE id = old_id)),
          COALESCE(
            NEW.raw_user_meta_data->>'avatar_url',
            NEW.raw_user_meta_data->>'picture',
            (SELECT avatar_url FROM public.profiles WHERE id = old_id)
          ),
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
          COALESCE(
            NEW.raw_user_meta_data->>'family_branch_name',
            COALESCE(
              NEW.raw_user_meta_data->>'last_name',
              NEW.raw_user_meta_data->>'family_name',
              NULLIF(trim(both ' ' from replace(NEW.raw_user_meta_data->>'name', split_part(NEW.raw_user_meta_data->>'name', ' ', 1), '')), ''),
              'User'
            ) || ' Family'
          )
        );

        INSERT INTO public.profiles (
          id, email, first_name, last_name, is_active, tree_id, 
          avatar_url, phone, location, family_branch_name, birth_date, birth_year, created_at
        )
        VALUES (
          NEW.id, 
          NEW.email, 
          COALESCE(
            NEW.raw_user_meta_data->>'first_name',
            NEW.raw_user_meta_data->>'given_name',
            split_part(NEW.raw_user_meta_data->>'name', ' ', 1),
            'First Name'
          ), 
          COALESCE(
            NEW.raw_user_meta_data->>'last_name',
            NEW.raw_user_meta_data->>'family_name',
            NULLIF(trim(both ' ' from replace(NEW.raw_user_meta_data->>'name', split_part(NEW.raw_user_meta_data->>'name', ' ', 1), '')), ''),
            'Last Name'
          ),
          true,
          new_tree_id,
          COALESCE(
            NEW.raw_user_meta_data->>'avatar_url',
            NEW.raw_user_meta_data->>'picture'
          ),
          NEW.raw_user_meta_data->>'phone',
          NEW.raw_user_meta_data->>'location',
          COALESCE(
            NEW.raw_user_meta_data->>'family_branch_name',
            COALESCE(
              NEW.raw_user_meta_data->>'last_name',
              NEW.raw_user_meta_data->>'family_name',
              NULLIF(trim(both ' ' from replace(NEW.raw_user_meta_data->>'name', split_part(NEW.raw_user_meta_data->>'name', ' ', 1), '')), ''),
              'User'
            ) || ' Family'
          ),
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
  console.log('Trigger function created.');

  // Drop triggers
  await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS trigger_on_auth_registration ON auth.users;`);
  await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS execution_on_supabase_auth_user_created ON auth.users;`);
  console.log('Old triggers dropped.');

  // Bind trigger to auth.users
  const bindTriggerSql = `
    CREATE TRIGGER execution_on_supabase_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_fusing_registration();
  `;
  await prisma.$executeRawUnsafe(bindTriggerSql);
  console.log('Trigger execution_on_supabase_auth_user_created bound successfully!');
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
