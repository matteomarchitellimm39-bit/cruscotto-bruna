drop policy if exists p_voci_perc_leggi on public.voci_dati;
create policy p_voci_perc_leggi on public.voci_dati for select
  using (voce = 'v-perc' and (public.puo_vedere('v-psic') or (dati->>'stato' = 'Pubblicato' and public.registrato())));
drop policy if exists p_voci_perc_sic on public.voci_dati;
create policy p_voci_perc_sic on public.voci_dati for update
  using (voce = 'v-perc' and public.puo_modificare('v-psic') and dati->>'stato' in ('Alla Sicurezza','Convalidato','Pubblicato'))
  with check (voce = 'v-perc' and public.puo_modificare('v-psic'));

create or replace function public.notifica_area(a_area text, a_testo text, a_link text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.registrato() then raise exception 'Non autorizzato'; end if;
  insert into notifiche (per, testo, link)
    select p.id, left(a_testo, 300), a_link from profili p
    where p.id is distinct from auth.uid()
      and (a_area = '*' or p.admin or exists (select 1 from permessi m where m.user_id = p.id and m.area = a_area));
end $$;

create or replace function public.notifica_utente(a_uid uuid, a_testo text, a_link text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.registrato() then raise exception 'Non autorizzato'; end if;
  insert into notifiche (per, testo, link) values (a_uid, left(a_testo, 300), a_link);
end $$;

create or replace function public.convalida_percorso(pid uuid) returns void
language plpgsql security definer set search_path = public as $$
declare r record; c text; autore uuid; n int;
begin
  if not public.puo_modificare('v-psic') then raise exception 'Non autorizzato'; end if;
  select * into r from voci_dati where id = pid and voce = 'v-perc' and dati->>'stato' = 'Alla Sicurezza';
  if not found then raise exception 'Il percorso non è in attesa della Sicurezza'; end if;
  update voci_dati set dati = jsonb_set(jsonb_set(dati, '{stato}', '"Convalidato"'), '{sic}',
      coalesce(dati->'sic', '{}'::jsonb) || jsonb_build_object('da', auth.uid(), 'quando', now())), aggiornato = now()
    where id = pid;
  autore := nullif(r.dati->>'autore', '')::uuid;
  n := 0;
  if coalesce((r.dati->'forn'->>'serve')::boolean, false) then
    for c in select jsonb_array_elements_text(coalesce(r.dati->'forn'->'cosa', '[]'::jsonb)) loop
      insert into voci_dati (voce, dati) values ('v-prev', jsonb_build_object('voce', 'Percorso ' || (r.dati->>'nome') || ' – ' || c,
        'fornitore', '', 'importo', '', 'stato', 'Da chiedere', 'chi', coalesce(autore::text, ''), 'entro', ''));
      n := n + 1;
    end loop;
  end if;
  if autore is not null then
    insert into notifiche (per, testo, link) values (autore, 'La Sicurezza ha convalidato «' || (r.dati->>'nome') || '»', 'v-perc');
    if n > 0 then
      insert into compiti (per, da, titolo) values (autore, auth.uid(), 'Chiedi i preventivi per il percorso «' || (r.dati->>'nome') || '»');
    end if;
  end if;
end $$;

create or replace function public.rimanda_percorso(pid uuid, nota text) returns void
language plpgsql security definer set search_path = public as $$
declare r record; autore uuid;
begin
  if not public.puo_modificare('v-psic') then raise exception 'Non autorizzato'; end if;
  if coalesce(trim(nota), '') = '' then raise exception 'Scrivi cosa va cambiato'; end if;
  select * into r from voci_dati where id = pid and voce = 'v-perc' and dati->>'stato' = 'Alla Sicurezza';
  if not found then raise exception 'Il percorso non è in attesa della Sicurezza'; end if;
  update voci_dati set dati = jsonb_set(jsonb_set(dati, '{stato}', '"Rimandato"'), '{nota_sic}', to_jsonb(nota)), aggiornato = now() where id = pid;
  autore := nullif(r.dati->>'autore', '')::uuid;
  if autore is not null then
    insert into notifiche (per, testo, link) values (autore, 'La Sicurezza ha rimandato «' || (r.dati->>'nome') || '»: ' || left(nota, 120), 'v-perc');
  end if;
end $$;

revoke execute on function public.convalida_percorso(uuid) from anon;
revoke execute on function public.rimanda_percorso(uuid, text) from anon;
revoke execute on function public.notifica_area(text, text, text) from anon;
revoke execute on function public.notifica_utente(uuid, text, text) from anon;
