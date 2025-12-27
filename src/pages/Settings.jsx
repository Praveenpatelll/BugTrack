
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Moon, Sun, Bell, Shield, Trash2, Lock, CheckCircle, X, AlertCircle } from 'lucide-react';

export default function Settings() {
    const { user, profile, updatePassword, signOut } = useAuth();
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
    const [notifications, setNotifications] = useState(() => {
        const saved = localStorage.getItem('notifications');
        return saved ? JSON.parse(saved) : { email: true, push: false, updates: true };
    });
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState(null);
    const [loading, setLoading] = useState(false);

    // Apply theme on mount and when it changes
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    // Save notifications to localStorage
    useEffect(() => {
        localStorage.setItem('notifications', JSON.stringify(notifications));
    }, [notifications]);

    const showMessage = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 4000);
    };

    const handleToggle = (key) => {
        setNotifications(prev => {
            const updated = { ...prev, [key]: !prev[key] };
            showMessage(`${key.charAt(0).toUpperCase() + key.slice(1)} notifications ${updated[key] ? 'enabled' : 'disabled'}`, 'success');
            return updated;
        });
    };

    const handleThemeChange = (newTheme) => {
        setTheme(newTheme);
        showMessage(`Theme changed to ${newTheme} mode`, 'success');
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();

        if (newPassword.length < 6) {
            showMessage('Password must be at least 6 characters', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showMessage('Passwords do not match', 'error');
            return;
        }

        setLoading(true);
        try {
            const { error } = await updatePassword(newPassword);
            if (error) throw error;

            showMessage('Password updated successfully!', 'success');
            setShowPasswordModal(false);
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            console.error('Password update error:', err);
            showMessage(err.message || 'Failed to update password', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = () => {
        if (window.confirm('⚠️ WARNING: This will permanently delete your account and all associated data. This action cannot be undone.\n\nAre you absolutely sure?')) {
            showMessage('Account deletion is not implemented yet. This would require backend support.', 'warning');
        }
    };

    return (
        <div>
            <h1 style={{ marginBottom: '2rem' }}>Settings</h1>

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

            <div style={{ display: 'grid', gap: '2rem', maxWidth: '800px' }}>

                {/* Appearance */}
                <section className="glass card">
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Moon size={20} /> Appearance
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                        Choose how BugTrack looks to you. Select a single theme, or sync with your system.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            className={`btn ${theme === 'light' ? 'btn-primary' : ''}`}
                            style={{
                                flex: 1,
                                padding: '1rem',
                                border: theme === 'light' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                                borderRadius: '0.5rem',
                                background: theme === 'light' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                            onClick={() => handleThemeChange('light')}
                        >
                            <Sun size={24} />
                            <div>Light Mode</div>
                        </button>
                        <button
                            className={`btn ${theme === 'dark' ? 'btn-primary' : ''}`}
                            style={{
                                flex: 1,
                                padding: '1rem',
                                border: theme === 'dark' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                                borderRadius: '0.5rem',
                                background: theme === 'dark' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                            onClick={() => handleThemeChange('dark')}
                        >
                            <Moon size={24} />
                            <div>Dark Mode</div>
                        </button>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1rem', marginBottom: 0 }}>
                        Note: Light mode styling is limited. Dark mode is recommended.
                    </p>
                </section>

                {/* Notifications */}
                <section className="glass card">
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Bell size={20} /> Notifications
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                        Manage how you receive notifications about bug updates and team activities.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {[
                            { id: 'email', label: 'Email Notifications', desc: 'Receive emails about your bug updates and assignments.' },
                            { id: 'push', label: 'Push Notifications', desc: 'Receive push notifications on your device (requires permission).' },
                            { id: 'updates', label: 'Product Updates', desc: 'Receive news about BugTrack features and improvements.' }
                        ].map(item => (
                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 500 }}>{item.label}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{item.desc}</div>
                                </div>
                                <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
                                    <input
                                        type="checkbox"
                                        checked={notifications[item.id]}
                                        onChange={() => handleToggle(item.id)}
                                        style={{ opacity: 0, width: 0, height: 0 }}
                                    />
                                    <span style={{
                                        position: 'absolute', cursor: 'pointer', inset: 0,
                                        background: notifications[item.id] ? 'var(--primary)' : '#475569',
                                        borderRadius: '24px', transition: '.4s'
                                    }}>
                                        <span style={{
                                            position: 'absolute', content: '""', height: '18px', width: '18px',
                                            left: notifications[item.id] ? '26px' : '4px', bottom: '3px',
                                            background: 'white', borderRadius: '50%', transition: '.4s'
                                        }} />
                                    </span>
                                </label>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Security */}
                <section className="glass card">
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Shield size={20} /> Security
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                        Keep your account secure with a strong password.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: 500 }}>Change Password</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Update your account password securely.</div>
                            </div>
                            <button className="btn btn-primary" onClick={() => setShowPasswordModal(true)}>Update</button>
                        </div>
                    </div>
                </section>

                {/* Account Info */}
                <section className="glass card">
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Account Information</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Email</label>
                            <div style={{ fontWeight: 500 }}>{user?.email || 'Not logged in'}</div>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Name</label>
                            <div style={{ fontWeight: 500 }}>{profile?.name || 'Loading...'}</div>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>User ID</label>
                            <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{user?.id || 'N/A'}</div>
                        </div>
                    </div>
                </section>

                {/* Danger Zone */}
                <section className="glass card" style={{ borderColor: '#ef4444', border: '2px solid rgba(239, 68, 68, 0.3)' }}>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444' }}>
                        <Lock size={20} /> Danger Zone
                    </h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                        Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <button
                        className="btn"
                        style={{ background: '#fee2e2', color: '#dc2626', border: 'none', fontWeight: 'bold' }}
                        onClick={handleDeleteAccount}
                    >
                        <Trash2 size={16} style={{ marginRight: '0.5rem' }} /> Delete Account
                    </button>
                </section>
            </div>

            {/* Password Change Modal */}
            {showPasswordModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 100, backdropFilter: 'blur(4px)'
                }} onClick={(e) => { if (e.target === e.currentTarget) setShowPasswordModal(false); }}>
                    <div className="glass card" style={{ width: '500px', maxWidth: '95%', background: '#1e293b' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0 }}>Change Password</h2>
                            <button className="btn" onClick={() => setShowPasswordModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label>New Password</label>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    placeholder="Enter new password (min 6 characters)"
                                />
                            </div>
                            <div>
                                <label>Confirm Password</label>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" className="btn" onClick={() => setShowPasswordModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? 'Updating...' : 'Update Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
