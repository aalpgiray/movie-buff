-- Movie Buff Database Schema
-- Supabase PostgreSQL with Row Level Security

-- User watchlist movies
CREATE TABLE IF NOT EXISTS user_movies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  imdb_id TEXT NOT NULL,
  title TEXT NOT NULL,
  year TEXT,
  poster TEXT,
  type TEXT DEFAULT 'movie',
  reason TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 10),
  comment TEXT,
  is_seen BOOLEAN DEFAULT FALSE,
  is_recommendation BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, imdb_id)
);

-- User categories for organizing watchlist
CREATE TABLE IF NOT EXISTS user_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Category assignments (many-to-many between categories and movies)
CREATE TABLE IF NOT EXISTS category_movies (
  category_id UUID REFERENCES user_categories(id) ON DELETE CASCADE,
  imdb_id TEXT NOT NULL,
  PRIMARY KEY (category_id, imdb_id)
);

-- Dismissed recommendations (to prevent re-suggesting)
CREATE TABLE IF NOT EXISTS dismissed_recommendations (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  imdb_id TEXT NOT NULL,
  dismissed_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, imdb_id)
);

-- Enable Row Level Security on all tables
ALTER TABLE user_movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE dismissed_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_movies
DROP POLICY IF EXISTS "users_select_own_movies" ON user_movies;
CREATE POLICY "users_select_own_movies" ON user_movies 
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_insert_own_movies" ON user_movies;
CREATE POLICY "users_insert_own_movies" ON user_movies 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_update_own_movies" ON user_movies;
CREATE POLICY "users_update_own_movies" ON user_movies 
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_delete_own_movies" ON user_movies;
CREATE POLICY "users_delete_own_movies" ON user_movies 
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_categories
DROP POLICY IF EXISTS "users_select_own_categories" ON user_categories;
CREATE POLICY "users_select_own_categories" ON user_categories 
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_insert_own_categories" ON user_categories;
CREATE POLICY "users_insert_own_categories" ON user_categories 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_update_own_categories" ON user_categories;
CREATE POLICY "users_update_own_categories" ON user_categories 
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_delete_own_categories" ON user_categories;
CREATE POLICY "users_delete_own_categories" ON user_categories 
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for category_movies (via category ownership)
DROP POLICY IF EXISTS "users_manage_category_movies" ON category_movies;
CREATE POLICY "users_manage_category_movies" ON category_movies 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_categories WHERE id = category_id AND user_id = auth.uid())
  );

-- RLS Policies for dismissed_recommendations
DROP POLICY IF EXISTS "users_select_own_dismissed" ON dismissed_recommendations;
CREATE POLICY "users_select_own_dismissed" ON dismissed_recommendations 
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_insert_own_dismissed" ON dismissed_recommendations;
CREATE POLICY "users_insert_own_dismissed" ON dismissed_recommendations 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_delete_own_dismissed" ON dismissed_recommendations;
CREATE POLICY "users_delete_own_dismissed" ON dismissed_recommendations 
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_movies_user_id ON user_movies(user_id);
CREATE INDEX IF NOT EXISTS idx_user_movies_is_seen ON user_movies(user_id, is_seen);
CREATE INDEX IF NOT EXISTS idx_user_movies_is_recommendation ON user_movies(user_id, is_recommendation);
CREATE INDEX IF NOT EXISTS idx_user_categories_user_id ON user_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_dismissed_recommendations_user_id ON dismissed_recommendations(user_id);
