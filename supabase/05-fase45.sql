alter table public.richieste add column if not exists consigli text;
alter table public.richieste add column if not exists consigli_quando timestamptz;
alter table public.notifiche add column if not exists inviata boolean not null default false;
update public.notifiche set inviata = true where inviata = false;

create table if not exists public.push_iscrizioni (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  endpoint text not null unique,
  dati jsonb not null,
  dispositivo text,
  creato timestamptz not null default now()
);
alter table public.push_iscrizioni enable row level security;
drop policy if exists p_push_mie on public.push_iscrizioni;
create policy p_push_mie on public.push_iscrizioni for all using (user_id = auth.uid()) with check (user_id = auth.uid() and public.registrato());

create table if not exists public.ai_uso (
  user_id uuid not null,
  giorno date not null,
  n int not null default 0,
  primary key (user_id, giorno)
);
alter table public.ai_uso enable row level security;

drop policy if exists p_voci_req_mie on public.voci_dati;
create policy p_voci_req_mie on public.voci_dati for select using (voce = 'v-req' and dati->>'a_uid' = auth.uid()::text);

create or replace function public.rispondi_documento(rid uuid, f jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare r record;
begin
  select * into r from voci_dati where id = rid and voce = 'v-req' and dati->>'a_uid' = auth.uid()::text;
  if not found then raise exception 'Questa richiesta non è per te'; end if;
  if coalesce(f->>'path', '') not like 'risposte/' || auth.uid()::text || '/%' then raise exception 'File non valido'; end if;
  update voci_dati set dati = dati || jsonb_build_object('stato', 'Arrivato', 'file', f, 'risposto_il', now()), aggiornato = now() where id = rid;
  if nullif(r.dati->>'da', '') is not null then
    insert into notifiche (per, testo, link)
      values ((r.dati->>'da')::uuid, (select coalesce(nome, email) from profili where id = auth.uid()) || ' ha mandato «' || (r.dati->>'documento') || '»', 'v-req');
  end if;
end $$;
revoke execute on function public.rispondi_documento(uuid, jsonb) from anon;

drop policy if exists p_doc_risposte_scrivi on storage.objects;
create policy p_doc_risposte_scrivi on storage.objects for insert to authenticated
  with check (bucket_id = 'documenti' and split_part(name, '/', 1) = 'risposte' and split_part(name, '/', 2) = auth.uid()::text);
drop policy if exists p_doc_risposte_leggi on storage.objects;
create policy p_doc_risposte_leggi on storage.objects for select to authenticated
  using (bucket_id = 'documenti' and split_part(name, '/', 1) = 'risposte' and (split_part(name, '/', 2) = auth.uid()::text or public.puo_vedere('v-req')));

create extension if not exists pg_net;
create or replace function public.spingi_push() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform net.http_post(
    url := 'https://rviwxvvjykprprertwkp.supabase.co/functions/v1/invia-push',
    body := '{}'::jsonb,
    headers := '{"Content-Type": "application/json"}'::jsonb);
  return null;
exception when others then
  return null;
end $$;
drop trigger if exists t_spingi_push on public.notifiche;
create trigger t_spingi_push after insert on public.notifiche for each statement execute function public.spingi_push();
