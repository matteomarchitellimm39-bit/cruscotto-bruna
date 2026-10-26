create table if not exists public.voci_dati (
  id uuid primary key default gen_random_uuid(),
  voce text not null,
  dati jsonb not null default '{}'::jsonb,
  creato_da uuid default auth.uid(),
  creato timestamptz not null default now(),
  aggiornato timestamptz not null default now()
);
create index if not exists voci_dati_voce on public.voci_dati (voce);

alter table public.profili add column if not exists presidente boolean not null default false;

create table if not exists public.richieste (
  id uuid primary key default gen_random_uuid(),
  titolo text not null,
  testo text,
  creato_da uuid default auth.uid(),
  creato timestamptz not null default now(),
  preso_da uuid,
  entro date,
  stato text not null default 'aperta' check (stato in ('aperta','presa','fatta'))
);

create table if not exists public.compiti (
  id uuid primary key default gen_random_uuid(),
  per uuid not null,
  da uuid default auth.uid(),
  titolo text not null,
  entro date,
  fatto boolean not null default false,
  privato boolean not null default false,
  creato timestamptz not null default now()
);

create table if not exists public.riunioni (
  id uuid primary key default gen_random_uuid(),
  titolo text not null,
  quando timestamptz not null,
  luogo text,
  note text,
  creato_da uuid default auth.uid(),
  creato timestamptz not null default now()
);

create table if not exists public.inviti_riunione (
  riunione_id uuid references public.riunioni on delete cascade,
  user_id uuid references public.profili on delete cascade,
  stato text not null default 'invitato' check (stato in ('invitato','accetta','rifiuta')),
  primary key (riunione_id, user_id)
);

create table if not exists public.notifiche (
  id bigserial primary key,
  per uuid not null,
  testo text not null,
  link text,
  letto boolean not null default false,
  quando timestamptz not null default now()
);

create table if not exists public.preferenze (
  user_id uuid primary key default auth.uid(),
  dati jsonb not null default '{}'::jsonb
);

create table if not exists public.aree_personali (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid(),
  titolo text not null,
  testo text,
  visibile boolean not null default false,
  aggiornato timestamptz not null default now()
);

create or replace function public.e_presidente() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select presidente or admin from profili where id = auth.uid()), false)
$$;

create or replace function public.registrato() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profili where id = auth.uid())
$$;

create or replace function public.vede_economia() returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1 from permessi where user_id = auth.uid()
      and area in ('s-bil','s-for','s-fon','s-pre','s-car','s-ric','s-ter','s-ev','s-cs','v-p27','v-voci'))
$$;

create or replace function public.prendi_richiesta(rid uuid, data_entro date) returns void
language plpgsql security definer set search_path = public as $$
begin
  if data_entro is null then raise exception 'Scrivi entro quando la consegni'; end if;
  if data_entro < current_date then raise exception 'La data non può essere nel passato'; end if;
  if not public.registrato() then raise exception 'Non autorizzato'; end if;
  update richieste set preso_da = auth.uid(), entro = data_entro, stato = 'presa'
    where id = rid and stato = 'aperta';
  if not found then raise exception 'Qualcuno l''ha già presa'; end if;
  insert into notifiche (per, testo, link)
    select r.creato_da, (select coalesce(nome, email) from profili where id = auth.uid()) || ' ha preso «' || r.titolo || '» entro il ' || to_char(data_entro, 'DD/MM'), 'p-req'
    from richieste r where r.id = rid and r.creato_da is not null;
end $$;

create or replace function public.chiudi_richiesta(rid uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update richieste set stato = 'fatta'
    where id = rid and (preso_da = auth.uid() or public.e_presidente());
  if not found then raise exception 'Non puoi chiudere questa richiesta'; end if;
  insert into notifiche (per, testo, link)
    select r.creato_da, '«' || r.titolo || '» è stata completata', 'p-req'
    from richieste r where r.id = rid and r.creato_da is not null;
end $$;

create or replace function public.notifica_nuova_richiesta() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into notifiche (per, testo, link)
    select p.id, 'Nuova richiesta del Presidente: «' || new.titolo || '»', 'p-req'
    from profili p where p.id is distinct from new.creato_da;
  return new;
end $$;
drop trigger if exists t_nuova_richiesta on public.richieste;
create trigger t_nuova_richiesta after insert on public.richieste for each row execute function public.notifica_nuova_richiesta();

create or replace function public.notifica_compito() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.per is distinct from new.da then
    insert into notifiche (per, testo, link)
      values (new.per, (select coalesce(nome, email) from profili where id = new.da) || ' ti ha assegnato: «' || new.titolo || '»', 'p-me');
  end if;
  return new;
end $$;
drop trigger if exists t_compito on public.compiti;
create trigger t_compito after insert on public.compiti for each row execute function public.notifica_compito();

create or replace function public.notifica_invito() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into notifiche (per, testo, link)
    select new.user_id, 'Sei invitato: «' || r.titolo || '» il ' || to_char(r.quando at time zone 'Europe/Rome', 'DD/MM HH24:MI'), 'p-home'
    from riunioni r where r.id = new.riunione_id;
  return new;
end $$;
drop trigger if exists t_invito on public.inviti_riunione;
create trigger t_invito after insert on public.inviti_riunione for each row execute function public.notifica_invito();

alter table public.voci_dati enable row level security;
alter table public.richieste enable row level security;
alter table public.compiti enable row level security;
alter table public.riunioni enable row level security;
alter table public.inviti_riunione enable row level security;
alter table public.notifiche enable row level security;
alter table public.preferenze enable row level security;
alter table public.aree_personali enable row level security;

drop policy if exists p_profili_colleghi on public.profili;
create policy p_profili_colleghi on public.profili for select using (public.registrato());

drop policy if exists p_voci_leggi on public.voci_dati;
create policy p_voci_leggi on public.voci_dati for select using (public.puo_vedere(voce));
drop policy if exists p_voci_ins on public.voci_dati;
create policy p_voci_ins on public.voci_dati for insert with check (public.puo_modificare(voce));
drop policy if exists p_voci_upd on public.voci_dati;
create policy p_voci_upd on public.voci_dati for update using (public.puo_modificare(voce)) with check (public.puo_modificare(voce));
drop policy if exists p_voci_del on public.voci_dati;
create policy p_voci_del on public.voci_dati for delete using (public.puo_modificare(voce));

drop policy if exists p_rich_leggi on public.richieste;
create policy p_rich_leggi on public.richieste for select using (public.registrato());
drop policy if exists p_rich_ins on public.richieste;
create policy p_rich_ins on public.richieste for insert with check (public.e_presidente());
drop policy if exists p_rich_upd on public.richieste;
create policy p_rich_upd on public.richieste for update using (public.e_presidente()) with check (public.e_presidente());
drop policy if exists p_rich_del on public.richieste;
create policy p_rich_del on public.richieste for delete using (public.e_presidente());

drop policy if exists p_comp_leggi on public.compiti;
create policy p_comp_leggi on public.compiti for select using (per = auth.uid() or da = auth.uid() or (public.is_admin() and not privato));
drop policy if exists p_comp_ins on public.compiti;
create policy p_comp_ins on public.compiti for insert with check (da = auth.uid() and public.registrato());
drop policy if exists p_comp_upd on public.compiti;
create policy p_comp_upd on public.compiti for update using (per = auth.uid() or da = auth.uid());
drop policy if exists p_comp_del on public.compiti;
create policy p_comp_del on public.compiti for delete using (da = auth.uid());

create or replace function public.invitato_a(rid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from inviti_riunione where riunione_id = rid and user_id = auth.uid())
$$;
create or replace function public.creatore_di(rid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from riunioni where id = rid and creato_da = auth.uid())
$$;

drop policy if exists p_riu_leggi on public.riunioni;
create policy p_riu_leggi on public.riunioni for select using (creato_da = auth.uid() or public.invitato_a(id) or public.is_admin());
drop policy if exists p_riu_ins on public.riunioni;
create policy p_riu_ins on public.riunioni for insert with check (creato_da = auth.uid() and public.registrato());
drop policy if exists p_riu_upd on public.riunioni;
create policy p_riu_upd on public.riunioni for update using (creato_da = auth.uid());
drop policy if exists p_riu_del on public.riunioni;
create policy p_riu_del on public.riunioni for delete using (creato_da = auth.uid());

drop policy if exists p_inv_leggi on public.inviti_riunione;
create policy p_inv_leggi on public.inviti_riunione for select using (user_id = auth.uid() or public.creatore_di(riunione_id) or public.invitato_a(riunione_id) or public.is_admin());
drop policy if exists p_inv_ins on public.inviti_riunione;
create policy p_inv_ins on public.inviti_riunione for insert with check (public.creatore_di(riunione_id));
drop policy if exists p_inv_upd on public.inviti_riunione;
create policy p_inv_upd on public.inviti_riunione for update using (user_id = auth.uid());
drop policy if exists p_inv_del on public.inviti_riunione;
create policy p_inv_del on public.inviti_riunione for delete using (public.creatore_di(riunione_id));

drop policy if exists p_not_leggi on public.notifiche;
create policy p_not_leggi on public.notifiche for select using (per = auth.uid());
drop policy if exists p_not_upd on public.notifiche;
create policy p_not_upd on public.notifiche for update using (per = auth.uid());

drop policy if exists p_pref on public.preferenze;
create policy p_pref on public.preferenze for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists p_aree_leggi on public.aree_personali;
create policy p_aree_leggi on public.aree_personali for select using (owner = auth.uid() or (visibile and public.registrato()) or public.is_admin());
drop policy if exists p_aree_scrivi on public.aree_personali;
create policy p_aree_scrivi on public.aree_personali for all using (owner = auth.uid()) with check (owner = auth.uid());

do $$ begin
  begin alter publication supabase_realtime add table public.voci_dati; exception when others then null; end;
  begin alter publication supabase_realtime add table public.richieste; exception when others then null; end;
  begin alter publication supabase_realtime add table public.notifiche; exception when others then null; end;
end $$;

create or replace function public.nuovo_utente() returns trigger
language plpgsql security definer set search_path = public as $$
declare inv record; k text; v text;
begin
  select * into inv from inviti where lower(email) = lower(new.email);
  insert into profili (id, email, nome, admin, presidente)
    values (new.id, lower(new.email), inv.nome, coalesce(inv.admin, false), coalesce(inv.permessi->>'_presidente', '') = 'si')
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

create or replace function public.annota() returns trigger
language plpgsql security definer set search_path = public as $$
declare a text; c text;
begin
  if tg_table_name = 'stato' then a := new.area; c := 'ha modificato la scheda';
  elsif tg_table_name = 'presenze' then a := 's-map'; c := 'ha aggiornato il conteggio di ' || new.id;
  elsif tg_table_name = 'permessi' then a := new.area; c := 'ha cambiato i permessi (' || new.livello || ')';
  elsif tg_table_name = 'voci_dati' then a := new.voce; c := case when tg_op = 'INSERT' then 'ha aggiunto una voce' else 'ha modificato una voce' end;
  end if;
  insert into registro (chi, email, area, cosa)
    values (auth.uid(), (select email from profili where id = auth.uid()), a, c);
  return new;
end $$;

drop trigger if exists t_annota_voci on public.voci_dati;
create trigger t_annota_voci after insert or update on public.voci_dati for each row execute function public.annota();
