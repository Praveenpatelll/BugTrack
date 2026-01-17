import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Bug, Settings as SettingsIcon, Users, Briefcase, User, LogOut, ChevronLeft, ChevronRight, X, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ isCollapsed, onToggle, mobileOpen, onMobileClose }) {
    const { signOut } = useAuth();

    return (
        <div className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'space-between',
                marginBottom: '2rem', paddingLeft: isCollapsed ? 0 : '0.5rem'
            }}>
                {!isCollapsed && (
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'white' }}>
                        <div style={{ background: 'var(--primary)', padding: '6px', borderRadius: '8px', display: 'flex' }}>
                            <Bug size={24} color="white" />
                        </div>
                        BugTrack
                    </h2>
                )}
                {isCollapsed && !mobileOpen && ( // Only show icon-only mode if not mobile open (mobile sidebar is full width)
                    <div style={{ background: 'var(--primary)', padding: '6px', borderRadius: '8px', display: 'flex' }}>
                        <Bug size={24} color="white" />
                    </div>
                )}

                {/* Desktop Toggle */}
                <button
                    onClick={onToggle}
                    className="btn desktop-toggle"
                    style={{
                        padding: '0.25rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'var(--text-muted)',
                        position: isCollapsed ? 'absolute' : 'static',
                        top: '1rem', right: isCollapsed ? '-12px' : 'auto',
                        borderRadius: '50%', width: '24px', height: '24px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 10
                    }}
                >
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>

                {/* Mobile Close Button */}
                <button
                    onClick={onMobileClose}
                    className="btn mobile-close"
                    style={{
                        display: 'none', // Hidden by default, shown via CSS on mobile
                        padding: '0.5rem', background: 'transparent', border: 'none', color: 'var(--text-muted)'
                    }}
                >
                    <X size={24} />
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title={isCollapsed ? "Dashboard" : ""}>
                    <LayoutDashboard size={20} />
                    {!isCollapsed && <span>Dashboard</span>}
                </NavLink>
                <NavLink to="/projects" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title={isCollapsed ? "Projects" : ""}>
                    <Briefcase size={20} />
                    {!isCollapsed && <span>Projects</span>}
                </NavLink>
                <NavLink to="/bugs" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title={isCollapsed ? "All Bugs" : ""}>
                    <Bug size={20} />
                    {!isCollapsed && <span>All Bugs</span>}
                </NavLink>
                <NavLink to="/users" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title={isCollapsed ? "Team" : ""}>
                    <Users size={20} />
                    {!isCollapsed && <span>Team</span>}
                </NavLink>
                <NavLink to="/load-test" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title={isCollapsed ? "Load Test" : ""}>
                    <Activity size={20} />
                    {!isCollapsed && <span>Load Test</span>}
                </NavLink>
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title={isCollapsed ? "My Profile" : ""}>
                    <User size={20} />
                    {!isCollapsed && <span>My Profile</span>}
                </NavLink>
                <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title={isCollapsed ? "Settings" : ""}>
                    <SettingsIcon size={20} />
                    {!isCollapsed && <span>Settings</span>}
                </NavLink>
                <button
                    onClick={signOut}
                    className="nav-item"
                    style={{
                        width: '100%', border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                        textAlign: isCollapsed ? 'center' : 'left', justifyContent: isCollapsed ? 'center' : 'flex-start'
                    }}
                    title={isCollapsed ? "Logout" : ""}
                >
                    <LogOut size={20} />
                    {!isCollapsed && <span>Logout</span>}
                </button>
            </div>
        </div>
    );
}
