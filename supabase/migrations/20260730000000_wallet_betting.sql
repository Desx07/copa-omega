-- ════════════════════════════════════════════════════════════════════════════
-- Apuestas con Omega Coins (wallet betting) — modelo PARIMUTUEL
-- Ver openspec/changes/wallet-betting. NO se aplica en automático: la corre Ariel.
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists bets (
  id uuid primary key default gen_random_uuid(),
  bettor_id uuid not null references players(id) on delete cascade,
  -- exactamente una referencia (como predictions): partida 1v1 o reto
  match_id uuid references matches(id) on delete cascade,
  challenge_id uuid references challenges(id) on delete cascade,
  predicted_winner_id uuid not null references players(id),
  stake int not null check (stake > 0),
  payout int not null default 0,
  status text not null default 'open'
    check (status in ('open', 'won', 'lost', 'refunded')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  -- exactamente una referencia (partida 1v1 o reto)
  constraint bets_one_ref check (
    (match_id is not null)::int + (challenge_id is not null)::int = 1
  )
);

-- Una apuesta por jugador por partida/reto. Índices PARCIALES: solo aplican cuando la
-- referencia no es NULL (así un jugador puede tener varias apuestas a distintos retos,
-- cada una con match_id NULL, sin que colisionen entre sí).
create unique index if not exists bets_uniq_match on bets (bettor_id, match_id) where match_id is not null;
create unique index if not exists bets_uniq_challenge on bets (bettor_id, challenge_id) where challenge_id is not null;

create index if not exists bets_match_idx on bets (match_id) where status = 'open';
create index if not exists bets_challenge_idx on bets (challenge_id) where status = 'open';
create index if not exists bets_bettor_idx on bets (bettor_id);

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table bets enable row level security;

-- el bettor ve sus apuestas
create policy bets_select_own on bets
  for select using (bettor_id = auth.uid());
-- el bettor inserta apuestas a su nombre (la validación de negocio va en la API)
create policy bets_insert_own on bets
  for insert with check (bettor_id = auth.uid());
-- las resoluciones usan las RPCs SECURITY DEFINER (bypass RLS). No hay update/delete por RLS.

-- ── Resolución PARIMUTUEL (atómica + idempotente) ────────────────────────────
-- Reparte el pool total entre los que acertaron el ganador, proporcional a su stake.
-- Los perdedores pierden el stake. Si nadie acertó, o todos apostaron al ganador
-- (no hay lado perdedor que financie), se reembolsa todo.
-- Idempotente: solo toca apuestas 'open'; una segunda corrida no encuentra open → no paga.
create or replace function resolve_bets_for_match(
  p_match_id uuid,
  p_challenge_id uuid,
  p_winner_id uuid
) returns void as $$
declare
  v_pool int;
  v_winners_stake int;
  b record;
  v_share int;
begin
  select coalesce(sum(stake), 0) into v_pool
    from bets
   where status = 'open'
     and (match_id = p_match_id
          or (p_challenge_id is not null and challenge_id = p_challenge_id));

  if v_pool = 0 then
    return; -- no hay apuestas abiertas
  end if;

  select coalesce(sum(stake), 0) into v_winners_stake
    from bets
   where status = 'open'
     and predicted_winner_id = p_winner_id
     and (match_id = p_match_id
          or (p_challenge_id is not null and challenge_id = p_challenge_id));

  -- Parimutuel necesita los dos lados. Nadie al ganador, o todos al ganador → reembolso.
  if v_winners_stake = 0 or v_winners_stake = v_pool then
    for b in
      select id, bettor_id, stake from bets
       where status = 'open'
         and (match_id = p_match_id
              or (p_challenge_id is not null and challenge_id = p_challenge_id))
    loop
      update players set omega_coins = omega_coins + b.stake where id = b.bettor_id;
      update bets set status = 'refunded', payout = b.stake, resolved_at = now() where id = b.id;
    end loop;
    return;
  end if;

  for b in
    select id, bettor_id, stake, predicted_winner_id from bets
     where status = 'open'
       and (match_id = p_match_id
            or (p_challenge_id is not null and challenge_id = p_challenge_id))
  loop
    if b.predicted_winner_id = p_winner_id then
      -- reparto proporcional del pool total (floor → la fracción sobrante se quema, anti-inflación)
      v_share := floor(b.stake::numeric * v_pool / v_winners_stake);
      update players set omega_coins = omega_coins + v_share where id = b.bettor_id;
      update bets set status = 'won', payout = v_share, resolved_at = now() where id = b.id;
    else
      update bets set status = 'lost', payout = 0, resolved_at = now() where id = b.id;
    end if;
  end loop;
end;
$$ language plpgsql security definer;

-- ── Reembolso (partida cancelada/borrada) ────────────────────────────────────
create or replace function refund_bets_for_match(
  p_match_id uuid,
  p_challenge_id uuid
) returns void as $$
declare b record;
begin
  for b in
    select id, bettor_id, stake from bets
     where status = 'open'
       and (match_id = p_match_id
            or (p_challenge_id is not null and challenge_id = p_challenge_id))
  loop
    update players set omega_coins = omega_coins + b.stake where id = b.bettor_id;
    update bets set status = 'refunded', payout = b.stake, resolved_at = now() where id = b.id;
  end loop;
end;
$$ language plpgsql security definer;
