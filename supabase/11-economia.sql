-- Bruna27 · 11: Economia riorganizzata. Le richieste di emissione fattura le crea e le modifica solo chi può modificare
-- Economia → Fatture da emettere. Si può eseguire più volte.
drop policy if exists p_voci_femit_resp_upd on public.voci_dati;

create or replace function public.richiedi_fattura(sid uuid, rata int) returns uuid
language plpgsql security definer set search_path = public as $$
declare s record; d jsonb; r jsonb; imp numeric; chiave text; nid uuid; resp uuid; nome_sp text;
begin
  if not public.puo_modificare('v-femit') then raise exception 'Solo chi può modificare Economia → Fatture può chiedere l''emissione di una fattura'; end if;
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
