-- ============================================
-- Minify Database Setup - Part 5: Cron Jobs
-- ============================================
-- This file creates background jobs that run automatically
-- Run this file AFTER 04_triggers.sql
-- ============================================

-- ============================================
-- PREREQUISITE: Enable pg_cron Extension
-- ============================================
-- pg_cron must be enabled before creating cron jobs
-- If you get an error, run this first:

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================
-- CRON JOB 1: delete-expired-links
-- ============================================
-- Runs: Daily at 2:00 AM UTC
-- Purpose: Automatically delete expired links (hard delete)
-- Impact: Keeps database clean and improves performance

SELECT cron.schedule(
  'delete-expired-links',           -- Job name
  '0 2 * * *',                      -- Schedule: Every day at 2:00 AM UTC
  $$DELETE FROM links WHERE expires_at <= now()$$
);

-- NOTES:
-- - Cron format: minute hour day month weekday
-- - '0 2 * * *' = 2:00 AM every day
-- - Hard deletes expired links permanently
-- - No need for is_active check (expired = should be deleted)
-- - RLS policy "Allow deletion of expired links" permits this operation

-- ============================================
-- CRON JOB 2: hard-delete-accounts
-- ============================================
-- Runs: Daily at 2:00 AM UTC
-- Purpose: Permanently delete soft-deleted accounts after 30 days
-- Impact: Removes user data after grace period, triggers cascade delete

SELECT cron.schedule(
  'hard-delete-accounts',           -- Job name
  '0 2 * * *',                      -- Schedule: Every day at 2:00 AM UTC
  $$DELETE FROM auth.users 
    WHERE id IN (
      SELECT id FROM profiles 
      WHERE deleted_at IS NOT NULL 
        AND deleted_at < now() - interval '30 days'
    )$$
);

-- NOTES:
-- - Finds profiles soft-deleted more than 30 days ago
-- - Deletes from auth.users (not profiles directly)
-- - CASCADE delete automatically removes:
--   * profiles record (via foreign key)
--   * links records (via foreign key)
-- - This is the "hard delete" that makes deletion permanent
-- - Users can reactivate within 30 days by logging in

-- ============================================
-- Verification Queries (Run after this script)
-- ============================================

-- View all cron jobs:
/*
SELECT 
  jobid,
  jobname,
  schedule,
  command,
  active
FROM cron.job
ORDER BY jobname;
*/

-- Expected result: 2 cron jobs
-- - delete-expired-links (active: true)
-- - hard-delete-accounts (active: true)

-- ============================================
-- MANAGEMENT COMMANDS (For Future Reference)
-- ============================================

-- To view job execution history:
/*
SELECT 
  jobid,
  jobname,
  runid,
  start_time,
  end_time,
  status,
  return_message
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;
*/

-- To unschedule (delete) a cron job:
/*
SELECT cron.unschedule('job_name_here');
*/

-- To unschedule by job ID:
/*
SELECT cron.unschedule(job_id_here);
*/

-- ============================================
-- IMPORTANT NOTES
-- ============================================

-- TIMING:
-- - Both jobs run at 2:00 AM UTC daily
-- - Adjust schedule if you need different timing
-- - UTC timezone is used (not local time)

-- SECURITY:
-- - Cron jobs run with elevated privileges
-- - RLS policies still apply where configured
-- - Be careful modifying these queries

-- TESTING:
-- - Don't wait 24 hours to test!
-- - Manually run the DELETE queries in SQL Editor
-- - Check results before relying on cron schedule

-- MONITORING:
-- - Check cron.job_run_details regularly
-- - Look for failed executions
-- - Verify expected number of deletions

-- ============================================
-- End of Database Setup
-- ============================================
-- Your Minify database is now fully configured!
-- All tables, policies, functions, triggers, and cron jobs are ready.
-- 
-- Next steps:
-- 1. Test user signup (should auto-create profile)
-- 2. Create a link (should auto-expire in 7 days)
-- 3. Verify cron jobs run successfully after 24 hours
-- ============================================