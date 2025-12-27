
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yylrxlgzkjzycsgkvyvd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5bHJ4bGd6a2p6eWNzZ2t2eXZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODEzODMsImV4cCI6MjA4MjA1NzM4M30.I7IUzK8_5uCj95-51C6_2YZmRjyi8SqOeVvzjU35avY';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);


async function checkSync() {
    console.log("Checking Supabase connection...");

    // 0. Try Anon Read
    const { data: anonData, error: anonError } = await supabase.from('bugs').select('*').limit(1);
    if (anonError) {
        console.log("Anon read not allowed or error:", anonError.message);
    } else {
        console.log("Anon read successful (Warning: RLS might be too open if this is private data). Count:", anonData.length);
    }

    // 1. Login
    let user = null;
    const email = 'patelpraveen972@gmail.com';
    const password = '123456';

    console.log(`Attempting login with ${email}...`);
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (authError) {
        console.error("Login failed:", authError.message);
        console.log("Attempting to SIGN UP a new test user...");
        const newEmail = `testsync_${Date.now()}@example.com`;
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: newEmail,
            password: 'password123'
        });

        if (signUpError) {
            console.error("Sign up also failed:", signUpError.message);
            return;
        }
        console.log("Sign up successful! User:", signUpData.user ? signUpData.user.id : "No user data returned (maybe email confirmation needed?)");
        user = signUpData.user;

        if (!user) {
            console.log("Wait, if email confirmation is on, we can't proceed directly.");
            return;
        }
    } else {
        console.log("Login successful. User ID:", authData.user.id);
        user = authData.user;
    }

    // 3. Create a Bug
    const testBug = {
        title: "SYNC_CHECK_" + Date.now(),
        description: "Automated sync check",
        priority: "Low",
        status: "Open",
        // reporter_id: user.id // Try with and without explicit reporter_id
    };

    console.log("Attempting to insert bug:", testBug);
    const { data: insertData, error: insertError } = await supabase
        .from('bugs')
        .insert([testBug]) // Let RLS handle reporter_id if set up, or trigger error
        .select();

    if (insertError) {
        console.error("Insert failed:", insertError.message);
        // Retry with reporter_id explicit if it helps?
        console.log("Retrying with explicit reporter_id...");
        const { data: retryData, error: retryError } = await supabase
            .from('bugs')
            .insert([{ ...testBug, reporter_id: user.id }]) // Assuming reporter_id is UUID now per migration
            .select();

        if (retryError) {
            console.error("Retry failed:", retryError.message);
        } else {
            console.log("Retry Insert successful. New Bug:", retryData);
            await cleanup(retryData[0].id);
        }

    } else {
        console.log("Insert successful. New Bug:", insertData);
        await cleanup(insertData[0].id);
    }
}

async function cleanup(id) {
    // 5. Delete
    console.log("Cleaning up ID:", id);
    const { error: deleteError } = await supabase
        .from('bugs')
        .delete()
        .eq('id', id);

    if (deleteError) console.error("Cleanup delete failed:", deleteError.message);
    else console.log("Cleanup delete successful.");
}


checkSync();
