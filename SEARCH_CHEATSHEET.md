# Quick Reference: Database Search Cheat Sheet

## 🎯 Common Search Patterns

### 1️⃣ Single Table Search
```javascript
// Get all records
await supabase.from('bugs').select('*')

// Get one record
await supabase.from('bugs').select('*').eq('id', 123).single()

// Search with filter
await supabase.from('bugs').select('*').eq('status', 'Open')
```

### 2️⃣ Search with Pattern Matching
```javascript
// Case-insensitive search
await supabase.from('bugs').select('*').ilike('title', '%login%')

// Multiple fields OR search
await supabase.from('bugs').select('*')
  .or('title.ilike.%keyword%,description.ilike.%keyword%')
```

### 3️⃣ Join Tables (Get Related Data)
```javascript
// Get bugs with user info
await supabase.from('bugs').select(`
  *,
  reporter:reporter_id(name, email),
  assignee:assignee_id(name, email),
  project:project_id(name)
`)
```

### 4️⃣ Filter Operations
| Operation | JavaScript | SQL |
|-----------|-----------|-----|
| Equal | `.eq('field', value)` | `WHERE field = value` |
| Not Equal | `.neq('field', value)` | `WHERE field != value` |
| Greater Than | `.gt('field', value)` | `WHERE field > value` |
| Less Than | `.lt('field', value)` | `WHERE field < value` |
| In List | `.in('field', [1,2,3])` | `WHERE field IN (1,2,3)` |
| Like | `.like('field', '%pat%')` | `WHERE field LIKE '%pat%'` |
| iLike | `.ilike('field', '%pat%')` | `WHERE field ILIKE '%pat%'` |
| Is Null | `.is('field', null)` | `WHERE field IS NULL` |

### 5️⃣ Sorting & Limiting
```javascript
// Order by
await supabase.from('bugs').select('*')
  .order('created_at', { ascending: false })

// Limit results
await supabase.from('bugs').select('*').limit(10)

// Pagination
await supabase.from('bugs').select('*').range(0, 9) // First 10
```

### 6️⃣ Count Records
```javascript
// Get count only
const { count } = await supabase.from('bugs')
  .select('*', { count: 'exact', head: true })

// Get data and count
const { data, count } = await supabase.from('bugs')
  .select('*', { count: 'exact' })
```

## 📊 Common Queries by Use Case

### My Bugs (Assigned to Me)
```javascript
await supabase.from('bugs').select('*')
  .eq('assignee_id', currentUserId)
  .neq('status', 'Closed')
```

### Bugs I Reported
```javascript
await supabase.from('bugs').select('*')
  .eq('reporter_id', currentUserId)
```

### Open High Priority Bugs
```javascript
await supabase.from('bugs').select('*')
  .eq('status', 'Open')
  .eq('priority', 'High')
```

### Recent Bugs (Last 7 Days)
```javascript
const sevenDaysAgo = new Date()
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

await supabase.from('bugs').select('*')
  .gte('created_at', sevenDaysAgo.toISOString())
```

### Unassigned Bugs
```javascript
await supabase.from('bugs').select('*')
  .is('assignee_id', null)
```

## 🔍 SQL Quick Reference

### Basic Search
```sql
-- All bugs
SELECT * FROM bugs;

-- Filter by status
SELECT * FROM bugs WHERE status = 'Open';

-- Search by keyword
SELECT * FROM bugs WHERE title ILIKE '%login%';
```

### Join Tables
```sql
SELECT 
  b.*,
  u.name as reporter_name,
  p.name as project_name
FROM bugs b
LEFT JOIN users u ON b.reporter_id = u.id
LEFT JOIN projects p ON b.project_id = p.id;
```

### Aggregation
```sql
-- Count by status
SELECT status, COUNT(*) 
FROM bugs 
GROUP BY status;

-- Bugs per project
SELECT p.name, COUNT(b.id) as bug_count
FROM projects p
LEFT JOIN bugs b ON p.id = b.project_id
GROUP BY p.name;
```

## 💡 Pro Tips

1. **Always use indexes** on frequently searched columns
2. **Use `.single()` or `.maybeSingle()`** when expecting one result
3. **Limit results** with `.limit()` for performance
4. **Use RLS policies** to auto-filter by user permissions
5. **Cache results** when data doesn't change frequently
6. **Use real-time subscriptions** for live updates

## 🚀 Performance Tips

```javascript
// ❌ Bad: Select all fields when you only need a few
await supabase.from('bugs').select('*')

// ✅ Good: Select only what you need
await supabase.from('bugs').select('id, title, status')

// ❌ Bad: Multiple separate queries
const bugs = await supabase.from('bugs').select('*')
const users = await supabase.from('users').select('*')

// ✅ Good: Single query with joins
await supabase.from('bugs').select(`
  *,
  reporter:reporter_id(name),
  assignee:assignee_id(name)
`)
```

## 📝 Quick Examples

### Dashboard Stats
```javascript
const { count: total } = await supabase.from('bugs')
  .select('*', { count: 'exact', head: true })

const { count: open } = await supabase.from('bugs')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'Open')
```

### Search Everything
```javascript
const keyword = 'login'

const [bugs, projects, users] = await Promise.all([
  supabase.from('bugs').select('*').ilike('title', `%${keyword}%`),
  supabase.from('projects').select('*').ilike('name', `%${keyword}%`),
  supabase.from('users').select('*').ilike('name', `%${keyword}%`)
])
```

### Advanced Filter
```javascript
await supabase.from('bugs').select('*')
  .eq('status', 'Open')
  .in('priority', ['High', 'Critical'])
  .gte('created_at', '2025-12-01')
  .order('priority')
  .limit(20)
```
