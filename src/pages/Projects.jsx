import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Plus, Briefcase, Trash2 } from 'lucide-react';

export default function Projects() {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', key: '', description: '' });

    const fetchProjects = async () => {
        try {
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProjects(data);
        } catch (err) {
            console.error('Error fetching projects:', err);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { error } = await supabase
                .from('projects')
                .insert([formData]);

            if (error) {
                if (error.code === '23505') { // Unique violation
                    alert('A project with this Key already exists. Please choose a unique Key (e.g., WEB2).');
                    return;
                }
                throw error;
            }

            setShowModal(false);
            setFormData({ name: '', key: '', description: '' });
            fetchProjects();
        } catch (err) {
            console.error('Error creating project:', err);
            alert('Error creating project');
        }
    };

    const handleDelete = async (id, name) => {
        if (!confirm(`Are you sure you want to delete project "${name}"?\n\nThis will permanently delete all bugs associated with this project.`)) return;

        try {
            const { error } = await supabase.from('projects').delete().eq('id', id);
            if (error) throw error;
            setProjects(projects.filter(p => p.id !== id));
        } catch (err) {
            console.error('Error deleting project:', err);
            alert('Error deleting project: ' + err.message);
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ marginBottom: '0.5rem' }}>Projects</h1>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>Manage your software projects.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={18} /> New Project
                </button>
            </div>

            {showModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 100, backdropFilter: 'blur(4px)'
                }} onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
                    <div className="glass card" style={{ width: '500px', maxWidth: '95%', background: '#1e293b' }}>
                        <h2 style={{ marginTop: 0 }}>Create Project</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label>Project Name</label>
                                <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Website Redesign" />
                            </div>
                            <div>
                                <label>Key (e.g. WEB)</label>
                                <input required value={formData.key} onChange={e => setFormData({ ...formData, key: e.target.value.toUpperCase() })} placeholder="WEB" maxLength={5} />
                            </div>
                            <div>
                                <label>Description</label>
                                <textarea rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button type="button" className="btn" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="stat-grid">
                {projects.map(proj => (
                    <div key={proj.id} className="glass card" style={{ position: 'relative' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                            <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '8px' }}>
                                <Briefcase size={24} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0 }}>{proj.name}</h3>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{proj.key}</span>
                            </div>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', height: '40px', overflow: 'hidden' }}>
                            {proj.description || 'No description provided.'}
                        </p>
                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Added: {proj.created_at?.split('T')[0]}</span>
                            <button className="btn" style={{ fontSize: '0.8rem' }} onClick={() => navigate('/bugs', { state: { projectId: proj.id } })}>View Details</button>
                            <button
                                className="btn"
                                style={{ fontSize: '0.8rem', color: '#ef4444', marginLeft: '0.5rem', background: 'rgba(239, 68, 68, 0.1)' }}
                                onClick={(e) => { e.stopPropagation(); handleDelete(proj.id, proj.name); }}
                                title="Delete Project"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
