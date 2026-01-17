import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AlertCircle, CheckCircle, Clock, Activity, FileText } from 'lucide-react';

export default function Dashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ total: 0, open: 0, closed: 0, inProgress: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            // Parallel requests for counts
            const [
                { count: total },
                { count: openCount },
                { count: inProgressCount },
                { count: closedCount }
            ] = await Promise.all([
                supabase.from('bugs').select('*', { count: 'exact', head: true }),
                supabase.from('bugs').select('*', { count: 'exact', head: true }).eq('status', 'Open'),
                supabase.from('bugs').select('*', { count: 'exact', head: true }).eq('status', 'In Progress'),
                supabase.from('bugs').select('*', { count: 'exact', head: true }).or('status.eq.Closed,status.eq.Resolved')
            ]);

            setStats({
                total: total || 0,
                open: openCount || 0,
                inProgress: inProgressCount || 0,
                closed: closedCount || 0
            });
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ title, value, icon: Icon, color }) => (
        <div className="glass card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', borderRadius: '12px', background: `${color}20`, color: color }}>
                <Icon size={24} />
            </div>
            <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>{title}</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', lineHeight: 1 }}>{loading ? '-' : value}</div>
            </div>
        </div>
    );

    return (
        <div>
            <h1 style={{ marginBottom: '2rem', fontSize: '2rem' }}>Dashboard Overview</h1>

            <div className="stat-grid">
                <StatCard title="Total Bugs" value={stats.total} icon={Activity} color="#6366f1" />
                <StatCard title="Open Issues" value={stats.open} icon={AlertCircle} color="#ef4444" />
                <StatCard title="In Progress" value={stats.inProgress} icon={Clock} color="#f59e0b" />
                <StatCard title="Resolved" value={stats.closed} icon={CheckCircle} color="#10b981" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                <div className="glass card">
                    <h3 style={{ marginTop: 0 }}>System Health</h3>
                    <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', borderRadius: '8px', overflow: 'hidden' }}>
                        <img
                            src="/images/dashboard-chart.png"
                            alt="Dashboard Visualization"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                                opacity: 0.9
                            }}
                        />
                    </div>
                </div>
                <div className="glass card">
                    <h3 style={{ marginTop: 0 }}>Quick Actions</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/bugs')}>
                            <AlertCircle size={18} style={{ marginRight: '8px' }} /> Report New Bug
                        </button>
                        <button className="btn" style={{ width: '100%', justifyContent: 'center', background: 'rgba(255,255,255,0.05)' }} onClick={() => alert('Documentation module is currently under development.')}>
                            <FileText size={18} style={{ marginRight: '8px' }} /> View Documentation
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
