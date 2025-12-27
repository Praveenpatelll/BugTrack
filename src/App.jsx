import React from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Bug, Settings as SettingsIcon, Plus, Users, Briefcase, User, LogOut } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import BugList from './pages/BugList';
import Projects from './pages/Projects';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import Profile from './pages/Profile';
import Team from './pages/Team';
import Settings from './pages/Settings';
import { AuthProvider, useAuth } from './context/AuthContext';
import { isConfigured } from './lib/supabase';

function Sidebar() {
  const { signOut } = useAuth();

  return (
    <div className="sidebar">
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'white', paddingLeft: '1rem' }}>
        <div style={{ background: 'var(--primary)', padding: '6px', borderRadius: '8px', display: 'flex' }}>
          <Bug size={24} color="white" />
        </div>
        BugTrack
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={20} /> Dashboard
        </NavLink>
        <NavLink to="/projects" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Briefcase size={20} /> Projects
        </NavLink>
        <NavLink to="/bugs" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Bug size={20} /> All Bugs
        </NavLink>
        <NavLink to="/users" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Users size={20} /> Team
        </NavLink>
      </div>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <User size={20} /> My Profile
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <SettingsIcon size={20} /> Settings
        </NavLink>
        <button
          onClick={signOut}
          className="nav-item"
          style={{ width: '100%', border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', textAlign: 'left' }}
        >
          <LogOut size={20} /> Logout
        </button>
      </div>
    </div>
  );
}

const Placeholder = ({ title }) => (
  <div className="glass card">
    <h2>{title}</h2>
    <p style={{ color: 'var(--text-muted)' }}>Coming soon...</p>
  </div>
);

const SetupRequired = () => (
  <div style={{
    minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    background: '#0f172a', color: '#e2e8f0', padding: '2rem'
  }}>
    <div className="glass card" style={{ maxWidth: '600px', width: '100%' }}>
      <h1 style={{ color: '#ef4444', marginTop: 0 }}>Supabase Setup Required</h1>
      <p>The application is now configured to use Supabase, but your credentials are missing.</p>

      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '0.5rem', margin: '1rem 0' }}>
        <h3 style={{ marginTop: 0, fontSize: '1rem' }}>1. Create .env File</h3>
        <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Create a file named <code>.env</code> in the project root with your credentials:</p>
        <pre style={{ background: '#1e293b', padding: '0.5rem', borderRadius: '0.25rem', overflowX: 'auto', fontSize: '0.8rem' }}>
          VITE_SUPABASE_URL=https://your-project.supabase.co{'\n'}
          VITE_SUPABASE_ANON_KEY=your-anon-key
        </pre>
      </div>

      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '0.5rem', margin: '1rem 0' }}>
        <h3 style={{ marginTop: 0, fontSize: '1rem' }}>2. Setup Database</h3>
        <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
          Copy the SQL script from <code>SUPABASE_SETUP.md</code> and run it in your Supabase SQL Editor.
        </p>
      </div>

      <p style={{ fontSize: '0.9rem', textAlign: 'center', color: '#64748b' }}>
        After adding the .env file, restart the dev server to apply changes.
      </p>
    </div>
  </div>
);

const RequireAuth = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null; // Or a loading spinner
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="grid-layout">
      <Sidebar />
      <div className="main-content">
        {children}
      </div>
    </div>
  );
};

export default function App() {
  if (!isConfigured) {
    return <SetupRequired />;
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected Routes */}
          <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/projects" element={<RequireAuth><Projects /></RequireAuth>} />
          <Route path="/bugs" element={<RequireAuth><BugList /></RequireAuth>} />
          <Route path="/users" element={<RequireAuth><Team /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
