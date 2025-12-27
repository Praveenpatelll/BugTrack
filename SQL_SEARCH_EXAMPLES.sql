-- ============================================
-- SQL QUERY EXAMPLES FOR SEARCHING DATABASE
-- Run these queries in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. BASIC SEARCHES
-- ============================================

-- Search all users
SELECT * FROM public.users ORDER BY created_at DESC;

-- Search user by email
SELECT * FROM public.users WHERE email = 'patelpraveen972@gmail.com';

-- Search users by name pattern (case-insensitive)
SELECT * FROM public.users WHERE name ILIKE '%praveen%';

-- Search all bugs
SELECT * FROM public.bugs ORDER BY created_at DESC LIMIT 20;

-- Search bugs by status
SELECT * FROM public.bugs WHERE status = 'Open';

-- Search bugs by priority and severity
SELECT * FROM public.bugs 
WHERE priority = 'High' AND severity = 'Critical'
ORDER BY created_at DESC;

-- Search bugs by keyword in title or description
SELECT * FROM public.bugs 
WHERE title ILIKE '%login%' OR description ILIKE '%login%'
ORDER BY created_at DESC;

-- ============================================
-- 2. SEARCHES WITH JOINS
-- ============================================

-- Get bugs with reporter and assignee information
SELECT 
  b.id,
  b.title,
  b.status,
  b.priority,
  b.severity,
  b.created_at,
  reporter.name as reporter_name,
  reporter.email as reporter_email,
  assignee.name as assignee_name,
  assignee.email as assignee_email,
  p.name as project_name
FROM public.bugs b
LEFT JOIN public.users reporter ON b.reporter_id = reporter.id
LEFT JOIN public.users assignee ON b.assignee_id = assignee.id
LEFT JOIN public.projects p ON b.project_id = p.id
ORDER BY b.created_at DESC
LIMIT 50;

-- Get all data for a specific bug with related information
SELECT 
  b.*,
  reporter.name as reporter_name,
  reporter.email as reporter_email,
  reporter.avatar as reporter_avatar,
  assignee.name as assignee_name,
  assignee.email as assignee_email,
  assignee.avatar as assignee_avatar,
  p.name as project_name,
  p.description as project_description
FROM public.bugs b
LEFT JOIN public.users reporter ON b.reporter_id = reporter.id
LEFT JOIN public.users assignee ON b.assignee_id = assignee.id
LEFT JOIN public.projects p ON b.project_id = p.id
WHERE b.id = 1;  -- Replace with actual bug ID

-- Get bugs with attachment counts
SELECT 
  b.id,
  b.title,
  b.status,
  b.priority,
  COUNT(DISTINCT a.id) as attachment_count,
  COUNT(DISTINCT c.id) as comment_count
FROM public.bugs b
LEFT JOIN public.attachments a ON b.id = a.bug_id
LEFT JOIN public.comments c ON b.id = c.bug_id
GROUP BY b.id, b.title, b.status, b.priority
ORDER BY b.created_at DESC;

-- ============================================
-- 3. PROJECT-BASED SEARCHES
-- ============================================

-- Get all projects with bug counts
SELECT 
  p.id,
  p.name,
  p.description,
  p.status,
  COUNT(b.id) as total_bugs,
  SUM(CASE WHEN b.status = 'Open' THEN 1 ELSE 0 END) as open_bugs,
  SUM(CASE WHEN b.status = 'In Progress' THEN 1 ELSE 0 END) as in_progress_bugs,
  SUM(CASE WHEN b.status = 'Closed' THEN 1 ELSE 0 END) as closed_bugs
FROM public.projects p
LEFT JOIN public.bugs b ON p.id = b.project_id
GROUP BY p.id, p.name, p.description, p.status
ORDER BY total_bugs DESC;

-- Get bugs for a specific project
SELECT 
  b.*,
  reporter.name as reporter_name,
  assignee.name as assignee_name
FROM public.bugs b
LEFT JOIN public.users reporter ON b.reporter_id = reporter.id
LEFT JOIN public.users assignee ON b.assignee_id = assignee.id
WHERE b.project_id = 1  -- Replace with actual project ID
ORDER BY b.created_at DESC;

-- ============================================
-- 4. USER ACTIVITY SEARCHES
-- ============================================

-- Get all bugs reported by a specific user
SELECT 
  b.id,
  b.title,
  b.status,
  b.priority,
  b.severity,
  b.created_at,
  p.name as project_name,
  assignee.name as assignee_name
FROM public.bugs b
LEFT JOIN public.projects p ON b.project_id = p.id
LEFT JOIN public.users assignee ON b.assignee_id = assignee.id
WHERE b.reporter_id = (SELECT id FROM public.users WHERE email = 'patelpraveen972@gmail.com')
ORDER BY b.created_at DESC;

-- Get all bugs assigned to a specific user
SELECT 
  b.id,
  b.title,
  b.status,
  b.priority,
  b.severity,
  b.created_at,
  p.name as project_name,
  reporter.name as reporter_name
FROM public.bugs b
LEFT JOIN public.projects p ON b.project_id = p.id
LEFT JOIN public.users reporter ON b.reporter_id = reporter.id
WHERE b.assignee_id = (SELECT id FROM public.users WHERE email = 'patelpraveen972@gmail.com')
ORDER BY b.created_at DESC;

-- Get all comments by a user
SELECT 
  c.id,
  c.content,
  c.created_at,
  b.id as bug_id,
  b.title as bug_title,
  u.name as commenter_name
FROM public.comments c
JOIN public.bugs b ON c.bug_id = b.id
JOIN public.users u ON c.user_id = u.id
WHERE c.user_id = (SELECT id FROM public.users WHERE email = 'patelpraveen972@gmail.com')
ORDER BY c.created_at DESC;

-- Get combined user activity (bugs + comments)
WITH user_bugs AS (
  SELECT 
    'bug_reported' as activity_type,
    b.id as item_id,
    b.title as description,
    b.created_at,
    p.name as context
  FROM public.bugs b
  LEFT JOIN public.projects p ON b.project_id = p.id
  WHERE b.reporter_id = (SELECT id FROM public.users WHERE email = 'patelpraveen972@gmail.com')
),
user_comments AS (
  SELECT 
    'comment' as activity_type,
    c.id as item_id,
    LEFT(c.content, 100) as description,
    c.created_at,
    b.title as context
  FROM public.comments c
  JOIN public.bugs b ON c.bug_id = b.id
  WHERE c.user_id = (SELECT id FROM public.users WHERE email = 'patelpraveen972@gmail.com')
)
SELECT * FROM user_bugs
UNION ALL
SELECT * FROM user_comments
ORDER BY created_at DESC
LIMIT 50;

-- ============================================
-- 5. ADVANCED FILTERING
-- ============================================

-- Complex multi-condition search
SELECT 
  b.*,
  reporter.name as reporter_name,
  assignee.name as assignee_name,
  p.name as project_name
FROM public.bugs b
LEFT JOIN public.users reporter ON b.reporter_id = reporter.id
LEFT JOIN public.users assignee ON b.assignee_id = assignee.id
LEFT JOIN public.projects p ON b.project_id = p.id
WHERE 
  (b.title ILIKE '%login%' OR b.description ILIKE '%login%')
  AND b.status IN ('Open', 'In Progress')
  AND b.priority IN ('High', 'Critical')
  AND b.created_at >= NOW() - INTERVAL '30 days'
ORDER BY 
  CASE b.priority
    WHEN 'Critical' THEN 1
    WHEN 'High' THEN 2
    WHEN 'Medium' THEN 3
    WHEN 'Low' THEN 4
  END,
  b.created_at DESC;

-- Search bugs by multiple fields with OR conditions
SELECT * FROM public.bugs
WHERE 
  title ILIKE '%error%' OR
  description ILIKE '%error%' OR
  steps_to_reproduce ILIKE '%error%' OR
  expected_result ILIKE '%error%' OR
  actual_result ILIKE '%error%'
ORDER BY created_at DESC;

-- ============================================
-- 6. STATISTICAL QUERIES
-- ============================================

-- Get bug statistics by status
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM public.bugs
GROUP BY status
ORDER BY count DESC;

-- Get bug statistics by priority
SELECT 
  priority,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM public.bugs
GROUP BY priority
ORDER BY 
  CASE priority
    WHEN 'Critical' THEN 1
    WHEN 'High' THEN 2
    WHEN 'Medium' THEN 3
    WHEN 'Low' THEN 4
  END;

-- Get bug statistics by severity
SELECT 
  severity,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM public.bugs
GROUP BY severity
ORDER BY count DESC;

-- Get bugs created per day (last 30 days)
SELECT 
  DATE(created_at) as date,
  COUNT(*) as bugs_created
FROM public.bugs
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Get most active reporters
SELECT 
  u.name,
  u.email,
  COUNT(b.id) as bugs_reported
FROM public.users u
LEFT JOIN public.bugs b ON u.id = b.reporter_id
GROUP BY u.id, u.name, u.email
HAVING COUNT(b.id) > 0
ORDER BY bugs_reported DESC
LIMIT 10;

-- Get bugs per assignee
SELECT 
  COALESCE(u.name, 'Unassigned') as assignee_name,
  COUNT(b.id) as assigned_bugs,
  SUM(CASE WHEN b.status = 'Open' THEN 1 ELSE 0 END) as open_bugs,
  SUM(CASE WHEN b.status = 'In Progress' THEN 1 ELSE 0 END) as in_progress_bugs,
  SUM(CASE WHEN b.status = 'Closed' THEN 1 ELSE 0 END) as closed_bugs
FROM public.bugs b
LEFT JOIN public.users u ON b.assignee_id = u.id
GROUP BY u.name
ORDER BY assigned_bugs DESC;

-- ============================================
-- 7. TIME-BASED SEARCHES
-- ============================================

-- Bugs created today
SELECT * FROM public.bugs
WHERE DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;

-- Bugs created in the last 7 days
SELECT * FROM public.bugs
WHERE created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- Bugs created this month
SELECT * FROM public.bugs
WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
ORDER BY created_at DESC;

-- Bugs created between specific dates
SELECT * FROM public.bugs
WHERE created_at BETWEEN '2025-12-01' AND '2025-12-31'
ORDER BY created_at DESC;

-- Overdue bugs (example with a due_date column if you add one)
-- SELECT * FROM public.bugs
-- WHERE due_date < CURRENT_DATE AND status != 'Closed'
-- ORDER BY due_date ASC;

-- ============================================
-- 8. SEARCH WITH PAGINATION
-- ============================================

-- Get bugs with pagination (page 1, 10 items per page)
SELECT 
  b.*,
  reporter.name as reporter_name,
  assignee.name as assignee_name,
  p.name as project_name
FROM public.bugs b
LEFT JOIN public.users reporter ON b.reporter_id = reporter.id
LEFT JOIN public.users assignee ON b.assignee_id = assignee.id
LEFT JOIN public.projects p ON b.project_id = p.id
ORDER BY b.created_at DESC
LIMIT 10 OFFSET 0;

-- Get bugs with pagination (page 2, 10 items per page)
SELECT 
  b.*,
  reporter.name as reporter_name,
  assignee.name as assignee_name,
  p.name as project_name
FROM public.bugs b
LEFT JOIN public.users reporter ON b.reporter_id = reporter.id
LEFT JOIN public.users assignee ON b.assignee_id = assignee.id
LEFT JOIN public.projects p ON b.project_id = p.id
ORDER BY b.created_at DESC
LIMIT 10 OFFSET 10;

-- Count total bugs for pagination
SELECT COUNT(*) as total_bugs FROM public.bugs;

-- ============================================
-- 9. SEARCH UNASSIGNED OR NULL VALUES
-- ============================================

-- Find bugs without assignee
SELECT 
  b.id,
  b.title,
  b.status,
  b.priority,
  b.created_at,
  reporter.name as reporter_name,
  p.name as project_name
FROM public.bugs b
LEFT JOIN public.users reporter ON b.reporter_id = reporter.id
LEFT JOIN public.projects p ON b.project_id = p.id
WHERE b.assignee_id IS NULL
ORDER BY b.created_at DESC;

-- Find bugs without project
SELECT * FROM public.bugs
WHERE project_id IS NULL
ORDER BY created_at DESC;

-- ============================================
-- 10. FULL-TEXT SEARCH
-- ============================================

-- Create full-text search index (run once)
-- CREATE INDEX bugs_search_idx ON public.bugs 
-- USING gin(to_tsvector('english', 
--   coalesce(title, '') || ' ' || 
--   coalesce(description, '') || ' ' ||
--   coalesce(steps_to_reproduce, '')
-- ));

-- Full-text search with ranking
SELECT 
  b.*,
  ts_rank(
    to_tsvector('english', 
      coalesce(b.title, '') || ' ' || 
      coalesce(b.description, '')
    ),
    plainto_tsquery('english', 'login error')
  ) as relevance
FROM public.bugs b
WHERE to_tsvector('english', 
  coalesce(b.title, '') || ' ' || 
  coalesce(b.description, '')
) @@ plainto_tsquery('english', 'login error')
ORDER BY relevance DESC;

-- ============================================
-- 11. DASHBOARD QUERIES
-- ============================================

-- Complete dashboard statistics
SELECT 
  (SELECT COUNT(*) FROM public.bugs) as total_bugs,
  (SELECT COUNT(*) FROM public.bugs WHERE status = 'Open') as open_bugs,
  (SELECT COUNT(*) FROM public.bugs WHERE status = 'In Progress') as in_progress_bugs,
  (SELECT COUNT(*) FROM public.bugs WHERE status = 'Closed') as closed_bugs,
  (SELECT COUNT(*) FROM public.bugs WHERE severity = 'Critical') as critical_bugs,
  (SELECT COUNT(*) FROM public.bugs WHERE priority = 'High') as high_priority_bugs,
  (SELECT COUNT(*) FROM public.bugs WHERE DATE(created_at) = CURRENT_DATE) as todays_bugs,
  (SELECT COUNT(*) FROM public.projects) as total_projects,
  (SELECT COUNT(*) FROM public.users) as total_users;

-- Recent activity summary
SELECT 
  'bug' as type,
  b.id,
  b.title as description,
  b.created_at,
  u.name as user_name,
  p.name as project_name
FROM public.bugs b
LEFT JOIN public.users u ON b.reporter_id = u.id
LEFT JOIN public.projects p ON b.project_id = p.id

UNION ALL

SELECT 
  'comment' as type,
  c.id,
  LEFT(c.content, 100) as description,
  c.created_at,
  u.name as user_name,
  b.title as project_name
FROM public.comments c
LEFT JOIN public.users u ON c.user_id = u.id
LEFT JOIN public.bugs b ON c.bug_id = b.id

ORDER BY created_at DESC
LIMIT 20;

-- ============================================
-- 12. VERIFY DATA INTEGRITY
-- ============================================

-- Find bugs with invalid foreign keys
SELECT b.* FROM public.bugs b
WHERE 
  (b.reporter_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.users WHERE id = b.reporter_id))
  OR (b.assignee_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.users WHERE id = b.assignee_id))
  OR (b.project_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.projects WHERE id = b.project_id));

-- Check for duplicate emails in users
SELECT email, COUNT(*) as count
FROM public.users
GROUP BY email
HAVING COUNT(*) > 1;

-- ============================================
-- NOTES:
-- - Replace placeholder values (email addresses, IDs) with actual values from your database
-- - Add LIMIT clauses to prevent overwhelming results
-- - Create indexes on frequently searched columns for better performance
-- - Use EXPLAIN ANALYZE before queries to check performance
-- ============================================
