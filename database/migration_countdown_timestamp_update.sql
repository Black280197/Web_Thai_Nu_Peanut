-- ============================================
-- MIGRATION: Update Countdown to use TIMESTAMPTZ
-- Date: 2026-01-04
-- Description: Ensures target_date column uses TIMESTAMPTZ for time precision
-- ============================================

-- Note: countdown_settings table already uses TIMESTAMPTZ
-- This migration documents that the column type is correct

-- Verify column type
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'countdown_settings' 
  AND column_name = 'target_date';

-- Expected result:
-- column_name  | data_type                   | is_nullable
-- target_date  | timestamp with time zone    | NO

-- The table definition already includes TIMESTAMPTZ:
-- CREATE TABLE IF NOT EXISTS public.countdown_settings (
--   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--   event_type TEXT NOT NULL CHECK (event_type IN ('return_date', 'birthday', 'debut_anniversary')),
--   target_date TIMESTAMPTZ NOT NULL,  <-- Already using TIMESTAMPTZ
--   title TEXT NOT NULL,
--   description TEXT,
--   is_active BOOLEAN DEFAULT TRUE,
--   updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
--   created_at TIMESTAMPTZ DEFAULT NOW(),
--   updated_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- Frontend updates completed:
-- 1. admin-dashboard.js: loadSettings() now properly parses hours and minutes from TIMESTAMPTZ
-- 2. admin-dashboard.js: Save handler combines date + time and validates before saving
-- 3. birthday-wishes.js: loadCountdownSettings() loads target_date from database
-- 4. birthday-wishes.js: Countdown now uses database time instead of hardcoded January 4th
-- 5. countdown.js: Already using database target_date with full timestamp support

-- No database migration needed - column type is already correct!
