-- ============================================
-- Minify Database Setup - Part 1: Create Tables
-- ============================================
-- This file creates all necessary tables for Minify
-- Run this file first before other SQL files
-- ============================================

-- NOTE: Supabase provides auth.users table by default
-- We do NOT need to create it, we only reference it via foreign keys

-- ============================================
-- TABLE 1: profiles
-- ============================================
-- Stores user profile information
-- Automatically created when user signs up (via trigger)
-- Links to auth.users via foreign key

CREATE TABLE public.profiles (
  id UUID NOT NULL,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  is_deleted BOOLEAN NULL,
  deleted_at TIMESTAMP WITH TIME ZONE NULL,
  
  -- Primary Key
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  
  -- Unique Constraints
  CONSTRAINT profiles_email_key UNIQUE (email),
  
  -- Foreign Key (references Supabase auth.users)
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) 
    REFERENCES auth.users (id) ON DELETE CASCADE,
  
  -- Check Constraints
  CONSTRAINT display_name_length CHECK (
    (char_length(display_name) >= 2) AND (char_length(display_name) <= 50)
  )
) TABLESPACE pg_default;

-- Index for soft-deleted accounts (improves query performance)
CREATE INDEX IF NOT EXISTS idx_profiles_is_deleted 
  ON public.profiles USING btree (is_deleted) 
  TABLESPACE pg_default
WHERE (is_deleted = true);

-- ============================================
-- TABLE 2: reserved_slugs
-- ============================================
-- Stores slugs that users cannot use for their short links
-- Prevents conflicts with system routes (admin, api, etc.)

CREATE TABLE public.reserved_slugs (
  slug TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  
  -- Primary Key
  CONSTRAINT reserved_slugs_pkey PRIMARY KEY (slug)
) TABLESPACE pg_default;

-- Insert common reserved slugs
INSERT INTO public.reserved_slugs (slug) VALUES
  ('admin'),
  ('api'),
  ('auth'),
  ('login'),
  ('signup'),
  ('dashboard'),
  ('profile'),
  ('settings'),
  ('logout'),
  ('account'),
  ('help'),
  ('support'),
  ('about'),
  ('contact'),
  ('terms'),
  ('privacy'),
  ('static'),
  ('public'),
  ('assets'),
  ('_next'),
  ('favicon'),
  ('robots'),
  ('sitemap')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- TABLE 3: links
-- ============================================
-- Stores all shortened links created by users
-- Includes expiration and active status

CREATE TABLE public.links (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  original_url TEXT NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  is_active BOOLEAN NULL DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE NULL DEFAULT (now() + INTERVAL '7 days'),
  
  -- Primary Key
  CONSTRAINT links_pkey PRIMARY KEY (id),
  
  -- Unique Constraints
  CONSTRAINT links_slug_key UNIQUE (slug),
  
  -- Foreign Key (references profiles, not auth.users directly)
  CONSTRAINT links_user_id_fkey FOREIGN KEY (user_id) 
    REFERENCES public.profiles (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Index for slug lookups (only active links)
CREATE INDEX IF NOT EXISTS idx_links_slug 
  ON public.links USING btree (slug) 
  TABLESPACE pg_default
WHERE (is_active = true);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_links_user_id 
  ON public.links USING btree (user_id) 
  TABLESPACE pg_default
WHERE (user_id IS NOT NULL);

-- Composite index for dashboard queries (user's active links, sorted by date)
CREATE INDEX IF NOT EXISTS idx_links_user_active 
  ON public.links USING btree (user_id, created_at DESC) 
  TABLESPACE pg_default
WHERE (is_active = true AND user_id IS NOT NULL);

-- ============================================
-- Verification Query (Run after this script)
-- ============================================
-- Uncomment and run this to verify all tables were created:
/*
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'reserved_slugs', 'links')
ORDER BY table_name;
*/

-- Expected result: 3 rows (links, profiles, reserved_slugs)