-- 1. Create Enums
CREATE TYPE shelf_type AS ENUM ('to_read', 'currently_reading', 'read', 'rereading', 'did_not_finish');
CREATE TYPE recommendation_status AS ENUM ('pending', 'dismissed', 'saved');

-- 2. Create Users Table (Public Profile)
CREATE TABLE users (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT,
  is_13_or_older BOOLEAN NOT NULL DEFAULT false,
  onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for Users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = user_id);

-- 3. Create Books Table
-- book_id is TEXT to natively support Google Books IDs (e.g. "zyTCAlFPjgYC")
CREATE TABLE books (
  book_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  cover_url TEXT,
  synopsis TEXT,
  genre_tags JSONB DEFAULT '[]'::jsonb,
  source TEXT NOT NULL DEFAULT 'api',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Books are universally readable, but only authenticated users can insert/update
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Books are publicly readable" ON books FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert books" ON books FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 4. Create UserBooks Table (The Shelf)
CREATE TABLE userbooks (
  userbook_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE NOT NULL,
  book_id TEXT REFERENCES books(book_id) ON DELETE CASCADE NOT NULL,
  shelf shelf_type NOT NULL,
  context_tags JSONB DEFAULT '{}'::jsonb,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, book_id) -- A user can only have one unique book on their shelf at a time
);

-- Enable RLS for UserBooks
ALTER TABLE userbooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own shelves" ON userbooks 
  FOR ALL USING (auth.uid() = user_id);

-- GIN Index for rapid tag searching by the recommendation engine
CREATE INDEX idx_userbooks_context_tags ON userbooks USING GIN (context_tags);

-- 5. Create Recommendations Table
CREATE TABLE recommendations (
  rec_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE NOT NULL,
  book_id TEXT REFERENCES books(book_id) ON DELETE CASCADE NOT NULL,
  match_reason TEXT NOT NULL,
  matched_tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  status recommendation_status NOT NULL DEFAULT 'pending',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their recommendations" ON recommendations 
  FOR ALL USING (auth.uid() = user_id);

-- 6. Create ShareLinks Table
CREATE TABLE share_links (
  link_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE NOT NULL,
  book_id TEXT REFERENCES books(book_id) ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their share links" ON share_links 
  FOR ALL USING (auth.uid() = user_id);
-- The public reading of a share link requires joining data, so we allow public read of the token
CREATE POLICY "Public can view valid share links" ON share_links 
  FOR SELECT USING (expires_at IS NULL OR expires_at > NOW());

-- 7. Auth Trigger: Automatically create public user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (user_id, email, is_13_or_older, onboarding_complete)
  VALUES (
    NEW.id,
    NEW.email,
    -- Extract the COPPA boolean from the raw_user_meta_data JSON we pass during signUp
    COALESCE((NEW.raw_user_meta_data->>'is_13_or_older')::boolean, false),
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
