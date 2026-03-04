-- Function to insert a default Welcome Note into garden_items for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_welcome_note()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.garden_items (user_id, title, content, category)
  VALUES (
    NEW.id,
    'Welcome to the Garden',
    '<h1>Welcome to the Garden</h1><p>This is your personal space for notes, ideas, and knowledge.</p><p>You can create new notes and link them to your projects. Switch to the <strong>Constellation</strong> view to see how your knowledge connects and visually navigate your thoughts.</p><p><br></p><h2>Getting Started</h2><ul><li><p>Type <code>/</code> to bring up the command menu for rich formatting.</p></li><li><p>Type <code>#</code> followed by a space to create a heading.</p></li><li><p>Use the <strong>Linkers</strong> menu at the bottom to connect this note to other items.</p></li></ul>',
    'Welcome'
  );
  RETURN NEW;
END;
$$;

-- Trigger that fires after a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created_welcome_note ON auth.users;
CREATE TRIGGER on_auth_user_created_welcome_note
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_welcome_note();

-- Optional: Backfill for existing users who do not have any garden items yet
-- Uncomment the block below to run it manually if you'd like to backfill existing users

/*
DO $$
DECLARE
  usr RECORD;
BEGIN
  FOR usr IN SELECT id FROM auth.users WHERE id NOT IN (SELECT DISTINCT user_id FROM public.garden_items) LOOP
    INSERT INTO public.garden_items (user_id, title, content, category)
    VALUES (
      usr.id,
      'Welcome to the Garden',
      '<h1>Welcome to the Garden</h1><p>This is your personal space for notes, ideas, and knowledge.</p><p>You can create new notes and link them to your projects. Switch to the <strong>Constellation</strong> view to see how your knowledge connects and visually navigate your thoughts.</p><p><br></p><h2>Getting Started</h2><ul><li><p>Type <code>/</code> to bring up the command menu for rich formatting.</p></li><li><p>Type <code>#</code> followed by a space to create a heading.</p></li><li><p>Use the <strong>Linkers</strong> menu at the bottom to connect this note to other items.</p></li></ul>',
      'Welcome'
    );
  END LOOP;
END;
$$;
*/
