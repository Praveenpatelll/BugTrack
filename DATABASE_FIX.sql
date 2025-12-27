-- SQL script to fix missing columns in bugs table
-- Run this in Supabase SQL Editor

-- Check if columns exist and add them if missing
DO $$ 
BEGIN
    -- Add actual_result column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'bugs' AND column_name = 'actual_result') THEN
        ALTER TABLE public.bugs ADD COLUMN actual_result text;
    END IF;
    
    -- Verify expected_result exists (it should from the original schema)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'bugs' AND column_name = 'expected_result') THEN
        ALTER TABLE public.bugs ADD COLUMN expected_result text;
    END IF;
    
    -- Verify steps_to_reproduce exists (it should from the original schema)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'bugs' AND column_name = 'steps_to_reproduce') THEN
        ALTER TABLE public.bugs ADD COLUMN steps_to_reproduce text;
    END IF;
END $$;

-- Verify the columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bugs' 
ORDER BY ordinal_position;
