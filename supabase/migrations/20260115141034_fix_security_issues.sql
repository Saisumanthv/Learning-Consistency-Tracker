/*
  # Fix Security Issues
  
  1. Security Fixes
    - Remove insecure RLS policies that use `USING (true)` and `WITH CHECK (true)`
    - Add proper authentication-based RLS policies
    - Fix function search_path security issue by setting SECURITY DEFINER and explicit search_path
    - Add user_id column to track ownership
  
  2. Changes
    - Add user_id column to daily_completions table
    - Drop old insecure policies
    - Create new restrictive policies that require authentication
    - Update function with stable search_path
  
  3. Important Notes
    - Users must be authenticated to access their data
    - Each user can only access their own completion records
    - Anonymous users will no longer have access
*/

-- Add user_id column to track ownership
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_completions' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE daily_completions ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create index for efficient user queries
CREATE INDEX IF NOT EXISTS idx_daily_completions_user_id ON daily_completions(user_id);

-- Drop old insecure policies
DROP POLICY IF EXISTS "Allow public read access" ON daily_completions;
DROP POLICY IF EXISTS "Allow public insert access" ON daily_completions;
DROP POLICY IF EXISTS "Allow public update access" ON daily_completions;

-- Create secure policies that require authentication

CREATE POLICY "Users can view own completions"
  ON daily_completions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own completions"
  ON daily_completions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own completions"
  ON daily_completions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own completions"
  ON daily_completions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Fix function search_path security issue
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;