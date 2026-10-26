alter table public.profili add column if not exists attivo boolean not null default true;
alter table public.profili add column if not exists deve_cambiare boolean not null default false;
alter table public.profili add column if not exists temp_scade timestamptz;
alter table public.profili add column if not exists informativa_il timestamptz;
alter table public.profili add column if not exists informativa_versione text;

create table if not exists public.password_temporanee (
  user_id uuid primary key,
  impronta text not null,
  creata timestamptz not null default now()
);
alter table public.password_temporanee enable row level security;

create or replace function public.utente_ok() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select attivo and not deve_cambiare from profili where id = auth.uid()), false)
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select admin and attivo and not deve_cambiare from profili where id = auth.uid()), false)
$$;

create or replace function public.livello(a text) returns text
language sql stable security definer set search_path = public as $$
  select case when not public.utente_ok() then null
              when (select admin from profili where id = auth.uid()) then 'modifica'
              else (select livello from permessi where user_id = auth.uid() and area = a) end
$$;

create or replace function public.registrato() returns boolean
language sql stable security definer set search_path = public as $$
  select public.utente_ok()
$$;

create or replace function public.e_presidente() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select (presidente or admin) and attivo and not deve_cambiare from profili where id = auth.uid()), false)
$$;

create or replace function public.registra_temporanea(uid uuid) returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  insert into password_temporanee (user_id, impronta)
    select id, md5(coalesce(encrypted_password, '')) from auth.users where id = uid
  on conflict (user_id) do update set impronta = excluded.impronta, creata = now();
  update profili set deve_cambiare = true, temp_scade = now() + interval '7 days' where id = uid;
end $$;
revoke execute on function public.registra_temporanea(uuid) from public, anon, authenticated;

create or replace function public.password_cambiata() returns boolean
language plpgsql security definer set search_path = public, auth as $$
declare vecchia text; ora text;
begin
  select impronta into vecchia from password_temporanee where user_id = auth.uid();
  select md5(coalesce(encrypted_password, '')) into ora from auth.users where id = auth.uid();
  if vecchia is not null and vecchia = ora then return false; end if;
  update profili set deve_cambiare = false, temp_scade = null where id = auth.uid();
  delete from password_temporanee where user_id = auth.uid();
  insert into registro (chi, email, area, cosa) values (auth.uid(), (select email from profili where id = auth.uid()), null, 'ha scelto la sua password');
  return true;
end $$;
revoke execute on function public.password_cambiata() from anon;

create or replace function public.accetta_informativa(versione text) returns void
language plpgsql security definer set search_path = public as $$
begin
  update profili set informativa_il = now(), informativa_versione = left(versione, 40) where id = auth.uid();
  insert into registro (chi, email, area, cosa) values (auth.uid(), (select email from profili where id = auth.uid()), null, 'ha accettato l''informativa ' || left(versione, 40));
end $$;
revoke execute on function public.accetta_informativa(text) from anon;
