# Database Search Guide

A comprehensive guide to searching data across different tables in your Supabase database.

## Table of Contents
1. [Single Table Searches](#single-table-searches)
2. [Filtering and Conditions](#filtering-and-conditions)
3. [Joining Multiple Tables](#joining-multiple-tables)
4. [Advanced Search Patterns](#advanced-search-patterns)
5. [Full-Text Search](#full-text-search)

---

## 1. Single Table Searches

### Search Users Table

#### SQL Approach
```sql
-- Get all users
SELECT * FROM public.users;

-- Get specific user by email
SELECT * FROM public.users WHERE email = 'patelpraveen972@gmail.com';

-- Get specific user by ID
SELECT * FROM public.users WHERE id = '5f4c4d8f-bc8f-44c5-9069-8e787b5ecc29';

-- Search users by name pattern
SELECT * FROM public.users WHERE name ILIKE '%praveen%';

-- Get users created after a specific date
SELECT * FROM public.users WHERE created_at > '2025-12-20';
```

#### JavaScript (Supabase Client) Approach
```javascript
import { supabase } from './lib/supabase';

// Get all users
const { data, error } = await supabase
  .from('users')
  .select('*');

// Get specific user by email
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('email', 'patelpraveen972@gmail.com')
  .single();

// Get specific user by ID
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', '5f4c4d8f-bc8f-44c5-9069-8e787b5ecc29')
  .single();

// Search users by name pattern (case-insensitive)
const { data, error } = await supabase
  .from('users')
  .select('*')
  .ilike('name', '%praveen%');

// Get users created after a specific date
const { data, error } = await supabase
  .from('users')
  .select('*')
  .gt('created_at', '2025-12-20');
```

---

### Search Bugs Table

#### SQL Approach
```sql
-- Get all bugs
SELECT * FROM public.bugs;

-- Get bugs by status
SELECT * FROM public.bugs WHERE status = 'Open';

-- Get bugs by priority
SELECT * FROM public.bugs WHERE priority = 'High';

-- Get bugs by severity
SELECT * FROM public.bugs WHERE severity = 'Critical';

-- Search bugs by title or description
SELECT * FROM public.bugs 
WHERE title ILIKE '%login%' OR description ILIKE '%login%';

-- Get bugs for a specific project
SELECT * FROM public.bugs WHERE project_id = 1;

-- Get bugs assigned to a specific user
SELECT * FROM public.bugs WHERE assignee_id = 1;

-- Get bugs created in the last 7 days
SELECT * FROM public.bugs 
WHERE created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

#### JavaScript (Supabase Client) Approach
```javascript
// Get all bugs
const { data, error } = await supabase
  .from('bugs')
  .select('*');

// Get bugs by status
const { data, error } = await supabase
  .from('bugs')
  .select('*')
  .eq('status', 'Open');

// Get bugs by multiple conditions (AND)
const { data, error } = await supabase
  .from('bugs')
  .select('*')
  .eq('status', 'Open')
  .eq('priority', 'High');

// Search bugs by title (case-insensitive)
const { data, error } = await supabase
  .from('bugs')
  .select('*')
  .ilike('title', '%login%');

// Get bugs for a specific project
const { data, error } = await supabase
  .from('bugs')
  .select('*')
  .eq('project_id', 1);

// Get recent bugs (last 7 days)
const sevenDaysAgo = new Date();
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

const { data, error } = await supabase
  .from('bugs')
  .select('*')
  .gte('created_at', sevenDaysAgo.toISOString())
  .order('created_at', { ascending: false });
```

---

### Search Projects Table

#### SQL Approach
```sql
-- Get all projects
SELECT * FROM public.projects;

-- Get active projects
SELECT * FROM public.projects WHERE status = 'Active';

-- Search projects by name
SELECT * FROM public.projects WHERE name ILIKE '%tracker%';

-- Count bugs per project
SELECT 
  p.id,
  p.name,
  COUNT(b.id) as bug_count
FROM public.projects p
LEFT JOIN public.bugs b ON p.id = b.project_id
GROUP BY p.id, p.name
ORDER BY bug_count DESC;
```

#### JavaScript (Supabase Client) Approach
```javascript
// Get all projects
const { data, error } = await supabase
  .from('projects')
  .select('*');

// Search projects by name
const { data, error } = await supabase
  .from('projects')
  .select('*')
  .ilike('name', '%tracker%');

// Get projects with bug count
const { data, error } = await supabase
  .from('projects')
  .select('*, bugs(count)');
```

---

## 2. Filtering and Conditions

### SQL Operators
```sql
-- Equality
SELECT * FROM bugs WHERE status = 'Open';

-- Greater than / Less than
SELECT * FROM bugs WHERE priority IN ('High', 'Critical');
SELECT * FROM bugs WHERE created_at > '2025-12-01';

-- LIKE / ILIKE (case-insensitive)
SELECT * FROM bugs WHERE title ILIKE '%error%';

-- IN operator
SELECT * FROM bugs WHERE status IN ('Open', 'In Progress');

-- NOT operator
SELECT * FROM bugs WHERE status != 'Closed';

-- NULL checks
SELECT * FROM bugs WHERE assignee_id IS NULL;
SELECT * FROM bugs WHERE assignee_id IS NOT NULL;

-- BETWEEN
SELECT * FROM bugs WHERE created_at BETWEEN '2025-12-01' AND '2025-12-31';

-- Multiple conditions with AND/OR
SELECT * FROM bugs 
WHERE status = 'Open' 
  AND priority = 'High'
  AND (severity = 'Critical' OR severity = 'Major');
```

### JavaScript Filters
```javascript
// Equality
.eq('status', 'Open')

// Not equal
.neq('status', 'Closed')

// Greater than / Less than
.gt('created_at', '2025-12-01')
.lt('created_at', '2025-12-31')
.gte('priority_level', 5)
.lte('priority_level', 10)

// LIKE patterns
.like('title', '%error%')
.ilike('title', '%error%')  // case-insensitive

// IN operator
.in('status', ['Open', 'In Progress'])

// NULL checks
.is('assignee_id', null)
.not('assignee_id', 'is', null)

// Text search
.textSearch('description', 'login error')

// Multiple conditions (chaining = AND)
await supabase
  .from('bugs')
  .select('*')
  .eq('status', 'Open')
  .eq('priority', 'High')
  .gte('created_at', '2025-12-01');

// OR conditions
await supabase
  .from('bugs')
  .select('*')
  .or('status.eq.Open,status.eq.In Progress');
```

---

## 3. Joining Multiple Tables

### Get Bugs with User and Project Details

#### SQL Approach
```sql
-- Get bugs with reporter and assignee names
SELECT 
  b.id,
  b.title,
  b.status,
  b.priority,
  reporter.name as reporter_name,
  reporter.email as reporter_email,
  assignee.name as assignee_name,
  assignee.email as assignee_email,
  p.name as project_name
FROM public.bugs b
LEFT JOIN public.users reporter ON b.reporter_id = reporter.id
LEFT JOIN public.users assignee ON b.assignee_id = assignee.id
LEFT JOIN public.projects p ON b.project_id = p.id
ORDER BY b.created_at DESC;

-- Get bugs with attachment count
SELECT 
  b.id,
  b.title,
  b.status,
  COUNT(DISTINCT a.id) as attachment_count,
  COUNT(DISTINCT c.id) as comment_count
FROM public.bugs b
LEFT JOIN public.attachments a ON b.id = a.bug_id
LEFT JOIN public.comments c ON b.id = c.bug_id
GROUP BY b.id, b.title, b.status
ORDER BY b.created_at DESC;
```

#### JavaScript (Supabase Client) Approach
```javascript
// Get bugs with related data
const { data, error } = await supabase
  .from('bugs')
  .select(`
    *,
    reporter:reporter_id(id, name, email, avatar),
    assignee:assignee_id(id, name, email, avatar),
    project:project_id(id, name, description),
    attachments(id, file_name, file_path, created_at),
    comments(id, content, created_at, user:user_id(name, avatar))
  `)
  .order('created_at', { ascending: false });

// Get a single bug with all related data
const { data, error } = await supabase
  .from('bugs')
  .select(`
    *,
    reporter:reporter_id(*),
    assignee:assignee_id(*),
    project:project_id(*),
    attachments(*),
    comments(*, user:user_id(*))
  `)
  .eq('id', bugId)
  .single();

// Get bugs for a specific user (as reporter or assignee)
const { data, error } = await supabase
  .from('bugs')
  .select(`
    *,
    project:project_id(name)
  `)
  .or(`reporter_id.eq.${userId},assignee_id.eq.${userId}`)
  .order('created_at', { ascending: false });
```

### Get User Activity

```sql
-- Get all activity for a user
SELECT 
  'bug' as type,
  b.id,
  b.title as description,
  b.created_at
FROM public.bugs b
WHERE b.reporter_id = 1

UNION ALL

SELECT 
  'comment' as type,
  c.id,
  c.content as description,
  c.created_at
FROM public.comments c
WHERE c.user_id = 1

ORDER BY created_at DESC
LIMIT 20;
```

```javascript
// Get bugs reported by user
const { data: reportedBugs } = await supabase
  .from('bugs')
  .select('*, project:project_id(name)')
  .eq('reporter_id', userId);

// Get bugs assigned to user
const { data: assignedBugs } = await supabase
  .from('bugs')
  .select('*, project:project_id(name)')
  .eq('assignee_id', userId);

// Get comments by user
const { data: comments } = await supabase
  .from('comments')
  .select('*, bug:bug_id(title)')
  .eq('user_id', userId);
```

---

## 4. Advanced Search Patterns

### Search Across Multiple Fields

#### SQL
```sql
-- Search bugs by keyword in multiple fields
SELECT * FROM public.bugs
WHERE 
  title ILIKE '%keyword%' OR
  description ILIKE '%keyword%' OR
  steps_to_reproduce ILIKE '%keyword%' OR
  expected_result ILIKE '%keyword%' OR
  actual_result ILIKE '%keyword%';

-- Search with multiple filters
SELECT 
  b.*,
  p.name as project_name,
  assignee.name as assignee_name
FROM public.bugs b
LEFT JOIN public.projects p ON b.project_id = p.id
LEFT JOIN public.users assignee ON b.assignee_id = assignee.id
WHERE 
  (b.title ILIKE '%login%' OR b.description ILIKE '%login%')
  AND b.status IN ('Open', 'In Progress')
  AND b.priority IN ('High', 'Critical')
  AND p.id = 1
ORDER BY 
  CASE b.priority
    WHEN 'Critical' THEN 1
    WHEN 'High' THEN 2
    WHEN 'Medium' THEN 3
    WHEN 'Low' THEN 4
  END,
  b.created_at DESC;
```

#### JavaScript
```javascript
// Complex search function
async function searchBugs({ 
  keyword, 
  status, 
  priority, 
  projectId, 
  assigneeId,
  dateFrom,
  dateTo 
}) {
  let query = supabase
    .from('bugs')
    .select(`
      *,
      reporter:reporter_id(name, email),
      assignee:assignee_id(name, email),
      project:project_id(name)
    `);

  // Add keyword search across multiple fields
  if (keyword) {
    query = query.or(`title.ilike.%${keyword}%,description.ilike.%${keyword}%`);
  }

  // Add filters
  if (status) query = query.eq('status', status);
  if (priority) query = query.eq('priority', priority);
  if (projectId) query = query.eq('project_id', projectId);
  if (assigneeId) query = query.eq('assignee_id', assigneeId);
  if (dateFrom) query = query.gte('created_at', dateFrom);
  if (dateTo) query = query.lte('created_at', dateTo);

  // Order results
  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  return { data, error };
}

// Usage
const results = await searchBugs({
  keyword: 'login',
  status: 'Open',
  priority: 'High',
  projectId: 1
});
```

### Pagination

```javascript
// Pagination with page size
const pageSize = 10;
const page = 1;

const { data, error, count } = await supabase
  .from('bugs')
  .select('*, project:project_id(name)', { count: 'exact' })
  .range((page - 1) * pageSize, page * pageSize - 1)
  .order('created_at', { ascending: false });

console.log(`Showing ${data.length} of ${count} total bugs`);
```

---

## 5. Full-Text Search

### Enable Full-Text Search (run in SQL Editor)

```sql
-- Create full-text search index on bugs table
CREATE INDEX bugs_search_idx ON public.bugs 
USING gin(to_tsvector('english', 
  coalesce(title, '') || ' ' || 
  coalesce(description, '') || ' ' ||
  coalesce(steps_to_reproduce, '')
));

-- Search using full-text search
SELECT 
  *,
  ts_rank(
    to_tsvector('english', 
      coalesce(title, '') || ' ' || 
      coalesce(description, '')
    ),
    plainto_tsquery('english', 'login error')
  ) as relevance
FROM public.bugs
WHERE to_tsvector('english', 
  coalesce(title, '') || ' ' || 
  coalesce(description, '')
) @@ plainto_tsquery('english', 'login error')
ORDER BY relevance DESC;
```

### JavaScript Full-Text Search
```javascript
// Use Supabase's text search
const { data, error } = await supabase
  .from('bugs')
  .select('*')
  .textSearch('title', 'login & error', {
    type: 'websearch',
    config: 'english'
  });
```

---

## Common Search Use Cases

### 1. Dashboard Stats
```javascript
// Get bug statistics
const { count: totalBugs } = await supabase
  .from('bugs')
  .select('*', { count: 'exact', head: true });

const { count: openBugs } = await supabase
  .from('bugs')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'Open');

const { count: criticalBugs } = await supabase
  .from('bugs')
  .select('*', { count: 'exact', head: true })
  .eq('severity', 'Critical');
```

### 2. Recent Activity
```javascript
// Get recent bugs
const { data } = await supabase
  .from('bugs')
  .select(`
    *,
    reporter:reporter_id(name, avatar),
    project:project_id(name)
  `)
  .order('created_at', { ascending: false })
  .limit(10);
```

### 3. My Bugs
```javascript
// Get bugs assigned to current user
const { data: myBugs } = await supabase
  .from('bugs')
  .select(`
    *,
    project:project_id(name),
    reporter:reporter_id(name)
  `)
  .eq('assignee_id', currentUserId)
  .neq('status', 'Closed')
  .order('priority', { ascending: true });
```

### 4. Project Overview
```javascript
// Get project details with bug stats
const { data: project } = await supabase
  .from('projects')
  .select(`
    *,
    bugs(
      count,
      status,
      priority
    )
  `)
  .eq('id', projectId)
  .single();
```

---

## Tips and Best Practices

1. **Always use indexes** for columns you frequently search on
2. **Use `select('*', { count: 'exact', head: true })`** for count-only queries (faster)
3. **Limit results** with `.limit()` for better performance
4. **Use pagination** for large datasets
5. **Index foreign keys** for faster joins
6. **Use RLS policies** to automatically filter data by user permissions
7. **Cache frequent queries** on the client side
8. **Use `.single()` or `.maybeSingle()`** when expecting one result

---

## Error Handling

```javascript
async function safeFetch() {
  const { data, error } = await supabase
    .from('bugs')
    .select('*');

  if (error) {
    console.error('Error fetching bugs:', error.message);
    return { data: null, error };
  }

  return { data, error: null };
}
```

---

## Resources

- [Supabase JavaScript Client Docs](https://supabase.com/docs/reference/javascript)
- [PostgreSQL Text Search](https://www.postgresql.org/docs/current/textsearch.html)
- [Supabase Filters](https://supabase.com/docs/reference/javascript/using-filters)
