
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (email) => {
        if (!email) {
            setProfile(null);
            return;
        }
        const { data } = await supabase.from('users').select('*').eq('email', email).single();
        setProfile(data);
    };

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user?.email) fetchProfile(session.user.email);
            setLoading(false);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user?.email) fetchProfile(session.user.email);
            else setProfile(null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signUp = async (email, password) => {
        const { data, error } = await supabase.auth.signUp({ email, password });

        if (!error && data.user) {
            // Create a user profile in the public.users table
            // IMPORTANT: Use the auth user's UUID as the primary key
            const userName = email.split('@')[0]; // Extract name from email
            const { data: profileData, error: profileError } = await supabase.from('users').insert({
                id: data.user.id, // Use the auth user's UUID
                name: userName,
                email: email,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random`
            }).select().single();

            if (profileError) {
                console.error('Error creating user profile:', profileError);
                // Return the profile error so the UI can show it
                return { data, error: new Error(`Auth successful but profile creation failed: ${profileError.message}`) };
            }

            console.log('User profile created successfully:', profileData);
        }

        return { data, error };
    };
    const signIn = (email, password) => supabase.auth.signInWithPassword({ email, password });
    const signOut = () => supabase.auth.signOut();
    const resetPassword = (email) => supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/update-password' });
    const updatePassword = (newPassword) => supabase.auth.updateUser({ password: newPassword });

    return (
        <AuthContext.Provider value={{ user, profile, signUp, signIn, signOut, resetPassword, updatePassword, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
