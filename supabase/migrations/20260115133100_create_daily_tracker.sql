/*
  # Daily Consistency Tracker Schema

  1. New Tables
    - `daily_completions`
      - `id` (uuid, primary key)
      - `date` (date, the date for this completion record)
      - `ai_knowledge` (boolean, whether AI knowledge was completed)
      - `codebasics` (boolean, whether Codebasics was completed)
      - `trading` (boolean, whether Trading was completed)
      - `created_at` (timestamptz, when record was created)
      - `updated_at` (timestamptz, when record was last updated)
  
  2. Security
    - Enable RLS on `daily_completions` table
    - Add policies for public access (since this is a personal tracker)
  
  3. Indexes
    - Add unique index on date to ensure one record per day
    - Add index on date for efficient querying
*/

CREATE TABLE IF NOT EXISTS daily_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date UNIQUE NOT NULL,
  ai_knowledge boolean DEFAULT false,
  codebasics boolean DEFAULT false,
  trading boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for efficient date queries
CREATE INDEX IF NOT EXISTS idx_daily_completions_date ON daily_completions(date DESC);

-- Enable RLS
ALTER TABLE daily_completions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read their completions (public app for personal use)
CREATE POLICY "Allow public read access"
  ON daily_completions
  FOR SELECT
  TO anon
  USING (true);

-- Allow anyone to insert completions
CREATE POLICY "Allow public insert access"
  ON daily_completions
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anyone to update completions
CREATE POLICY "Allow public update access"
  ON daily_completions
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_daily_completions_updated_at ON daily_completions;
CREATE TRIGGER update_daily_completions_updated_at
  BEFORE UPDATE ON daily_completions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();