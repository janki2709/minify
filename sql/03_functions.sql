-- ============================================
-- Minify Database Setup - Part 3: Functions
-- ============================================
-- This file creates database functions used by triggers
-- Run this file AFTER 02_rls_policies.sql
-- Run this file BEFORE 04_triggers.sql
-- ============================================

-- ============================================
-- FUNCTION 1: handle_new_user()
-- ============================================
-- Automatically creates a profile when a user signs up
-- Triggered by: INSERT on auth.users
-- Purpose: Sync user data from auth.users to profiles table

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

-- NOTES:
-- - SECURITY DEFINER: Runs with creator's permissions (bypasses RLS)
-- - COALESCE: Uses display_name from signup metadata, or extracts from email
-- - split_part: Extracts username from email (before @) as fallback
-- - Example: john@example.com → display_name = "john" (if not provided)

-- ============================================
-- FUNCTION 2: update_updated_at_column()
-- ============================================
-- Automatically updates the updated_at timestamp on row changes
-- Triggered by: UPDATE on profiles, links tables
-- Purpose: Keep track of when records were last modified

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- NOTES:
-- - Runs BEFORE UPDATE
-- - Sets updated_at to current timestamp automatically
-- - Applied to both profiles and links tables

-- ============================================
-- Verification Query (Run after this script)
-- ============================================
-- Uncomment and run this to verify functions were created:
/*
SELECT 
  routine_name AS function_name,
  routine_type AS type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('handle_new_user', 'update_updated_at_column')
ORDER BY routine_name;
*/

-- Expected result: 2 functions
-- - handle_new_user
-- - update_updated_at_column