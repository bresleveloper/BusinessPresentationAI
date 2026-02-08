-- Presentation Ratings Table
CREATE TABLE IF NOT EXISTS presentation_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  style TEXT CHECK (style IN ('80s', '2000s', '2020s')),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_presentation_ratings_user ON presentation_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_presentation_ratings_session ON presentation_ratings(session_id);
CREATE INDEX IF NOT EXISTS idx_presentation_ratings_style ON presentation_ratings(style);

-- Row Level Security
ALTER TABLE presentation_ratings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all ratings (for analytics)
CREATE POLICY "Anyone can view ratings"
  ON presentation_ratings FOR SELECT
  USING (true);

-- Policy: Users can insert their own ratings
CREATE POLICY "Users can insert own ratings"
  ON presentation_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own ratings
CREATE POLICY "Users can update own ratings"
  ON presentation_ratings FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own ratings
CREATE POLICY "Users can delete own ratings"
  ON presentation_ratings FOR DELETE
  USING (auth.uid() = user_id);
