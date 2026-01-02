
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { Mail, Shield, Search, User, CheckCircle, AlertCircle, Lock, Trash2, Settings, Plus, X } from 'lucide-react';

export default function Team() {
    const { profile } = useAuth();
    const { can, permissions, loading: permsLoading } = usePermissions();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [hasRoleColumn, setHasRoleColumn] = useState(true);
    const [message, setMessage] = useState(null);
    const [activeTab, setActiveTab] = useState('members'); // 'members' | 'permissions'
    const [rolePermissions, setRolePermissions] = useState([]);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');

    useEffect(() => {
        fetchUsers();
    }, [profile]);

    useEffect(() => {
        if (activeTab === 'permissions') {
            fetchRolePermissions();
        }
    }, [activeTab]);

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
                if (error.message.includes('role')) {
                    setHasRoleColumn(false);
                    showMessage('Note: The role column is missing from DB.', 'warning');
                }
                throw error;
            }
            setUsers(data || []);
            if (data && data.length > 0) setHasRoleColumn('role' in data[0]);
        } catch (error) {
            console.error('Error fetching team:', error);
            // showMessage('Failed to load team members', 'error'); 
        } finally {
            setLoading(false);
        }
    };

    const fetchRolePermissions = async () => {
        const { data, error } = await supabase.from('permissions').select('*');
        if (data) {
            // Sort manually to keep hierarchy logical
            const order = ['Admin', 'Manager', 'Developer', 'Reporter', 'Guest'];
            data.sort((a, b) => order.indexOf(a.role) - order.indexOf(b.role));
            setRolePermissions(data);
        }
    };

    const handleRoleUpdate = async (userId, newRole) => {
        if (!can('can_manage_users')) {
            showMessage('You do not have permission to change roles', 'error');
            return;
        }

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
            setUsers(previousUsers);
            showMessage('Failed to update role: ' + err.message, 'error');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!confirm('Are you sure you want to remove this user from the team? This action cannot be undone.')) return;

        try {
            const { error } = await supabase.from('users').delete().eq('id', userId);
            if (error) throw error;
            setUsers(users.filter(u => u.id !== userId));
            showMessage('User removed from team', 'success');
        } catch (err) {
            console.error(err);
            showMessage('Error deleting user: ' + err.message, 'error');
        }
    };

    const handlePermissionToggle = async (role, field, currentValue) => {
        if (!can('can_manage_permissions')) return;

        // Optimistic update
        const updatedPerms = rolePermissions.map(p =>
            p.role === role ? { ...p, [field]: !currentValue } : p
        );
        setRolePermissions(updatedPerms);

        try {
            const { error } = await supabase
                .from('permissions')
                .update({ [field]: !currentValue })
                .eq('role', role);

            if (error) throw error;
        } catch (err) {
            console.error(err);
            showMessage('Failed to update permission', 'error');
            fetchRolePermissions(); // Revert
        }
    };

    const [newRoleName, setNewRoleName] = useState('');

    const handleAddRole = async (e) => {
        e.preventDefault();
        if (!newRoleName.trim()) return;
        if (!can('can_manage_permissions')) return;

        const role = newRoleName.trim();
        // Simple case check
        if (rolePermissions.some(p => p.role.toLowerCase() === role.toLowerCase())) {
            showMessage('Role already exists', 'error');
            return;
        }

        try {
            const { error } = await supabase.from('permissions').insert([{
                role: role,
                can_delete_project: false,
                can_delete_bug: false,
                can_manage_users: false,
                can_manage_permissions: false
            }]);

            if (error) throw error;
            showMessage(`Role "${role}" created`, 'success');
            setNewRoleName('');
            fetchRolePermissions();
        } catch (err) {
            console.error(err);
            showMessage('Error creating role: ' + err.message, 'error');
        }
    };

    const handleDeleteRole = async (role) => {
        if (!confirm(`Are you sure you want to delete the role "${role}"?`)) return;
        if (!can('can_manage_permissions')) return;

        try {
            // Check if attached to users
            const { count, error: countError } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('role', role);

            if (countError) throw countError;
            if (count > 0) {
                showMessage(`Cannot delete role: ${count} users have this role. Reassign them first.`, 'error');
                return;
            }

            const { error } = await supabase.from('permissions').delete().eq('role', role);
            if (error) throw error;

            showMessage(`Role "${role}" deleted`, 'success');
            setRolePermissions(rolePermissions.filter(p => p.role !== role));
        } catch (err) {
            console.error(err);
            showMessage('Error deleting role: ' + err.message, 'error');
        }
    };

    const handleInvite = (e) => {
        e.preventDefault();
        // In a real app, this would trigger a Supabase Edge Function to send an email
        // or generate a specialized sign-up link.
        // For now, we simulate the action.
        setShowInviteModal(false);
        setInviteEmail('');
        showMessage(`Invitation sent to ${inviteEmail} (Simulated)`, 'success');
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
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>Manage users, roles, and access controls.</p>
                </div>

                {can('can_manage_users') && (
                    <button onClick={() => setShowInviteModal(true)} className="btn btn-primary">
                        <Plus size={18} /> Add Member
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <button
                    onClick={() => setActiveTab('members')}
                    style={{
                        padding: '0.75rem 1rem',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'members' ? '2px solid var(--primary)' : '2px solid transparent',
                        color: activeTab === 'members' ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: 600,
                        cursor: 'pointer'
                    }}
                >
                    Team Members
                </button>
                <button
                    onClick={() => setActiveTab('permissions')}
                    style={{
                        padding: '0.75rem 1rem',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'permissions' ? '2px solid var(--primary)' : '2px solid transparent',
                        color: activeTab === 'permissions' ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <Settings size={16} /> Role Permissions
                </button>
            </div>

            {/* Message Banner */}
            {message && (
                <div style={{
                    background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : message.type === 'warning' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: message.type === 'success' ? '#10b981' : message.type === 'warning' ? '#f59e0b' : '#ef4444',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    marginBottom: '1.5rem',
                    border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : message.type === 'warning' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    display: 'flex', alignItems: 'center', gap: '0.75rem'
                }}>
                    {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    {message.text}
                </div>
            )}

            {activeTab === 'members' && (
                <>
                    <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search team members..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '2.5rem', width: '100%', maxWidth: '400px' }}
                        />
                    </div>

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
                                        {can('can_manage_users') && profile?.id !== user.id && (
                                            <button
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="btn btn-danger"
                                                style={{ padding: '0.4rem', borderRadius: '0.4rem' }}
                                                title="Remove User"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>

                                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: 'auto' }}>
                                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Shield size={12} /> Role
                                            {!can('can_manage_users') && <Lock size={10} style={{ opacity: 0.5 }} />}
                                        </label>
                                        <select
                                            value={user.role || 'Developer'}
                                            onChange={(e) => handleRoleUpdate(user.id, e.target.value)}
                                            style={{
                                                width: '100%',
                                                cursor: (hasRoleColumn && can('can_manage_users')) ? 'pointer' : 'not-allowed',
                                                opacity: (hasRoleColumn && can('can_manage_users')) ? 1 : 0.6
                                            }}
                                            disabled={!hasRoleColumn || !can('can_manage_users')}
                                        >
                                            <option value="Admin">Admin</option>
                                            <option value="Manager">Manager</option>
                                            <option value="Developer">Developer</option>
                                            <option value="Reporter">Reporter</option>
                                            <option value="Guest">Guest</option>
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {activeTab === 'permissions' && (
                <div className="glass card" style={{ padding: '0', overflow: 'hidden' }}>
                    {can('can_manage_permissions') && (
                        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <form onSubmit={handleAddRole} style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
                                <input
                                    type="text"
                                    placeholder="New Role Name (e.g. Lead QA)"
                                    value={newRoleName}
                                    onChange={e => setNewRoleName(e.target.value)}
                                    style={{ maxWidth: '250px' }}
                                />
                                <button type="submit" className="btn btn-primary" disabled={!newRoleName.trim()}>
                                    <Plus size={16} /> Add Role
                                </button>
                            </form>
                        </div>
                    )}
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Role</th>
                                    <th style={{ textAlign: 'center' }}>Delete Projects</th>
                                    <th style={{ textAlign: 'center' }}>Delete Bugs</th>
                                    <th style={{ textAlign: 'center' }}>Manage Users</th>
                                    <th style={{ textAlign: 'center' }}>Manage Permissions</th>
                                    {can('can_manage_permissions') && <th style={{ textAlign: 'center', width: '60px' }}>Action</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {rolePermissions.map((perm) => (
                                    <tr key={perm.role}>
                                        <td style={{ fontWeight: 600 }}>
                                            <span className={`badge ${perm.role === 'Admin' ? 'badge-critical' :
                                                perm.role === 'Manager' ? 'badge-high' :
                                                    'badge-low'
                                                }`}>
                                                {perm.role}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <input
                                                type="checkbox"
                                                checked={perm.can_delete_project}
                                                onChange={() => handlePermissionToggle(perm.role, 'can_delete_project', perm.can_delete_project)}
                                                disabled={!can('can_manage_permissions') || perm.role === 'Admin'}
                                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                            />
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <input
                                                type="checkbox"
                                                checked={perm.can_delete_bug}
                                                onChange={() => handlePermissionToggle(perm.role, 'can_delete_bug', perm.can_delete_bug)}
                                                disabled={!can('can_manage_permissions') || perm.role === 'Admin'}
                                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                            />
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <input
                                                type="checkbox"
                                                checked={perm.can_manage_users}
                                                onChange={() => handlePermissionToggle(perm.role, 'can_manage_users', perm.can_manage_users)}
                                                disabled={!can('can_manage_permissions') || perm.role === 'Admin'}
                                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                            />
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <input
                                                type="checkbox"
                                                checked={perm.can_manage_permissions}
                                                onChange={() => handlePermissionToggle(perm.role, 'can_manage_permissions', perm.can_manage_permissions)}
                                                disabled={!can('can_manage_permissions') || perm.role === 'Admin'}
                                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                            />
                                        </td>
                                        {can('can_manage_permissions') && (
                                            <td style={{ textAlign: 'center' }}>
                                                {perm.role !== 'Admin' && (
                                                    <button
                                                        onClick={() => handleDeleteRole(perm.role)}
                                                        className="btn btn-delete"
                                                        style={{ padding: '0.25rem 0.5rem', background: 'transparent', border: 'none', color: '#ef4444' }}
                                                        title="Delete Role"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {rolePermissions.length === 0 && (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                            Loading permissions...
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Invite Modal */}
            {showInviteModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
                    zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="glass card animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '2rem', background: 'var(--card-bg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Invite Member</h2>
                            <button onClick={() => setShowInviteModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleInvite}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={inviteEmail}
                                    onChange={e => setInviteEmail(e.target.value)}
                                    placeholder="new.member@company.com"
                                    autoFocus
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowInviteModal(false)} className="btn" style={{ background: 'transparent', border: '1px solid var(--border-color)' }}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Send Invite
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

