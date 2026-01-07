-- ============================================
-- Minify Database Setup - Part 2: RLS Policies
-- ============================================
-- This file sets up Row Level Security (RLS) policies
-- Run this file AFTER 01_create_tables.sql
-- ============================================

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reserved_slugs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- LINKS TABLE POLICIES
-- ============================================

-- Policy 1: Allow deletion of expired links (for cron job)
CREATE POLICY "Allow deletion of expired links"
ON public.links
FOR DELETE
USING (expires_at <= now());

-- Policy 2: Anyone can read active links (for public access to shortened URLs)
CREATE POLICY "Anyone can read active links"
ON public.links
FOR SELECT
USING (is_active = true);

-- Policy 3: Users can delete their own links
CREATE POLICY "Users can delete own links"
ON public.links
FOR DELETE
USING (auth.uid() = user_id);

-- Policy 4: Users can insert their own links
CREATE POLICY "Users can insert own links"
ON public.links
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy 5: Users can update their own links
CREATE POLICY "Users can update own links"
ON public.links
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 6: Users can view their own links
CREATE POLICY "Users can view own links"
ON public.links
FOR SELECT
USING (auth.uid() = user_id);

-- ============================================
-- PROFILES TABLE POLICIES
-- ============================================

-- Policy 1: Allow profile creation (for trigger on signup)
CREATE POLICY "Allow profile creation"
ON public.profiles
FOR INSERT
WITH CHECK (true);

-- Policy 2: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 3: Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- ============================================
-- RESERVED_SLUGS TABLE POLICIES
-- ============================================

-- Policy 1: Anyone can read reserved slugs (for validation during link creation)
CREATE POLICY "Anyone can read reserved slugs"
ON public.reserved_slugs
FOR SELECT
USING (true);

-- ============================================
-- NOTES
-- ============================================

-- LINKS TABLE:
-- - "Anyone can read active links" allows unauthenticated users to access shortened URLs
-- - "Users can view own links" allows authenticated users to see their dashboard
-- - "Allow deletion of expired links" enables cron job to delete expired links
-- - Users have full CRUD access to their own links

-- PROFILES TABLE:
-- - "Allow profile creation" has permissive INSERT (WITH CHECK true) because:
--   * The database trigger creates profiles (not in authenticated context)
--   * Security is enforced by foreign key constraint (id must exist in auth.users)
--   * Unique constraints on id and email prevent duplicates
-- - Users can only view/update their own profile (via auth.uid())

-- RESERVED_SLUGS TABLE:
-- - Public read access allows frontend to validate slugs before submission
-- - No INSERT/UPDATE/DELETE policies (managed by admins via SQL only)

-- ============================================
-- Verification Query (Run after this script)
-- ============================================
-- Uncomment and run this to verify all policies were created:
/*
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('links', 'profiles', 'reserved_slugs')
ORDER BY tablename, policyname;
*/

-- Expected result: 10 policies total
-- - links: 6 policies
-- - profiles: 3 policies
-- - reserved_slugs: 1 policy