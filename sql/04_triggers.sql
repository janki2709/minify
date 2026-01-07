-- ============================================
-- Minify Database Setup - Part 4: Triggers
-- ============================================
-- This file creates triggers that execute functions automatically
-- Run this file AFTER 03_functions.sql
-- ============================================

-- ============================================
-- TRIGGER 1: on_auth_user_created
-- ============================================
-- Automatically creates a profile when a user signs up
-- Fires: AFTER INSERT on auth.users
-- Executes: handle_new_user() function

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- NOTES:
-- - Fires on every new user signup
-- - Creates corresponding record in profiles table
-- - Uses metadata from signup (display_name)
-- - Ensures auth.users and profiles stay in sync

-- ============================================
-- TRIGGER 2: update_profiles_updated_at
-- ============================================
-- Automatically updates updated_at timestamp when profile is modified
-- Fires: BEFORE UPDATE on profiles
-- Executes: update_updated_at_column() function

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- NOTES:
-- - Fires before any UPDATE on profiles table
-- - Sets updated_at = NOW() automatically
-- - Useful for tracking when profile was last modified

-- ============================================
-- TRIGGER 3: update_links_updated_at
-- ============================================
-- Automatically updates updated_at timestamp when link is modified
-- Fires: BEFORE UPDATE on links
-- Executes: update_updated_at_column() function

CREATE TRIGGER update_links_updated_at
  BEFORE UPDATE ON public.links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- NOTES:
-- - Fires before any UPDATE on links table
-- - Sets updated_at = NOW() automatically
-- - Tracks when link was last modified (e.g., extended expiration)

-- ============================================
-- Verification Query (Run after this script)
-- ============================================
-- Uncomment and run this to verify triggers were created:
/*
SELECT 
  trigger_name,
  event_object_table AS table_name,
  action_timing,
  event_manipulation AS event
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name IN (
    'on_auth_user_created',
    'update_profiles_updated_at',
    'update_links_updated_at'
  )
ORDER BY event_object_table, trigger_name;
*/

-- Expected result: 3 triggers
-- - on_auth_user_created (auth.users, AFTER INSERT)
-- - update_links_updated_at (links, BEFORE UPDATE)
-- - update_profiles_updated_at (profiles, BEFORE UPDATE)