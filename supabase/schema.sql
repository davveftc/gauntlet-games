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

-- ============ FRIENDS ============
create table if not exists friends (
  id bigint generated always as identity primary key,
  uid uuid not null references users(uid) on delete cascade,
  friend_uid uuid not null references users(uid) on delete cascade,
  created_at timestamptz not null default now(),
  unique(uid, friend_uid)
);

-- ============ FRIEND REQUESTS ============
create table if not exists friend_requests (
  id bigint generated always as identity primary key,
  from_uid uuid not null references users(uid) on delete cascade,
  to_uid uuid not null references users(uid) on delete cascade,
  status text not null default 'pending', -- 'pending', 'accepted', 'rejected'
  created_at timestamptz not null default now(),
  unique(from_uid, to_uid)
);

-- ============ CHAINS ============
create table if not exists chains (
  id uuid primary key default gen_random_uuid(),
  date date not null default current_date,
  status text not null default 'in_progress', -- 'in_progress', 'completed', 'broken'
  current_link_index integer not null default 0,
  total_score integer not null default 0,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- ============ CHAIN LINKS ============
create table if not exists chain_links (
  id bigint generated always as identity primary key,
  chain_id uuid not null references chains(id) on delete cascade,
  link_index integer not null, -- 0-5 position in the chain
  uid uuid not null references users(uid) on delete cascade,
  game_id text not null, -- one of the 6 chain games (excludes wordless)
  result text not null default 'pending', -- 'pending', 'playing', 'win', 'loss'
  score integer not null default 0,
  started_at timestamptz,
  completed_at timestamptz,
  nominated_next_uid uuid references users(uid),
  unique(chain_id, link_index)
);

-- ============ NOTIFICATIONS ============
create table if not exists notifications (
  id bigint generated always as identity primary key,
  uid uuid not null references users(uid) on delete cascade,
  type text not null, -- 'chain_invite', 'chain_turn', 'chain_result', 'friend_request'
  title text not null,
  body text not null,
  data jsonb not null default '{}'::jsonb,
  read boolean not null default false,
  email_sent boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============ INDEXES ============
create index if not exists idx_streaks_uid on streaks(uid);
create index if not exists idx_game_history_uid_date on game_history(uid, date);
create index if not exists idx_game_history_uid_game_date on game_history(uid, game_id, date);
create index if not exists idx_daily_content_date on daily_content(date);
create index if not exists idx_leaderboard_period_date on leaderboard_entries(period, date);
create index if not exists idx_friends_uid on friends(uid);
create index if not exists idx_friends_friend_uid on friends(friend_uid);
create index if not exists idx_friend_requests_to on friend_requests(to_uid, status);
create index if not exists idx_chain_links_chain on chain_links(chain_id);
create index if not exists idx_chain_links_uid_date on chain_links(uid);
create index if not exists idx_chains_date on chains(date);
create index if not exists idx_notifications_uid on notifications(uid, read);

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

-- ============ RLS: FRIENDS ============
alter table friends enable row level security;
create policy "Users can view own friends" on friends
  for select using (auth.uid() = uid or auth.uid() = friend_uid);
create policy "Users can insert own friends" on friends
  for insert with check (auth.uid() = uid);
create policy "Users can delete own friends" on friends
  for delete using (auth.uid() = uid or auth.uid() = friend_uid);

-- ============ RLS: FRIEND REQUESTS ============
alter table friend_requests enable row level security;
create policy "Users can view own friend requests" on friend_requests
  for select using (auth.uid() = from_uid or auth.uid() = to_uid);
create policy "Users can send friend requests" on friend_requests
  for insert with check (auth.uid() = from_uid);
create policy "Users can update requests sent to them" on friend_requests
  for update using (auth.uid() = to_uid);

-- ============ RLS: CHAINS ============
alter table chains enable row level security;
create policy "Chain participants can view chains" on chains
  for select using (
    exists (select 1 from chain_links where chain_links.chain_id = chains.id and chain_links.uid = auth.uid())
  );
create policy "Authenticated users can create chains" on chains
  for insert with check (true);
create policy "Chain participants can update chains" on chains
  for update using (
    exists (select 1 from chain_links where chain_links.chain_id = chains.id and chain_links.uid = auth.uid())
  );

-- ============ RLS: CHAIN LINKS ============
alter table chain_links enable row level security;
create policy "Chain participants can view links" on chain_links
  for select using (
    exists (select 1 from chain_links cl where cl.chain_id = chain_links.chain_id and cl.uid = auth.uid())
  );
create policy "Authenticated users can insert links" on chain_links
  for insert with check (true);
create policy "Assigned player can update own link" on chain_links
  for update using (auth.uid() = uid);

-- ============ RLS: NOTIFICATIONS ============
alter table notifications enable row level security;
create policy "Users can view own notifications" on notifications
  for select using (auth.uid() = uid);
create policy "Authenticated users can insert notifications" on notifications
  for insert with check (true);
create policy "Users can update own notifications" on notifications
  for update using (auth.uid() = uid);
