import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function usePermissions() {
    const { profile } = useAuth();
    const [permissions, setPermissions] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!profile?.role) {
            setLoading(false);
            return;
        }

        const fetchPermissions = async () => {
            // First check if we have permissions in local storage or cache to save a round trip?
            // For now, fetch live to ensure security.

            // 1. Fetch ALL permissions ref to know what's possible (optional, but good for admin UI)
            // 2. Fetch YOUR role's permissions

            try {
                const { data, error } = await supabase
                    .from('permissions')
                    .select('*')
                    .eq('role', profile.role)
                    .single();

                if (error && error.code !== 'PGRST116') { // PGRST116 = 0 rows (roles might not be in DB yet)
                    console.error('Error fetching permissions:', error);
                }

                if (data) {
                    setPermissions(data);
                } else {
                    // Fallback defaults if table empty or role missing
                    setPermissions({
                        can_delete_project: profile.role === 'Admin',
                        can_delete_bug: profile.role === 'Admin',
                        can_manage_users: profile.role === 'Admin',
                        can_assign_users: true // Everyone (except Guest maybe)
                    });
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchPermissions();
    }, [profile]);

    // Check if user has specific permission
    const can = (action) => {
        if (profile?.role === 'Admin') return true; // Super Admin Override
        return !!permissions[action];
    };

    return { permissions, loading, can };
}
