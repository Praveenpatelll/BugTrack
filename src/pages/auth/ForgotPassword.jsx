
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { Bug, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const { resetPassword } = useAuth();
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await resetPassword(email);
        if (error) {
            alert(error.message);
        } else {
            setSent(true);
        }
        setLoading(false);
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
            <div className="glass card" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
                <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    <ArrowLeft size={16} /> Back to Login
                </Link>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
                    <div style={{ background: 'var(--primary)', padding: '0.75rem', borderRadius: '12px', marginBottom: '1rem' }}>
                        <Bug size={32} color="white" />
                    </div>
                    <h1 style={{ margin: 0, fontSize: '1.75rem' }}>Reset Password</h1>
                    <p style={{ color: 'var(--text-muted)' }}>We'll send you a link to reset it.</p>
                </div>

                {sent ? (
                    <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                            Check your email!
                        </div>
                        <p style={{ color: 'var(--text-muted)' }}>We've sent a password reset link to <strong>{email}</strong>.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label>Email Address</label>
                            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '0.5rem' }}>
                            {loading ? 'Sending link...' : 'Send Reset Link'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
