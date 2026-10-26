
create table if not exists public.profili (
  id uuid primary key references auth.users on delete cascade,
  email text unique not null,
  nome text,
  admin boolean not null default false,
  creato timestamptz not null default now()
);

create table if not exists public.inviti (
  email text primary key,
  nome text,
  admin boolean not null default false,
  permessi jsonb not null default '{}'::jsonb,
  usato boolean not null default false,
  creato timestamptz not null default now()
);

create table if not exists public.permessi (
  user_id uuid references public.profili on delete cascade,
  area text not null,
  livello text not null check (livello in ('vedi','modifica')),
  primary key (user_id, area)
);

create table if not exists public.dati (
  pacchetto text primary key,
  contenuto jsonb not null,
  aggiornato timestamptz not null default now()
);

create table if not exists public.stato (
  area text primary key,
  contenuto jsonb not null default '{}'::jsonb,
  aggiornato timestamptz not null default now(),
  aggiornato_da uuid
);

create table if not exists public.presenze (
  id text primary key,
  dati jsonb not null default '{}'::jsonb,
  aggiornato timestamptz not null default now(),
  aggiornato_da uuid
);

create table if not exists public.registro (
  id bigserial primary key,
  quando timestamptz not null default now(),
  chi uuid,
  email text,
  area text,
  cosa text
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select admin from profili where id = auth.uid()), false)
$$;

create or replace function public.livello(a text) returns text
language sql stable security definer set search_path = public as $$
  select case when (select admin from profili where id = auth.uid()) then 'modifica'
              else (select livello from permessi where user_id = auth.uid() and area = a) end
$$;

create or replace function public.puo_vedere(a text) returns boolean
language sql stable security definer set search_path = public as $$ select public.livello(a) is not null $$;

create or replace function public.puo_modificare(a text) returns boolean
language sql stable security definer set search_path = public as $$ select public.livello(a) = 'modifica' $$;

create or replace function public.vede_economia() returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1 from permessi where user_id = auth.uid()
      and area in ('s-bil','s-for','s-fon','s-pre','s-car','s-ric','s-ter','s-ev','s-cs'))
$$;

create or replace function public.solo_invitati() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from inviti where lower(email) = lower(new.email)) then
    raise exception 'Questa email non è stata invitata';
  end if;
  return new;
end $$;

create or replace function public.nuovo_utente() returns trigger
language plpgsql security definer set search_path = public as $$
declare inv record; k text; v text;
begin
  select * into inv from inviti where lower(email) = lower(new.email);
  insert into profili (id, email, nome, admin)
    values (new.id, lower(new.email), inv.nome, coalesce(inv.admin, false))
    on conflict (id) do nothing;
  if inv.permessi is not null then
    for k, v in select * from jsonb_each_text(inv.permessi) loop
      if v in ('vedi','modifica') then
        insert into permessi (user_id, area, livello) values (new.id, k, v)
          on conflict (user_id, area) do update set livello = excluded.livello;
      end if;
    end loop;
  end if;
  update inviti set usato = true where lower(email) = lower(new.email);
  insert into registro (chi, email, area, cosa) values (new.id, lower(new.email), null, 'si è registrato');
  return new;
end $$;

drop trigger if exists t_solo_invitati on auth.users;
create trigger t_solo_invitati before insert on auth.users for each row execute function public.solo_invitati();
drop trigger if exists t_nuovo_utente on auth.users;
create trigger t_nuovo_utente after insert on auth.users for each row execute function public.nuovo_utente();

create or replace function public.annota() returns trigger
language plpgsql security definer set search_path = public as $$
declare a text; c text;
begin
  if tg_table_name = 'stato' then a := new.area; c := 'ha modificato la scheda';
  elsif tg_table_name = 'presenze' then a := 's-map'; c := 'ha aggiornato il conteggio di ' || new.id;
  elsif tg_table_name = 'permessi' then a := new.area; c := 'ha cambiato i permessi (' || new.livello || ')';
  end if;
  insert into registro (chi, email, area, cosa)
    values (auth.uid(), (select email from profili where id = auth.uid()), a, c);
  return new;
end $$;

drop trigger if exists t_annota_stato on public.stato;
create trigger t_annota_stato after insert or update on public.stato for each row execute function public.annota();
drop trigger if exists t_annota_presenze on public.presenze;
create trigger t_annota_presenze after insert or update on public.presenze for each row execute function public.annota();
drop trigger if exists t_annota_permessi on public.permessi;
create trigger t_annota_permessi after insert or update on public.permessi for each row execute function public.annota();

alter table public.profili  enable row level security;
alter table public.inviti   enable row level security;
alter table public.permessi enable row level security;
alter table public.dati     enable row level security;
alter table public.stato    enable row level security;
alter table public.presenze enable row level security;
alter table public.registro enable row level security;

drop policy if exists p_profili_leggi on public.profili;
create policy p_profili_leggi on public.profili for select using (id = auth.uid() or public.is_admin());
drop policy if exists p_profili_admin on public.profili;
create policy p_profili_admin on public.profili for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists p_inviti_admin on public.inviti;
create policy p_inviti_admin on public.inviti for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists p_permessi_leggi on public.permessi;
create policy p_permessi_leggi on public.permessi for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists p_permessi_admin on public.permessi;
create policy p_permessi_admin on public.permessi for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists p_dati_leggi on public.dati;
create policy p_dati_leggi on public.dati for select using (
  (pacchetto = 'economia' and public.vede_economia()) or
  (pacchetto = 'censimento' and public.puo_vedere('s-cs')));
drop policy if exists p_dati_admin on public.dati;
create policy p_dati_admin on public.dati for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists p_stato_leggi on public.stato;
create policy p_stato_leggi on public.stato for select using (
  public.vede_economia() or (area = 's-map' and public.puo_vedere('s-map')));
drop policy if exists p_stato_scrivi on public.stato;
create policy p_stato_scrivi on public.stato for insert with check (public.puo_modificare(area));
drop policy if exists p_stato_aggiorna on public.stato;
create policy p_stato_aggiorna on public.stato for update using (public.puo_modificare(area)) with check (public.puo_modificare(area));

drop policy if exists p_presenze_leggi on public.presenze;
create policy p_presenze_leggi on public.presenze for select using (public.puo_vedere('s-map'));
drop policy if exists p_presenze_scrivi on public.presenze;
create policy p_presenze_scrivi on public.presenze for insert with check (public.puo_modificare('s-map'));
drop policy if exists p_presenze_aggiorna on public.presenze;
create policy p_presenze_aggiorna on public.presenze for update using (public.puo_modificare('s-map')) with check (public.puo_modificare('s-map'));

drop policy if exists p_registro_admin on public.registro;
create policy p_registro_admin on public.registro for select using (public.is_admin());

do $$ begin
  begin alter publication supabase_realtime add table public.stato; exception when others then null; end;
  begin alter publication supabase_realtime add table public.presenze; exception when others then null; end;
end $$;

insert into public.inviti (email, nome, admin) values ('LA-TUA-EMAIL@esempio.it', 'Matteo', true)
  on conflict (email) do update set admin = true;
