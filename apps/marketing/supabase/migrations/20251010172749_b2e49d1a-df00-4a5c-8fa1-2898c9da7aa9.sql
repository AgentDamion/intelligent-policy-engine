-- Add gamification fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS compliance_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS compliance_streak_best INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_compliance_date DATE;

-- Create achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Users can view their own achievements
CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own achievements
CREATE POLICY "Users can create own achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked_at ON user_achievements(unlocked_at DESC);