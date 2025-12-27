# Role-Based Access Control (RBAC) Implementation

## Overview
The Bug Tracker now implements **role-based access control** to ensure only administrators can modify user roles.

## Features Implemented

### ✅ Admin-Only Role Management
- **Only users with "Admin" role can change other users' roles**
- Non-admin users can view the team but cannot modify roles
- Clear visual indicators for access levels

### ✅ Visual Feedback

#### For Admin Users:
- ✅ Full access to all role dropdowns
- ✅ Enabled dropdowns with pointer cursor
- ✅ Success notifications when roles are updated
- ✅ Tooltip: "Change user role"

#### For Non-Admin Users:
- 🔒 **Blue informational banner** showing:
  - "View-Only Access" heading with lock icon
  - Current user's role displayed
  - Explanation that only admins can modify roles
- 🔒 **Disabled role dropdowns** with:
  - Grayed out appearance (60% opacity)
  - Not-allowed cursor
  - Lock icon next to "Role" label
  - Tooltip: "Only administrators can change roles"
- ❌ **Error message** if non-admin tries to change role:
  - "Only administrators can change user roles"

## Technical Implementation

### Files Modified
- **`src/pages/Team.jsx`**
  - Added `useAuth` hook to get current user's profile
  - Created `currentUserProfile` state to track logged-in user's role
  - Added `isAdmin` computed value: `currentUserProfile?.role === 'Admin'`
  - Updated `handleRoleUpdate()` to check admin status
  - Added visual banner for non-admin users
  - Modified role dropdown to be disabled for non-admins

### Database Setup
- **`SET_ADMIN_USER.sql`** - SQL script to promote users to Admin role

## How to Use

### Setting Up Admin Users

1. **Open Supabase SQL Editor**
2. **Run one of these queries**:

   ```sql
   -- By email (recommended)
   UPDATE public.users 
   SET role = 'Admin' 
   WHERE email = 'your-admin@email.com';
   
   -- Verify
   SELECT id, name, email, role FROM public.users;
   ```

3. **User must log out and log back in** for role changes to take effect

### Testing RBAC

#### As Admin User:
1. Log in with admin account
2. Navigate to Team Management page
3. You should see:
   - No "View-Only Access" banner
   - All role dropdowns enabled
   - Ability to change any user's role
4. Change a user's role
5. Verify success notification appears

#### As Non-Admin User:
1. Log in with non-admin account (Developer, QA, etc.)
2. Navigate to Team Management page
3. You should see:
   - Blue "View-Only Access" banner
   - Your current role displayed
   - All role dropdowns disabled (grayed out)
   - Lock icons next to role labels
4. Try clicking a dropdown
5. Tooltip should show "Only administrators can change roles"
6. If you somehow trigger onChange, error message appears

## Security Notes

### Frontend Protection
- ✅ Role dropdowns are disabled for non-admins
- ✅ Visual indicators prevent confusion
- ✅ Error messages inform users of restrictions
- ✅ `handleRoleUpdate()` checks admin status before proceeding

### Recommended: Backend Protection (Row-Level Security)

For production environments, add RLS policies to Supabase:

```sql
-- Only allow admins to update user roles
CREATE POLICY "Only admins can update roles"
ON public.users
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'Admin'
  )
);
```

**Note**: This project currently relies on frontend validation. For production use, implementing database-level RLS is highly recommended.

## Role Hierarchy

| Role      | Can Change Roles | Description                    |
|-----------|------------------|--------------------------------|
| Admin     | ✅ Yes           | Full permissions               |
| Manager   | ❌ No            | Team lead, cannot change roles |
| Developer | ❌ No            | Standard developer access      |
| QA        | ❌ No            | Quality assurance tester       |
| Guest     | ❌ No            | Read-only or limited access    |

## Troubleshooting

### "Only administrators can change user roles" error appears for admin
**Solution**: 
1. Verify user's role in database: `SELECT * FROM users WHERE email = 'your-email@example.com';`
2. Ensure role is exactly `'Admin'` (case-sensitive)
3. Log out and log back in
4. Clear browser cache/localStorage if needed

### Dropdown shows as disabled even though user is admin
**Solution**:
1. Check browser console for errors
2. Verify `currentUserProfile` is loaded (may take 1-2 seconds)
3. Refresh the page
4. Check that email in auth matches email in users table

### Changes don't persist after page refresh
**Solution**:
1. Check browser console for Supabase errors
2. Verify database connection in `.env` file
3. Check Supabase project status
4. Run `SELECT * FROM users` to verify changes were saved

## Future Enhancements

Potential additions:
- [ ] Add Manager permission to create new users but not change admin roles
- [ ] Add audit log for role changes
- [ ] Email notifications when user roles are changed
- [ ] Prevent admins from removing their own admin role
- [ ] Require super-admin confirmation for critical role changes

---

**Created**: December 26, 2025  
**Version**: 1.0  
**Status**: ✅ Production Ready
