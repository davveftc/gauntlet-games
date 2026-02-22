-- Gauntlet Database Schema for Supabase

-- ============ USERS ============
create table if not exists users (
  uid uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Player',
  email text,
  avatar text not null default 'default',
  level integer not null default 1,
  xp integer not null default 0,
  join_date date not null default current_date,
  total_games_played integer not null default 0,
  total_wins integer not null default 0,
  gauntlet_survivals integer not null default 0,
  unlocks jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- ============ STREAKS ============
create table if not exists streaks (
  id bigint generated always as identity primary key,
  uid uuid not null references users(uid) on delete cascade,
  game_id text not null, -- 'wordless', 'songless', 'moreless', 'clueless', 'spellingbee', 'global', 'gauntlet'
  current integer not null default 0,
  longest integer not null default 0,
  last_played_date date,
  unique(uid, game_id)
);

-- ============ GAME HISTORY ============
create table if not exists game_history (
  id bigint generated always as identity primary key,
  uid uuid not null references users(uid) on delete cascade,
  game_id text not null,
  date date not null,
  result text not null, -- 'win', 'loss', 'in-progress', 'not-started'
  guesses jsonb not null default '[]'::jsonb,
  started_at bigint,
  completed_at bigint,
  score integer,
  created_at timestamptz not null default now(),
  unique(uid, game_id, date)
);

-- ============ DAILY CONTENT ============
create table if not exists daily_content (
  id bigint generated always as identity primary key,
  date date not null unique,
  wordless jsonb, -- { "word": "CRANE" }
  songless jsonb, -- { "songId": "abc123" }
  moreless jsonb, -- { "pairs": [...] }
  clueless jsonb, -- { "targetWord": "OCEAN" }
  spellingbee jsonb, -- { "words": [...] }
  created_at timestamptz not null default now()
);

-- ============ LEADERBOARD ENTRIES ============
create table if not exists leaderboard_entries (
  id bigint generated always as identity primary key,
  period text not null, -- 'daily', 'weekly', 'alltime'
  date date not null,
  uid uuid not null references users(uid) on delete cascade,
  display_name text not null,
  avatar text not null default 'default',
  score integer not null default 0,
  rank integer not null,
  created_at timestamptz not null default now()
);

-- ============ INDEXES ============
create index if not exists idx_streaks_uid on streaks(uid);
create index if not exists idx_game_history_uid_date on game_history(uid, date);
create index if not exists idx_game_history_uid_game_date on game_history(uid, game_id, date);
create index if not exists idx_daily_content_date on daily_content(date);
create index if not exists idx_leaderboard_period_date on leaderboard_entries(period, date);

-- ============ ROW LEVEL SECURITY ============
alter table users enable row level security;
alter table streaks enable row level security;
alter table game_history enable row level security;
alter table daily_content enable row level security;
alter table leaderboard_entries enable row level security;

-- Users can read/write their own data
create policy "Users can view own profile" on users
  for select using (auth.uid() = uid);
create policy "Users can update own profile" on users
  for update using (auth.uid() = uid);
create policy "Users can insert own profile" on users
  for insert with check (auth.uid() = uid);

-- Streaks: users can read/write their own
create policy "Users can view own streaks" on streaks
  for select using (auth.uid() = uid);
create policy "Users can update own streaks" on streaks
  for update using (auth.uid() = uid);
create policy "Users can insert own streaks" on streaks
  for insert with check (auth.uid() = uid);

-- Game history: users can read/write their own
create policy "Users can view own game history" on game_history
  for select using (auth.uid() = uid);
create policy "Users can insert own game history" on game_history
  for insert with check (auth.uid() = uid);
create policy "Users can update own game history" on game_history
  for update using (auth.uid() = uid);

-- Daily content: everyone can read, no one writes (admin via service role)
create policy "Anyone can read daily content" on daily_content
  for select using (true);

-- Leaderboard: everyone can read
create policy "Anyone can read leaderboard" on leaderboard_entries
  for select using (true);
