
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { User, Camera, Save } from 'lucide-react';

export default function Profile() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState({ name: '', email: '', avatar: '' });
    const [avatarFile, setAvatarFile] = useState(null);

    useEffect(() => {
        if (user) {
            fetchProfile();
        }
    }, [user]);

    const fetchProfile = async () => {
        try {
            // Check if profile exists in public.users linked by email (legacy sync)
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('email', user.email)
                .single();

            if (data) {
                setProfile(data);
            } else {
                setProfile({ ...profile, email: user.email });
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
        }
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setProfile({ ...profile, avatar: URL.createObjectURL(file) });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            let avatarUrl = profile.avatar;

            if (avatarFile) {
                const fileExt = avatarFile.name.split('.').pop();
                const fileName = `avatar-${user.id}-${Math.random()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(fileName, avatarFile);

                if (uploadError) throw uploadError;

                const { data: publicUrlData } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(fileName);

                avatarUrl = publicUrlData.publicUrl;
            }

            // Upsert into public.users
            const payload = {
                email: user.email,
                name: profile.name,
                avatar: avatarUrl
            };

            if (profile.id) {
                payload.id = profile.id;
            }

            const { error } = await supabase
                .from('users')
                .upsert(payload, { onConflict: 'id' });

            if (error) throw error;

            alert('Profile updated successfully!');
        } catch (error) {
            alert('Error updating profile: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1 style={{ marginBottom: '2rem' }}>My Profile</h1>

            <div className="glass card" style={{ maxWidth: '600px' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                        <div style={{ position: 'relative', width: '100px', height: '100px' }}>
                            <img
                                src={profile.avatar || `https://ui-avatars.com/api/?name=${profile.name || 'User'}&background=random`}
                                alt="Profile"
                                style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-color)' }}
                            />
                            <label
                                htmlFor="avatar-upload"
                                style={{
                                    position: 'absolute', bottom: 0, right: 0,
                                    background: 'var(--primary)', color: 'white',
                                    padding: '0.4rem', borderRadius: '50%', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                            >
                                <Camera size={16} />
                            </label>
                            <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
                        </div>

                        <div>
                            <h3 style={{ margin: 0, marginBottom: '0.25rem' }}>{profile.name || 'Your Name'}</h3>
                            <p style={{ margin: 0, color: 'var(--text-muted)' }}>{user?.email}</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label>Full Name</label>
                            <input
                                required
                                value={profile.name}
                                onChange={e => setProfile({ ...profile, name: e.target.value })}
                                placeholder="e.g. Alice Developer"
                            />
                        </div>
                        <div>
                            <label>Email Address</label>
                            <input disabled value={user?.email || ''} style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Email cannot be changed.</p>
                        </div>
                    </div>

                    <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : <><Save size={18} /> Save Changes</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
