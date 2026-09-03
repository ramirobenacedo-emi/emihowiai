-- Tablero de implementaciones: clientes (tracks) + tarjetas.
-- Sin login: el acceso es por URL, las politicas permiten leer y escribir a cualquiera.

create extension if not exists pgcrypto;

create table if not exists public.clients (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  color        text not null default '#64748b',
  go_live_date date,
  created_at   timestamptz not null default now()
);

create table if not exists public.cards (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  client_id   uuid references public.clients(id) on delete set null,
  assignee    text,
  due_date    date,
  column_key  text not null default 'backlog'
              check (column_key in ('backlog', 'todo', 'doing', 'done')),
  position    double precision not null default 0,
  done_at     timestamptz,
  archived    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists cards_board_idx  on public.cards (archived, column_key, position);
create index if not exists cards_client_idx on public.cards (client_id);

-- Marca done_at al entrar a Done y lo limpia al salir. Vive en la base para que
-- valga siempre, sin depender de que la app se acuerde de setearlo.
create or replace function public.cards_touch()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  if new.column_key = 'done'
     and (tg_op = 'INSERT' or old.column_key is distinct from 'done') then
    new.done_at := now();
  elsif new.column_key <> 'done' then
    new.done_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists cards_touch on public.cards;
create trigger cards_touch
  before insert or update on public.cards
  for each row execute function public.cards_touch();

alter table public.clients enable row level security;
alter table public.cards   enable row level security;

-- Sin politica de delete a proposito: las tarjetas se archivan, no se borran.
drop policy if exists clients_read   on public.clients;
drop policy if exists clients_insert on public.clients;
drop policy if exists clients_update on public.clients;
create policy clients_read   on public.clients for select using (true);
create policy clients_insert on public.clients for insert with check (true);
create policy clients_update on public.clients for update using (true) with check (true);

drop policy if exists cards_read   on public.cards;
drop policy if exists cards_insert on public.cards;
drop policy if exists cards_update on public.cards;
create policy cards_read   on public.cards for select using (true);
create policy cards_insert on public.cards for insert with check (true);
create policy cards_update on public.cards for update using (true) with check (true);
