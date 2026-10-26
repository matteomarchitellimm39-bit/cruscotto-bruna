alter table public.richieste drop constraint if exists richieste_stato_check;
alter table public.richieste add constraint richieste_stato_check check (stato in ('aperta','presa','lavorazione','attesa','fatta'));
alter table public.richieste add column if not exists priorita text not null default 'Normale';
alter table public.richieste add column if not exists area text;
alter table public.richieste add column if not exists allegato jsonb;
alter table public.richieste add column if not exists presa_il timestamptz;
alter table public.richieste add column if not exists fatta_il timestamptz;
alter table public.richieste add column if not exists note text;

create or replace function public.prendi_richiesta(rid uuid, data_entro date) returns void
language plpgsql security definer set search_path = public as $$
begin
  if data_entro is null then raise exception 'Scrivi entro quando la consegni'; end if;
  if data_entro < current_date then raise exception 'La data non può essere nel passato'; end if;
  if not public.registrato() then raise exception 'Non autorizzato'; end if;
  update richieste set preso_da = auth.uid(), entro = data_entro, stato = 'presa', presa_il = now()
    where id = rid and stato = 'aperta';
  if not found then raise exception 'Qualcuno l''ha già presa'; end if;
  insert into notifiche (per, testo, link)
    select r.creato_da, (select coalesce(nome, email) from profili where id = auth.uid()) || ' ha preso «' || r.titolo || '» entro il ' || to_char(data_entro, 'DD/MM'), 'p-req'
    from richieste r where r.id = rid and r.creato_da is not null;
end $$;

create or replace function public.aggiorna_richiesta(rid uuid, nuovo text, nota text) returns void
language plpgsql security definer set search_path = public as $$
declare r record;
begin
  if nuovo not in ('presa','lavorazione','attesa','fatta') then raise exception 'Stato non valido'; end if;
  select * into r from richieste where id = rid;
  if not found then raise exception 'Richiesta non trovata'; end if;
  if not (r.preso_da = auth.uid() or public.e_presidente()) then raise exception 'Solo chi l''ha presa o il Presidente può aggiornarla'; end if;
  update richieste set stato = nuovo, note = coalesce(nullif(nota, ''), note), fatta_il = case when nuovo = 'fatta' then now() else null end where id = rid;
  if r.creato_da is not null and r.creato_da <> auth.uid() then
    insert into notifiche (per, testo, link) values (r.creato_da, '«' || r.titolo || '»: ' ||
      case nuovo when 'fatta' then 'completata' when 'attesa' then 'in attesa' when 'lavorazione' then 'in lavorazione' else 'presa in carico' end ||
      coalesce(' — ' || nullif(nota, ''), ''), 'p-req');
  end if;
end $$;
revoke execute on function public.aggiorna_richiesta(uuid, text, text) from anon;

create or replace function public.chiudi_richiesta(rid uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform public.aggiorna_richiesta(rid, 'fatta', null);
end $$;

alter table public.compiti add column if not exists area text;
alter table public.compiti add column if not exists priorita text not null default 'Normale';
alter table public.compiti add column if not exists allegato jsonb;
alter table public.compiti add column if not exists stato text not null default 'assegnato';
alter table public.compiti add column if not exists chiede_data boolean not null default false;
alter table public.compiti add column if not exists storico jsonb not null default '[]'::jsonb;

create or replace function public.notifica_compito_cambio() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.per is distinct from old.per and new.per is not null then
    insert into notifiche (per, testo, link) values (new.per, (select coalesce(nome, email) from profili where id = auth.uid()) || ' ti ha assegnato: «' || new.titolo || '»', 'p-me');
  end if;
  if new.da is not null and new.da <> auth.uid() and (new.stato is distinct from old.stato or new.fatto is distinct from old.fatto) then
    insert into notifiche (per, testo, link) values (new.da, (select coalesce(nome, email) from profili where id = auth.uid()) || ': «' || new.titolo || '» ' ||
      case when new.fatto then 'è fatto' when new.stato = 'preso' then 'preso in carico' || coalesce(' entro il ' || to_char(new.entro, 'DD/MM'), '') else 'aggiornato' end, 'p-me');
  end if;
  return new;
end $$;
drop trigger if exists t_compito_cambio on public.compiti;
create trigger t_compito_cambio after update on public.compiti for each row execute function public.notifica_compito_cambio();

alter table public.riunioni add column if not exists tipo text not null default 'Riunione';
alter table public.riunioni add column if not exists allegati jsonb not null default '[]'::jsonb;

alter table public.aree_personali add column if not exists condivisa_con uuid[] not null default '{}';
alter table public.aree_personali add column if not exists allegati jsonb not null default '[]'::jsonb;
drop policy if exists p_aree_leggi on public.aree_personali;
create policy p_aree_leggi on public.aree_personali for select
  using (owner = auth.uid() or (visibile and public.registrato()) or (auth.uid() = any(condivisa_con) and public.registrato()) or public.is_admin());

drop policy if exists p_doc_personali_scrivi on storage.objects;
create policy p_doc_personali_scrivi on storage.objects for insert to authenticated
  with check (bucket_id = 'documenti' and split_part(name, '/', 1) in ('personali','compiti','richieste','riunioni') and split_part(name, '/', 2) = auth.uid()::text);
drop policy if exists p_doc_personali_leggi on storage.objects;
create policy p_doc_personali_leggi on storage.objects for select to authenticated
  using (bucket_id = 'documenti' and split_part(name, '/', 1) in ('personali','compiti','richieste','riunioni') and public.registrato());

create or replace function public.genera_avvisi_scadenze() returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into notifiche (per, testo, link)
    select c.per, 'Domani scade: «' || c.titolo || '»', 'p-me' from compiti c
    where not c.fatto and c.entro = current_date + 1;
  insert into notifiche (per, testo, link)
    select c.per, 'In ritardo: «' || c.titolo || '» doveva essere fatto il ' || to_char(c.entro, 'DD/MM'), 'p-me' from compiti c
    where not c.fatto and c.entro = current_date - 1;
  insert into notifiche (per, testo, link)
    select r.preso_da, 'Domani scade la richiesta del Presidente «' || r.titolo || '»', 'p-req' from richieste r
    where r.stato in ('presa','lavorazione','attesa') and r.entro = current_date + 1;
  insert into notifiche (per, testo, link)
    select x, 'In ritardo: «' || r.titolo || '» doveva essere consegnata il ' || to_char(r.entro, 'DD/MM'), 'p-req'
    from richieste r, unnest(array[r.preso_da, r.creato_da]) as x
    where r.stato in ('presa','lavorazione','attesa') and r.entro = current_date - 1 and x is not null;
end $$;
revoke execute on function public.genera_avvisi_scadenze() from public, anon, authenticated;

create extension if not exists pg_cron;
do $$ begin
  perform cron.unschedule('bruna27-scadenze');
exception when others then null;
end $$;
select cron.schedule('bruna27-scadenze', '0 6 * * *', 'select public.genera_avvisi_scadenze()');
