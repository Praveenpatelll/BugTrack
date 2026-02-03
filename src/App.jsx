import React from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Bug, Settings as SettingsIcon, Plus, Users, Briefcase, User, LogOut, Menu } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import BugList from './pages/BugList';
import Projects from './pages/Projects';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import Profile from './pages/Profile';
import Team from './pages/Team';
import Settings from './pages/Settings';
import LoadTest from './pages/LoadTest';
import { AuthProvider, useAuth } from './context/AuthContext';
import { isConfigured } from './lib/supabase';
import Sidebar from './components/Sidebar';

const RequireAuth = ({ children }) => {
  const { user, loading } = useAuth();
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const location = useLocation();

  // Close mobile sidebar on route change
  React.useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  // Safety timeout for loading
  React.useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        console.warn('Loading timeout reached.');
        // Logic to show error? For now just log.
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (loading) return <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading application...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className={`grid-layout ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Mobile Header */}
      <div className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 'bold', color: 'white' }}>
          <div style={{ background: 'var(--primary)', padding: '6px', borderRadius: '8px', display: 'flex' }}>
            <Bug size={24} color="white" />
          </div>
          BugTrack
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="btn"
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)' }}
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Overlay */}
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}

      <Sidebar
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed(!isCollapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="main-content">
        {children}
      </div>
    </div>
  );
};

const SetupRequired = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0f172a',
    color: 'white',
    padding: '2rem',
    textAlign: 'center',
    fontFamily: 'system-ui, sans-serif'
  }}>
    <div style={{ marginBottom: '2rem', background: '#334155', padding: '1rem', borderRadius: '50%' }}>
      <Bug size={48} color="#f87171" />
    </div>
    <h1 style={{ fontSize: '2rem', marginBottom: '1rem', fontWeight: 'bold' }}>Configuration Required</h1>
    <p style={{ maxWidth: '600px', lineHeight: '1.6', color: '#94a3b8', marginBottom: '2rem' }}>
      The application could not start because it is missing the required Supabase configuration.
      <br />
      If you are the developer, please ensure the following environment variables are set:
    </p>
    <div style={{
      background: '#1e293b',
      padding: '1.5rem',
      borderRadius: '8px',
      textAlign: 'left',
      width: '100%',
      maxWidth: '500px',
      border: '1px solid #475569',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    }}>
      <code style={{ display: 'block', color: '#38bdf8', marginBottom: '0.5rem', fontFamily: 'monospace' }}>VITE_SUPABASE_URL</code>
      <code style={{ display: 'block', color: '#38bdf8', fontFamily: 'monospace' }}>VITE_SUPABASE_ANON_KEY</code>
    </div>
    <p style={{ marginTop: '2rem', fontSize: '0.875rem', color: '#64748b' }}>
      Check your <code style={{ color: '#cbd5e1' }}>.env</code> file locally or your Deployment Settings (Netlify/Vercel).
    </p>
  </div>
);

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
          <Route path="/load-test" element={<RequireAuth><LoadTest /></RequireAuth>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
