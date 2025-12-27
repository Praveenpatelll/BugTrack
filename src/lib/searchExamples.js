// SearchExamples.jsx
// Practical examples of searching data across different tables

import { supabase } from '../lib/supabase';

// ============================================
// 1. SIMPLE SEARCH EXAMPLES
// ============================================

/**
 * Search users by name or email
 */
export const searchUsers = async (searchTerm) => {
    const { data, error } = await supabase
        .from('users')
        .select('id, name, email, avatar')
        .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .order('name');

    if (error) {
        console.error('Error searching users:', error);
        return [];
    }
    return data;
};

/**
 * Search bugs by title or description
 */
export const searchBugs = async (searchTerm) => {
    const { data, error } = await supabase
        .from('bugs')
        .select(`
      id,
      title,
      description,
      status,
      priority,
      severity,
      created_at
    `)
        .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error searching bugs:', error);
        return [];
    }
    return data;
};

/**
 * Search projects by name
 */
export const searchProjects = async (searchTerm) => {
    const { data, error } = await supabase
        .from('projects')
        .select('id, name, description, status')
        .ilike('name', `%${searchTerm}%`)
        .order('name');

    if (error) {
        console.error('Error searching projects:', error);
        return [];
    }
    return data;
};

// ============================================
// 2. ADVANCED SEARCH WITH MULTIPLE FILTERS
// ============================================

/**
 * Advanced bug search with multiple filters
 */
export const advancedBugSearch = async ({
    keyword = '',
    status = null,
    priority = null,
    severity = null,
    projectId = null,
    assigneeId = null,
    reporterId = null,
    dateFrom = null,
    dateTo = null,
    limit = 50
}) => {
    let query = supabase
        .from('bugs')
        .select(`
      *,
      reporter:reporter_id(id, name, email, avatar),
      assignee:assignee_id(id, name, email, avatar),
      project:project_id(id, name),
      attachments(count)
    `);

    // Keyword search across multiple fields
    if (keyword) {
        query = query.or(
            `title.ilike.%${keyword}%,` +
            `description.ilike.%${keyword}%,` +
            `steps_to_reproduce.ilike.%${keyword}%`
        );
    }

    // Apply filters
    if (status) query = query.eq('status', status);
    if (priority) query = query.eq('priority', priority);
    if (severity) query = query.eq('severity', severity);
    if (projectId) query = query.eq('project_id', projectId);
    if (assigneeId) query = query.eq('assignee_id', assigneeId);
    if (reporterId) query = query.eq('reporter_id', reporterId);
    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo) query = query.lte('created_at', dateTo);

    // Limit and order
    query = query
        .order('created_at', { ascending: false })
        .limit(limit);

    const { data, error } = await query;

    if (error) {
        console.error('Error in advanced search:', error);
        return [];
    }
    return data;
};

// ============================================
// 3. SEARCH WITH JOINS (RELATED DATA)
// ============================================

/**
 * Get bugs with all related information
 */
export const getBugsWithDetails = async (filters = {}) => {
    const { data, error } = await supabase
        .from('bugs')
        .select(`
      *,
      reporter:reporter_id (
        id,
        name,
        email,
        avatar
      ),
      assignee:assignee_id (
        id,
        name,
        email,
        avatar
      ),
      project:project_id (
        id,
        name,
        description
      ),
      attachments (
        id,
        file_name,
        file_path,
        file_type,
        created_at
      ),
      comments (
        id,
        content,
        created_at,
        user:user_id (
          id,
          name,
          avatar
        )
      )
    `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching bugs with details:', error);
        return [];
    }
    return data;
};

/**
 * Get a single bug with all details
 */
export const getBugById = async (bugId) => {
    const { data, error } = await supabase
        .from('bugs')
        .select(`
      *,
      reporter:reporter_id(*),
      assignee:assignee_id(*),
      project:project_id(*),
      attachments(*),
      comments(
        *,
        user:user_id(*)
      )
    `)
        .eq('id', bugId)
        .single();

    if (error) {
        console.error('Error fetching bug:', error);
        return null;
    }
    return data;
};

/**
 * Get user's activity (bugs reported, assigned, and comments)
 */
export const getUserActivity = async (userId) => {
    // Get bugs reported by user
    const { data: reportedBugs } = await supabase
        .from('bugs')
        .select(`
      id,
      title,
      status,
      priority,
      created_at,
      project:project_id(name)
    `)
        .eq('reporter_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

    // Get bugs assigned to user
    const { data: assignedBugs } = await supabase
        .from('bugs')
        .select(`
      id,
      title,
      status,
      priority,
      created_at,
      project:project_id(name)
    `)
        .eq('assignee_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

    // Get user's comments
    const { data: comments } = await supabase
        .from('comments')
        .select(`
      id,
      content,
      created_at,
      bug:bug_id(id, title)
    `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

    return {
        reportedBugs: reportedBugs || [],
        assignedBugs: assignedBugs || [],
        comments: comments || []
    };
};

// ============================================
// 4. AGGREGATION QUERIES
// ============================================

/**
 * Get bug statistics by project
 */
export const getProjectStats = async (projectId) => {
    // Get total bugs
    const { count: totalBugs } = await supabase
        .from('bugs')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId);

    // Get open bugs
    const { count: openBugs } = await supabase
        .from('bugs')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)
        .eq('status', 'Open');

    // Get bugs by priority
    const { data: priorityData } = await supabase
        .from('bugs')
        .select('priority')
        .eq('project_id', projectId);

    const priorityCounts = priorityData?.reduce((acc, bug) => {
        acc[bug.priority] = (acc[bug.priority] || 0) + 1;
        return acc;
    }, {});

    // Get bugs by severity
    const { data: severityData } = await supabase
        .from('bugs')
        .select('severity')
        .eq('project_id', projectId);

    const severityCounts = severityData?.reduce((acc, bug) => {
        acc[bug.severity] = (acc[bug.severity] || 0) + 1;
        return acc;
    }, {});

    return {
        total: totalBugs || 0,
        open: openBugs || 0,
        byPriority: priorityCounts || {},
        bySeverity: severityCounts || {}
    };
};

/**
 * Get dashboard statistics
 */
export const getDashboardStats = async () => {
    // Total bugs
    const { count: totalBugs } = await supabase
        .from('bugs')
        .select('*', { count: 'exact', head: true });

    // Open bugs
    const { count: openBugs } = await supabase
        .from('bugs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Open');

    // Critical bugs
    const { count: criticalBugs } = await supabase
        .from('bugs')
        .select('*', { count: 'exact', head: true })
        .eq('severity', 'Critical');

    // Bugs created today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count: todaysBugs } = await supabase
        .from('bugs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

    // Total projects
    const { count: totalProjects } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true });

    return {
        totalBugs: totalBugs || 0,
        openBugs: openBugs || 0,
        criticalBugs: criticalBugs || 0,
        todaysBugs: todaysBugs || 0,
        totalProjects: totalProjects || 0
    };
};

// ============================================
// 5. PAGINATION
// ============================================

/**
 * Get bugs with pagination
 */
export const getBugsPaginated = async (page = 1, pageSize = 10, filters = {}) => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
        .from('bugs')
        .select(`
      *,
      reporter:reporter_id(name, avatar),
      assignee:assignee_id(name, avatar),
      project:project_id(name)
    `, { count: 'exact' });

    // Apply filters
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.priority) query = query.eq('priority', filters.priority);
    if (filters.projectId) query = query.eq('project_id', filters.projectId);

    // Apply pagination
    query = query
        .range(from, to)
        .order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
        console.error('Error fetching paginated bugs:', error);
        return { data: [], count: 0, totalPages: 0 };
    }

    return {
        data: data || [],
        count: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
        currentPage: page
    };
};

// ============================================
// 6. REAL-TIME SEARCH
// ============================================

/**
 * Subscribe to changes in bugs table
 */
export const subscribeToBugs = (callback) => {
    const subscription = supabase
        .channel('bugs-channel')
        .on(
            'postgres_changes',
            {
                event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
                schema: 'public',
                table: 'bugs'
            },
            (payload) => {
                console.log('Bug changed:', payload);
                callback(payload);
            }
        )
        .subscribe();

    // Return unsubscribe function
    return () => {
        subscription.unsubscribe();
    };
};

// ============================================
// 7. EXAMPLE USAGE IN COMPONENTS
// ============================================

/**
 * Example: Search component implementation
 */
export const useSearch = () => {
    const [results, setResults] = React.useState([]);
    const [loading, setLoading] = React.useState(false);

    const search = async (query) => {
        setLoading(true);
        try {
            const bugs = await searchBugs(query);
            const projects = await searchProjects(query);
            const users = await searchUsers(query);

            setResults({
                bugs,
                projects,
                users
            });
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    return { results, loading, search };
};

/**
 * Example: Filter bugs in a component
 */
export const useFilteredBugs = () => {
    const [bugs, setBugs] = React.useState([]);
    const [filters, setFilters] = React.useState({
        status: '',
        priority: '',
        projectId: null
    });

    const applyFilters = async () => {
        const results = await advancedBugSearch(filters);
        setBugs(results);
    };

    React.useEffect(() => {
        applyFilters();
    }, [filters]);

    return { bugs, filters, setFilters };
};

// ============================================
// 8. UTILITY FUNCTIONS
// ============================================

/**
 * Check if a bug exists
 */
export const bugExists = async (bugId) => {
    const { data, error } = await supabase
        .from('bugs')
        .select('id')
        .eq('id', bugId)
        .maybeSingle();

    return !error && data !== null;
};

/**
 * Get bugs assigned to current user
 */
export const getMyBugs = async (userId) => {
    const { data, error } = await supabase
        .from('bugs')
        .select(`
      *,
      project:project_id(name),
      reporter:reporter_id(name, avatar)
    `)
        .eq('assignee_id', userId)
        .neq('status', 'Closed')
        .order('priority', { ascending: true })
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching my bugs:', error);
        return [];
    }
    return data;
};

/**
 * Get recent activity (last 10 bugs)
 */
export const getRecentBugs = async (limit = 10) => {
    const { data, error } = await supabase
        .from('bugs')
        .select(`
      id,
      title,
      status,
      priority,
      created_at,
      reporter:reporter_id(name, avatar),
      project:project_id(name)
    `)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching recent bugs:', error);
        return [];
    }
    return data;
};

export default {
    searchUsers,
    searchBugs,
    searchProjects,
    advancedBugSearch,
    getBugsWithDetails,
    getBugById,
    getUserActivity,
    getProjectStats,
    getDashboardStats,
    getBugsPaginated,
    subscribeToBugs,
    bugExists,
    getMyBugs,
    getRecentBugs
};
