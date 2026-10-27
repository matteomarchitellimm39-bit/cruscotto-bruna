-- Bruna27 · 09: foto profilo e colore di ogni utente, bacheca aperta a tutti, notifiche con mittente e archivio.
-- Si può eseguire più volte senza danni.

-- 1. Foto e colore del profilo
alter table public.profili add column if not exists foto text;
alter table public.profili add column if not exists colore text;

create or replace function public.colore_libero() returns text
language sql stable security definer set search_path = public as $$
  select c from unnest(array['#4C7BD9','#D9822B','#2A9D8F','#B5527E','#7A5CC7','#C9A227','#3F8F4F','#D9534F','#2B7A99','#A0663A','#6C7A89','#9C4FB5']) with ordinality as t(c, i)
  order by (select count(*) from profili p where p.colore = t.c and p.attivo), i limit 1
$$;
create or replace function public.assegna_colore() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.colore is null then new.colore := public.colore_libero(); end if;
  return new;
end $$;
drop trigger if exists t_assegna_colore on public.profili;
create trigger t_assegna_colore before insert on public.profili for each row execute function public.assegna_colore();
do $$ declare r record; begin
  for r in select id from public.profili where colore is null order by creato loop
    update public.profili set colore = public.colore_libero() where id = r.id;
  end loop;
end $$;

-- la foto: ognuno solo la propria, e solo dalla cartella pubblica delle foto
create or replace function public.imposta_foto(url text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.registrato() then raise exception 'Non autorizzato'; end if;
  if url is not null and url not like '%/storage/v1/object/public/foto/' || auth.uid()::text || '/%' then raise exception 'Indirizzo non valido'; end if;
  update profili set foto = url where id = auth.uid();
end $$;
revoke execute on function public.imposta_foto(text) from anon;

-- il colore lo può cambiare l'amministratore
create or replace function public.imposta_colore(uid uuid, c text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Solo l''amministratore'; end if;
  if c !~ '^#[0-9A-Fa-f]{6}$' then raise exception 'Colore non valido'; end if;
  update profili set colore = c where id = uid;
end $$;
revoke execute on function public.imposta_colore(uuid, text) from anon;

-- cartella pubblica delle foto (serve per mostrarle anche nelle notifiche): ognuno scrive solo nella propria
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('foto', 'foto', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 2097152, allowed_mime_types = array['image/jpeg','image/png','image/webp'];
drop policy if exists p_foto_scrivi on storage.objects;
create policy p_foto_scrivi on storage.objects for insert to authenticated
  with check (bucket_id = 'foto' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists p_foto_leggi on storage.objects;
create policy p_foto_leggi on storage.objects for select to authenticated
  using (bucket_id = 'foto');
drop policy if exists p_foto_cambia on storage.objects;
create policy p_foto_cambia on storage.objects for update to authenticated
  using (bucket_id = 'foto' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists p_foto_cancella on storage.objects;
create policy p_foto_cancella on storage.objects for delete to authenticated
  using (bucket_id = 'foto' and (storage.foldername(name))[1] = auth.uid()::text);

-- 2. Notifiche: chi le ha generate, archivio, titoli chiari
alter table public.notifiche add column if not exists da uuid default auth.uid();
alter table public.notifiche add column if not exists archiviata boolean not null default false;
create index if not exists notifiche_per_quando on public.notifiche (per, quando desc);

create or replace function public.notifica_completa() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.titolo is null or new.titolo = '' then
    new.titolo := case split_part(coalesce(new.link, ''), '#', 1)
      when 'p-req' then 'Richiesta del Presidente'
      when 'p-me' then 'Compito'
      when 'p-home' then 'Riunione'
      when 'v-req' then 'Richiesta di documento'
      when 'v-perc' then 'Percorsi' when 'v-psic' then 'Percorsi' when 'p-pub' then 'Percorsi'
      when 'v-femit' then 'Fattura da emettere'
      when 'v-pag' then 'Pagamento da verificare'
      when 'v-sp27' then 'Sponsor'
      when 'p-bach' then 'Bacheca'
      else null end;
  end if;
  if new.link = 'p-req' and new.testo like 'Nuova richiesta del Presidente%' then
    new.testo := new.testo || '. Aprila per prenderla in carico e indicare la scadenza.';
  end if;
  if new.link = 'p-me' and new.testo like '%ti ha assegnato: «Emetti la fattura%' then
    new.titolo := 'Fattura da emettere';
  end if;
  return new;
end $$;
drop trigger if exists t_notifica_completa on public.notifiche;
create trigger t_notifica_completa before insert on public.notifiche for each row execute function public.notifica_completa();

-- messaggi: «Francesco» oppure «Gruppo Sicurezza — Francesco»
create or replace function public.notifica_messaggio() returns trigger
language plpgsql security definer set search_path = public as $$
declare c record; chi text; tit text;
begin
  select * into c from conversazioni where id = new.conv_id;
  update conversazioni set ultimo = new.quando where id = new.conv_id;
  chi := (select coalesce(nome, email) from profili where id = new.da);
  tit := case when c.tipo = 'privata' then chi else coalesce(c.titolo, 'Gruppo') || ' — ' || chi end;
  insert into notifiche (per, da, titolo, testo, link, priorita)
    select p.user_id, new.da, case when p.user_id = any(new.menzioni) then tit || ' (ti ha menzionato)' else tit end,
      left(coalesce(new.testo, 'Ha mandato un allegato'), 160), 'p-chat#' || new.conv_id, case when p.user_id = any(new.menzioni) then 'urgente' else 'normale' end
    from partecipanti p
    where p.conv_id = new.conv_id and p.user_id <> new.da
      and (p.user_id = any(new.menzioni) or not exists (select 1 from notifiche n where n.per = p.user_id and n.link = 'p-chat#' || new.conv_id and not n.letto));
  return new;
end $$;

-- 3. Bacheca aperta a tutti gli utenti attivi
alter table public.avvisi alter column titolo drop not null;
alter table public.avvisi add column if not exists ufficiale boolean not null default false;
alter table public.avvisi add column if not exists menzioni uuid[] not null default '{}';
alter table public.avvisi add column if not exists collegamento jsonb;
alter table public.avvisi add column if not exists modificato timestamptz;

create or replace function public.controlla_avviso() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.autore := auth.uid();
    new.ufficiale := public.e_presidente();
    if not new.ufficiale then new.fissato := false; end if;
  else
    new.autore := old.autore; new.ufficiale := old.ufficiale; new.quando := old.quando;
    if not public.e_presidente() then new.fissato := old.fissato; end if;
    if new.titolo is distinct from old.titolo or new.testo is distinct from old.testo then new.modificato := now(); end if;
  end if;
  if coalesce(new.titolo, '') = '' and coalesce(new.testo, '') = '' then raise exception 'Scrivi qualcosa'; end if;
  return new;
end $$;
drop trigger if exists t_controlla_avviso on public.avvisi;
create trigger t_controlla_avviso before insert or update on public.avvisi for each row execute function public.controlla_avviso();

drop policy if exists p_avv_crea on public.avvisi;
create policy p_avv_crea on public.avvisi for insert with check (public.utente_ok());

-- notifica a tutti i destinatari solo per le comunicazioni ufficiali o importanti; chi è menzionato la riceve sempre
create or replace function public.notifica_avviso() returns trigger
language plpgsql security definer set search_path = public as $$
declare chi text;
begin
  chi := (select coalesce(nome, email) from profili where id = new.autore);
  insert into notifiche (per, da, titolo, testo, link, priorita)
    select p.id, new.autore,
      case when p.id = any(new.menzioni) then chi || ' ti ha citato in bacheca'
           when new.importante then 'Importante — ' || chi
           else new.tipo || ' — ' || chi end,
      left(coalesce(nullif(new.titolo, ''), new.testo), 160), 'p-bach#' || new.id, case when new.importante or p.id = any(new.menzioni) then 'urgente' else 'normale' end
    from profili p
    where p.attivo and p.id <> new.autore
      and (p.id = any(new.menzioni) or new.importante or new.ufficiale)
      and (new.tutti or p.id = any(new.utenti) or p.id = any(new.menzioni) or new.aree && (case when p.admin then array['eco','evt','com','sic','adm'] else coalesce((select array_agg(distinct s.sezione) from permessi m join sezioni_voci s on s.voce = m.area where m.user_id = p.id), '{}') end));
  return new;
end $$;

create or replace function public.destinatario(a public.avvisi) returns boolean
language sql stable security definer set search_path = public as $$
  select public.utente_ok() and (a.tutti or auth.uid() = any(a.utenti) or auth.uid() = any(a.menzioni) or a.aree && public.mie_sezioni() or a.autore = auth.uid() or public.e_presidente())
$$;
