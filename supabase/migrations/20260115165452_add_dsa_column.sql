/*
  # Add DSA Column to Daily Completions

  1. Changes
    - Add `dsa` (boolean) column to the `daily_completions` table
    - Default value set to false

  2. Important Notes
    - This column tracks completion of Data Structures and Algorithms learning
    - All existing records will have dsa set to false by default
*/

-- Add dsa column to daily_completions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_completions' AND column_name = 'dsa'
  ) THEN
    ALTER TABLE daily_completions ADD COLUMN dsa boolean DEFAULT false;
  END IF;
END $$;