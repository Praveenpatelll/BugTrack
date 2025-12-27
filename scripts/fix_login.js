
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yylrxlgzkjzycsgkvyvd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5bHJ4bGd6a2p6eWNzZ2t2eXZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODEzODMsImV4cCI6MjA4MjA1NzM4M30.I7IUzK8_5uCj95-51C6_2YZmRjyi8SqOeVvzjU35avY';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fixLogin() {
    const email = 'demo@example.com';
    const password = 'demo123456';

    console.log(`Creating/Checking demo user ${email}...`);

    // 1. Try to Login first
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (!signInError) {
        console.log("Demo user already exists. You can login with:", email, password);
        return;
    }

    // 2. Sign Up if login failed
    console.log("Creating new demo user...");
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
    });

    if (signUpError) {
        console.error("Failed to create demo user:", signUpError.message);
    } else {
        console.log("SUCCESS: Created demo user.");
        console.log("Email:", email);
        console.log("Password:", password);

        // Also ensure profile exists in public.users
        if (signUpData.user) {
            const { error: profileError } = await supabase.from('users').insert({
                id: signUpData.user.id,
                name: 'Demo User',
                email: email,
                avatar: `https://ui-avatars.com/api/?name=Demo&background=random`
            });
            if (profileError) console.log("Note: Profile might already exist or error:", profileError.message);
            else console.log("Profile created.");
        }
    }
}

fixLogin();
