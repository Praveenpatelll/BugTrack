
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Mail, Shield, Search, User, CheckCircle, AlertCircle, Lock } from 'lucide-react';

export default function Team() {
    const { profile } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [hasRoleColumn, setHasRoleColumn] = useState(true);
    const [message, setMessage] = useState(null);
    const [currentUserProfile, setCurrentUserProfile] = useState(null);

    useEffect(() => {
        fetchUsers();
        fetchCurrentUserProfile();
    }, [profile]);

    const fetchCurrentUserProfile = async () => {
        if (!profile?.email) return;

        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('email', profile.email)
                .single();

            if (data) {
                setCurrentUserProfile(data);
            }
        } catch (err) {
            console.error('Error fetching current user profile:', err);
        }
    };

    const isAdmin = currentUserProfile?.role === 'Admin';

    const showMessage = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 3000);
    };

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('name');

            if (error) {
                // Check if it's a role column issue
                if (error.message.includes('role')) {
                    setHasRoleColumn(false);
                    showMessage('Note: The role column is missing. Please run ADD_ROLES_COLUMN.sql', 'warning');
                }
                throw error;
            }
            setUsers(data || []);

            if (data && data.length > 0) {
                // Check if role column exists by checking first user
                setHasRoleColumn('role' in data[0]);
            }
        } catch (error) {
            console.error('Error fetching team:', error);
            showMessage('Failed to load team members', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleRoleUpdate = async (userId, newRole) => {
        if (!isAdmin) {
            showMessage('Only administrators can change user roles', 'error');
            return;
        }

        if (!hasRoleColumn) {
            showMessage('Cannot update role: role column is missing. Run ADD_ROLES_COLUMN.sql', 'error');
            return;
        }

        // Optimistic update
        const previousUsers = [...users];
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));

        try {
            const { error } = await supabase
                .from('users')
                .update({ role: newRole })
                .eq('id', userId);

            if (error) throw error;
            showMessage('Role updated successfully!', 'success');
        } catch (err) {
            console.error('Error updating role:', err);
            setUsers(previousUsers); // Revert
            showMessage('Failed to update role: ' + err.message, 'error');
        }
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ marginBottom: '0.5rem' }}>Team Management</h1>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>Manage users and their roles.</p>
                </div>
                <div style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search team members..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ paddingLeft: '2.5rem', width: '300px' }}
                    />
                </div>
            </div>

            {/* Message Banner */}
            {message && (
                <div style={{
                    background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' :
                        message.type === 'warning' ? 'rgba(245, 158, 11, 0.1)' :
                            'rgba(239, 68, 68, 0.1)',
                    color: message.type === 'success' ? '#10b981' :
                        message.type === 'warning' ? '#f59e0b' : '#ef4444',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    marginBottom: '1.5rem',
                    border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.3)' :
                        message.type === 'warning' ? 'rgba(245, 158, 11, 0.3)' :
                            'rgba(239, 68, 68, 0.3)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                }}>
                    {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    {message.text}
                </div>
            )}

            {/* Admin Permission Notice */}
            {!isAdmin && hasRoleColumn && (
                <div className="glass card" style={{
                    marginBottom: '1.5rem',
                    padding: '1rem',
                    background: 'rgba(99, 102, 241, 0.05)',
                    border: '1px solid rgba(99, 102, 241, 0.3)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Lock size={20} style={{ color: '#6366f1' }} />
                        <div>
                            <h4 style={{ margin: '0 0 0.25rem 0', color: '#6366f1', fontSize: '0.95rem' }}>
                                View-Only Access
                            </h4>
                            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                Only administrators can modify user roles. Your current role is: <strong>{currentUserProfile?.role || 'Loading...'}</strong>
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {!hasRoleColumn && (
                <div className="glass card" style={{
                    marginBottom: '1.5rem',
                    padding: '1rem',
                    background: 'rgba(245, 158, 11, 0.05)',
                    border: '1px solid rgba(245, 158, 11, 0.3)'
                }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#f59e0b' }}>⚠️ Setup Required</h4>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        The <code>role</code> column is missing from the users table.
                        Run the SQL script <code>ADD_ROLES_COLUMN.sql</code> in your Supabase SQL Editor to enable role management.
                    </p>
                </div>
            )}

            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading team...</div>
            ) : filteredUsers.length === 0 ? (
                <div className="glass card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <User size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                        {searchTerm ? 'No team members found matching your search.' : 'No team members yet.'}
                    </p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {filteredUsers.map(user => (
                        <div key={user.id} className="glass card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <img
                                    src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=random`}
                                    alt={user.name}
                                    style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }}
                                />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {user.name || 'Unknown User'}
                                    </h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        <Mail size={12} /> {user.email || 'No email'}
                                    </div>
                                </div>
                            </div>

                            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: 'auto' }}>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Shield size={12} />
                                    Role
                                    {!isAdmin && <Lock size={10} style={{ opacity: 0.5 }} />}
                                </label>
                                <select
                                    value={user.role || 'Developer'}
                                    onChange={(e) => handleRoleUpdate(user.id, e.target.value)}
                                    style={{
                                        width: '100%',
                                        cursor: (hasRoleColumn && isAdmin) ? 'pointer' : 'not-allowed',
                                        opacity: (hasRoleColumn && isAdmin) ? 1 : 0.6
                                    }}
                                    disabled={!hasRoleColumn || !isAdmin}
                                    title={
                                        !hasRoleColumn ? 'Run ADD_ROLES_COLUMN.sql to enable role management' :
                                            !isAdmin ? 'Only administrators can change roles' :
                                                'Change user role'
                                    }
                                >
                                    <option value="Admin">Admin</option>
                                    <option value="Manager">Manager</option>
                                    <option value="Developer">Developer</option>
                                    <option value="QA">QA</option>
                                    <option value="Guest">Guest</option>
                                </select>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
