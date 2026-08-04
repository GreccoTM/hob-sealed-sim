create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text,
  created_at timestamptz not null default now()
);

create table sealed_pools (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  set_code text not null default 'HOB',
  cards jsonb not null,
  created_at timestamptz not null default now()
);

create table decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  pool_id uuid references sealed_pools (id) on delete set null,
  name text not null default 'Meu deck',
  maindeck jsonb not null,
  sideboard jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table match_history (
  id uuid primary key default gen_random_uuid(),
  room_code text not null,
  player1_id uuid not null references auth.users (id) on delete cascade,
  player2_id uuid references auth.users (id) on delete cascade,
  winner_id uuid references auth.users (id) on delete set null,
  summary jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create index sealed_pools_user_id_idx on sealed_pools (user_id);
create index decks_user_id_idx on decks (user_id);
create index decks_pool_id_idx on decks (pool_id);
create index match_history_player1_id_idx on match_history (player1_id);
create index match_history_player2_id_idx on match_history (player2_id);

alter table profiles enable row level security;
alter table sealed_pools enable row level security;
alter table decks enable row level security;
alter table match_history enable row level security;

create policy "profiles: owner can read" on profiles
  for select using (auth.uid() = id);
create policy "profiles: owner can insert" on profiles
  for insert with check (auth.uid() = id);
create policy "profiles: owner can update" on profiles
  for update using (auth.uid() = id);

create policy "sealed_pools: owner full access" on sealed_pools
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "decks: owner full access" on decks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "match_history: participants can read" on match_history
  for select using (auth.uid() = player1_id or auth.uid() = player2_id);
create policy "match_history: player1 can insert" on match_history
  for insert with check (auth.uid() = player1_id);
create policy "match_history: participants can update" on match_history
  for update using (auth.uid() = player1_id or auth.uid() = player2_id);
