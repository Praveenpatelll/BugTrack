import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Bug, ArrowRight, Lock, Mail } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const { error } = await signIn(email, password);
        if (error) {
            setError(error.message);
        } else {
            navigate('/');
        }
        setLoading(false);
    };

    return (
        <div className="mesh-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>

            {/* Ambient Background Elements */}
            <div style={{ position: 'absolute', top: '20%', left: '20%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%', animation: 'float 6s ease-in-out infinite' }} />
            <div style={{ position: 'absolute', bottom: '20%', right: '20%', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%', animation: 'float 8s ease-in-out infinite reverse' }} />

            {/* Main Container - Split Screen on Desktop */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                width: '100%',
                maxWidth: '1200px',
                margin: '2rem',
                gap: '2rem',
                alignItems: 'center'
            }} className="login-container">

                {/* Left Side - Login Form */}
                <div className="glass card animate-fade-in" style={{ padding: '2.5rem', position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {/* Decorative Top Line */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, var(--primary), transparent)' }} />

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2.5rem' }}>
                        <div style={{
                            background: 'linear-gradient(135deg, var(--primary), #4f46e5)',
                            padding: '1rem',
                            borderRadius: '16px',
                            marginBottom: '1.5rem',
                            boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.4)'
                        }}>
                            <Bug size={40} color="white" strokeWidth={1.5} />
                        </div>
                        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '700', letterSpacing: '-0.02em', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Welcome Back
                        </h1>
                        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '1rem' }}>
                            Sign in to access your dashboard
                        </p>
                    </div>

                    {error && (
                        <div style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            padding: '1rem',
                            borderRadius: '0.75rem',
                            marginBottom: '1.5rem',
                            fontSize: '0.9rem',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div className="input-group">
                            <label style={{ marginLeft: '0.25rem', fontWeight: '500' }}>Email</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="name@company.com"
                                    style={{ paddingLeft: '2.75rem', height: '48px' }}
                                />
                            </div>
                        </div>
                        <div className="input-group">
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <label style={{ marginLeft: '0.25rem', fontWeight: '500' }}>Password</label>
                                <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '600' }}>Forgot password?</Link>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    style={{ paddingLeft: '2.75rem', height: '48px' }}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                            style={{
                                marginTop: '0.5rem',
                                height: '48px',
                                fontSize: '1rem',
                                boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.2)'
                            }}
                        >
                            {loading ? 'Signing in...' : (
                                <>Sign In <ArrowRight size={18} /></>
                            )}
                        </button>
                    </form>

                    <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                            Don't have an account?{' '}
                            <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: '600', transition: 'color 0.2s' }}>
                                Create account
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Right Side - Hero Image */}
                <div className="hero-image-container" style={{
                    position: 'relative',
                    height: '600px',
                    borderRadius: '1rem',
                    overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'var(--card-bg)',
                    backdropFilter: 'blur(12px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <img
                        src="/images/login-hero.png"
                        alt="Bug Tracking Visualization"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            opacity: 0.95
                        }}
                    />
                    {/* Gradient Overlay for better integration */}
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(16,185,129,0.05) 100%)',
                        pointerEvents: 'none'
                    }} />
                </div>
            </div>
        </div>
    );
}
