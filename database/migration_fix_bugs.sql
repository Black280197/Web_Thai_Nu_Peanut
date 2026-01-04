-- Migration to fix RLS policies and countdown date type
-- Run this in Supabase SQL Editor

-- 1. Add INSERT policy for site_settings
DROP POLICY IF EXISTS "Admins can insert site settings" ON public.site_settings;
CREATE POLICY "Admins can insert site settings"
  ON public.site_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 2. Fix countdown target_date type from DATE to TIMESTAMPTZ
ALTER TABLE public.countdown_settings 
  ALTER COLUMN target_date TYPE TIMESTAMPTZ 
  USING target_date::TIMESTAMPTZ;

-- 3. Update handle_new_user function to save avatar_url from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username, role, status, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    'member',
    'active',
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'countdown_settings' AND column_name = 'target_date';

SELECT policyname, tablename, cmd 
FROM pg_policies 
WHERE tablename = 'site_settings';

SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';
