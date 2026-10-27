-- Bruna27 · 13 · Eventi (Fase C): attività organizzative dopo la pubblicazione, pesi, verifica, notifica «Evento pronto»
-- Si può rieseguire senza danni. Va eseguito dopo il 12.

alter table public.compiti add column if not exists fase text;                       -- 'scheda' (le 24 ore) oppure 'lavoro' (preparazione)
alter table public.compiti add column if not exists criteri text;                    -- quando si considera completata
alter table public.compiti add column if not exists critica boolean not null default false;   -- essenziale: pesa 3 e blocca il 100%
alter table public.compiti add column if not exists verifica boolean not null default false;  -- serve la conferma di chi l'ha assegnata
alter table public.compiti add column if not exists verificato boolean not null default false;
alter table public.compiti add column if not exists conta boolean not null default true;      -- false per pagamenti e cose da fare dopo l'evento
alter table public.compiti add column if not exists nota_fine text;
alter table public.compiti add column if not exists allegati jsonb not null default '[]'::jsonb;

-- un evento è «pronto» una volta sola per ogni completamento effettivo
create table if not exists public.eventi_pronti (
  evento_id text primary key,
  nome text,
  pronto boolean not null default false,
  quando timestamptz
);
alter table public.eventi_pronti enable row level security;
drop policy if exists p_pronti_leggi on public.eventi_pronti;
create policy p_pronti_leggi on public.eventi_pronti for select using (public.puo_vedere('s-ev'));

create or replace function public.controlla_evento_pronto() returns trigger
language plpgsql security definer set search_path = public as $$
declare ev text; tot int; ok int; nm text; n int;
begin
  ev := coalesce(new.evento_id, old.evento_id);
  if ev is null then return null; end if;
  select count(*) filter (where conta),
         count(*) filter (where conta and fatto and (not verifica or verificato)),
         min(split_part(titolo, ' · ', 1))
    into tot, ok, nm
    from compiti where evento_id = ev and fase = 'lavoro';
  if tot > 0 and ok = tot then
    insert into eventi_pronti (evento_id, nome, pronto, quando) values (ev, nm, true, now())
      on conflict (evento_id) do update set pronto = true, quando = now(), nome = excluded.nome where not eventi_pronti.pronto;
    get diagnostics n = row_count;
    if n > 0 then
      insert into notifiche (per, titolo, testo, link)
        select distinct u, 'Bruna27 — Evento pronto',
          '«' || nm || '» è pronto. Tutte le attività organizzative previste risultano completate. Consulta la scheda per il riepilogo finale.',
          'sec-evt#' || ev
        from compiti c, unnest(array[c.per, c.da]) as u
        where c.evento_id = ev and u is not null;
    end if;
  else
    update eventi_pronti set pronto = false where evento_id = ev and pronto;
  end if;
  return null;
end $$;
drop trigger if exists t_evento_pronto on public.compiti;
create trigger t_evento_pronto after insert or update or delete on public.compiti
  for each row execute function public.controlla_evento_pronto();
