-- Bruna27 · 12 · Eventi (Fase B): attività per area collegate alla scheda evento, 24 ore, promemoria e ritardi
-- Si può rieseguire senza danni.

-- 1. Le attività dell'evento sono compiti collegati alla scheda
alter table public.compiti add column if not exists evento_id text;
alter table public.compiti add column if not exists nota text;
alter table public.compiti add column if not exists scade_il timestamptz;
alter table public.compiti add column if not exists avvisato_prima boolean not null default false;
alter table public.compiti add column if not exists avvisato_ritardo boolean not null default false;
create index if not exists compiti_evento on public.compiti (evento_id) where evento_id is not null;

-- chi vede gli Eventi vede anche le attività degli eventi (per l'avanzamento); l'amministratore può riaprirle
drop policy if exists p_comp_evento_leggi on public.compiti;
create policy p_comp_evento_leggi on public.compiti for select
  using (evento_id is not null and public.puo_vedere('s-ev'));
drop policy if exists p_comp_upd on public.compiti;
create policy p_comp_upd on public.compiti for update
  using (per = auth.uid() or da = auth.uid() or (evento_id is not null and public.is_admin()));

-- 2. La notifica del compito di un evento apre direttamente la scheda dell'evento
create or replace function public.notifica_compito() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.per is distinct from new.da then
    if new.evento_id is not null then
      insert into notifiche (per, da, titolo, testo, link)
        values (new.per, new.da, 'Evento',
          (select coalesce(nome, email) from profili where id = new.da) || ' ti ha assegnato: «' || new.titolo || '»' ||
          coalesce(' · entro ' || to_char(new.scade_il at time zone 'Europe/Rome', 'DD/MM "alle" HH24:MI'), '') || '. Apri la scheda dell''evento.',
          'sec-evt#' || new.evento_id);
    else
      insert into notifiche (per, testo, link)
        values (new.per, (select coalesce(nome, email) from profili where id = new.da) || ' ti ha assegnato: «' || new.titolo || '»', 'p-me');
    end if;
  end if;
  return new;
end $$;

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
      when 'sec-evt' then 'Evento'
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

-- 3. Promemoria prima della scadenza delle 24 ore e avviso di ritardo (una volta sola ciascuno)
create or replace function public.avvisi_eventi_24h() returns void
language plpgsql security definer set search_path = public as $$
begin
  with x as (
    update compiti set avvisato_prima = true
    where evento_id is not null and not fatto and stato not in ('attesa','non_necessario')
      and scade_il is not null and scade_il > now() and scade_il <= now() + interval '4 hours' and not avvisato_prima
    returning per, titolo, evento_id, scade_il)
  insert into notifiche (per, titolo, testo, link, priorita)
    select per, 'Evento', 'Restano meno di 4 ore: «' || titolo || '» va completato entro le ' || to_char(scade_il at time zone 'Europe/Rome', 'HH24:MI') || '.', 'sec-evt#' || evento_id, 'urgente' from x;

  with y as (
    update compiti set avvisato_ritardo = true
    where evento_id is not null and not fatto and stato not in ('attesa','non_necessario')
      and scade_il is not null and scade_il < now() and not avvisato_ritardo
    returning per, da, titolo, evento_id)
  insert into notifiche (per, titolo, testo, link, priorita)
    select u, 'Evento in ritardo', 'In ritardo: «' || titolo || '». Le 24 ore per completare la scheda sono passate.', 'sec-evt#' || evento_id, 'urgente'
    from y, unnest(array[y.per, y.da]) as u where u is not null
    group by u, titolo, evento_id;
end $$;
revoke execute on function public.avvisi_eventi_24h() from anon, authenticated;

select cron.unschedule('bruna27-eventi-24h') where exists (select 1 from cron.job where jobname = 'bruna27-eventi-24h');
select cron.schedule('bruna27-eventi-24h', '*/30 * * * *', 'select public.avvisi_eventi_24h()');
