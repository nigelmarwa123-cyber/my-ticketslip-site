-- Create custom types
CREATE TYPE ticket_status AS ENUM ('pending', 'won', 'lost');
CREATE TYPE reaction_type AS ENUM ('fire', 'risky');

-- Profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  avatar_color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tickets table
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poster_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  bookmaker TEXT,
  note TEXT,
  image_url TEXT NOT NULL,
  total_odds NUMERIC NOT NULL,
  kickoff_at TIMESTAMPTZ NOT NULL,
  status ticket_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  locked BOOLEAN DEFAULT true
);

-- Follows table
CREATE TABLE follows (
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

-- Reactions table
CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type reaction_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (ticket_id, user_id, type)
);

-- Flags table
CREATE TABLE flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (ticket_id, user_id)
);

-- Comments table
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Set up Row Level Security (RLS)

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);

-- Tickets
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tickets are viewable by everyone." ON tickets FOR SELECT USING (true);
CREATE POLICY "Users can insert their own tickets." ON tickets FOR INSERT WITH CHECK (auth.uid() = poster_id);
CREATE POLICY "Users can update their own tickets." ON tickets FOR UPDATE USING (auth.uid() = poster_id);

-- Follows
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Follows are viewable by everyone." ON follows FOR SELECT USING (true);
CREATE POLICY "Users can insert their own follows." ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can delete their own follows." ON follows FOR DELETE USING (auth.uid() = follower_id);

-- Reactions
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reactions are viewable by everyone." ON reactions FOR SELECT USING (true);
CREATE POLICY "Users can insert their own reactions." ON reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reactions." ON reactions FOR DELETE USING (auth.uid() = user_id);

-- Flags
ALTER TABLE flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Flags are viewable by everyone." ON flags FOR SELECT USING (true);
CREATE POLICY "Users can insert their own flags." ON flags FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own flags." ON flags FOR DELETE USING (auth.uid() = user_id);

-- Comments
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments are viewable by everyone." ON comments FOR SELECT USING (true);
CREATE POLICY "Users can insert their own comments." ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments." ON comments FOR DELETE USING (auth.uid() = user_id);

-- Set up Storage for ticket images (if not already set via dashboard)
-- Note: You may need to create the 'tickets' bucket manually in Supabase Storage dashboard
-- INSERT INTO storage.buckets (id, name, public) VALUES ('tickets', 'tickets', true);
-- CREATE POLICY "Ticket images are viewable by everyone." ON storage.objects FOR SELECT USING (bucket_id = 'tickets');
-- CREATE POLICY "Users can upload ticket images." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'tickets' AND auth.uid() = owner);

-- Bet Log Entries (Private personal bankroll tracker)
CREATE TYPE bet_outcome AS ENUM ('pending', 'won', 'lost');

CREATE TABLE bet_log_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  stake_amount NUMERIC NOT NULL,
  outcome bet_outcome NOT NULL DEFAULT 'pending',
  return_amount NUMERIC,
  note TEXT,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for complete privacy
ALTER TABLE bet_log_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only read and write their own bet log entries" ON bet_log_entries FOR ALL USING (auth.uid() = user_id);
