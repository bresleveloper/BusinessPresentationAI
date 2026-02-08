-- ============================================
-- Database Verification Script
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Check if user_sessions table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'user_sessions'
) AS user_sessions_exists;

-- 2. Check if presentation_ratings table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'presentation_ratings'
) AS presentation_ratings_exists;

-- 3. Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_sessions'
ORDER BY ordinal_position;

-- 4. Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('user_sessions', 'presentation_ratings');

-- 5. Check policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename IN ('user_sessions', 'presentation_ratings')
ORDER BY tablename, policyname;

-- 6. Count existing sessions (if table exists)
SELECT COUNT(*) as total_sessions
FROM user_sessions;

-- 7. View recent sessions (if any exist)
SELECT
  user_id,
  session_id,
  created_at,
  CASE
    WHEN business_profile IS NOT NULL THEN 'Yes'
    ELSE 'No'
  END as has_profile,
  CASE
    WHEN conversation IS NOT NULL THEN 'Yes'
    ELSE 'No'
  END as has_conversation,
  CASE
    WHEN presentations IS NOT NULL THEN 'Yes'
    ELSE 'No'
  END as has_presentations
FROM user_sessions
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- If tables don't exist, run:
-- 1. supabase-sessions-schema.sql
-- 2. supabase-ratings-schema.sql
-- ============================================
