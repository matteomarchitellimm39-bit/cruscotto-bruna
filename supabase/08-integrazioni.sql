delete from public.voci_dati where voce = 'v-prot';
delete from public.permessi where area = 'v-prot';

create table if not exists public.impostazioni (
  chiave text primary key,
  valore jsonb not null default '{}'::jsonb,
  aggiornato timestamptz not null default now()
);
alter table public.impostazioni enable row level security;
drop policy if exists p_imp_leggi on public.impostazioni;
create policy p_imp_leggi on public.impostazioni for select using (public.registrato());
drop policy if exists p_imp_admin on public.impostazioni;
create policy p_imp_admin on public.impostazioni for all using (public.is_admin()) with check (public.is_admin());
insert into public.impostazioni (chiave, valore) values ('generali', '{"resp_fatture":null,"resp_pagamenti":null,"giorni_promemoria":[7,1],"clausole_sponsor":""}'::jsonb) on conflict (chiave) do nothing;

create or replace function public.imp(k text) returns text
language sql stable security definer set search_path = public as $$
  select valore->>k from impostazioni where chiave = 'generali'
$$;

create table if not exists public.sezioni_voci (sezione text not null, voce text not null, primary key (sezione, voce));
insert into public.sezioni_voci (sezione, voce) values
 ('eco','s-bil'),('eco','v-p27'),('eco','s-pre'),('eco','s-ric'),('eco','v-voci'),('eco','v-fatt'),('eco','v-femit'),('eco','s-car'),('eco','v-care'),('eco','s-ter'),('eco','s-for'),('eco','v-for27'),('eco','v-pag'),('eco','v-cv'),('eco','v-prev'),
 ('evt','v-calu'),('evt','s-ev'),('evt','v-crea'),('evt','s-cs'),('evt','v-perc'),
 ('com','v-sp26'),('com','v-sp27'),('com','v-altri'),('com','v-area'),
 ('sic','s-map'),('sic','v-psic'),('sic','v-msic'),
 ('adm','v-aut'),('adm','v-req')
on conflict do nothing;
create or replace function public.mie_sezioni() returns text[]
language sql stable security definer set search_path = public as $$
  select case when public.is_admin() then array['eco','evt','com','sic','adm']
    else coalesce((select array_agg(distinct s.sezione) from permessi p join sezioni_voci s on s.voce = p.area where p.user_id = auth.uid() and public.utente_ok()), '{}') end
$$;

alter table public.notifiche add column if not exists titolo text;
alter table public.notifiche add column if not exists priorita text not null default 'normale';

drop policy if exists p_voci_for27_pag on public.voci_dati;
create policy p_voci_for27_pag on public.voci_dati for select
  using (voce = 'v-for27' and (public.puo_vedere('v-pag') or public.imp('resp_pagamenti') = auth.uid()::text));
drop policy if exists p_voci_femit_resp on public.voci_dati;
create policy p_voci_femit_resp on public.voci_dati for select
  using (voce = 'v-femit' and public.imp('resp_fatture') = auth.uid()::text);
drop policy if exists p_voci_femit_resp_upd on public.voci_dati;
create policy p_voci_femit_resp_upd on public.voci_dati for update
  using (voce = 'v-femit' and public.imp('resp_fatture') = auth.uid()::text)
  with check (voce = 'v-femit');
create unique index if not exists voci_femit_unica on public.voci_dati ((dati->>'chiave')) where voce = 'v-femit' and dati->>'stato' <> 'Annullata';

create or replace function public.richiedi_fattura(sid uuid, rata int) returns uuid
language plpgsql security definer set search_path = public as $$
declare s record; d jsonb; r jsonb; imp numeric; chiave text; nid uuid; resp uuid; nome_sp text;
begin
  if not public.puo_modificare('v-sp27') then raise exception 'Non autorizzato'; end if;
  select * into s from voci_dati where id = sid and voce = 'v-sp27';
  if not found then raise exception 'Sponsor non trovato'; end if;
  d := s.dati; nome_sp := coalesce(d->>'nome', 'sponsor');
  r := coalesce(d->'rate'->rata, '{}'::jsonb);
  imp := coalesce(nullif(r->>'importo','')::numeric, nullif(d->>'importo','')::numeric, 0);
  chiave := sid::text || ':' || rata;
  if exists (select 1 from voci_dati where voce = 'v-femit' and dati->>'chiave' = chiave and dati->>'stato' <> 'Annullata') then
    raise exception 'Per questa rata la fattura è già stata richiesta';
  end if;
  insert into voci_dati (voce, dati) values ('v-femit', jsonb_build_object(
    'chiave', chiave, 'sponsor_id', sid, 'cliente', nome_sp, 'piva', d->>'piva', 'cf', d->>'cf', 'sede', d->>'sede', 'pec', d->>'pec', 'sdi', d->>'sdi',
    'email', d->>'email', 'rata', rata, 'descrizione', coalesce(r->>'n', 'Sponsorizzazione Festa della Bruna ' || coalesce(d->>'edizione','2027')),
    'imponibile', coalesce(r->>'imponibile', d->>'imponibile'), 'iva', coalesce(r->>'iva', d->>'iva'), 'importo', imp, 'scadenza', r->>'data',
    'stato', 'Da emettere', 'richiesta_da', auth.uid(), 'richiesta_il', now())) returning id into nid;
  resp := nullif(public.imp('resp_fatture'), '')::uuid;
  if resp is not null then
    insert into compiti (per, da, titolo, area, priorita) values (resp, auth.uid(), 'Emetti la fattura a ' || nome_sp || ' (' || replace(to_char(round(imp), 'FM999G999G990'), ',', '.') || ' €)', 'v-femit', 'Alta');
  end if;
  return nid;
end $$;
revoke execute on function public.richiedi_fattura(uuid, int) from anon;

create or replace function public.verifica_pagamento(fid uuid, idx int, esito text, motivo text) returns void
language plpgsql security definer set search_path = public as $$
declare f record; p jsonb; chi uuid;
begin
  if not (public.is_admin() or public.imp('resp_pagamenti') = auth.uid()::text) then raise exception 'Solo il responsabile dei pagamenti può verificare'; end if;
  select * into f from voci_dati where id = fid and voce = 'v-for27';
  if not found then raise exception 'Fornitore non trovato'; end if;
  p := f.dati->'pagamenti'->idx;
  if p is null then raise exception 'Rata non trovata'; end if;
  if esito = 'verificato' then
    p := p || jsonb_build_object('stato', 'verificato', 'pagato', true, 'verificato', jsonb_build_object('da', auth.uid(), 'quando', now()));
  elsif esito = 'rifiutato' then
    p := p || jsonb_build_object('stato', 'rifiutato', 'pagato', false, 'motivo', coalesce(motivo, ''));
  else raise exception 'Esito non valido'; end if;
  update voci_dati set dati = jsonb_set(dati, array['pagamenti', idx::text], p), aggiornato = now() where id = fid;
  chi := nullif(p->'dichiarato'->>'da', '')::uuid;
  if chi is not null and chi <> auth.uid() then
    insert into notifiche (per, titolo, testo, link, priorita) values (chi, 'Pagamento ' || case when esito = 'verificato' then 'confermato' else 'da correggere' end,
      coalesce(f.dati->>'fornitore','') || ' · ' || coalesce(p->>'n','rata') || case when esito = 'rifiutato' then ': ' || coalesce(motivo,'') else '' end, 'v-pag', case when esito = 'rifiutato' then 'urgente' else 'normale' end);
  end if;
end $$;
revoke execute on function public.verifica_pagamento(uuid, int, text, text) from anon;

create table if not exists public.conversazioni (
  id uuid primary key default gen_random_uuid(),
  titolo text,
  tipo text not null default 'privata' check (tipo in ('privata','gruppo','area')),
  area text,
  creato_da uuid default auth.uid(),
  creato timestamptz not null default now(),
  ultimo timestamptz not null default now()
);
create unique index if not exists conv_area_unica on public.conversazioni (area) where tipo = 'area';
create table if not exists public.partecipanti (
  conv_id uuid references public.conversazioni on delete cascade,
  user_id uuid not null,
  ultimo_letto timestamptz not null default now(),
  primary key (conv_id, user_id)
);
create table if not exists public.messaggi (
  id bigserial primary key,
  conv_id uuid references public.conversazioni on delete cascade,
  da uuid not null default auth.uid(),
  testo text,
  allegato jsonb,
  collegamento jsonb,
  menzioni uuid[] not null default '{}',
  quando timestamptz not null default now()
);
create index if not exists messaggi_conv on public.messaggi (conv_id, quando);
alter table public.conversazioni enable row level security;
alter table public.partecipanti enable row level security;
alter table public.messaggi enable row level security;

create or replace function public.partecipa(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from partecipanti where conv_id = cid and user_id = auth.uid()) and public.utente_ok()
$$;
create or replace function public.creatore_conv(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from conversazioni where id = cid and creato_da = auth.uid())
$$;
drop policy if exists p_conv_leggi on public.conversazioni;
create policy p_conv_leggi on public.conversazioni for select using (public.partecipa(id) or creato_da = auth.uid());
drop policy if exists p_conv_crea on public.conversazioni;
create policy p_conv_crea on public.conversazioni for insert with check (creato_da = auth.uid() and tipo in ('privata','gruppo') and public.registrato());
drop policy if exists p_conv_mod on public.conversazioni;
create policy p_conv_mod on public.conversazioni for update using (creato_da = auth.uid() or public.is_admin());
drop policy if exists p_conv_del on public.conversazioni;
create policy p_conv_del on public.conversazioni for delete using ((creato_da = auth.uid() and tipo <> 'area') or public.is_admin());
drop policy if exists p_part_leggi on public.partecipanti;
create policy p_part_leggi on public.partecipanti for select using (public.partecipa(conv_id));
drop policy if exists p_part_crea on public.partecipanti;
create policy p_part_crea on public.partecipanti for insert with check (public.creatore_conv(conv_id) or public.is_admin());
drop policy if exists p_part_mod on public.partecipanti;
create policy p_part_mod on public.partecipanti for update using (user_id = auth.uid());
drop policy if exists p_part_del on public.partecipanti;
create policy p_part_del on public.partecipanti for delete using (user_id = auth.uid() or public.creatore_conv(conv_id) or public.is_admin());
drop policy if exists p_msg_leggi on public.messaggi;
create policy p_msg_leggi on public.messaggi for select using (public.partecipa(conv_id));
drop policy if exists p_msg_scrivi on public.messaggi;
create policy p_msg_scrivi on public.messaggi for insert with check (da = auth.uid() and public.partecipa(conv_id));
drop policy if exists p_msg_del on public.messaggi;
create policy p_msg_del on public.messaggi for delete using (da = auth.uid());

create or replace function public.unisciti_aree() returns void
language plpgsql security definer set search_path = public as $$
declare s text; cid uuid; nomi jsonb := '{"eco":"Economia","evt":"Eventi","com":"Commerciale","sic":"Sicurezza","adm":"Amministrazione"}';
begin
  if not public.utente_ok() then return; end if;
  foreach s in array public.mie_sezioni() loop
    select id into cid from conversazioni where tipo = 'area' and area = s;
    if cid is null then insert into conversazioni (titolo, tipo, area, creato_da) values ('Gruppo ' || (nomi->>s), 'area', s, null) returning id into cid; end if;
    insert into partecipanti (conv_id, user_id) values (cid, auth.uid()) on conflict do nothing;
  end loop;
  delete from partecipanti p using conversazioni c where p.conv_id = c.id and c.tipo = 'area' and p.user_id = auth.uid() and not (c.area = any(public.mie_sezioni()));
end $$;
revoke execute on function public.unisciti_aree() from anon;

create or replace function public.notifica_messaggio() returns trigger
language plpgsql security definer set search_path = public as $$
declare c record; chi text;
begin
  select * into c from conversazioni where id = new.conv_id;
  update conversazioni set ultimo = new.quando where id = new.conv_id;
  chi := (select coalesce(nome, email) from profili where id = new.da);
  insert into notifiche (per, titolo, testo, link, priorita)
    select p.user_id, case when p.user_id = any(new.menzioni) then chi || ' ti ha menzionato' else coalesce(c.titolo, chi) end,
      left(coalesce(new.testo, 'Allegato'), 140), 'p-chat#' || new.conv_id, case when p.user_id = any(new.menzioni) then 'urgente' else 'normale' end
    from partecipanti p
    where p.conv_id = new.conv_id and p.user_id <> new.da
      and (p.user_id = any(new.menzioni) or not exists (select 1 from notifiche n where n.per = p.user_id and n.link = 'p-chat#' || new.conv_id and not n.letto));
  return new;
end $$;
drop trigger if exists t_messaggio on public.messaggi;
create trigger t_messaggio after insert on public.messaggi for each row execute function public.notifica_messaggio();

create table if not exists public.avvisi (
  id uuid primary key default gen_random_uuid(),
  titolo text not null,
  testo text,
  tipo text not null default 'Avviso',
  allegati jsonb not null default '[]'::jsonb,
  autore uuid default auth.uid(),
  quando timestamptz not null default now(),
  tutti boolean not null default true,
  utenti uuid[] not null default '{}',
  aree text[] not null default '{}',
  fissato boolean not null default false,
  importante boolean not null default false,
  conferma boolean not null default false
);
create table if not exists public.letture (
  avviso_id uuid references public.avvisi on delete cascade,
  user_id uuid not null default auth.uid(),
  quando timestamptz not null default now(),
  primary key (avviso_id, user_id)
);
alter table public.avvisi enable row level security;
alter table public.letture enable row level security;
create or replace function public.destinatario(a public.avvisi) returns boolean
language sql stable security definer set search_path = public as $$
  select public.utente_ok() and (a.tutti or auth.uid() = any(a.utenti) or a.aree && public.mie_sezioni() or a.autore = auth.uid() or public.e_presidente())
$$;
drop policy if exists p_avv_leggi on public.avvisi;
create policy p_avv_leggi on public.avvisi for select using (public.destinatario(avvisi));
drop policy if exists p_avv_crea on public.avvisi;
create policy p_avv_crea on public.avvisi for insert with check (autore = auth.uid() and public.e_presidente());
drop policy if exists p_avv_mod on public.avvisi;
create policy p_avv_mod on public.avvisi for update using (autore = auth.uid() or public.is_admin());
drop policy if exists p_avv_del on public.avvisi;
create policy p_avv_del on public.avvisi for delete using (autore = auth.uid() or public.is_admin());
drop policy if exists p_let_mie on public.letture;
create policy p_let_mie on public.letture for insert with check (user_id = auth.uid());
drop policy if exists p_let_leggi on public.letture;
create policy p_let_leggi on public.letture for select using (user_id = auth.uid() or exists (select 1 from avvisi a where a.id = avviso_id and (a.autore = auth.uid() or public.is_admin())));

create or replace function public.destinatari_avviso(aid uuid) returns table (user_id uuid, nome text, letto timestamptz)
language sql stable security definer set search_path = public as $$
  select p.id, coalesce(p.nome, p.email), l.quando
  from avvisi a cross join profili p left join letture l on l.avviso_id = a.id and l.user_id = p.id
  where a.id = aid and (a.autore = auth.uid() or public.is_admin()) and p.attivo and p.id <> a.autore
    and (a.tutti or p.id = any(a.utenti) or a.aree && (case when p.admin then array['eco','evt','com','sic','adm'] else coalesce((select array_agg(distinct s.sezione) from permessi m join sezioni_voci s on s.voce = m.area where m.user_id = p.id), '{}') end))
$$;
revoke execute on function public.destinatari_avviso(uuid) from anon;

create or replace function public.notifica_avviso() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into notifiche (per, titolo, testo, link, priorita)
    select p.id, case when new.importante then 'Importante: ' else '' end || new.tipo || ' in bacheca', new.titolo, 'p-bach', case when new.importante then 'urgente' else 'normale' end
    from profili p
    where p.attivo and p.id <> new.autore
      and (new.tutti or p.id = any(new.utenti) or new.aree && (case when p.admin then array['eco','evt','com','sic','adm'] else coalesce((select array_agg(distinct s.sezione) from permessi m join sezioni_voci s on s.voce = m.area where m.user_id = p.id), '{}') end));
  return new;
end $$;
drop trigger if exists t_avviso on public.avvisi;
create trigger t_avviso after insert on public.avvisi for each row execute function public.notifica_avviso();

create or replace function public.genera_avvisi_pagamenti() returns void
language plpgsql security definer set search_path = public as $$
declare resp uuid; giorni int[];
begin
  resp := nullif(public.imp('resp_pagamenti'), '')::uuid;
  if resp is null then return; end if;
  select coalesce(array_agg(x::int), array[7,1]) into giorni from jsonb_array_elements_text(coalesce((select valore->'giorni_promemoria' from impostazioni where chiave='generali'), '[7,1]'::jsonb)) x;
  insert into notifiche (per, titolo, testo, link, priorita)
    select resp, case when (p->>'data')::date < current_date then 'Pagamento in ritardo' else 'Pagamento in scadenza' end,
      coalesce(f.dati->>'fornitore','') || ' · ' || coalesce(p->>'n','rata') || ' · ' || coalesce(p->>'importo','') || ' € · entro il ' || to_char((p->>'data')::date, 'DD/MM'), 'v-pag',
      case when (p->>'data')::date < current_date then 'urgente' else 'normale' end
    from voci_dati f, jsonb_array_elements(coalesce(f.dati->'pagamenti','[]'::jsonb)) p
    where f.voce = 'v-for27' and coalesce(p->>'stato','programmato') not in ('verificato') and coalesce(p->>'data','') <> ''
      and (((p->>'data')::date - current_date) = any(giorni) or (p->>'data')::date = current_date - 1);
end $$;
revoke execute on function public.genera_avvisi_pagamenti() from public, anon, authenticated;

create or replace function public.genera_briefing() returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into notifiche (per, titolo, testo, link)
    select p.id, 'Il tuo briefing di oggi',
      concat_ws(' · ',
        nullif((select count(*) from compiti c where c.per = p.id and not c.fatto)::text, '0') || ' cose da fare',
        nullif((select count(*) from compiti c where c.per = p.id and not c.fatto and c.entro <= current_date)::text, '0') || ' in scadenza o in ritardo',
        nullif((select count(*) from richieste r where r.stato = 'aperta')::text, '0') || ' richieste del Presidente da prendere',
        nullif((select count(*) from riunioni r join inviti_riunione i on i.riunione_id = r.id where i.user_id = p.id and i.stato <> 'rifiuta' and r.quando::date = current_date)::text, '0') || ' riunioni oggi'),
      'p-home'
    from profili p join preferenze pr on pr.user_id = p.id
    where p.attivo and coalesce((pr.dati->>'briefing_push')::boolean, false);
end $$;
revoke execute on function public.genera_briefing() from public, anon, authenticated;

do $$ begin perform cron.unschedule('bruna27-pagamenti'); exception when others then null; end $$;
do $$ begin perform cron.unschedule('bruna27-briefing'); exception when others then null; end $$;
select cron.schedule('bruna27-pagamenti', '5 6 * * *', 'select public.genera_avvisi_pagamenti()');
select cron.schedule('bruna27-briefing', '0 6 * * *', 'select public.genera_briefing()');

do $$ begin
  begin alter publication supabase_realtime add table public.messaggi; exception when others then null; end;
  begin alter publication supabase_realtime add table public.avvisi; exception when others then null; end;
end $$;

drop policy if exists p_doc_personali_scrivi on storage.objects;
create policy p_doc_personali_scrivi on storage.objects for insert to authenticated
  with check (bucket_id = 'documenti' and split_part(name, '/', 1) in ('personali','compiti','richieste','riunioni','chat','bacheca') and split_part(name, '/', 2) = auth.uid()::text);
drop policy if exists p_doc_personali_leggi on storage.objects;
create policy p_doc_personali_leggi on storage.objects for select to authenticated
  using (bucket_id = 'documenti' and split_part(name, '/', 1) in ('personali','compiti','richieste','riunioni','chat','bacheca') and public.registrato());
