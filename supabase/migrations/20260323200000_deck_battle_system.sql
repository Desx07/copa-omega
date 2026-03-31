-- ============================================================================
-- Deck Battle (3v3) System
-- Cada blader arma un deck de 3 beyblades y reta a otro blader
-- Se juegan 3 rounds, cada uno con un bey del deck
-- ============================================================================

-- =========================
-- Table: player_decks
-- =========================
create table if not exists public.player_decks (
  id uuid default gen_random_uuid() primary key,
  player_id uuid not null references public.players(id) on delete cascade,

  -- Slot 1
  slot1_blade text not null,
  slot1_ratchet text not null,
  slot1_bit text not null,

  -- Slot 2
  slot2_blade text not null,
  slot2_ratchet text not null,
  slot2_bit text not null,

  -- Slot 3
  slot3_blade text not null,
  slot3_ratchet text not null,
  slot3_bit text not null,

  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,

  -- Un solo deck por jugador
  constraint player_decks_player_unique unique (player_id)
);

-- RLS
alter table public.player_decks enable row level security;

-- Todos pueden leer decks (para ver el deck del rival en batalla)
create policy "player_decks_select" on public.player_decks
  for select using (true);

-- Solo el dueno puede insertar su deck
create policy "player_decks_insert" on public.player_decks
  for insert with check (auth.uid() = player_id);

-- Solo el dueno puede actualizar su deck
create policy "player_decks_update" on public.player_decks
  for update using (auth.uid() = player_id);

-- Solo el dueno puede eliminar su deck
create policy "player_decks_delete" on public.player_decks
  for delete using (auth.uid() = player_id);


-- =========================
-- Table: deck_battles
-- =========================
create table if not exists public.deck_battles (
  id uuid default gen_random_uuid() primary key,
  challenger_id uuid not null references public.players(id) on delete cascade,
  opponent_id uuid not null references public.players(id) on delete cascade,
  omega_coins_bet int not null default 0 check (omega_coins_bet >= 0 and omega_coins_bet <= 10),

  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')),

  winner_id uuid references public.players(id),

  -- Rounds: cada round tiene un ganador (null = no jugado aun)
  round1_winner uuid references public.players(id),
  round2_winner uuid references public.players(id),
  round3_winner uuid references public.players(id),

  -- Snapshot de los decks al momento de la batalla (para historial)
  challenger_deck jsonb,
  opponent_deck jsonb,

  created_at timestamptz default now() not null,

  constraint deck_battles_no_self check (challenger_id != opponent_id)
);

-- RLS
alter table public.deck_battles enable row level security;

-- Todos pueden leer batallas de deck
create policy "deck_battles_select" on public.deck_battles
  for select using (true);

-- Cualquier jugador autenticado puede crear un reto
create policy "deck_battles_insert" on public.deck_battles
  for insert with check (auth.uid() = challenger_id);

-- Solo participantes y admins pueden actualizar (aceptar, resolver rounds)
create policy "deck_battles_update" on public.deck_battles
  for update using (
    auth.uid() = challenger_id
    or auth.uid() = opponent_id
    or exists (
      select 1 from public.players
      where id = auth.uid() and (is_admin = true or is_judge = true)
    )
  );

-- Indices
create index if not exists idx_deck_battles_challenger on public.deck_battles(challenger_id);
create index if not exists idx_deck_battles_opponent on public.deck_battles(opponent_id);
create index if not exists idx_deck_battles_status on public.deck_battles(status);
