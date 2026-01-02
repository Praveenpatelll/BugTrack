import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { Plus, Trash2, User, Image as ImageIcon, CheckCircle, X, ExternalLink, Edit, Eye, FileText, Video, Paperclip, Download, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, HeadingLevel, AlignmentType, WidthType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

const PRIORITY_COLORS = {
    High: 'badge-high',
    Medium: 'badge-medium',
    Low: 'badge-low',
    Critical: 'badge-critical'
};

const STATUS_OPTS = ['Open', 'In Progress', 'Closed'];

export default function BugList() {
    const { profile } = useAuth();
    const { can } = usePermissions();
    const location = useLocation();
    const [bugs, setBugs] = useState([]);
    const [users, setUsers] = useState([]);
    const [assignableUsers, setAssignableUsers] = useState([]); // Users who can be assigned (Dev/Admin)
    const [currentUserRole, setCurrentUserRole] = useState(null); // Current user's role
    const [projects, setProjects] = useState([]);
    const [filterProject, setFilterProject] = useState(location.state?.projectId || '');
    const [filterModule, setFilterModule] = useState('');
    const [filterAssignee, setFilterAssignee] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [files, setFiles] = useState([]);
    const [existingAttachments, setExistingAttachments] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [deletingAttachmentId, setDeletingAttachmentId] = useState(null);
    const [viewBug, setViewBug] = useState(null);
    const [zoomedImage, setZoomedImage] = useState(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'Medium',
        severity: 'Minor',
        assignee_id: '',
        reporter_id: profile?.id || null,
        project_id: '',
        module: '',
        environment: '',
        steps_to_reproduce: '',
        expected_result: '',
        actual_result: ''
    });

    // Update form default when profile loads
    useEffect(() => {
        if (profile?.id) {
            setFormData(prev => ({ ...prev, reporter_id: profile.id }));
        }
    }, [profile]);

    // Fetch current user role when profile is available
    useEffect(() => {
        if (profile?.email) {
            supabase.from('users').select('role').eq('email', profile.email).single()
                .then(({ data }) => setCurrentUserRole(data?.role || 'Developer'));
        }
    }, [profile]);

    const fetchData = async () => {
        try {
            // Fetch Users
            const { data: usersData } = await supabase.from('users').select('*');
            setUsers(usersData || []);

            // Filter assignable users (Admins and Developers only)
            const devsAndAdmins = (usersData || []).filter(u => u.role !== 'Reporter' && u.role !== 'Guest');
            setAssignableUsers(devsAndAdmins);

            // Fetch Projects
            const { data: projectsData } = await supabase.from('projects').select('*');
            setProjects(projectsData || []);

            // Fetch Bugs with Joins
            let query = supabase
                .from('bugs')
                .select(`
                    *,
                    assignee:users!assignee_id(name, avatar),
                    reporter:users!reporter_id(name, avatar),
                    project:projects!project_id(key, name),
                    attachments:attachments(*)
                `)
                .order('created_at', { ascending: false });

            if (filterProject) {
                query = query.eq('project_id', filterProject);
            }

            const { data: bugsData, error } = await query;

            if (error) throw error;

            // Transform for compatibility with existing render logic
            const formattedBugs = bugsData.map(b => ({
                ...b,
                assignee_name: b.assignee?.name,
                assignee_avatar: b.assignee?.avatar,
                reporter_name: b.reporter?.name,
                project_key: b.project?.key,
                project_name: b.project?.name
            }));
            setBugs(formattedBugs);
        } catch (err) {
            console.error('Error fetching data:', err);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filterProject]);

    // ... (existing helper functions: handleFilesChange, removeFile, deleteAttachment, handlePaste, handleSubmit, resetForm, handleDelete, handleStatusChange, handleEdit)

    const handleFilesChange = (e) => {
        if (e.target.files) {
            setFiles(prev => [...prev, ...Array.from(e.target.files)]);
        }
    };

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const deleteAttachment = async (attId, fileUrl) => {
        // Force delete, no confirmation
        // if (!confirm('Permanently delete this attachment?')) return;
        setDeletingAttachmentId(attId);
        console.log('Force Deleting Attachment:', attId);

        try {
            // 1. Delete from DB
            const { error: dbError } = await supabase.from('attachments').delete().eq('id', attId);
            if (dbError) throw dbError;

            // 2. Delete from Storage
            try {
                const rawPath = fileUrl.split('/attachments/').pop();
                const path = decodeURIComponent(rawPath);
                if (path) {
                    await supabase.storage.from('attachments').remove([path]);
                }
            } catch (ignore) { console.warn('Storage delete warning', ignore); }

            // 3. Update State (Loose equality for safety)
            setExistingAttachments(prev => prev.filter(a => a.id != attId));

            setBugs(prev => prev.map(b => {
                if (b.id === editingId) {
                    return { ...b, attachments: (b.attachments || []).filter(a => a.id != attId) };
                }
                return b;
            }));

            // alert('Deleted successfully.');
        } catch (err) {
            console.error('Error deleting:', err);
            alert('Error deleting attachment: ' + err.message);
        } finally {
            setDeletingAttachmentId(null);
        }
    };

    // Expose for debugging
    useEffect(() => {
        window.deleteBugAttachment = deleteAttachment;
        console.log('Debug function window.deleteBugAttachment is ready.');
    }, [existingAttachments, bugs]);

    const handlePaste = (e) => {
        const items = e.clipboardData.items;
        const newFiles = [];
        for (const item of items) {
            if (item.kind === 'file') {
                const blob = item.getAsFile();
                if (blob) newFiles.push(blob);
            }
        }
        if (newFiles.length > 0) {
            setFiles(prev => [...prev, ...newFiles]);
            e.preventDefault();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Submitting bug report...');
        setLoading(true);
        try {
            const payload = { ...formData };
            if (!payload.assignee_id) payload.assignee_id = null;
            if (!payload.project_id) payload.project_id = null;
            payload.screenshot = null; // Deprecated

            console.log('Saving payload:', payload);

            let bugId = editingId;

            if (editingId) {
                const { error } = await supabase.from('bugs').update(payload).eq('id', editingId);
                if (error) throw error;
            } else {
                const { data, error } = await supabase.from('bugs').insert([payload]).select().single();
                if (error) throw error;
                bugId = data.id;
            }

            // Upload Attachments
            if (files.length > 0 && bugId) {
                console.log(`Uploading ${files.length} files...`);
                const attachmentInserts = [];

                for (const file of files) {
                    const fileNameProp = file.name || 'pasted_file';
                    const fileExt = fileNameProp.includes('.') ? fileNameProp.split('.').pop() : 'bin';
                    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

                    const { error: uploadError } = await supabase.storage
                        .from('attachments')
                        .upload(uniqueName, file);

                    if (uploadError) {
                        console.error('Upload Error:', uploadError);
                        if (uploadError.message.includes('row-level security')) {
                            alert('Storage Permission Error: Run "SETUP_ATTACHMENTS.sql" in Dashboard.');
                        }
                        continue;
                    }

                    const { data: publicUrlData } = supabase.storage
                        .from('attachments')
                        .getPublicUrl(uniqueName);

                    attachmentInserts.push({
                        bug_id: bugId,
                        file_url: publicUrlData.publicUrl,
                        file_name: fileNameProp,
                        file_type: file.type || 'application/octet-stream'
                    });
                }

                if (attachmentInserts.length > 0) {
                    const { error: attachError } = await supabase.from('attachments').insert(attachmentInserts);
                    if (attachError) console.error('Error linking attachments:', attachError);
                }
            }

            setShowModal(false);
            resetForm();
            fetchData();
            alert('Issue saved successfully!');
        } catch (err) {
            console.error('Error saving bug:', err);
            let msg = err.message;
            if (msg.includes('invalid input syntax') || msg.includes('foreign key constraint')) {
                msg = `Database Schema Error: ${msg}\n\nPlease run "FIX_BUGS_SCHEMA.sql" in your Supabase SQL Editor to fix the ID types (UUID vs BigInt).`;
            }
            alert('Error saving bug: ' + msg);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '', description: '', priority: 'Medium', severity: 'Minor', assignee_id: '', reporter_id: profile?.id || null,
            project_id: '', module: '', environment: '', steps_to_reproduce: '', expected_result: '', actual_result: ''
        });
        setFiles([]);
        setExistingAttachments([]);
        setEditingId(null);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this issue?')) return;
        console.log('Force Deleting BUG:', id);
        try {
            const { error } = await supabase.from('bugs').delete().eq('id', id);
            if (error) throw error;
            setBugs(bugs.filter(b => b.id !== id));
        } catch (err) {
            console.error(err);
            alert('Error deleting bug: ' + err.message);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        // Optimistic update
        setBugs(bugs.map(b => b.id === id ? { ...b, status: newStatus } : b));
        try {
            const { error } = await supabase.from('bugs').update({ status: newStatus }).eq('id', id);
            if (error) throw error;
        } catch (err) {
            console.error(err);
            fetchData(); // Revert on error
            alert('Error updating status');
        }
    };

    const handleEdit = (bug) => {
        setEditingId(bug.id);
        setExistingAttachments(bug.attachments || []);
        setFormData({
            title: bug.title,
            description: bug.description || '',
            priority: bug.priority,
            severity: bug.severity || 'Minor',
            assignee_id: bug.assignee_id || '',
            reporter_id: bug.reporter_id || 1,
            project_id: bug.project_id || '',
            module: bug.module || '',
            environment: bug.environment || '',
            steps_to_reproduce: bug.steps_to_reproduce || '',
            expected_result: bug.expected_result || '',
            actual_result: bug.actual_result || ''
        });
        setShowModal(true);
    };

    // Filter bugs before export
    const getFilteredBugs = () => {
        return bugs.filter(b => {
            if (filterModule && b.module !== filterModule) return false;
            if (filterAssignee && b.assignee_id !== filterAssignee) return false;
            return true;
        });
    };

    const exportToExcel = () => {
        const filteredBugs = getFilteredBugs();
        const exportData = filteredBugs.map((bug, index) => ({
            ID: bug.id,
            Title: bug.title,
            Project: bug.project_name || '-',
            Status: bug.status,
            Priority: bug.priority,
            Severity: bug.severity,
            Module: bug.module || '-',
            Assignee: bug.assignee_name || 'Unassigned',
            Reporter: bug.reporter_name || '-',
            Environment: bug.environment || '-',
            CreatedDate: new Date(bug.created_at).toLocaleDateString(),
            Description: bug.description || '-',
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(exportData);
        XLSX.utils.book_append_sheet(wb, ws, "Bug Report");
        XLSX.writeFile(wb, `BugReport_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const exportToDoc = () => {
        const filteredBugs = getFilteredBugs();

        // Generate HTML content for legacy Word compatibility (works on ALL versions)
        let htmlContent = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <meta charset='utf-8'>
                <title>Bug Report</title>
                <style>
                    body { font-family: 'Arial', sans-serif; font-size: 11pt; }
                    table { border-collapse: collapse; width: 100%; margin-top: 20px; }
                    th, td { border: 1px solid #000000; padding: 6px; text-align: left; vertical-align: top; }
                    th { background-color: #f2f2f2; font-weight: bold; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .meta { text-align: center; color: #666; margin-bottom: 30px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1 style="margin: 0; font-size: 24pt;">Bug Report</h1>
                </div>
                <div class="meta">
                    <p>Generated on: ${new Date().toLocaleDateString()} | Total Issues: ${filteredBugs.length}</p>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 10%">ID</th>
                            <th style="width: 30%">Title</th>
                            <th style="width: 15%">Status</th>
                            <th style="width: 10%">Priority</th>
                            <th style="width: 20%">Assignee</th>
                            <th style="width: 15%">Project</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        filteredBugs.forEach(bug => {
            htmlContent += `
                <tr>
                    <td>${String(bug.id).substring(0, 8)}...</td>
                    <td><strong>${bug.title}</strong></td>
                    <td>${bug.status}</td>
                    <td>${bug.priority}</td>
                    <td>${bug.assignee_name || 'Unassigned'}</td>
                    <td>${bug.project_name || '-'}</td>
                </tr>
            `;
        });

        htmlContent += `
                    </tbody>
                </table>
            </body>
            </html>
        `;

        // Save as .doc (MIME type application/msword)
        const blob = new Blob(['\ufeff', htmlContent], {
            type: 'application/msword'
        });
        saveAs(blob, `BugReport_${new Date().toISOString().split('T')[0]}_v2.doc`);
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ marginBottom: '0.5rem' }}>Issues</h1>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>Track and manage software defects.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <select style={{ width: '150px' }} value={filterProject} onChange={e => setFilterProject(e.target.value)}>
                        <option value="">All Projects</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <select style={{ width: '150px' }} value={filterModule} onChange={e => setFilterModule(e.target.value)}>
                        <option value="">All Modules</option>
                        {[...new Set(bugs.map(b => b.module).filter(Boolean))].map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                    <select style={{ width: '150px' }} value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}>
                        <option value="">All Assignees</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>

                    {/* Export Buttons */}
                    <button className="btn" onClick={exportToExcel} title="Download Excel" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <FileSpreadsheet size={18} color="#10b981" />
                    </button>
                    <button className="btn" onClick={exportToDoc} title="Download Word" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <FileText size={18} color="#3b82f6" />
                    </button>

                    <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
                        <Plus size={18} /> New Issue
                    </button>
                </div>
            </div>

            {showModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 100, backdropFilter: 'blur(4px)'
                }} onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
                    <div className="glass card" style={{ width: '800px', maxWidth: '95%', background: '#1e293b', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0 }}>{editingId ? 'Edit Issue' : 'Report Bug'}</h2>
                            <button className="btn" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label>Title</label>
                                    <input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Login button not working" />
                                </div>
                                <div>
                                    <label>Project</label>
                                    <select required value={formData.project_id} onChange={e => setFormData({ ...formData, project_id: e.target.value })}>
                                        <option value="">Select Project...</option>
                                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label>Module</label>
                                    <input value={formData.module} onChange={e => setFormData({ ...formData, module: e.target.value })} placeholder="e.g. Auth, Checkout..." />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label>Priority</label>
                                    <select value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                                        <option>Low</option>
                                        <option>Medium</option>
                                        <option>High</option>
                                        <option>Critical</option>
                                    </select>
                                </div>
                                <div>
                                    <label>Assignee</label>
                                    <select value={formData.assignee_id} onChange={e => setFormData({ ...formData, assignee_id: e.target.value })}>
                                        <option value="">Unassigned</option>
                                        {assignableUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label>Environment</label>
                                    <input value={formData.environment} onChange={e => setFormData({ ...formData, environment: e.target.value })} placeholder="e.g. Chrome, iOS..." />
                                </div>
                            </div>

                            <div>
                                <label>Description</label>
                                <textarea rows={2} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Brief summary..." />
                            </div>

                            <div>
                                <label>Steps to Reproduce</label>
                                <textarea rows={3} value={formData.steps_to_reproduce} onChange={e => setFormData({ ...formData, steps_to_reproduce: e.target.value })} placeholder="1. Go to homepage&#10;2. Click on..." />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label>Expected Result</label>
                                    <textarea rows={2} value={formData.expected_result} onChange={e => setFormData({ ...formData, expected_result: e.target.value })} />
                                </div>
                                <div>
                                    <label>Actual Result</label>
                                    <textarea rows={2} value={formData.actual_result} onChange={e => setFormData({ ...formData, actual_result: e.target.value })} />
                                </div>
                            </div>

                            <div>
                                <label>Attachments (Images, Video, PDF, Docs)</label>

                                {/* Existing Attachments (Edit Mode) */}
                                {existingAttachments.length > 0 && (
                                    <div style={{ marginBottom: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.5rem' }}>
                                        {existingAttachments.map(att => (
                                            <div key={att.id} style={{
                                                border: '1px solid var(--border-color)', borderRadius: '0.25rem',
                                                padding: '0.5rem', background: 'rgba(255,255,255,0.02)', position: 'relative'
                                            }}>
                                                <div style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '0.25rem' }}>
                                                    {att.file_name}
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <a href={att.file_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontSize: '0.8rem' }}>View</a>

                                                    {/* Enhanced Delete Button */}
                                                    <button type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            deleteAttachment(att.id, att.file_url);
                                                        }}
                                                        disabled={deletingAttachmentId === att.id}
                                                        className="btn-delete"
                                                        title={`Delete File ${att.id}`}
                                                        style={{
                                                            background: deletingAttachmentId === att.id ? '#f3f4f6' : '#fee2e2',
                                                            border: deletingAttachmentId === att.id ? '1px solid #d1d5db' : '1px solid #ef4444',
                                                            borderRadius: '4px',
                                                            padding: '2px 6px',
                                                            cursor: deletingAttachmentId === att.id ? 'not-allowed' : 'pointer',
                                                            color: deletingAttachmentId === att.id ? '#9ca3af' : '#dc2626',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 'bold',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px'
                                                        }}>
                                                        {deletingAttachmentId === att.id ? (
                                                            <span>Deleting...</span>
                                                        ) : (
                                                            <><Trash2 size={12} /> Delete</>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div
                                    tabIndex={0}
                                    onPaste={handlePaste}
                                    style={{
                                        border: '2px dashed var(--border-color)',
                                        padding: '2rem',
                                        borderRadius: '0.5rem',
                                        textAlign: 'center',
                                        background: files.length > 0 ? 'rgba(16, 185, 129, 0.05)' : 'transparent',
                                        borderColor: files.length > 0 ? '#10b981' : 'var(--border-color)',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        outline: 'none'
                                    }}
                                >
                                    <input
                                        id="fileInput"
                                        type="file"
                                        multiple
                                        onChange={handleFilesChange}
                                        style={{ display: 'none' }}
                                    />
                                    <Paperclip size={32} color="var(--text-muted)" />
                                    <span style={{ color: 'var(--text-muted)' }}>
                                        <button
                                            type="button"
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: 'var(--primary)',
                                                textDecoration: 'underline',
                                                cursor: 'pointer',
                                                fontWeight: 'bold',
                                                padding: 0
                                            }}
                                            onClick={() => document.getElementById('fileInput').click()}
                                        >
                                            Click to Browse
                                        </button>
                                        {' '}or <strong>Paste (Ctrl+V)</strong> here
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        Supported: Images, Videos, PDF, Word, etc.
                                    </span>
                                </div>

                                {/* File List */}
                                {files.length > 0 && (
                                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {files.map((file, idx) => (
                                            <div key={idx} style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '0.25rem'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    {file.type.startsWith('image/') ? <ImageIcon size={16} /> :
                                                        file.type.startsWith('video/') ? <Video size={16} /> : <FileText size={16} />}
                                                    <span style={{ fontSize: '0.9rem' }}>{file.name}</span>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({(file.size / 1024).toFixed(1)} KB)</span>
                                                </div>
                                                <button type="button" onClick={() => removeFile(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" className="btn" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? 'Saving...' : (editingId ? 'Update Issue' : 'Create Issue')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {viewBug && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 100, backdropFilter: 'blur(4px)'
                }} onClick={(e) => { if (e.target === e.currentTarget) setViewBug(null); }}>
                    <div className="glass card" style={{ width: '800px', maxWidth: '95%', background: '#1e293b', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{viewBug.title}</h2>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                    #{viewBug.id} • {viewBug.project_name || 'No Project'} • Reported by User #{viewBug.reporter_id}
                                </div>
                            </div>
                            <button className="btn" onClick={() => setViewBug(null)}><X size={20} /></button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div>
                                    <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)' }}>Description</h4>
                                    <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{viewBug.description || 'No description provided.'}</p>
                                </div>

                                <div>
                                    <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)' }}>Steps to Reproduce</h4>
                                    <p style={{ whiteSpace: 'pre-wrap', margin: 0, background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '0.5rem' }}>
                                        {viewBug.steps_to_reproduce || 'No steps provided.'}
                                    </p>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)' }}>Expected Result</h4>
                                        <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{viewBug.expected_result || '-'}</p>
                                    </div>
                                    <div>
                                        <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)' }}>Actual Result</h4>
                                        <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{viewBug.actual_result || '-'}</p>
                                    </div>
                                </div>

                                {(viewBug.attachments?.length > 0 || viewBug.screenshot) && (
                                    <div>
                                        <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)' }}>Attachments</h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
                                            {viewBug.attachments?.map(att => (
                                                <div key={att.id} style={{ border: '1px solid var(--border-color)', borderRadius: '0.5rem', overflow: 'hidden', position: 'relative' }}>
                                                    {att.file_type?.startsWith('image/') ? (
                                                        <img
                                                            src={att.file_url}
                                                            alt={att.file_name}
                                                            style={{ width: '100%', height: '100px', objectFit: 'cover', cursor: 'zoom-in' }}
                                                            onClick={() => setZoomedImage(att.file_url)}
                                                        />
                                                    ) : att.file_type?.startsWith('video/') ? (
                                                        <video src={att.file_url} controls style={{ width: '100%', height: '100px', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div style={{ height: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                                                            <FileText size={32} />
                                                        </div>
                                                    )}
                                                    <div style={{ padding: '0.5rem', fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', background: '#1e293b' }}>
                                                        <a href={att.file_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                            <ExternalLink size={12} /> {att.file_name || 'Download'}
                                                        </a>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!viewBug.attachments || viewBug.attachments.length === 0) && viewBug.screenshot && (
                                                <div style={{ border: '1px solid var(--border-color)', borderRadius: '0.5rem', overflow: 'hidden' }}>
                                                    <img
                                                        src={viewBug.screenshot}
                                                        alt="Attachment"
                                                        style={{ width: '100%', height: '100px', objectFit: 'cover', cursor: 'zoom-in' }}
                                                        onClick={() => setZoomedImage(viewBug.screenshot)}
                                                    />
                                                    <div style={{ padding: '0.5rem', fontSize: '0.75rem' }}>
                                                        <a href={viewBug.screenshot} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>Legacy Image</a>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div className="card" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Status</label>
                                        <span className="badge" style={{ background: 'var(--primary)', color: 'white' }}>{viewBug.status}</span>
                                    </div>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Priority</label>
                                        <span className={`badge ${PRIORITY_COLORS[viewBug.priority] || 'badge-low'}`}>{viewBug.priority}</span>
                                    </div>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Severity</label>
                                        <span>{viewBug.severity || 'Minor'}</span>
                                    </div>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Assignee</label>
                                        {viewBug.assignee_name ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <img src={viewBug.assignee_avatar} alt="" className="avatar" />
                                                <span>{viewBug.assignee_name}</span>
                                            </div>
                                        ) : <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}
                                    </div>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Reporter</label>
                                        <span style={{ fontSize: '0.9rem' }}>{viewBug.reporter_name || `User #${viewBug.reporter_id}`}</span>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Environment</label>
                                        <span>{viewBug.environment || 'Not specified'}</span>
                                    </div>
                                    <div style={{ marginTop: '1rem' }}>
                                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Module</label>
                                        <span>{viewBug.module || 'General'}</span>
                                    </div>
                                </div>

                                <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => { handleEdit(viewBug); setViewBug(null); }}>
                                    <Edit size={16} /> Edit Issue
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="glass card table-container">
                <table>
                    <thead>
                        <tr>
                            <th style={{ width: '60px' }}>#ID</th>
                            <th>Title / Project</th>
                            <th style={{ width: '150px' }}>Status</th>
                            <th style={{ width: '120px' }}>Priority</th>
                            <th>Assignee</th>
                            <th>Reporter</th>
                            <th>Attachment</th>
                            <th style={{ width: '180px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bugs.filter(b => {
                            if (filterModule && b.module !== filterModule) return false;
                            if (filterAssignee && b.assignee_id !== filterAssignee) return false;
                            return true;
                        }).map(bug => (
                            <tr key={bug.id}>
                                <td style={{ color: 'var(--text-muted)' }}>#{bug.id}</td>
                                <td>
                                    <div style={{ fontWeight: 500 }}>{bug.title}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        {bug.project_key ? <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{bug.project_key}</span> : 'No Project'}
                                        {' • '}{bug.created_at?.split('T')[0]}
                                    </div>
                                </td>
                                <td>
                                    <select
                                        value={bug.status}
                                        onChange={(e) => handleStatusChange(bug.id, e.target.value)}
                                        style={{ padding: '0.25rem', fontSize: '0.85rem', width: 'auto' }}
                                    >
                                        {STATUS_OPTS.map(s => <option key={s}>{s}</option>)}
                                    </select>
                                </td>
                                <td>
                                    <span className={`badge ${PRIORITY_COLORS[bug.priority] || 'badge-low'}`}>
                                        {bug.priority}
                                    </span>
                                </td>
                                <td>
                                    {bug.assignee_name ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <img src={bug.assignee_avatar} alt="" className="avatar" />
                                            <span style={{ fontSize: '0.9rem' }}>{bug.assignee_name}</span>
                                        </div>
                                    ) : (
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Unassigned</span>
                                    )}
                                </td>
                                <td>
                                    <span style={{ fontSize: '0.9rem' }}>{bug.reporter_name || '-'}</span>
                                </td>
                                <td>
                                    {bug.attachments && bug.attachments.length > 0 ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                            <Paperclip size={16} /> {bug.attachments.length}
                                        </div>
                                    ) : bug.screenshot ? (
                                        <a href={bug.screenshot} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.9rem' }}>
                                            <ImageIcon size={16} /> View
                                        </a>
                                    ) : '-'}
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button className="btn" style={{ padding: '0.25rem 0.5rem' }} onClick={() => setViewBug(bug)} title="View Details">
                                            <Eye size={16} />
                                        </button>
                                        <button className="btn" style={{ padding: '0.25rem 0.5rem' }} onClick={() => handleEdit(bug)} title="Edit">
                                            <Edit size={16} />
                                        </button>
                                        {can('can_delete_bug') && (
                                            <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem' }} onClick={() => handleDelete(bug.id)}>
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {bugs.length === 0 && (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                    No bugs found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>


            {
                zoomedImage && (
                    <div
                        style={{
                            position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.9)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out'
                        }}
                        onClick={() => setZoomedImage(null)}
                    >
                        <img
                            src={zoomedImage}
                            alt="Full Screen"
                            style={{ maxWidth: '95vw', maxHeight: '95vh', objectFit: 'contain', boxShadow: '0 0 20px rgba(0,0,0,0.5)' }}
                        />
                        <button
                            style={{
                                position: 'absolute', top: '2rem', right: '2rem', background: 'white', color: 'black',
                                border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                            }}
                        >
                            <X size={24} />
                        </button>
                    </div>
                )
            }
        </div >
    )
}
