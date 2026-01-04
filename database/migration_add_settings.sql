-- Add new site settings for login slogan and about popup
-- Run this in Supabase SQL Editor

INSERT INTO public.site_settings (setting_key, setting_value, description) VALUES
('login_slogan', 'Welcome to Wangho''s Flower Garden - A special place for Peanut''s fans to connect and celebrate together.', 'Login page slogan text'),
('about_popup_enabled', 'false', 'Show about popup on homepage')
ON CONFLICT (setting_key) DO NOTHING;

-- Verify settings were added
SELECT setting_key, setting_value, description 
FROM public.site_settings 
WHERE setting_key IN ('login_slogan', 'about_popup_enabled');
