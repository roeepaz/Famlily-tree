import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  console.log('Applying updated trigger with registration fields to database...');
  
  // Create the updated function public.handle_new_user_fusing_registration
  const createFunctionSql = `
    CREATE OR REPLACE FUNCTION public.handle_new_user_fusing_registration()
    RETURNS TRIGGER AS $$
    DECLARE
      old_id UUID;
    BEGIN
      -- Check if a placeholder profile exists with the email and is_active = false
      SELECT id INTO old_id FROM public."Profile" WHERE email = NEW.email AND is_active = false LIMIT 1;
      
      IF old_id IS NOT NULL THEN
        -- Update Relationships to point to the new user ID
        UPDATE public."Relationship" SET person_id = NEW.id WHERE person_id = old_id;
        UPDATE public."Relationship" SET relative_id = NEW.id WHERE relative_id = old_id;
        
        -- Update other tables referencing the placeholder profile
        UPDATE public."Post" SET author_id = NEW.id WHERE author_id = old_id;
        UPDATE public."HeritageVault" SET created_by = NEW.id WHERE created_by = old_id;
        
        -- Update the profile itself to make it active and copy registration fields
        UPDATE public."Profile" SET 
          id = NEW.id, 
          is_active = true,
          first_name = COALESCE(NEW.raw_user_meta_data->>'first_name', first_name),
          last_name = COALESCE(NEW.raw_user_meta_data->>'last_name', last_name),
          family_branch_name = COALESCE(family_branch_name, NEW.raw_user_meta_data->>'family_branch_name'),
          phone = COALESCE(NEW.raw_user_meta_data->>'phone', phone),
          location = COALESCE(NEW.raw_user_meta_data->>'location', location),
          avatar_url = COALESCE(NEW.raw_user_meta_data->>'avatar_url', avatar_url),
          birth_date = CASE WHEN NEW.raw_user_meta_data->>'birth_date' IS NOT NULL THEN (NEW.raw_user_meta_data->>'birth_date')::timestamp WITH time zone ELSE birth_date END,
          birth_year = CASE WHEN NEW.raw_user_meta_data->>'birth_date' IS NOT NULL THEN EXTRACT(YEAR FROM (NEW.raw_user_meta_data->>'birth_date')::timestamp WITH time zone)::integer ELSE birth_year END
        WHERE id = old_id;
      ELSE
        -- If no placeholder exists, insert a new active profile using metadata
        INSERT INTO public."Profile" (
          id, email, first_name, last_name, is_active, created_at,
          family_branch_name, phone, location, avatar_url, birth_date, birth_year
        )
        VALUES (
          NEW.id,
          NEW.email,
          COALESCE(NEW.raw_user_meta_data->>'first_name', 'First Name'),
          COALESCE(NEW.raw_user_meta_data->>'last_name', 'Last Name'),
          true,
          NOW(),
          NEW.raw_user_meta_data->>'family_branch_name',
          NEW.raw_user_meta_data->>'phone',
          NEW.raw_user_meta_data->>'location',
          NEW.raw_user_meta_data->>'avatar_url',
          CASE WHEN NEW.raw_user_meta_data->>'birth_date' IS NOT NULL THEN (NEW.raw_user_meta_data->>'birth_date')::timestamp WITH time zone ELSE NULL END,
          CASE WHEN NEW.raw_user_meta_data->>'birth_date' IS NOT NULL THEN EXTRACT(YEAR FROM (NEW.raw_user_meta_data->>'birth_date')::timestamp WITH time zone)::integer ELSE NULL END
        );
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;
  
  await prisma.$executeRawUnsafe(createFunctionSql);
  console.log('Trigger function created.');

  // Drop trigger if exists
  const dropTriggerSql = `
    DROP TRIGGER IF EXISTS execution_on_supabase_auth_user_created ON auth.users;
  `;
  await prisma.$executeRawUnsafe(dropTriggerSql);
  console.log('Old trigger dropped.');

  // Bind trigger to auth.users
  const bindTriggerSql = `
    CREATE TRIGGER execution_on_supabase_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_fusing_registration();
  `;
  await prisma.$executeRawUnsafe(bindTriggerSql);
  console.log('Trigger bound to auth.users successfully!');
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
