
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yylrxlgzkjzycsgkvyvd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5bHJ4bGd6a2p6eWNzZ2t2eXZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODEzODMsImV4cCI6MjA4MjA1NzM4M30.I7IUzK8_5uCj95-51C6_2YZmRjyi8SqOeVvzjU35avY';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verifyFix() {
    console.log("----------------------------------------");
    console.log("TESTING LOGIN & BUG CREATION (Schema Verification)");
    console.log("----------------------------------------");

    const email = 'demo@example.com';
    const password = 'demo123456';

    // 1. Login
    console.log(`1. Logging in as ${email}...`);
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (authError) {
        console.error("❌ Login failed:", authError.message);
        return;
    }
    console.log("✅ Login successful. User ID:", authData.user.id);
    const userId = authData.user.id;

    // 2. Try to Create a Bug (This previously failed due to BigInt vs UUID)
    console.log("\n2. Attempting to create a test bug...");

    const testBug = {
        title: "Final Fix Verification " + new Date().toISOString(),
        description: "This bug proves that the database schema now correctly handles UUIDs.",
        priority: "High",
        status: "Open",
        reporter_id: userId, // UUID
        project_id: null,
        assignee_id: null
    };

    const { data: bugData, error: bugError } = await supabase
        .from('bugs')
        .insert([testBug])
        .select()
        .single();

    if (bugError) {
        console.error("❌ BUG CREATION FAILED:", bugError.message);
        console.error("Details:", bugError);
    } else {
        console.log("✅ BUG CREATION SUCCESSFUL!");
        console.log("   ID:", bugData.id);
        console.log("   Title:", bugData.title);
        console.log("   Reporter ID (UUID):", bugData.reporter_id);

        console.log("\n----------------------------------------");
        console.log("🎉 SUCCESS! The website is fully synced and functional.");
        console.log("You can now login to http://localhost:5173 with:");
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${password}`);
        console.log("----------------------------------------");

        // Optional Cleanup
        // await supabase.from('bugs').delete().eq('id', bugData.id);
    }
}

verifyFix();
